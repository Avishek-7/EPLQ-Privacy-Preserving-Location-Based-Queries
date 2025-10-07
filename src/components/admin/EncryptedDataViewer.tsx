import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BrutalistButton } from '../ui';

interface EncryptedPOI {
    id: string;
    encryptedName: string;
    encryptedCategory: string;
    encryptedCoordinates: string;
    encryptedDescription?: string;
    spatialIndex: {
        quadTreeLevel: number;
        encryptedBounds: string;
        indexHash: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const EncryptedDataViewer: React.FC = () => {
    const [pois, setPois] = useState<EncryptedPOI[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPOI, setSelectedPOI] = useState<EncryptedPOI | null>(null);

    useEffect(() => {
        loadEncryptedPOIs();
    }, []);

    const loadEncryptedPOIs = async () => {
        try {
            setLoading(true);
            const poisQuery = query(
                collection(db, 'encryptedPOIs'),
                orderBy('createdAt', 'desc')
            );
            const poisSnapshot = await getDocs(poisQuery);
            
            const poisData: EncryptedPOI[] = poisSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                } as EncryptedPOI;
            });
            
            setPois(poisData);
        } catch (error) {
            console.error('Error loading encrypted POIs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mock decryption function - in production, this would require proper keys
    const previewDecryption = (encryptedData: string): string => {
        try {
            return atob(encryptedData);
        } catch {
            return '[Encrypted Data]';
        }
    };

    const filteredPOIs = pois.filter(poi => 
        poi.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        previewDecryption(poi.encryptedName).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">🔒 Encrypted Data Viewer</h2>
                    <p className="text-gray-600 font-semibold">View encrypted POI data with privacy preservation</p>
                </div>
                <BrutalistButton
                    onClick={loadEncryptedPOIs}
                    variant="secondary"
                    size="sm"
                >
                    🔄 Refresh
                </BrutalistButton>
            </div>

            {/* Security Warning */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-black text-amber-800">
                            Privacy Protected Data
                        </h3>
                        <div className="mt-2 text-sm text-amber-700 font-semibold">
                            <p>
                                This data is encrypted using EPLQ algorithms. Preview decryption is only available 
                                for demonstration purposes and requires proper decryption keys in production.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <input
                    type="text"
                    placeholder="Search encrypted POI data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                />
            </div>

            {/* POI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPOIs.map((poi) => (
                    <div 
                        key={poi.id} 
                        className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer"
                        onClick={() => setSelectedPOI(poi)}
                    >
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    POI ID: {poi.id.substring(0, 8)}...
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Created: {poi.createdAt.toLocaleDateString()}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-medium text-gray-500">Encrypted Name:</span>
                                    <p className="text-sm font-mono bg-gray-100 p-2 rounded truncate">
                                        {poi.encryptedName}
                                    </p>
                                </div>
                                
                                <div>
                                    <span className="text-xs font-medium text-gray-500">Preview (Demo):</span>
                                    <p className="text-sm text-green-700 font-medium">
                                        {previewDecryption(poi.encryptedName)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Spatial Index Level: {poi.spatialIndex?.quadTreeLevel}</span>
                                    <span className="text-blue-600">🔒 Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Results */}
            {filteredPOIs.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No POI data found</h3>
                    <p className="text-gray-500">
                        {pois.length === 0 
                            ? 'No encrypted POI data has been uploaded yet.'
                            : 'No results match your search criteria.'
                        }
                    </p>
                </div>
            )}

            {/* Details Modal */}
            {selectedPOI && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">POI Details</h3>
                            <button
                                onClick={() => setSelectedPOI(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID</label>
                                <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">{selectedPOI.id}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Encrypted Name</label>
                                <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">
                                    {selectedPOI.encryptedName}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    Preview: {previewDecryption(selectedPOI.encryptedName)}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Encrypted Category</label>
                                <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">
                                    {selectedPOI.encryptedCategory}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    Preview: {previewDecryption(selectedPOI.encryptedCategory)}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Encrypted Coordinates</label>
                                <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">
                                    {selectedPOI.encryptedCoordinates}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                    Preview: {previewDecryption(selectedPOI.encryptedCoordinates)}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Spatial Index</label>
                                <div className="mt-1 text-sm bg-gray-50 p-2 rounded">
                                    <p>Level: {selectedPOI.spatialIndex?.quadTreeLevel}</p>
                                    <p className="font-mono text-xs break-all">
                                        Hash: {selectedPOI.spatialIndex?.indexHash}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Created</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedPOI.createdAt.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Updated</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedPOI.updatedAt.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <p className="text-sm text-gray-600 font-semibold">
                    Showing {filteredPOIs.length} of {pois.length} encrypted POI records
                </p>
            </div>
        </div>
    );
};

export default EncryptedDataViewer;
