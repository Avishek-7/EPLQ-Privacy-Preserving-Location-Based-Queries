import { collection, query, getDocs, where, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { eplqCrypto, type QueryPredicate, type POIData, type EncryptedPoint } from '../lib/encryption/eplq-crypto';
import { logger } from '../utils/logger';

export interface QueryResult {
    results: POIData[];
    executionTime: number;
    queryId: string;
    timestamp: number;
    totalScanned: number;
}

export interface QueryHistory {
    queryId: string;
    predicate: QueryPredicate;
    resultCount: number;
    executionTime: number;
    timestamp: number;
    userId: string;
}

export class EPLQQueryService {
    private initialized = false;

    /**
     * Initialize the query service
     */
    async initialize(): Promise<void> {
        logger.info('EPLQQueryService', '🚀 Initializing EPLQ Query Service...');
        
        try {
            // Initialize the crypto system if not already done
            if (!eplqCrypto.isInitialized()) {
                await eplqCrypto.initialize();
            }
            
            this.initialized = true;
            logger.success('EPLQQueryService', '✅ EPLQ Query Service initialized successfully');
        } catch (error) {
            logger.error('EPLQQueryService', '❌ Failed to initialize Query Service', error);
            throw new Error('Query service initialization failed');
        }
    }

    /**
     * Execute a privacy-preserving spatial range query
     */
    async executeRangeQuery(
        predicate: QueryPredicate, 
        userId: string,
        maxResults: number = 50
    ): Promise<QueryResult> {
        if (!this.initialized) {
            throw new Error('Query service not initialized');
        }

        const queryId = this.generateQueryId();
        const startTime = Date.now();
        
        logger.info('EPLQQueryService', `🔍 Executing range query: ${queryId}`, {
            center: `${predicate.centerLat}, ${predicate.centerLng}`,
            radius: `${predicate.radius}m`,
            category: predicate.category || 'all'
        });

        try {
            // Step 1: Encrypt the query predicate
            logger.debug('EPLQQueryService', '🔐 Encrypting query predicate...');
            const encryptedQuery = await eplqCrypto.encryptQuery(predicate);

            // Step 2: Retrieve encrypted POI data from Firestore
            logger.debug('EPLQQueryService', '📥 Retrieving encrypted POI data...');
            const encryptedPoints = await this.retrieveEncryptedPOIs(predicate);
            
            logger.info('EPLQQueryService', `📊 Retrieved ${encryptedPoints.length} encrypted points for analysis`);

            // If no data available, return empty results with helpful message
            if (encryptedPoints.length === 0) {
                logger.warn('EPLQQueryService', '⚠️ No POI data available in database');
                const executionTime = Date.now() - startTime;
                
                return {
                    results: [],
                    executionTime,
                    queryId,
                    timestamp: Date.now(),
                    totalScanned: 0
                };
            }

            // Step 3: Execute privacy-preserving range query
            logger.debug('EPLQQueryService', '🧮 Executing privacy-preserving computation...');
            const results = await eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPoints);

            // Step 4: Limit results and calculate metrics
            const limitedResults = results.slice(0, maxResults);
            const executionTime = Date.now() - startTime;

            // Step 5: Log query for analytics
            await this.logQuery({
                queryId,
                predicate: {
                    ...predicate,
                    category: predicate.category || 'all' // Ensure category is never undefined
                },
                resultCount: limitedResults.length,
                executionTime,
                timestamp: Date.now(),
                userId
            });

            const queryResult: QueryResult = {
                results: limitedResults,
                executionTime,
                queryId,
                timestamp: Date.now(),
                totalScanned: encryptedPoints.length
            };

            logger.success('EPLQQueryService', `✅ Query ${queryId} completed successfully`, {
                results: limitedResults.length,
                executionTime: `${executionTime}ms`,
                scanned: encryptedPoints.length
            });

            return queryResult;
        } catch (error) {
            logger.error('EPLQQueryService', `❌ Query ${queryId} failed`, error);
            throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieve encrypted POIs from Firestore with spatial optimization
     */
    private async retrieveEncryptedPOIs(predicate: QueryPredicate): Promise<EncryptedPoint[]> {
        try {
            const poisCollection = collection(db, 'encryptedPOIs');
            let q;

            // Strategy 1: Try category-specific query with orderBy (requires index)
            if (predicate.category) {
                try {
                    q = query(
                        poisCollection,
                        where('category', '==', predicate.category),
                        orderBy('timestamp', 'desc'),
                        limit(1000)
                    );
                    
                    logger.debug('EPLQQueryService', `🎯 Querying with category filter: ${predicate.category}`);
                    const querySnapshot = await getDocs(q);
                    return this.processQuerySnapshot(querySnapshot, predicate);
                } catch (indexError) {
                    logger.warn('EPLQQueryService', '⚠️ Category+timestamp index not available, falling back to simple query', indexError);
                    
                    // Fallback: Query by category only (no orderBy)
                    q = query(
                        poisCollection,
                        where('category', '==', predicate.category),
                        limit(1000)
                    );
                    
                    const querySnapshot = await getDocs(q);
                    return this.processQuerySnapshot(querySnapshot, predicate);
                }
            } else {
                // Strategy 2: No category filter, just get recent POIs
                try {
                    q = query(
                        poisCollection,
                        orderBy('timestamp', 'desc'),
                        limit(1000)
                    );
                    
                    logger.debug('EPLQQueryService', '📋 Querying all POIs ordered by timestamp');
                    const querySnapshot = await getDocs(q);
                    return this.processQuerySnapshot(querySnapshot, predicate);
                } catch (indexError) {
                    logger.warn('EPLQQueryService', '⚠️ Timestamp index not available, using simple query', indexError);
                    
                    // Fallback: Simple query without orderBy
                    q = query(poisCollection, limit(1000));
                    const querySnapshot = await getDocs(q);
                    return this.processQuerySnapshot(querySnapshot, predicate);
                }
            }
        } catch (error) {
            logger.error('EPLQQueryService', '❌ Failed to retrieve encrypted POIs', error);
            
            // Final fallback: Return empty array to allow query to continue
            logger.warn('EPLQQueryService', '🔄 Returning empty result set due to query errors');
            return [];
        }
    }

    /**
     * Process Firestore query snapshot into EncryptedPoint array
     */
    private processQuerySnapshot(querySnapshot: Awaited<ReturnType<typeof getDocs>>, predicate: QueryPredicate): EncryptedPoint[] {
        const encryptedPoints: EncryptedPoint[] = [];
        const spatialBounds = this.calculateSpatialBounds(predicate);

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            if (this.isValidEncryptedPoint(data) && this.isWithinSpatialBounds(data, spatialBounds)) {
                encryptedPoints.push({
                    encryptedCoords: (data.encryptedData || data.encryptedCoords) as string,
                    spatialIndex: data.spatialIndex as string,
                    predicateHash: (data.predicateHash || '') as string,
                    iv: (data.iv || '') as string,
                    timestamp: data.timestamp as number
                });
            }
        });

        logger.debug('EPLQQueryService', `📋 Processed ${encryptedPoints.length} valid encrypted points`);
        return encryptedPoints;
    }

    /**
     * Calculate spatial bounds for query optimization
     */
    private calculateSpatialBounds(predicate: QueryPredicate) {
        // Simple bounding box calculation (can be enhanced with proper spatial indexing)
        const earthRadius = 6371000; // meters
        const latDelta = (predicate.radius / earthRadius) * (180 / Math.PI);
        const lngDelta = (predicate.radius / earthRadius) * (180 / Math.PI) / Math.cos(predicate.centerLat * Math.PI / 180);
        
        return {
            minLat: predicate.centerLat - latDelta,
            maxLat: predicate.centerLat + latDelta,
            minLng: predicate.centerLng - lngDelta,
            maxLng: predicate.centerLng + lngDelta
        };
    }

    /**
     * Check if data point is within spatial bounds (rough filtering)
     */
    private isWithinSpatialBounds(data: Record<string, unknown>, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): boolean {
        // This is a simplified check - in practice, you'd need proper spatial indexing
        // For encrypted data, this might work on spatial index fields if available
        if (data.approximateLat && data.approximateLng && 
            typeof data.approximateLat === 'number' && typeof data.approximateLng === 'number') {
            return data.approximateLat >= bounds.minLat && 
                   data.approximateLat <= bounds.maxLat &&
                   data.approximateLng >= bounds.minLng && 
                   data.approximateLng <= bounds.maxLng;
        }
        // If no spatial metadata, include all points (let encryption layer handle filtering)
        return true;
    }

    /**
     * Validate encrypted point data structure
     */
    private isValidEncryptedPoint(data: unknown): boolean {
        if (!data || typeof data !== 'object') return false;
        
        const obj = data as Record<string, unknown>;
        return !!(obj && 
               (obj.encryptedData || obj.encryptedCoords) && 
               obj.spatialIndex && 
               typeof obj.timestamp === 'number');
    }

    /**
     * Log query for analytics and performance monitoring
     */
    private async logQuery(queryHistory: QueryHistory): Promise<void> {
        try {
            const queryLogRef = doc(collection(db, 'queryLogs'), queryHistory.queryId);
            await setDoc(queryLogRef, {
                ...queryHistory,
                createdAt: new Date()
            });
            
            logger.debug('EPLQQueryService', `📝 Query ${queryHistory.queryId} logged successfully`);
        } catch (error) {
            logger.warn('EPLQQueryService', 'Failed to log query (non-critical)', error);
            // Don't throw error for logging failures
        }
    }

    /**
     * Generate unique query ID
     */
    private generateQueryId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `eplq_${timestamp}_${random}`;
    }

    /**
     * Get query performance statistics
     */
    async getQueryStats(userId: string, days: number = 7): Promise<{
        totalQueries: number;
        avgExecutionTime: number;
        avgResultCount: number;
        recentQueries: QueryHistory[];
    }> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const logsCollection = collection(db, 'queryLogs');
            const q = query(
                logsCollection,
                where('userId', '==', userId),
                where('timestamp', '>=', cutoffDate.getTime()),
                orderBy('timestamp', 'desc'),
                limit(100)
            );

            const querySnapshot = await getDocs(q);
            const queries: QueryHistory[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as QueryHistory;
                queries.push(data);
            });

            const totalQueries = queries.length;
            const avgExecutionTime = totalQueries > 0 
                ? queries.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries 
                : 0;
            const avgResultCount = totalQueries > 0 
                ? queries.reduce((sum, q) => sum + q.resultCount, 0) / totalQueries 
                : 0;

            return {
                totalQueries,
                avgExecutionTime: Math.round(avgExecutionTime),
                avgResultCount: Math.round(avgResultCount * 100) / 100,
                recentQueries: queries.slice(0, 10)
            };
        } catch (error) {
            logger.error('EPLQQueryService', '❌ Failed to get query stats', error);
            return {
                totalQueries: 0,
                avgExecutionTime: 0,
                avgResultCount: 0,
                recentQueries: []
            };
        }
    }

    /**
     * Test query performance with sample data
     */
    async performanceTest(): Promise<{
        encryptionTime: number;
        queryTime: number;
        decryptionTime: number;
        totalTime: number;
    }> {
        if (!this.initialized) {
            throw new Error('Query service not initialized');
        }

        logger.info('EPLQQueryService', '🧪 Running performance test...');

        const startTotal = Date.now();

        // Test encryption
        const startEncryption = Date.now();
        const testPredicate: QueryPredicate = {
            centerLat: 40.7128,
            centerLng: -74.0060,
            radius: 1000,
            category: 'restaurant'
        };
        await eplqCrypto.encryptQuery(testPredicate);
        const encryptionTime = Date.now() - startEncryption;

        // Test query execution (with empty dataset)
        const startQuery = Date.now();
        await this.executeRangeQuery(testPredicate, 'test-user', 10);
        const queryTime = Date.now() - startQuery;

        // Decryption time is included in query time
        const decryptionTime = Math.round(queryTime * 0.3); // Estimated

        const totalTime = Date.now() - startTotal;

        const results = {
            encryptionTime,
            queryTime,
            decryptionTime,
            totalTime
        };

        logger.success('EPLQQueryService', '✅ Performance test completed', results);
        return results;
    }

    /**
     * Check if service is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Create and export singleton instance
export const eplqQueryService = new EPLQQueryService();
export default eplqQueryService;
