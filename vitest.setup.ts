import { vi } from 'vitest'
import crypto from 'crypto'

// Ensure crypto is available globally
if (!globalThis.crypto) {
  // Use webcrypto if available (Node 16+)
  if (crypto.webcrypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto,
      writable: true,
      configurable: true,
    })
  } else {
    // Fallback for older Node versions
    const cryptoPolyfill = {
      getRandomValues: (arr: any) => {
        return crypto.randomFillSync(arr)
      },
      randomUUID: crypto.randomUUID || (() => {
        return crypto.randomBytes(16).toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
      }),
    }
    
    Object.defineProperty(globalThis, 'crypto', {
      value: cryptoPolyfill,
      writable: true,
      configurable: true,
    })
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window events
Object.defineProperty(window, 'addEventListener', { value: vi.fn() })
Object.defineProperty(window, 'removeEventListener', { value: vi.fn() })