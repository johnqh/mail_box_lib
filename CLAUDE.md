# Claude Code Assistant Instructions

This document provides context and instructions for AI assistants working on the @johnqh/lib project.

## AI Assistant Quick Start

**Before any task, run these checks:**
```bash
npm run check-all  # Ensures build, tests, and lint all pass
```

**Common tasks you might be asked to do:**
1. Add new service → Start with interface definition in `src/types/services/`
2. Fix type errors → Check @johnqh/types imports first, use Optional<T> for nullable types
3. Update dependencies → Use `npm install package@latest`
4. Debug tests → Run `npm test -- --watch`
5. Find code → Use Glob for files, Grep for content

## AI Development Optimization

### Quick Command Reference
```bash
# Validation
npm run check-all       # Run all checks (lint, typecheck, tests)
npm run validate        # Full validation with quality checks
npm run quick-check     # Fast validation (no coverage)

# Development
npm run build:watch     # Watch mode for building
npm run test:watch      # Watch tests
npm run lint:watch      # Watch linting
npm run typecheck:watch # Watch TypeScript compilation

# Analysis
npm run analyze:deps    # Check dependency issues
npm run analyze:health  # Run health analysis
npm run analyze:types   # Type coverage report
npm run quality-check   # Full quality analysis
npm run performance-check # Performance monitoring
```

### AI-Friendly File Structure
```
src/
├── business/           # ✅ Core business logic (AI: modify here for features)
│   ├── hooks/         # React hooks (AI: extend functionality here)
│   │   ├── indexer/   # Indexer API hooks - (endpointUrl, dev) params
│   │   ├── wildduck/  # WildDuck hooks - (config: WildDuckConfig) params
│   │   ├── contracts/ # Blockchain contract hooks
│   │   └── core/      # Core utility hooks
│   └── core/          # Domain operations (AI: business rules here)
├── network/           # ✅ API clients (AI: update endpoints here)
│   └── clients/
│       ├── indexer.ts # IndexerClient with dev mode support
│       └── wildduck.ts # WildDuckAPI with WildDuckConfig
├── types/             # ✅ TypeScript definitions (AI: start here for new features)
└── utils/             # ✅ Utility functions (AI: helpers and tools)
```

### Pattern Recognition for AI

#### 🎯 Adding a New Hook Pattern
```typescript
// 1. Check if similar hook exists
Grep -n "use.*Hook" src/business/hooks/

// 2. Use template for consistency
// For Indexer hooks:
const useIndexerFeature = (endpointUrl: string, dev: boolean) => {
  const client = new IndexerClient(endpointUrl, dev);
  // ... implementation
};

// For WildDuck hooks:
const useWildduckFeature = (config: WildDuckConfig) => {
  // ... implementation using config
};

// 3. Export from index
export { useIndexerFeature } from './useIndexerFeature';
```

#### 🎯 Optional<T> Pattern (REQUIRED)
```typescript
// Always use Optional<T> for nullable/undefined values
import { Optional } from '@johnqh/types';

// ❌ WRONG: Manual nullable patterns
function getValue(): string | null | undefined { }
const [error, setError] = useState<string | null>(null);

// ✅ RIGHT: Use Optional<T>
function getValue(): Optional<string> { }
const [error, setError] = useState<Optional<string>>(null);
```

#### 🎯 Configuration Pattern
```typescript
// Always require configuration from consumer
interface ServiceConfig {
  required: string;      // Required fields
  alsoRequired: string;  // Required fields
  optional?: string;     // Optional fields
}

// Never create default configs internally
// ❌ WRONG: const defaultConfig = { ... }
// ✅ RIGHT: Accept config as parameter
```

#### 🎯 Error Handling Pattern
```typescript
// Consistent error handling across hooks
try {
  const result = await apiCall();
  return result;
} catch (err) {
  const errorMessage = err instanceof Error
    ? err.message
    : 'Operation failed';
  setError(errorMessage);
  throw err;
}
```

## Quick Reference

