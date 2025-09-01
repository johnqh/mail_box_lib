// This file sets up crypto polyfill for vitest
// It's loaded before vitest config using node --import flag

import crypto from 'crypto';

// Ensure crypto is available globally before any other code runs
if (!globalThis.crypto) {
  if (crypto.webcrypto) {
    globalThis.crypto = crypto.webcrypto;
  } else {
    // Fallback for older Node versions
    globalThis.crypto = {
      getRandomValues: (arr) => {
        return crypto.randomFillSync(arr);
      },
      randomUUID: crypto.randomUUID || (() => {
        return crypto.randomBytes(16).toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      }),
    };
  }
}

// Also set on global for compatibility
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = globalThis.crypto;
}