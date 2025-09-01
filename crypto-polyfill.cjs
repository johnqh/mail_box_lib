// Crypto polyfill for Node.js environments
// This file is loaded with --require before any other modules

// Try multiple approaches to ensure crypto is available
const crypto = require('crypto');

// Set up crypto on globalThis
if (!globalThis.crypto) {
  // Use webcrypto if available (Node 16+)
  if (crypto.webcrypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: crypto.webcrypto,
      writable: true,
      configurable: true,
    });
  } else {
    // Fallback for older Node versions - create a minimal crypto object
    const cryptoPolyfill = {
      getRandomValues: (arr) => {
        return crypto.randomFillSync(arr);
      },
      randomUUID: crypto.randomUUID || (() => {
        return crypto.randomBytes(16).toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      }),
    };
    
    Object.defineProperty(globalThis, 'crypto', {
      value: cryptoPolyfill,
      writable: true,
      configurable: true,
    });
  }
}

// Also set on global for compatibility
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = globalThis.crypto;
}