import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EPLQQueryService, type QueryResult } from './eplq-query';

// Mock the crypto module
vi.mock('../lib/encryption/eplq-crypto', () => ({
  eplqCrypto: {
    isInitialized: vi.fn().mockReturnValue(false),
    initialize: vi.fn().mockResolvedValue(undefined),
    encryptPoint: vi.fn().mockResolvedValue({
      encryptedX: 'encrypted-x',
      encryptedY: 'encrypted-y',
      proof: 'point-proof'
    }),
    encryptPredicate: vi.fn().mockResolvedValue({
      encryptedPredicate: 'encrypted-predicate',
      proof: 'predicate-proof'
    }),
    decrypt: vi.fn().mockResolvedValue([
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
      
      // Mock Firestore response
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'poi-1',
            data: () => ({
              name: 'Test Restaurant',
              category: 'restaurant',
              latitude: 25.6093,
              longitude: 85.1376,
              description: 'A test restaurant'
            })
          }
        ]
      } as any);

      // Mock crypto decryption
      vi.mocked(eplqCrypto.decrypt).mockResolvedValue([
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
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result = await queryService.executeRangeQuery(predicate, 10);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Test Restaurant');
    });

    it('handles uninitialized service', async () => {
      const predicate = {
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 10))
        .rejects.toThrow('Query service not initialized');
    });
  });

  describe('range query with encrypted point', () => {
    it('executes query with encrypted point', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      
      vi.mocked(getDocs).mockResolvedValue({
        docs: []
      } as any);

      vi.mocked(eplqCrypto.decrypt).mockResolvedValue([]);

      await queryService.initialize();

      const encryptedPoint = {
        encryptedX: 'encrypted-x',
        encryptedY: 'encrypted-y',
        proof: 'point-proof'
      };

      const result = await queryService.executeRangeQueryWithEncryptedPoint(
        encryptedPoint, 
        1000, 
        'restaurant', 
        10
      );

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
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 10))
        .rejects.toThrow('Database error');
    });

    it('handles decryption errors', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(eplqCrypto.decrypt).mockRejectedValue(new Error('Decryption failed'));

      await queryService.initialize();

      const predicate = {
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      await expect(queryService.executeRangeQuery(predicate, 10))
        .rejects.toThrow('Decryption failed');
    });
  });

  describe('query metrics', () => {
    it('tracks execution time', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(eplqCrypto.decrypt).mockResolvedValue([]);

      await queryService.initialize();

      const predicate = {
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result = await queryService.executeRangeQuery(predicate, 10);

      expect(result.executionTime).toBeTypeOf('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('generates unique query IDs', async () => {
      const { eplqCrypto } = await import('../lib/encryption/eplq-crypto');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(eplqCrypto.isInitialized).mockReturnValue(true);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(eplqCrypto.decrypt).mockResolvedValue([]);

      await queryService.initialize();

      const predicate = {
        centerX: 25.6093,
        centerY: 85.1376,
        radius: 1000,
        category: 'restaurant'
      };

      const result1 = await queryService.executeRangeQuery(predicate, 10);
      const result2 = await queryService.executeRangeQuery(predicate, 10);

      expect(result1.queryId).toBeTypeOf('string');
      expect(result2.queryId).toBeTypeOf('string');
      expect(result1.queryId).not.toBe(result2.queryId);
    });
  });
});