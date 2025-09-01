import { vi } from 'vitest'
import { webcrypto } from 'crypto'

// Polyfill crypto.getRandomValues for Node.js environment
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
})

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