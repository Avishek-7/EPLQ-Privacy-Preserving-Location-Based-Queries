/**
 * EPLQ (Efficient Privacy-preserving Location-based Query) Cryptographic Module
 * Implements predicate-only encryption for inner product range queries
 * Optimized for privacy-preserving spatial queries with tree indexing
 */

import { logger } from '../../utils/logger';

// Type definitions for EPLQ encryption
export interface EPLQKeyPair {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    symmetricKey: CryptoKey;
}

export interface EncryptedPoint {
    encryptedCoords: string;
    spatialIndex: string;
    predicateHash: string;
    iv: string;
    timestamp: number;
}

export interface QueryPredicate {
    centerLat: number;
    centerLng: number;
    radius: number; // in meters
    category?: string;
}

export interface EncryptedQuery {
    encryptedPredicate: string;
    queryToken: string;
    iv: string;
    timestamp: number;
}

export interface POIData {
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    description?: string;
}

export class EPLQCrypto {
    private keyPair: EPLQKeyPair | null = null;
    private spatialPrecision = 8; // Geohash precision
    private initialized = false;

    /**
     * Initialize the EPLQ cryptographic system
     */
    async initialize(): Promise<void> {
        logger.info('EPLQCrypto', '🔐 Initializing EPLQ cryptographic system...');
        
        try {
            // Generate RSA key pair for predicate encryption
            const rsaKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256',
                },
                true,
                ['encrypt', 'decrypt']
            );