- **Version**: 3.3.3
- **Package**: @johnqh/lib
- **Type**: React Native-compatible shared library
- **Primary Use**: 0xmail.box projects (web & mobile)
- **Dependencies**: @johnqh/types (^1.6.2), @johnqh/mail_box_contracts (^1.5.3)

## Project Context

### What is @johnqh/lib?

A React Native-compatible shared utilities library for 0xmail.box projects, providing:

- Platform-agnostic business logic
- Email management services (WildDuck integration)
- Blockchain integration (Solana & EVM)
- Authentication services (Firebase Auth)
- AI-powered features (email assistance)
- Points/rewards system
- UI hooks and utilities

### Key Principles

1. **Platform Abstraction**: Code MUST work on both web and React Native
2. **Interface-First Design**: ALWAYS define interfaces before implementations
3. **Business Logic Separation**: Pure domain logic separate from platform code
4. **Comprehensive Testing**: All business logic MUST be tested
5. **Type Safety**: Everything is strictly typed with TypeScript + Optional<T>
6. **No Direct Platform Imports**: Never import React Native or web-specific modules in business logic

### Recent Updates (v3.3.3)

- **@johnqh/types v1.6.2**: Updated to latest types with Optional<T> pattern
- **Optional<T> Migration**: All nullable types now use Optional<T> from @johnqh/types
- **Type Consolidation**:
  - `AppAnalyticsEvent` → `AnalyticsEvent`
  - `StandardEmailFolder` → `MailboxType`
  - `WalletConnectionState` → `ConnectionState`
  - `NetworkStatus` → removed (consolidated into `ConnectionState`)
- **Indexer API v2.2.0**: Updated all endpoints to match new structure
- **Enhanced NetworkResponse**: Added BaseResponse fields (success, timestamp)
- **Improved Type Safety**: Stricter typing with better error handling

### Type Migration Notes

**REQUIRED PATTERNS:**
- Use `Optional<T>` instead of `T | undefined | null`
- Import `Optional` from `@johnqh/types`
- All hook error states should be `Optional<string>`
- All nullable return types should use `Optional<T>`

**Updated Type Mappings:**
- `LoginMethod` → Use string literals ('email', 'wallet', 'google', etc.)
- `AppAnalyticsEvent` → `AnalyticsEvent` (from @johnqh/types)
- `StandardEmailFolder` → `MailboxType` (from @johnqh/types)
- `WalletConnectionState` → `ConnectionState` (from @johnqh/types)
- `ChainType.UNKNOWN` → No longer exists (use null or ConnectionState.UNKNOWN)

## Architecture Overview

```
src/
├── business/           # Core business logic (platform-agnostic)
│   ├── core/          # Domain operations
│   │   ├── analytics/ # Analytics business logic
│   │   ├── auth/      # Authentication logic
│   │   ├── email/     # Email operations
│   │   ├── folder/    # Folder management
│   │   ├── indexer/   # Indexer service logic
│   │   ├── mailbox/   # Mailbox operations
│   │   ├── navigation/# Navigation state
│   │   └── wallet/    # Wallet status management
│   ├── hooks/         # React hooks
│   │   ├── contracts/ # Blockchain contract hooks
│   │   ├── core/      # Core utility hooks
│   │   ├── indexer/   # Indexer API hooks
│   │   ├── nameservice/# Name resolution hooks
│   │   └── wildduck/  # WildDuck API hooks
│   └── context/       # React contexts
├── di/                # Dependency injection
├── network/           # HTTP clients
│   └── clients/
│       ├── indexer.ts # IndexerClient (dev mode aware)
│       └── wildduck.ts# WildDuckAPI (config-based)
├── storage/           # Storage services
├── types/             # TypeScript definitions
│   ├── api.ts         # API response types
│   ├── email.ts       # Email interfaces
│   └── services/      # Service interfaces
└── utils/             # Platform-specific implementations
    ├── async-helpers.ts
    ├── auth/          # Authentication utilities
    ├── blockchain/    # Blockchain utilities
    ├── contracts/     # Smart contract utilities
    ├── indexer/       # Indexer utilities
    └── nameservice/   # Name resolution utilities
```

