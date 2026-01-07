# AI-Assisted Development Guide

**Version: 3.6.9**
**Package: @sudobility/mail_box_lib**

This guide provides AI assistants with essential context and patterns for working on this React Native-compatible shared utilities library.

## 🎯 Quick Reference

### Essential Commands
```bash
# Validation (run before committing)
npm run check-all           # Lint + TypeCheck + Tests

# Development
npm run typecheck           # TypeScript validation (fastest check)
npm test                    # Run all 116 tests
npm run lint:fix            # Auto-fix linting issues
npm run build               # Build to dist/

# Watch modes
npm run build:watch         # Watch TypeScript compilation
npm run test:watch          # Watch tests
npm run typecheck:watch     # Watch type checking
```

### Current State (v3.6.9)
- **Tests**: 116 passing across 7 test files
- **Dependencies**: Updated @sudobility packages (di, types, indexer_client, wildduck_client)
- **Type System**: Uses `Optional<T>` pattern from @sudobility/types
- **Architecture**: Platform-agnostic business logic with TanStack Query integration

## 📁 Project Structure

```
src/
├── business/                # Core business logic (platform-agnostic)
│   ├── core/               # Domain operations (auth, analytics, folders, navigation)
│   ├── hooks/              # React hooks with TanStack Query
│   ├── stores/             # Zustand state management (mailboxes, messages, webhooks)
│   └── types/              # Business type definitions
├── di/                     # Dependency injection (from @sudobility/di)
├── network/                # HTTP clients
├── types/                  # TypeScript type definitions
│   ├── api.ts             # API types
│   ├── email.ts           # Email and user types
│   ├── blockchain/        # Blockchain types
│   └── services/          # Service interfaces
└── utils/                  # Platform-specific utilities
    ├── auth/              # Authentication utilities
    ├── blockchain/        # Blockchain utilities
    ├── contracts/         # Smart contract utilities
    └── email/             # Email transformation utilities
```

## 🔧 Key Patterns

### Optional<T> Type Pattern (REQUIRED)
**Always use `Optional<T>` for nullable values**

```typescript
import { Optional } from '@sudobility/types';

// ❌ WRONG
const value: string | null | undefined;
function getValue(): string | null { }

// ✅ CORRECT
const value: Optional<string>;
function getValue(): Optional<string> { }
```

### Type Import Locations (v3.6.9)
After recent refactoring, types are now imported from their source packages:

```typescript
// Core types from @sudobility/types
import {
  Optional,
  WalletType,
  StorageType,
  NetworkClient,
  NetworkResponse,
  AnalyticsService,
} from '@sudobility/types';

// Wildduck types from @sudobility/types
import {
  WildduckConfig,
  WildduckMailbox,
  WildduckUserAuth,
  WildduckMessage,
  WildduckMessageDetail,
} from '@sudobility/types';

// DI types from @sudobility/di
import type { StorageService } from '@sudobility/di';

// Contracts from @sudobility/contracts
import { OnchainMailerClient, WalletDetector } from '@sudobility/contracts';
```

### Hook Pattern with TanStack Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { Optional } from '@sudobility/types';

