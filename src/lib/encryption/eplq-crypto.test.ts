import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eplqCrypto, type POIData } from './eplq-crypto'

// Mock CryptoJS for testing
vi.mock('crypto-js', () => ({
  SHA256: vi.fn().mockReturnValue({ toString: () => 'mocked_hash' }),
  AES: {
    encrypt: vi.fn().mockReturnValue({ toString: () => 'encrypted_data' }),
    decrypt: vi.fn().mockReturnValue({ toString: () => 'decrypted_data' }),
  },
  lib: {
    WordArray: {
      random: vi.fn().mockReturnValue({ toString: () => 'random_key' }),
    },
  },
  enc: {
    Utf8: {
      parse: vi.fn(),
      stringify: vi.fn().mockReturnValue('utf8_string'),
    },
  },
}))

describe('EPLQ Crypto', () => {
  const mockPOI: POIData = {
    name: 'Test POI',
    category: 'restaurant',
    latitude: 25.6093,
    longitude: 85.1376,
    description: 'Test description',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize successfully', async () => {
    const result = await eplqCrypto.initialize()
    expect(result).toBe(true)
  })

  it('should return initialization status', () => {
    const isInitialized = eplqCrypto.isInitialized()
    expect(typeof isInitialized).toBe('boolean')
  })

  it('should encrypt POI data', async () => {
    const encryptedPOI = await eplqCrypto.encryptPOI(mockPOI)
    
    expect(encryptedPOI).toHaveProperty('encryptedLat')
    expect(encryptedPOI).toHaveProperty('encryptedLng')
    expect(encryptedPOI).toHaveProperty('geohash')
    expect(encryptedPOI).toHaveProperty('spatialIndex')
  })

  it('should encrypt query predicates', async () => {
    const predicate = {
      centerLat: 25.6093,
      centerLng: 85.1376,
      radius: 10000, // 10km in meters
      category: 'restaurant',
    }

    const encryptedQuery = await eplqCrypto.encryptQuery(predicate)
    expect(encryptedQuery).toHaveProperty('encryptedPredicate')
    expect(encryptedQuery).toHaveProperty('queryToken')
    expect(encryptedQuery).toHaveProperty('iv')
    expect(encryptedQuery).toHaveProperty('timestamp')
  })

  it('should clear persisted keys', async () => {
    const result = await eplqCrypto.clearPersistedKeys()
    expect(result).toBe(true)
  })

  it('should handle invalid POI data', async () => {
    const invalidPOI = {
      name: '',
      category: '',
      latitude: NaN,
      longitude: NaN,
      description: '',
    } as POIData

    await expect(eplqCrypto.encryptPOI(invalidPOI)).rejects.toThrow()
  })

  it('should validate coordinate ranges', async () => {
    const invalidCoordsPOI = {
      ...mockPOI,
      latitude: 91, // Invalid latitude
      longitude: 181, // Invalid longitude
    }

    await expect(eplqCrypto.encryptPOI(invalidCoordsPOI)).rejects.toThrow()
  })
})