## Common Tasks & Patterns

### Adding a New Service (Complete Example)

1. **Define Interface** (`src/types/services/my-service.interface.ts`)

   ```typescript
   import { Optional } from '@johnqh/types';

   export interface MyService {
     method(param: string): Promise<Result>;
   }

   export interface Result {
     success: boolean;
     data?: any;
     error?: Optional<string>;
   }
   ```

2. **Create Business Operations** (`src/business/core/my-service/my-service-operations.ts`)

   ```typescript
   import { Optional } from '@johnqh/types';
   import { MyService } from '../../../types/services/my-service.interface';

   export class MyServiceOperations {
     constructor(private myService: MyService) {}

     async businessMethod(data: BusinessData): Promise<BusinessResult> {
       // Pure business logic - NO platform imports!
       const result = await this.myService.method(data.param);

       if (!result.success) {
         throw new MyServiceError(result.error || 'Operation failed');
       }

       return {
         processed: true,
         value: result.data,
       };
     }
   }

   export class MyServiceError extends Error {
     constructor(message: string) {
       super(message);
       this.name = 'MyServiceError';
     }
   }
   ```

3. **Create React Hook** (`src/business/hooks/data/useMyService.ts`)

   ```typescript
   import { useState, useCallback } from 'react';
   import { Optional } from '@johnqh/types';
   import { MyServiceOperations } from '../../core/my-service/my-service-operations';
   import { createMyService } from '../../../utils/my-service';

   export const useMyService = () => {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<Optional<string>>(null);

     const operations = new MyServiceOperations(createMyService());

     const executeMethod = useCallback(async (data: BusinessData) => {
       setLoading(true);
       setError(null);

       try {
         const result = await operations.businessMethod(data);
         return result;
       } catch (err) {
         const errorMsg = err instanceof Error ? err.message : 'Unknown error';
         setError(errorMsg);
         throw err;
       } finally {
         setLoading(false);
       }
     }, []);

     return {
       executeMethod,
       loading,
       error,
       clearError: () => setError(null),
     };
   };
   ```

## Development Commands

Essential commands to know:

```bash
npm run build         # TypeScript compilation
npm run build:watch   # Watch mode compilation
npm test             # Run all tests
npm run test:watch   # Watch test mode
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format code with Prettier
npm run typecheck    # Type checking without build
npm run check-all    # Run lint, typecheck, and tests
npm run validate     # Full validation with quality checks
npm run analyze:health # Health analysis
```

## AI Code Examples and Troubleshooting

### 🚀 Quick Start Templates

#### Creating a New Indexer Hook
```typescript
// File: src/business/hooks/indexer/useIndexerNewFeature.ts
import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { IndexerClient } from '../../../network/clients/indexer';

export const useIndexerNewFeature = (endpointUrl: string, dev: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);
  const client = new IndexerClient(endpointUrl, dev);

  const fetchData = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await client.newEndpoint(param);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { fetchData, isLoading, error, clearError: () => setError(null) };
};
```

#### Creating a New WildDuck Hook
```typescript
// File: src/business/hooks/wildduck/useWildduckNewFeature.ts
import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import axios from 'axios';

export const useWildduckNewFeature = (config: WildDuckConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const fetchData = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (config.cloudflareWorkerUrl) {
        headers['Authorization'] = `Bearer ${config.apiToken}`;
        headers['X-App-Source'] = '0xmail-box';
      } else {
        headers['X-Access-Token'] = config.apiToken;
      }

      const response = await axios.get(`${apiUrl}/new-endpoint/${param}`, { headers });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return { fetchData, isLoading, error, clearError: () => setError(null) };
};
```

### 🎯 Common Patterns Recognition

