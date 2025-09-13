import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'indexer/**',
      'wildduck/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/test/**',
        '**/__tests__/**',
        '**/scripts/**',
        '**/templates/**',
        '**/docs/**',
        '**/examples/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // More strict thresholds for critical business logic
        'src/business/core/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/network/clients/**': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      },
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});