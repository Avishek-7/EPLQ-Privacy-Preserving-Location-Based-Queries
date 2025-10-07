/**
 * Privacy-Preserving POI Search Component
 * Uses EPLQ cryptographic system for secure location-based queries
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eplqQueryService, type QueryResult } from '../../services/eplq-query';
import { type QueryPredicate, type POIData } from '../../lib/encryption/eplq-crypto';
import { BrutalistButton, BrutalistInput, BrutalistSelect } from '../ui';
import { logger } from '../../utils/logger';

interface SearchLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

export const POISearch: React.FC = () => {
    const { user, addQueryToHistory } = useAuth();
    const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(1000); // meters
    const [searchCategory, setSearchCategory] = useState<string>('');
    const [searchResults, setSearchResults] = useState<POIData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [serviceInitialized, setServiceInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize EPLQ query service
    useEffect(() => {
        const initializeService = async () => {
            try {
                logger.info('POISearch', '🚀 Initializing EPLQ Query Service...');
                await eplqQueryService.initialize();
                setServiceInitialized(true);
                logger.success('POISearch', '✅ EPLQ Query Service ready');
            } catch (error) {
                logger.error('POISearch', '❌ Failed to initialize query service', error);
                setError('Failed to initialize search service. Please refresh the page.');
            }
        };

        initializeService();
    }, []);

    // Get user's current location
    const getCurrentLocation = (): Promise<SearchLocation> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            logger.info('POISearch', '📍 Requesting current location...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: SearchLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
                    };
                    logger.success('POISearch', '✅ Location obtained', location);
                    resolve(location);
                },
                (error) => {
                    logger.error('POISearch', '❌ Failed to get location', error);
                    reject(new Error(`Location error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    };

    // Handle current location request
    const handleUseCurrentLocation = async () => {
        try {
            setError(null);
            const location = await getCurrentLocation();
            setSearchLocation(location);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
            setError(errorMessage);
            logger.error('POISearch', '❌ Current location request failed', error);
        }
    };

    // Handle manual location input
    const handleManualLocation = (lat: string, lng: string) => {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            if (lat && lng) {
                setError('Please enter valid latitude and longitude values');
            }
            return;
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            setError('Latitude must be between -90 and 90, longitude between -180 and 180');
            return;
        }

        setError(null);
        setSearchLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        
        logger.success('POISearch', '✅ Manual location set', { latitude, longitude });
    };    // Execute privacy-preserving POI search
    const handleSearch = async () => {
        if (!serviceInitialized) {
            setError('Search service not initialized. Please wait and try again.');
            return;
        }

        if (!searchLocation) {
            setError('Please set a search location first');
            return;
        }

        if (!user) {
            setError('Please log in to perform searches');
            return;
        }

        setIsSearching(true);
        setError(null);
        setSearchResults([]);
        setQueryResult(null);

        logger.info('POISearch', '🔍 Starting privacy-preserving POI search', {
            location: searchLocation,
            radius: searchRadius,
            category: searchCategory || 'all'
        });

        try {
            const predicate: QueryPredicate = {
                centerLat: searchLocation.latitude,
                centerLng: searchLocation.longitude,
                radius: searchRadius,
                category: searchCategory || undefined
            };

            const result = await eplqQueryService.executeRangeQuery(predicate, user.uid);
            
            setSearchResults(result.results);
            setQueryResult(result);
            
            // Save query to user history
            const queryDescription = `POI Search: ${searchCategory || 'all categories'} within ${searchRadius}m of ${searchLocation.latitude.toFixed(4)}, ${searchLocation.longitude.toFixed(4)}`;
            const responseSummary = `Found ${result.results.length} POIs in ${result.executionTime}ms`;
            await addQueryToHistory(queryDescription, responseSummary);
            
            logger.success('POISearch', `✅ Search completed successfully`, {
                results: result.results.length,
                executionTime: `${result.executionTime}ms`,
                queryId: result.queryId
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Search failed';
            setError(errorMessage);
            logger.error('POISearch', '❌ Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Calculate distance for display
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">🔍 Privacy-Preserving POI Search</h2>
                <p className="text-gray-600">
                    Search for Points of Interest using EPLQ encrypted spatial queries
                </p>
            </div>

            {/* Service Status */}
            <div className={`p-4 rounded-lg border ${
                serviceInitialized 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
            }`}>
                <div className="flex items-center space-x-2">
                    <span className={serviceInitialized ? 'text-green-500' : 'text-yellow-500'}>
                        {serviceInitialized ? '✅' : '⏳'}
                    </span>
                    <span className={`text-sm font-semibold ${
                        serviceInitialized ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                        EPLQ Query Service: {serviceInitialized ? 'Ready' : 'Initializing...'}
                    </span>
                </div>
            </div>

            {/* Search Configuration */}
            <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">Search Configuration</h3>
                
                {/* Location Input */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-black text-gray-700 mb-2">Search Location</label>
                        
                        {/* Current Location Status */}
                        {searchLocation && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-500">📍</span>
                                    <span className="text-green-800 font-semibold">Location Set:</span>
                                    <span className="text-green-700 font-mono text-sm">
                                        {searchLocation.latitude.toFixed(6)}, {searchLocation.longitude.toFixed(6)}
                                    </span>
                                </div>
                                {searchLocation.address && (
                                    <p className="text-green-600 text-xs mt-1 ml-6">{searchLocation.address}</p>
                                )}
                            </div>
                        )}

                        {/* Location Options */}
                        <div className="space-y-3">
                            {/* Use Current Location */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <BrutalistButton
                                    onClick={handleUseCurrentLocation}
                                    variant="secondary"
                                    size="sm"
                                    className="shrink-0"
                                >
                                    📍 Use Current Location
                                </BrutalistButton>
                                
                                {/* Quick Location Presets */}
                                <div className="flex flex-wrap gap-2">
                                    <BrutalistButton
                                        onClick={() => handleManualLocation('40.7128', '-74.0060')}
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        🗽 NYC
                                    </BrutalistButton>
                                    <BrutalistButton
                                        onClick={() => handleManualLocation('34.0522', '-118.2437')}
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        🌴 LA
                                    </BrutalistButton>
                                    <BrutalistButton
                                        onClick={() => handleManualLocation('51.5074', '-0.1278')}
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        🇬🇧 London
                                    </BrutalistButton>
                                    <BrutalistButton
                                        onClick={() => handleManualLocation('25.5924', '84.9567')}
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        🇮🇳 Bihar
                                    </BrutalistButton>
                                </div>
                            </div>

                            {/* Manual Coordinates */}
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Or enter coordinates manually:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <BrutalistInput
                                        type="number"
                                        placeholder="Latitude (e.g., 40.7128)"
                                        step="any"
                                        onChange={(e) => {
                                            const lng = (e.target.form?.elements.namedItem('longitude') as HTMLInputElement)?.value || '';
                                            if (e.target.value && lng) {
                                                handleManualLocation(e.target.value, lng);
                                            }
                                        }}
                                        name="latitude"
                                    />
                                    <BrutalistInput
                                        type="number"
                                        placeholder="Longitude (e.g., -74.0060)"
                                        step="any"
                                        onChange={(e) => {
                                            const lat = (e.target.form?.elements.namedItem('latitude') as HTMLInputElement)?.value || '';
                                            if (lat && e.target.value) {
                                                handleManualLocation(lat, e.target.value);
                                            }
                                        }}
                                        name="longitude"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Tip: Use one of the preset locations above to get started quickly
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-black text-gray-700 mb-2">Search Radius (meters)</label>
                            <BrutalistSelect
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                            >
                                <option value={500}>500m (Walking distance)</option>
                                <option value={1000}>1km (Short walk)</option>
                                <option value={2000}>2km (Medium distance)</option>
                                <option value={5000}>5km (Nearby area)</option>
                                <option value={10000}>10km (Wide area)</option>
                            </BrutalistSelect>
                        </div>
                        <div>
                            <label className="block text-sm font-black text-gray-700 mb-2">Category (optional)</label>
                            <BrutalistInput
                                type="text"
                                placeholder="e.g., restaurant, hotel, park"
                                value={searchCategory}
                                onChange={(e) => setSearchCategory(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Search Button */}
                <BrutalistButton
                    onClick={handleSearch}
                    disabled={!serviceInitialized || !searchLocation || isSearching}
                    className="w-full"
                >
                    {isSearching ? '🔍 Searching...' : '🚀 Execute Privacy-Preserving Search'}
                </BrutalistButton>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <span className="text-red-500">❌</span>
                        <div className="text-red-700">
                            <p className="font-semibold">Search Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Query Performance */}
            {queryResult && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h3 className="font-black text-blue-900 mb-2">🚀 Query Performance</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700 font-semibold">Execution Time:</span>
                            <p className="text-blue-900 font-black">{queryResult.executionTime}ms</p>
                        </div>
                        <div>
                            <span className="text-blue-700 font-semibold">Results Found:</span>
                            <p className="text-blue-900 font-black">{queryResult.results.length}</p>
                        </div>
                        <div>
                            <span className="text-blue-700 font-semibold">Points Scanned:</span>
                            <p className="text-blue-900 font-black">{queryResult.totalScanned}</p>
                        </div>
                        <div>
                            <span className="text-blue-700 font-semibold">Query ID:</span>
                            <p className="text-blue-900 font-black text-xs">{queryResult.queryId.split('_')[2]}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {queryResult && (
                <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-4">
                        🎯 Search Results ({searchResults.length} found)
                    </h3>
                    
                    {searchResults.length > 0 ? (
                        <div className="space-y-4">
                            {searchResults.map((poi, index) => {
                                const distance = searchLocation 
                                    ? calculateDistance(searchLocation.latitude, searchLocation.longitude, poi.latitude, poi.longitude)
                                    : 0;
                                
                                return (
                                    <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-gray-900 text-lg">{poi.name}</h4>
                                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">
                                                {Math.round(distance)}m away
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600 font-semibold">Category:</span>
                                                <p className="text-gray-900 font-semibold">{poi.category}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-semibold">Coordinates:</span>
                                                <p className="text-gray-900 font-mono text-xs">{poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-semibold">Distance:</span>
                                                <p className="text-gray-900 font-semibold">{Math.round(distance)}m</p>
                                            </div>
                                        </div>
                                        {poi.description && (
                                            <p className="text-gray-600 text-sm mt-2">{poi.description}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">🔍</div>
                            <h4 className="text-xl font-black text-gray-900 mb-2">No POIs Found</h4>
                            <p className="text-gray-600 mb-4">
                                No Points of Interest found in your search area. This could be because:
                            </p>
                            <ul className="text-gray-600 text-sm space-y-1 mb-6 text-left max-w-md mx-auto">
                                <li>• No POI data available for this location</li>
                                <li>• Search radius too small (try increasing radius)</li>
                                <li>• Specific category has no nearby results</li>
                                <li>• Database is empty (this is a demo system)</li>
                            </ul>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                                <h5 className="font-black text-blue-900 mb-2">💡 Tips to get results:</h5>
                                <ul className="text-blue-800 text-sm space-y-1">
                                    <li>• Increase search radius to 2-5km</li>
                                    <li>• Try "All Categories" instead of specific category</li>
                                    <li>• Search in a major city location</li>
                                    <li>• Ask an admin to upload POI data</li>
                                </ul>
                            </div>
                        </div>
                    )}
                    
                    {/* Query Performance Info */}
                    {queryResult && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h5 className="font-black text-gray-900 mb-2">📊 Query Performance</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Execution Time:</span>
                                    <p className="font-black text-gray-900">{queryResult.executionTime}ms</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Points Scanned:</span>
                                    <p className="font-black text-gray-900">{queryResult.totalScanned}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Results Found:</span>
                                    <p className="font-black text-gray-900">{searchResults.length}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Query ID:</span>
                                    <p className="font-mono text-xs text-gray-700">{queryResult.queryId}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Privacy Information */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <h3 className="font-black text-purple-900 mb-2">🔒 Privacy Protection</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Your search location is encrypted using EPLQ predicate-only encryption</li>
                    <li>• Server cannot see your actual coordinates or search patterns</li>
                    <li>• All POI data remains encrypted throughout the query process</li>
                    <li>• Zero-knowledge privacy preservation ensures complete confidentiality</li>
                </ul>
            </div>
        </div>
    );
};

export default POISearch;