#### Configuration Extraction Pattern
```typescript
// BEFORE (Internal config ❌)
const useService = () => {
  const client = new APIClient('https://hardcoded-url.com');
  // ...
};

// AFTER (Consumer config ✅)
const useService = (config: ServiceConfig) => {
  const client = new APIClient(config.apiUrl);
  // ...
};
```

#### Hook Parameter Patterns
```typescript
// Indexer hooks ALWAYS use:
(endpointUrl: string, dev: boolean)

// WildDuck hooks ALWAYS use:
(config: WildDuckConfig)

// TanStack Query hooks ADD options:
(endpointUrl: string, dev: boolean, options?: UseQueryOptions<T>)
```

### 🔍 AI Search Commands

#### Find Similar Code
```bash
# Find all hooks with similar functionality
Grep -n "useIndexer.*" src/business/hooks/indexer/
Grep -n "useWildduck.*" src/business/hooks/wildduck/

# Find configuration patterns
Grep -n "Config" src/network/clients/
Grep -n "interface.*Config" src/

# Find error handling patterns
Grep -n "catch.*err" src/business/hooks/
```

#### Locate Files by Pattern
```bash
# Find all hook files
Glob "**/use*.ts"

# Find all interface definitions
Glob "**/*.interface.ts"

# Find all test files
Glob "**/*.test.ts"
```

### 🛠️ Troubleshooting Guide for AI

#### Type Errors
1. **Missing Optional<T>**: Always use `Optional<T>` for nullable types
2. **Unknown type**: Look in @johnqh/types first, then src/types/
3. **NetworkResponse<T> issues**: Ensure BaseResponse fields (success, timestamp)

```typescript
// Type assertion pattern for legacy code
const result = response.data as ExpectedType;

// Preferred Optional<T> pattern
const result: Optional<ExpectedType> = response.data;
```

#### Hook Issues
1. **Wrong parameter pattern**: Check if it's Indexer or WildDuck hook
2. **Missing config**: Ensure WildDuck hooks receive WildDuckConfig
3. **Dev mode not working**: Check if dev parameter is passed as x-dev header

#### API Client Issues
1. **Endpoint not found**: Check if endpoint exists in client class
2. **Authentication fails**: Verify header configuration (Bearer vs X-Access-Token)
3. **CORS issues**: Check if using correct API URL

## External Dependencies

### Project dependencies

- `@johnqh/types` (v1.6.2) - Shared TypeScript types and interfaces
  - Provides: Optional<T>, AnalyticsEvent, ConnectionState, MailboxType, etc.
  - **CRITICAL**: Always use Optional<T> for nullable types
- `@johnqh/mail_box_contracts` (v1.5.3) - Smart contract interfaces

### Key Libraries

- **React/React Native**: UI framework compatibility
- **Firebase**: Backend services
- **Blockchain**: @solana/web3.js, viem for crypto operations
- **Testing**: Vitest, @testing-library/react
- **Crypto**: @noble/hashes, bs58

## Deployment & CI/CD

### Automated Processes

- **CI Pipeline**: Runs on every push/PR
- **AI Code Review**: Automated analysis of changes
- **Security Audits**: Vulnerability scanning
- **Multi-platform Testing**: Tests on different OS/Node versions
- **Auto-publishing**: Publishes to npm on version changes

Remember: This is a foundational library used by multiple projects, so stability and backward compatibility are crucial!

# AI Assistant Guidelines

### Task Checklist for Common Operations

#### Adding a New Feature

- [ ] Define TypeScript interfaces first (use Optional<T>)
- [ ] Implement business logic in `src/business/core/`
- [ ] Create platform implementations in `src/utils/`
- [ ] Add React hooks in `src/business/hooks/`
- [ ] Write comprehensive tests
- [ ] Update index.ts exports
- [ ] Run `npm run check-all`
- [ ] Update API documentation if public

#### Fixing a Bug

- [ ] Locate the bug using search/grep
- [ ] Check if bug exists in both platforms
- [ ] Write a failing test first
- [ ] Fix the implementation
- [ ] Verify test passes
- [ ] Check for similar bugs elsewhere
- [ ] Run full test suite

