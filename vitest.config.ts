import { defineConfig } from 'vitest/config'
import crypto from 'crypto'

// Apply crypto polyfill before Vite initialization
if (!globalThis.crypto) {
  if (crypto.webcrypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto,
      writable: true,
      configurable: true,
    })
  } else {
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

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'indexer',
      'wildduck'
    ]
  },
})