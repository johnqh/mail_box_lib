// This file sets up crypto polyfill for vitest
import crypto from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = {};
}
globalThis.crypto.getRandomValues = (arr) => crypto.randomFillSync(arr);