export const useFeature = (config: FeatureConfig) => {
  const [error, setError] = useState<Optional<string>>(null);

  const query = useQuery({
    queryKey: ['feature', config.id],
    queryFn: async () => {
      // Implementation
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: error || query.error?.message,
  };
};
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand';
import { Optional } from '@sudobility/types';

interface StoreState {
  data: Optional<Data>;
  setData: (data: Data) => void;
}

export const useStore = create<StoreState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
```

## 🚫 Don't Re-export Deep Dependencies

**Rule**: Only re-export from direct dependencies or peerDependencies, never from transitive dependencies.

```typescript
// ✅ CORRECT - Re-exporting from peer dependencies
export { WalletType, StorageType } from '@sudobility/types';
export { OnchainMailerClient } from '@sudobility/contracts';

// ❌ WRONG - Re-exporting from deep dependencies
// Don't export anything from packages that are dependencies of our dependencies
```

## 📝 Adding New Features

### 1. Define Types First
```typescript
// src/types/services/my-service.interface.ts
import { Optional } from '@sudobility/types';

export interface MyService {
  doSomething(input: string): Promise<Optional<Result>>;
}
```

### 2. Create Business Logic
```typescript
// src/business/core/my-feature/my-operations.ts
export class MyOperations {
  constructor(private service: MyService) {}

  async execute(input: string): Promise<Optional<Result>> {
    // Pure business logic - NO platform imports
    return this.service.doSomething(input);
  }
}
```

### 3. Create React Hook
```typescript
// src/business/hooks/core/useMyFeature.ts
import { useState, useCallback } from 'react';
import { Optional } from '@sudobility/types';

export const useMyFeature = (config: Config) => {
  const [data, setData] = useState<Optional<Data>>(null);
  const [error, setError] = useState<Optional<string>>(null);

  // Implementation

  return { data, error };
};
```

### 4. Export from Index Files
```typescript
// src/types/services/index.ts
export * from './my-service.interface';

// src/business/core/index.ts
export * from './my-feature/my-operations';

// src/business/hooks/core/index.ts
export { useMyFeature } from './useMyFeature';
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyFeature', () => {
  let mockService: MockService;

  beforeEach(() => {
    mockService = createMockService();
  });

  it('should handle success case', async () => {
    // Arrange
    mockService.doSomething.mockResolvedValue(result);

    // Act
    const output = await feature.execute(input);

    // Assert
    expect(output).toEqual(expected);
  });

  it('should handle error case', async () => {
    // Test error handling
  });
});
```

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm test -- path/to/test    # Run specific test
```

## 🐛 Common Issues

### Type Errors After Dependency Update
**Solution**: Types moved to @sudobility/types
```typescript
// Update imports from
import { WalletType } from '@sudobility/di';
// To
import { WalletType } from '@sudobility/types';
```

### StorageService Compatibility
**Issue**: @sudobility/di and @sudobility/wildduck_client had incompatible StorageService interfaces
**Solution**: Updated to wildduck_client v1.0.5 which uses StorageService from @sudobility/di

### Optional<T> Not Used
**Issue**: Using `| null | undefined` instead of `Optional<T>`
**Solution**: Import and use `Optional<T>` from @sudobility/types

## 📦 Dependency Management

### Peer Dependencies
```json
{
  "@sudobility/contracts": "^1.11.0",
  "@sudobility/di": "^1.4.7",
  "@sudobility/types": "^1.8.29",
  "@sudobility/indexer_client": "^0.0.28",
  "@sudobility/wildduck_client": "^1.0.5",
  "@tanstack/react-query": "^5.90.5"
}
```

### Direct Dependency
```json
{
  "zustand": "^5.0.8"
}
```

## 🔍 Code Search Patterns

```bash
# Find all hooks
find src/business/hooks -name "use*.ts"

# Find all interfaces
find src/types -name "*.interface.ts"

# Find all stores
find src/business/stores -name "*Store.ts"

# Find tests
find src -name "*.test.ts"

# Search for type usage
grep -r "Optional<" src/
```

## ✅ Pre-Commit Checklist

Before committing code changes:

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all 116 tests)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Used `Optional<T>` for all nullable types
- [ ] No platform-specific imports in business logic
- [ ] Updated exports in index.ts files
- [ ] Tests added/updated for new functionality

## 📚 Additional Resources

- **CLAUDE.md**: Comprehensive project context for Claude AI (root directory)
- **docs/DEVELOPMENT.md**: Full development guide
- **docs/API.md**: API documentation
- **docs/TYPES.md**: Type system documentation
- **docs/SECURITY.md**: Security policy and vulnerability reporting

## 🔄 Recent Changes (v3.6.9)

### Dependency Updates
- @sudobility/di: 1.4.6 → 1.4.7
- @sudobility/indexer_client: 0.0.27 → 0.0.28
- @sudobility/wildduck_client: 1.0.2 → 1.0.5

### Type Migration
- All types now imported from their source packages (@sudobility/types)
- Removed local re-exports of types from deep dependencies
- Fixed StorageService compatibility with wildduck_client

### Removed Features
- AI email services (ai-email.service.ts, ai-search.service.ts, ai-web3.service.ts)
- Email and mailbox operations (replaced by WildduckClient integration)

---

**For detailed project context, see CLAUDE.md**
