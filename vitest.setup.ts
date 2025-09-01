import { vi } from 'vitest'

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