// Crypto polyfill for Node.js environments
// This file is loaded with --require before any other modules
const { webcrypto } = require('crypto');

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}