#### Refactoring Code

- [ ] Ensure interface compatibility
- [ ] Update all platform implementations
- [ ] Maintain test coverage
- [ ] Check TypeScript types
- [ ] Update documentation
- [ ] Run `npm run lint:fix`

### Code Search Patterns

```bash
# Find all interfaces
**/*.interface.ts

# Find platform-specific implementations
**/*.web.ts
**/*.reactnative.ts

# Find business operations
**/business/core/**/*-operations.ts

# Find React hooks
**/business/hooks/**/*.ts

# Find tests
**/__tests__/**/*.test.ts
```

### Common Import Patterns

```typescript
// Importing Optional and types (ALWAYS use Optional<T>)
import { Optional, AnalyticsEvent, ConnectionState } from '@johnqh/types';

// Importing interfaces
import { MyService } from '../../types/services/my-service.interface';

// Importing from barrel exports
import { ServiceA, ServiceB } from '../services';

// Platform-aware imports (use dynamic requires)
const Service = Platform.OS === 'web'
  ? require('./service.web').WebService
  : require('./service.reactnative').ReactNativeService;
```

### API Integration Patterns

All indexer API calls now require signature authentication:

```typescript
// Protected endpoint pattern
async protectedCall(walletAddress: string, signature: string, message: string) {
  return this.client.post('/api/protected-endpoint', {
    walletAddress,
    signature,
    message,
    // ... other data
  });
}

// Points API endpoints
/api/points/balance/:walletAddress
/api/points/history/:walletAddress
/api/points/leaderboard

// Solana endpoints
/api/solana/balance/:walletAddress
/api/solana/transactions/:walletAddress
```

### Testing Patterns

```typescript
// Mock Optional<T> values
const mockService = {
  method: vi.fn().mockResolvedValue({ success: true }),
};

// Test Optional<T> return values
await expect(promise).resolves.toBe(expected);
await expect(promise).rejects.toThrow(ErrorType);

// Test hooks with Optional<T>
const { result } = renderHook(() => useMyHook());
await waitFor(() => expect(result.current.loading).toBe(false));
```

### Common Pitfalls to Avoid

- ❌ Don't use `T | undefined | null` - use `Optional<T>`
- ❌ Don't import React Native modules in business logic
- ❌ Don't skip interface definitions
- ❌ Don't forget platform detection in index files
- ❌ Don't hardcode API endpoints (use config)
- ❌ Don't ignore TypeScript errors
- ❌ Don't mix concerns (business/platform/UI)
- ❌ Don't skip error handling
- ❌ Don't forget to export from index files

### Quick Fixes for Common Issues

**Optional<T> Usage:**

```typescript
// Import Optional
import { Optional } from '@johnqh/types';

// Use in interfaces
interface MyInterface {
  data: Optional<string>;
  error: Optional<Error>;
}

// Use in functions
function getValue(): Optional<string> { }
const [state, setState] = useState<Optional<Data>>(null);
```

**TypeScript Errors:**

```bash
npm run typecheck  # Find all type errors
npm run build      # Full compilation check
```

**Test Failures:**

```bash
npm test -- --watch  # Run tests in watch mode
npm test -- path/to/specific.test.ts  # Run specific test
```

**Lint Issues:**

```bash
npm run lint:fix  # Auto-fix most issues
npm run format    # Format with Prettier
```

## Getting Help

### Resources

1. **Development Guide**: `DEVELOPMENT.md`
2. **API Documentation**: `docs/API.md`
3. **Type Documentation**: `docs/TYPES.md`
4. **Templates**: `templates/` directory
5. **Test Examples**: Existing `__tests__` directories

### When Stuck

1. Look at similar existing implementations
2. Check the templates directory for patterns
3. Review the type definitions for interfaces
4. Run the tests to understand expected behavior
5. Check the development guide for best practices

Remember: Always use `Optional<T>` for nullable types - this is a REQUIRED pattern in this codebase!