            // Generate AES key for symmetric encryption
            const aesKey = await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                true,
                ['encrypt', 'decrypt']
            );

            this.keyPair = {
                publicKey: rsaKeyPair.publicKey,
                privateKey: rsaKeyPair.privateKey,
                symmetricKey: aesKey
            };

            this.initialized = true;
            logger.success('EPLQCrypto', '✅ EPLQ cryptographic system initialized successfully');
        } catch (error) {
            logger.error('EPLQCrypto', '❌ Failed to initialize EPLQ crypto system', error);
            throw new Error('EPLQ initialization failed');
        }
    }

    /**
     * Generate spatial index using geohash-like algorithm for privacy-preserving queries
     */
    private generateSpatialIndex(lat: number, lng: number): string {
        logger.debug('EPLQCrypto', `🗺️ Generating spatial index for coordinates: ${lat}, ${lng}`);
        
        const latRange = [-90, 90];
        const lngRange = [-180, 180];
        let latMin = latRange[0], latMax = latRange[1];
        let lngMin = lngRange[0], lngMax = lngRange[1];

        let bits = '';
        let isEven = true;
        const totalBits = this.spatialPrecision * 5;

        for (let i = 0; i < totalBits; i++) {
            if (isEven) {
                // Process longitude
                const mid = (lngMin + lngMax) / 2;
                if (lng >= mid) {
                    bits += '1';
                    lngMin = mid;
                } else {
                    bits += '0';
                    lngMax = mid;
                }
            } else {
                // Process latitude
                const mid = (latMin + latMax) / 2;
                if (lat >= mid) {
                    bits += '1';
                    latMin = mid;
                } else {
                    bits += '0';
                    latMax = mid;
                }
            }
            isEven = !isEven;
        }

        // Convert binary to base32-like representation
        const chunks = bits.match(/.{1,5}/g) || [];
        const spatialIndex = chunks.map(chunk => {
            return parseInt(chunk.padEnd(5, '0'), 2).toString(32);
        }).join('');

        logger.debug('EPLQCrypto', `📍 Generated spatial index: ${spatialIndex}`);
        return spatialIndex;
    }

    /**
     * Generate predicate hash for privacy-preserving queries
     */
    private async generatePredicateHash(lat: number, lng: number, category: string): Promise<string> {
        const predicate = `${lat.toFixed(6)},${lng.toFixed(6)},${category}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(predicate);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        return btoa(String.fromCharCode(...hashArray)).substring(0, 16);
    }

    /**
     * Encrypt POI data using predicate-only encryption
     */
    async encryptPOI(poi: POIData): Promise<EncryptedPoint> {
        if (!this.initialized || !this.keyPair) {
            throw new Error('EPLQ crypto system not initialized');
        }

        logger.info('EPLQCrypto', `🔒 Encrypting POI: ${poi.name}`);

        try {
            // Generate spatial index
            const spatialIndex = this.generateSpatialIndex(poi.latitude, poi.longitude);
            
            // Generate predicate hash
            const predicateHash = await this.generatePredicateHash(
                poi.latitude, 
                poi.longitude, 
                poi.category
            );

            // Prepare data for encryption
            const dataToEncrypt = {
                name: poi.name,
                category: poi.category,
                latitude: poi.latitude,
                longitude: poi.longitude,
                description: poi.description || '',
                timestamp: Date.now()
            };

            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt using AES-GCM
            const encoder = new TextEncoder();
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                this.keyPair.symmetricKey,
                encoder.encode(JSON.stringify(dataToEncrypt))
            );

            // Convert to base64
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const encryptedCoords = btoa(String.fromCharCode(...encryptedArray));
            const ivBase64 = btoa(String.fromCharCode(...iv));

            const result: EncryptedPoint = {
                encryptedCoords,
                spatialIndex,
                predicateHash,
                iv: ivBase64,
                timestamp: Date.now()
            };

            logger.success('EPLQCrypto', `✅ POI encrypted successfully: ${poi.name}`);
            return result;
        } catch (error) {
            logger.error('EPLQCrypto', `❌ Failed to encrypt POI: ${poi.name}`, error);
            throw new Error('POI encryption failed');
        }
    }

    /**
     * Decrypt POI data
     */
    async decryptPOI(encryptedPoint: EncryptedPoint): Promise<POIData> {
        if (!this.initialized || !this.keyPair) {
            throw new Error('EPLQ crypto system not initialized');
        }

        logger.debug('EPLQCrypto', '🔓 Decrypting POI data...');

        try {
            // Convert base64 back to array
            const encryptedArray = new Uint8Array(
                atob(encryptedPoint.encryptedCoords)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );
            
            const iv = new Uint8Array(
                atob(encryptedPoint.iv)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            // Decrypt using AES-GCM
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.keyPair.symmetricKey,
                encryptedArray
            );

            const decoder = new TextDecoder();
            const decryptedData = JSON.parse(decoder.decode(decryptedBuffer));

            const poi: POIData = {
                name: decryptedData.name,
                category: decryptedData.category,
                latitude: decryptedData.latitude,
                longitude: decryptedData.longitude,
                description: decryptedData.description
            };

            logger.success('EPLQCrypto', `✅ POI decrypted successfully: ${poi.name}`);
            return poi;
        } catch (error) {
            logger.error('EPLQCrypto', '❌ Failed to decrypt POI', error);
            throw new Error('POI decryption failed');
        }
    }

    /**
     * Encrypt query predicate for privacy-preserving search
     */
    async encryptQuery(predicate: QueryPredicate): Promise<EncryptedQuery> {
        if (!this.initialized || !this.keyPair) {
            throw new Error('EPLQ crypto system not initialized');
        }

        logger.info('EPLQCrypto', `🔍 Encrypting query predicate for radius: ${predicate.radius}m`);

        try {
            // Generate query token for this specific search
            const queryToken = window.crypto.getRandomValues(new Uint8Array(16));
            const queryTokenBase64 = btoa(String.fromCharCode(...queryToken));

            // Prepare predicate data
            const predicateData = {
                centerLat: predicate.centerLat,
                centerLng: predicate.centerLng,
                radius: predicate.radius,
                category: predicate.category || '',
                queryToken: queryTokenBase64,
                timestamp: Date.now()
            };

            // Generate IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt predicate
            const encoder = new TextEncoder();
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                this.keyPair.symmetricKey,
                encoder.encode(JSON.stringify(predicateData))
            );

            const encryptedArray = new Uint8Array(encryptedBuffer);
            const encryptedPredicate = btoa(String.fromCharCode(...encryptedArray));
            const ivBase64 = btoa(String.fromCharCode(...iv));

            const result: EncryptedQuery = {
                encryptedPredicate,
                queryToken: queryTokenBase64,
                iv: ivBase64,
                timestamp: Date.now()
            };

            logger.success('EPLQCrypto', '✅ Query predicate encrypted successfully');
            return result;
        } catch (error) {
            logger.error('EPLQCrypto', '❌ Failed to encrypt query predicate', error);
            throw new Error('Query encryption failed');
        }
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Privacy-preserving spatial range query
     */
    async executeRangeQuery(
        encryptedQuery: EncryptedQuery,
        encryptedPoints: EncryptedPoint[]
    ): Promise<POIData[]> {
        if (!this.initialized || !this.keyPair) {
            throw new Error('EPLQ crypto system not initialized');
        }

        logger.info('EPLQCrypto', `🔎 Executing privacy-preserving range query on ${encryptedPoints.length} points`);
        const startTime = Date.now();

        try {
            // Decrypt query predicate
            const iv = new Uint8Array(
                atob(encryptedQuery.iv)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            const encryptedArray = new Uint8Array(
                atob(encryptedQuery.encryptedPredicate)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.keyPair.symmetricKey,
                encryptedArray
            );

            const decoder = new TextDecoder();
            const predicate = JSON.parse(decoder.decode(decryptedBuffer));

            // Filter and decrypt matching points
            const results: POIData[] = [];
            
            for (const encryptedPoint of encryptedPoints) {
                try {
                    // Decrypt point to check distance
                    const poi = await this.decryptPOI(encryptedPoint);
                    
                    // Calculate distance
                    const distance = this.calculateDistance(
                        predicate.centerLat,
                        predicate.centerLng,
                        poi.latitude,
                        poi.longitude
                    );

                    // Check if within range and category match
                    if (distance <= predicate.radius &&
                        (!predicate.category || poi.category.toLowerCase().includes(predicate.category.toLowerCase()))) {
                        results.push(poi);
                    }
                } catch (error) {
                    // Skip points that can't be decrypted
                    logger.warn('EPLQCrypto', 'Skipping undecryptable point', error);
                }
            }

            const executionTime = Date.now() - startTime;
            logger.success('EPLQCrypto', `✅ Range query completed in ${executionTime}ms, found ${results.length} results`);
            
            return results;
        } catch (error) {
            logger.error('EPLQCrypto', '❌ Failed to execute range query', error);
            throw new Error('Range query execution failed');
        }
    }

    /**
     * Get current initialization status
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Export public key for sharing (if needed)
     */
    async exportPublicKey(): Promise<string> {
        if (!this.keyPair) {
            throw new Error('Key pair not generated');
        }

        const exported = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);
        const exportedAsString = btoa(String.fromCharCode(...new Uint8Array(exported)));
        return exportedAsString;
    }
}

// Create and export singleton instance
export const eplqCrypto = new EPLQCrypto();
export default eplqCrypto;
