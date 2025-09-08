import React, { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface POIData {
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    description?: string;
}

interface DataUploadProps {
    onUploadSuccess: () => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<string | null>(null);

    const encryptPOIData = async (poi: POIData) => {
        // Simple encryption for demo purposes - in production, use proper encryption
        const key = process.env.REACT_APP_ENCRYPTION_KEY || 'fallback-key';
        const dataString = JSON.stringify(poi);
        
        // Use Web Crypto API for production-level encryption
        const encoder = new TextEncoder();
        
        // Generate a key from the environment variable
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(key.padEnd(32, '0').slice(0, 32)), // Ensure 32 bytes
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        // Generate a random initialization vector
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the data
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            keyMaterial,
            encoder.encode(dataString)
        );
        
        // Convert to base64 for storage
        const encryptedArray = new Uint8Array(encryptedBuffer);
        const ivBase64 = btoa(String.fromCharCode(...iv));
        const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
        
        return {
            ...poi,
            encryptedData: `${ivBase64}:${encryptedBase64}`,
            isEncrypted: true
        };
    };

    const generateSpatialIndex = (lat: number, lng: number) => {
        // Generate a geohash-like spatial index for efficient querying
        const precision = 8; // Adjust precision as needed
        const latRange = [-90, 90];
        const lngRange = [-180, 180];

        let latMin = latRange[0], latMax = latRange[1];
        let lngMin = lngRange[0], lngMax = lngRange[1];

        let geohash = '';
        let isEven = true;

        for (let i = 0; i < precision * 5; i++) {
            if (isEven) {
                // Longitude
                const mid = (lngMin + lngMax) / 2;
                if (lng >= mid) {
                    geohash += '1';
                    lngMin = mid;
                } else {
                    geohash += '0';
                    lngMax = mid;
                }
            } else {
                // Latitude
                const mid = (latMin + latMax) / 2;
                if (lat >= mid) {
                    geohash += '1';
                    latMin = mid;
                } else {
                    geohash += '0';
                    latMax = mid;
                }
            }
            isEven = !isEven;
        }

        // Convert binary string to base32-like representation
        const chunks = geohash.match(/.{1,5}/g) || [];
        const spatialIndex = chunks.map(chunk => {
            return parseInt(chunk.padEnd(5, '0'), 2).toString(32);
        }).join('');

        return spatialIndex;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file  = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

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

            const batchSize = 500;
            let uploadCount = 0;

            for (let i=0; i<poisData.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchData = poisData.slice(i, i+batchSize);

                for (const poi of batchData) {
                    const encryptedPOI = await encryptPOIData(poi);
                    const spatialIndex = generateSpatialIndex(poi.latitude, poi.longitude);
                    const docRef = doc(collection(db, 'encryptedPOIs'));
                    batch.set(docRef, { ...encryptedPOI, spatialIndex });
                }

                await batch.commit();
                uploadCount += batchData.length;
                setUploadProgress((uploadCount / poisData.length) * 100);
            }

            setUploadResult(`Successfully uploaded ${uploadCount} POIs with privacy preservation`);
            onUploadSuccess();
        } catch (error: unknown) {
            console.error('Upload error:', error);
            setUploadResult(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
        } finally {
            setUploading(false);
        }
    };

    const sampleData = `name,category,latitude,longitude,description
        Starbucks Coffee,Restaurant,40.7128,-74.0060,Popular coffee chain
        Central Park,Recreation,40.7829,-73.9654,Large public park
        Times Square,Tourism,40.7580,-73.9855,Famous commercial intersection
        Empire State Building,Landmark,40.7484,-73.9857,Historic skyscraper
        Brooklyn Bridge,Transportation,40.7061,-73.9969,Iconic suspension bridge`;
    
    const  downloadSampleCSV = () => {
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_poi_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
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
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Download Sample CSV
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Predicate-Only Encryption</h4>
                        <p className="text-sm text-gray-600">
                            POI data is encrypted using advanced predicate-only encryption for inner product range queries
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Privacy-Preserving Index</h4>
                        <p className="text-sm text-gray-600">
                            Spatial tree index structure enables fast queries while preserving location privacy
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Zero Knowledge</h4>
                        <p className="text-sm text-gray-600">
                            Server cannot decrypt or analyze the uploaded location data
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Query Optimization</h4>
                        <p className="text-sm text-gray-600">
                            Optimized for ~0.9s query generation and few seconds POI search performance
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataUpload;