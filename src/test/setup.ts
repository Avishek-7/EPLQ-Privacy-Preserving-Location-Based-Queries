import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

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

// Enhanced cleanup after each test for memory management
afterEach(() => {
  // Clean up DOM from React Testing Library
  cleanup();
  
  // Clear all mocks to prevent memory retention
  vi.clearAllMocks();
  
  // Clear any timers
  vi.clearAllTimers();
  
  // Reset modules to prevent state leakage between tests
  vi.resetModules();
  
  // Force garbage collection if available (Node.js with --expose-gc)
  if (global.gc) {
    global.gc();
  }
});

// Set up memory-efficient mocks
beforeEach(() => {
  // Mock console methods to prevent spam during tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock IntersectionObserver for scroll-based components
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});