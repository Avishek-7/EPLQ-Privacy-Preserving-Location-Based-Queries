import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EPLQQueryService, type QueryResult } from './eplq-query';
import { getDocs } from 'firebase/firestore';

// Mock the crypto module
vi.mock('../lib/encryption/eplq-crypto', () => ({
  eplqCrypto: {
    isInitialized: vi.fn().mockReturnValue(false),
    initialize: vi.fn().mockResolvedValue(undefined),
    encryptQuery: vi.fn().mockResolvedValue({
      encryptedPredicate: 'encrypted-predicate',
      queryToken: 'test-token',
      iv: 'test-iv',
      timestamp: Date.now()
    }),
    encryptPOI: vi.fn().mockResolvedValue({
      encryptedCoords: 'encrypted-coords',
      spatialIndex: 'test-index',
      predicateHash: 'test-hash',
      iv: 'test-iv',
      timestamp: Date.now()
    }),
    decryptPOI: vi.fn().mockResolvedValue({
      name: 'Test POI',
      category: 'restaurant',
      latitude: 25.6093,
      longitude: 85.1376,
      description: 'Test restaurant'
    }),
    executeRangeQuery: vi.fn().mockResolvedValue([
      {
        name: 'Test POI',
        category: 'restaurant',
        latitude: 25.6093,
        longitude: 85.1376,
        description: 'Test restaurant'
      }
    ])
  }
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue('mock-timestamp')
}));

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  }
}));

describe('EPLQQueryService', () => {
  let queryService: EPLQQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    queryService = new EPLQQueryService();
  });

  describe('initialization', () => {
    it('creates a new instance', () => {
      expect(queryService).toBeInstanceOf(EPLQQueryService);
    });

    it('initializes the service', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      
      await queryService.initialize();
      
      expect(eplqCrypto.initialize).toHaveBeenCalled();
    });

    it('handles initialization when crypto is already initialized', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      
      await queryService.initialize();
      
      expect(eplqCrypto.initialize).not.toHaveBeenCalled();
    });

    it('handles initialization errors', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      vi.mocked(eplqCrypto.initialize).mockRejectedValue(new Error('Crypto init failed'));

      await expect(queryService.initialize()).rejects.toThrow('Query service initialization failed');
    });
  });

  describe('range query execution', () => {
    it('executes range query successfully', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      // Mock successful initialization
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      
      // Mock Firestore response with proper QuerySnapshot interface
      const mockDoc = {
        id: 'poi-1',
        data: () => ({
          name: 'Test Restaurant',
          category: 'restaurant',
          latitude: 25.6093,
          longitude: 85.1376,
          description: 'A test restaurant'
        })
      };
      
      const mockQuerySnapshot = {
        docs: [mockDoc],
        forEach: vi.fn((callback) => [mockDoc].forEach(callback)),
        size: 1,
        empty: false
      };
      
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      // Mock crypto range query execution
      vi.mocked(eplqCrypto.executeRangeQuery).mockResolvedValue([
        {
          name: 'Test Restaurant',
          category: 'restaurant',
          latitude: 25.6093,
          longitude: 85.1376,
          description: 'A test restaurant'
        }
      ]);

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result = await queryService.executeRangeQuery(predicate, 'test-user', 10);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Test Restaurant');
    });

    it('handles uninitialized service', async () => {
      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 'test-user', 10))
        .rejects.toThrow('Query service not initialized');
    });
  });

  describe('range query with encrypted point', () => {
    it('executes query with encrypted point', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      
      const emptyQuerySnapshot = {
        docs: [],
        forEach: vi.fn((callback) => [].forEach(callback)),
        size: 0,
        empty: true
      };
      
      vi.mocked(getDocs).mockResolvedValue(emptyQuerySnapshot as any);

      vi.mocked(eplqCrypto.executeRangeQuery).mockResolvedValue([]);

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result = await queryService.executeRangeQuery(predicate, 'test-user', 10);

      expect(result).toBeDefined();
      expect(result.results).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('handles database query errors', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 'test-user', 10))
        .rejects.toThrow('Query execution failed');
    });

    it('handles decryption errors', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      const emptyQuerySnapshot = {
        docs: [],
        forEach: vi.fn((callback) => [].forEach(callback)),
        size: 0,
        empty: true
      };
      vi.mocked(getDocs).mockResolvedValue(emptyQuerySnapshot as any);
      vi.mocked(eplqCrypto.executeRangeQuery).mockRejectedValue(new Error('Decryption failed'));

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 'test-user', 10))
        .rejects.toThrow('Query execution failed');
    });
  });

  describe('query metrics', () => {
    it('tracks execution time', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      const emptyQuerySnapshot = {
        docs: [],
        forEach: vi.fn((callback) => [].forEach(callback)),
        size: 0,
        empty: true
      };
      vi.mocked(getDocs).mockResolvedValue(emptyQuerySnapshot as any);
      vi.mocked(eplqCrypto.executeRangeQuery).mockResolvedValue([]);

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result = await queryService.executeRangeQuery(predicate, 'test-user', 10);

      expect(result.executionTime).toBeTypeOf('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('generates unique query IDs', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      const emptyQuerySnapshot = {
        docs: [],
        forEach: vi.fn((callback) => [].forEach(callback)),
        size: 0,
        empty: true
      };
      vi.mocked(getDocs).mockResolvedValue(emptyQuerySnapshot as any);
      vi.mocked(eplqCrypto.executeRangeQuery).mockResolvedValue([]);

      await queryService.initialize();

      const predicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result1 = await queryService.executeRangeQuery(predicate, 'test-user', 10);
      const result2 = await queryService.executeRangeQuery(predicate, 'test-user', 10);

      expect(result1.queryId).toBeTypeOf('string');
      expect(result2.queryId).toBeTypeOf('string');
      expect(result1.queryId).not.toBe(result2.queryId);
    });
  });
});