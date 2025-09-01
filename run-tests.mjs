#!/usr/bin/env node

// Import the crypto setup first
await import('./vitest-crypto-setup.mjs');

// Then run vitest
await import('vitest/dist/cli.js');