import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(),
  },
}))

// Mock EPLQ Crypto
vi.mock('../lib/encryption/eplq-crypto', () => ({
  eplqCrypto: {
    initialize: vi.fn().mockResolvedValue(true),
    isInitialized: vi.fn().mockReturnValue(true),
    encryptPOI: vi.fn().mockResolvedValue({
      encryptedCoords: 'encrypted_coords',
      spatialIndex: 'test_index',
      predicateHash: 'test_hash',
      iv: 'test_iv',
      timestamp: Date.now(),
    }),
    encryptQuery: vi.fn().mockResolvedValue({
      encryptedPredicate: 'encrypted_predicate',
      queryToken: 'test_token',
      iv: 'test_iv',
      timestamp: Date.now(),
    }),
    decryptPOI: vi.fn().mockResolvedValue({
      name: 'Test POI',
      category: 'restaurant',
      latitude: 25.6093,
      longitude: 85.1376,
      description: 'Test description',
    }),
    decrypt: vi.fn().mockResolvedValue([
      {
        name: 'Test POI',
        category: 'restaurant',
        latitude: 25.6093,
        longitude: 85.1376,
        description: 'Test description',
      }
    ]),
    executeQuery: vi.fn().mockResolvedValue([]),
    clearPersistedKeys: vi.fn().mockResolvedValue(true),
  },
}))

// Mock geolocation
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 25.6093,
          longitude: 85.1376,
        },
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})