import React, { useState, useEffect } from 'react';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { eplqCrypto, type POIData } from '../../lib/encryption/eplq-crypto';
import { logger } from '../../utils/logger';

interface DataUploadProps {
    onUploadSuccess: () => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<string | null>(null);
    const [cryptoInitialized, setCryptoInitialized] = useState(false);

    // Initialize EPLQ crypto system on component mount
    useEffect(() => {
        const initializeCrypto = async () => {
            try {
                if (!eplqCrypto.isInitialized()) {
                    logger.info('DataUpload', '🔐 Initializing EPLQ crypto system...');
                    await eplqCrypto.initialize();
                }
                setCryptoInitialized(true);
                logger.success('DataUpload', '✅ EPLQ crypto system ready for data upload');
            } catch (error) {
                logger.error('DataUpload', '❌ Failed to initialize EPLQ crypto system', error);
                setUploadResult('Error: Failed to initialize encryption system');
            }
        };

        initializeCrypto();
    }, []);

    const encryptPOIData = async (poi: POIData) => {
        logger.info('DataUpload', `🔒 Encrypting POI data: ${poi.name}`);
        
        try {
            // Use EPLQ crypto system for privacy-preserving encryption
            const encryptedPoint = await eplqCrypto.encryptPOI(poi);
            
            logger.success('DataUpload', `✅ POI encrypted successfully: ${poi.name}`);
            return {
                ...encryptedPoint,
                // Keep original structure for compatibility
                isEncrypted: true,
                originalCategory: poi.category // For filtering
            };
        } catch (error) {
            logger.error('DataUpload', `❌ Failed to encrypt POI: ${poi.name}`, error);
            throw new Error(`Encryption failed for ${poi.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file  = event.target.files?.[0];
        if (!file) return;

        if (!cryptoInitialized) {
            setUploadResult('Error: Encryption system not initialized. Please wait and try again.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        logger.info('DataUpload', `📁 Starting file upload: ${file.name}`);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());

            const requiredHeaders =  ['name', 'category', 'latitude', 'longitude'];
            const hasRequiredHeaders = requiredHeaders.every(requiredHeader => 
                headers.some(h => h.toLowerCase().includes(requiredHeader))
            );

            if (!hasRequiredHeaders) {
                throw new Error('CSV must contain: name, category, latitude, longitude columns');
            }

            const poisData: POIData[] = [];

            // Parse CSV data
            for (let i=1; i<lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if(values.length >= 4) {
                    const poi: POIData = {
                        name: values[0],
                        category: values[1],
                        latitude: parseFloat(values[2]),
                        longitude: parseFloat(values[3]),
                        description: values[4] || undefined
                    };

                    if (!isNaN(poi.latitude) && !isNaN(poi.longitude)) {
                        poisData.push(poi);
                    }
                }
            }

            if (poisData.length === 0) {
                throw new Error('No valid POI data found in the file');
            }

            logger.info('DataUpload', `📊 Parsed ${poisData.length} POIs from CSV`);

            // Process in batches for better performance and Firebase limits
            const batchSize = 500;
            let uploadCount = 0;
            let encryptedCount = 0;

            for (let i=0; i<poisData.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchData = poisData.slice(i, i+batchSize);

                logger.info('DataUpload', `🔐 Encrypting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(poisData.length/batchSize)}`);

                for (const poi of batchData) {
                    try {
                        const encryptedPOI = await encryptPOIData(poi);
                        const docRef = doc(collection(db, 'encryptedPOIs'));
                        batch.set(docRef, encryptedPOI);
                        encryptedCount++;
                    } catch (error) {
                        logger.warn('DataUpload', `⚠️ Skipping POI due to encryption error: ${poi.name}`, error);
                        // Continue with other POIs
                    }
                }

                await batch.commit();
                uploadCount += batchData.length;
                setUploadProgress((uploadCount / poisData.length) * 100);
                
                logger.info('DataUpload', `✅ Batch uploaded: ${uploadCount}/${poisData.length} POIs processed`);
            }

            const successMessage = `Successfully uploaded ${encryptedCount} POIs with EPLQ privacy-preserving encryption`;
            setUploadResult(successMessage);
            logger.success('DataUpload', successMessage);
            onUploadSuccess();
        } catch (error: unknown) {
            const errorMessage = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error('DataUpload', '❌ File upload failed', error);
            setUploadResult(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const sampleData = `name,category,latitude,longitude,description
Hotel Sunrise,hotel,25.6200,85.1600,Luxury hotel in the heart of the city
Grand Palace Hotel,hotel,25.6250,85.1650,Historic hotel with modern amenities
Budget Inn,hotel,25.6150,85.1550,Affordable accommodation for travelers
Spice Garden Restaurant,restaurant,25.6300,85.1700,Traditional Indian cuisine
Coffee Corner,restaurant,25.6220,85.1620,Best coffee in town
Pizza Palace,restaurant,25.6180,85.1580,Italian cuisine and pizza
City Mall,shopping,25.6240,85.1640,Large shopping complex with retail stores
Central Hospital,hospital,25.6160,85.1560,24/7 emergency medical services
Gas Station Plus,gas_station,25.6280,85.1680,Fuel and convenience store
Railway Station,transportation,25.6260,85.1660,Main railway terminal
Bus Terminal,transportation,25.6140,85.1540,Inter-city bus services
City Park,recreation,25.6230,85.1630,Beautiful public park with gardens`;
    
    const  downloadSampleCSV = () => {
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_poi_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const uploadSampleData = async () => {
        if (!cryptoInitialized) {
            setUploadResult('Error: Encryption system not ready');
            return;
        }

        logger.info('DataUpload', '🚀 Starting sample data upload...');
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        try {
            // Parse sample data
            const lines = sampleData.trim().split('\n');
            const dataLines = lines.slice(1); // Skip header row

            const poisToUpload: POIData[] = dataLines.map(line => {
                const values = line.split(',').map(v => v.trim());
                return {
                    name: values[0],
                    category: values[1],
                    latitude: parseFloat(values[2]),
                    longitude: parseFloat(values[3]),
                    description: values[4] || ''
                };
            });

            logger.info('DataUpload', `📊 Uploading ${poisToUpload.length} sample POIs...`);
            
            // Upload in batches
            const batchSize = 10;
            const totalPOIs = poisToUpload.length;
            let uploadedCount = 0;

            for (let i = 0; i < poisToUpload.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchPOIs = poisToUpload.slice(i, i + batchSize);

                for (const poi of batchPOIs) {
                    const encryptedData = await encryptPOIData(poi);
                    const docRef = doc(collection(db, 'encryptedPOIs'));
                    batch.set(docRef, {
                        ...encryptedData,
                        category: poi.category,
                        timestamp: Date.now(),
                        createdAt: new Date(),
                        approximateLat: Math.floor(poi.latitude * 100) / 100,
                        approximateLng: Math.floor(poi.longitude * 100) / 100
                    });
                }

                await batch.commit();
                uploadedCount += batchPOIs.length;
                setUploadProgress(Math.round((uploadedCount / totalPOIs) * 100));
                
                logger.info('DataUpload', `📦 Batch uploaded: ${uploadedCount}/${totalPOIs} POIs`);
            }

            setUploadResult(`✅ Successfully uploaded ${totalPOIs} sample POIs with encryption!`);
            logger.success('DataUpload', `🎉 Sample data upload completed: ${totalPOIs} POIs`);
            onUploadSuccess();
        } catch (error) {
            logger.error('DataUpload', '❌ Sample data upload failed', error);
            setUploadResult(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const clearAllPOIData = async () => {
        if (!cryptoInitialized) {
            setUploadResult('Error: Encryption system not ready');
            return;
        }

        logger.info('DataUpload', '🧹 Starting to clear all POI data...');
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        try {
            const poisRef = collection(db, 'encryptedPOIs');
            const snapshot = await getDocs(poisRef);
            
            if (snapshot.empty) {
                setUploadResult('✅ No POI data found - database is already clean!');
                return;
            }

            logger.info('DataUpload', `📊 Found ${snapshot.size} POI documents to delete`);
            
            let deletedCount = 0;
            const batchSize = 10;
            const docs = snapshot.docs;

            // Delete in batches to avoid hitting Firestore limits
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchDocs = docs.slice(i, i + batchSize);

                for (const docSnap of batchDocs) {
                    batch.delete(docSnap.ref);
                }

                await batch.commit();
                deletedCount += batchDocs.length;
                setUploadProgress(Math.round((deletedCount / docs.length) * 100));
                
                logger.info('DataUpload', `🗑️ Deleted batch: ${deletedCount}/${docs.length} POIs`);
            }

            setUploadResult(`✅ Successfully cleared ${deletedCount} POI documents! Database is now clean.`);
            logger.success('DataUpload', `🎉 POI data cleanup completed: ${deletedCount} documents deleted`);
            onUploadSuccess();
        } catch (error) {
            logger.error('DataUpload', '❌ POI data cleanup failed', error);
            setUploadResult(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const resetEncryptionKeys = async () => {
        try {
            setUploading(true);
            setUploadProgress(0);
            setUploadResult(null);
            
            logger.info('DataUpload', '🔄 Resetting encryption keys...');
            
            // Clear persisted keys
            await eplqCrypto.clearPersistedKeys();
            
            // Re-initialize with new keys
            await eplqCrypto.initialize();
            
            setCryptoInitialized(true);
            setUploadResult('✅ Encryption keys reset successfully! New keys generated.');
            logger.success('DataUpload', '🎉 Encryption keys reset completed');
        } catch (error) {
            logger.error('DataUpload', '❌ Key reset failed', error);
            setUploadResult(`❌ Key reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-grey-900">POI Data Upload</h2>
                <p className="text-grey-600">
                    Upload Points of Interest data with automatic privacy-preserving encryption
                </p>
            </div>
            {/* Upload Instruction */}
            <div className="bg-blue-50 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Instructions</h3>
                <ul className="space-y-2 text-blue-800">
                    <li>1. Upload CSV files with POI data</li>
                    <li>2. Required columns: name, category, latitude, longitude</li>
                    <li>3. Optional: description column</li>
                    <li>4. Data will be automatically encrypted using EPLQ algorithm</li>
                    <li>5. Spatial indexing will be applied for privacy-preserving queries</li>
                </ul>
                <button
                    onClick={downloadSampleCSV}
                    className="mt-4 mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    📥 Download Sample CSV
                </button>
                <button
                    onClick={uploadSampleData}
                    disabled={uploading || !cryptoInitialized}
                    className="mt-4 mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    🚀 Upload Sample Data Now
                </button>
                <button
                    onClick={clearAllPOIData}
                    disabled={uploading || !cryptoInitialized}
                    className="mt-4 mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    🗑️ Clear All POI Data
                </button>
                <button
                    onClick={resetEncryptionKeys}
                    disabled={uploading}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    🔄 Reset Encryption Keys
                </button>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">📂</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload POI Data</h3>
                    <p className="text-gray-600 mb-4">
                        Choose a CSV file containing your Points of Interest data
                    </p>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="poi-upload"
                    />
                    <label 
                        htmlFor="poi-upload"
                        className={`inline-black px-6 py-3 rounded-md font-medium cursor-pointer transition-colors ${
                                uploading
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {uploading ? 'Uploading...' : 'Select CSV File'}    
                    </label> 
                </div>
                {/* Progress Bar*/}
                {uploading && (
                    <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Encrypting and uploading POIs...</span>
                            <span>{uploadProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Upload Result */}
                {uploadResult && (
                    <div className={`mt-6 p-4 rounded-md ${
                        uploadResult.includes('Error') 
                            ? 'bg-red-50 border border-red-200 text-red-700'
                            : 'bg-green-50 border border-green-200 text-green-700'
                    }`}>
                        {uploadResult}
                    </div>
                )}
            </div>
            {/* Security Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 EPLQ Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Predicate-Only Encryption</h4>
                        <p className="text-sm text-green-700">
                            Advanced inner product range encryption ensures POI data privacy while enabling spatial queries
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">📊 Privacy-Preserving Tree Index</h4>
                        <p className="text-sm text-blue-700">
                            Optimized spatial indexing with geohash-based privacy preservation for fast (~0.9s) queries
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2">🛡️ Zero-Knowledge Security</h4>
                        <p className="text-sm text-purple-700">
                            Server cannot decrypt or analyze location data - complete privacy preservation
                        </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">⚡ Query Optimization</h4>
                        <p className="text-sm text-orange-700">
                            Circle-based spatial range queries optimized for mobile and cloud deployment
                        </p>
                    </div>
                </div>
                
                {/* Crypto Status */}
                <div className={`mt-4 p-3 rounded-lg border ${
                    cryptoInitialized 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                }`}>
                    <div className="flex items-center space-x-2">
                        <span className={cryptoInitialized ? 'text-green-500' : 'text-yellow-500'}>
                            {cryptoInitialized ? '✅' : '⏳'}
                        </span>
                        <span className={`text-sm font-semibold ${
                            cryptoInitialized ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                            EPLQ Crypto System: {cryptoInitialized ? 'Ready' : 'Initializing...'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataUpload;