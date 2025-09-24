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
      encryptedLat: 'encrypted_lat',
      encryptedLng: 'encrypted_lng',
      geohash: 'test_geohash',
      spatialIndex: 'test_index',
    }),
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