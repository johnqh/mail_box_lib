# Claude Code Assistant Instructions

This document provides comprehensive guidance for AI assistants (Claude Code, GitHub Copilot, Cursor, etc.) working on the `@sudobility/mail_box_lib` project.

## ⚠️ CRITICAL RULES

**NEVER automatically commit or push changes:**
- ❌ DO NOT run `git add` without explicit user request
- ❌ DO NOT run `git commit` without explicit user request
- ❌ DO NOT run `git push` without explicit user request
- ✅ ONLY commit/push when user explicitly says "commit" or "push"
- ✅ ALWAYS wait for user approval before any git operations

## Package Manager

**This project uses Bun as the package manager.** Always use `bun` commands instead of `npm`:

```bash
# Install dependencies
bun install

# Run any script
bun run <script-name>
```

## AI Assistant Quick Start

**Before any task, run these checks:**
```bash
bun run check-all  # Ensures build, tests, and lint all pass
```

**Common tasks you might be asked to do:**
1. Add new service → Start with interface definition in `src/types/services/`
2. Fix type errors → Check @sudobility/types imports first, use Optional<T> for nullable types
3. Update dependencies → Use `bun add package@latest`
4. Debug tests → Run `bun test -- --watch`
5. Find code → Use Glob for files, Grep for content

## AI Development Optimization

### Quick Command Reference
```bash
# Validation
bun run check-all       # Run all checks (lint, typecheck, tests)
bun run validate        # Full validation with quality checks
bun run quick-check     # Fast validation (no coverage)

# Development
bun run build:watch     # Watch mode for building
bun run test:watch      # Watch tests
bun run lint:watch      # Watch linting
bun run typecheck:watch # Watch TypeScript compilation

# Analysis
bun run analyze:deps    # Check dependency issues
bun run analyze:health  # Run health analysis
bun run analyze:types   # Type coverage report
bun run quality-check   # Full quality analysis
bun run performance-check # Performance monitoring
```

### AI-Friendly File Structure
```
src/
├── business/           # ✅ Core business logic (AI: modify here for features)
│   ├── hooks/         # React hooks (AI: extend functionality here)
│   │   ├── contracts/ # Blockchain contract hooks
│   │   └── core/      # Core utility hooks
│   └── core/          # Domain operations (AI: business rules here)
├── network/           # ✅ API clients (AI: update endpoints here)
│   └── clients/       # API client implementations
├── types/             # ✅ TypeScript definitions (AI: start here for new features)
└── utils/             # ✅ Utility functions (AI: helpers and tools)
```

### Pattern Recognition for AI

#### 🎯 Adding a New Hook Pattern
```typescript
// 1. Check if similar hook exists
Grep -n "use.*Hook" src/business/hooks/

// 2. Use template for consistency
const useFeature = (config: FeatureConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);
  // ... implementation
};

// 3. Export from index
export { useFeature } from './useFeature';
```

#### 🎯 Optional<T> Pattern (REQUIRED)
```typescript
// Always use Optional<T> for nullable/undefined values
import { Optional } from '@sudobility/types';

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

- **Version**: 3.14.62
- **Package**: `@sudobility/mail_box_lib`
- **Type**: React Native-compatible shared library (ES Module)
- **Primary Use**: Blockchain email projects (web & mobile)
- **Key Dependencies**:
  - `@sudobility/types` (^1.9.43) - Shared TypeScript types
  - `@sudobility/contracts` (^1.17.53) - Smart contract interfaces
  - `@sudobility/di` (^1.5.17) - Dependency injection
  - `@sudobility/configs` (^0.0.56) - Configuration
- **Test Coverage**: 165 tests across 11 test files

## Project Context

### What is @sudobility/mail_box_lib?

A React Native-compatible shared utilities library for blockchain email projects, providing:

- Platform-agnostic business logic
- Blockchain integration (Solana & EVM)
- Authentication services (Firebase Auth)
- AI-powered features (email assistance)
- UI hooks and utilities
- Core utility services

### Key Principles

1. **Platform Abstraction**: Code MUST work on both web and React Native
2. **Interface-First Design**: ALWAYS define interfaces before implementations
3. **Business Logic Separation**: Pure domain logic separate from platform code
4. **Comprehensive Testing**: All business logic MUST be tested
5. **Type Safety**: Everything is strictly typed with TypeScript + Optional<T>
6. **No Direct Platform Imports**: Never import React Native or web-specific modules in business logic

### Recent Updates (v3.14.62)

- **@sudobility/types v1.9.43**: Updated to latest types with Optional<T> pattern
- **Optional<T> Migration**: All nullable types now use Optional<T> from @sudobility/types
- **Type Consolidation**:
  - `AppAnalyticsEvent` → `AnalyticsEvent`
  - `StandardEmailFolder` → `MailboxType`
  - `WalletConnectionState` → `ConnectionState`
  - `NetworkStatus` → removed (consolidated into `ConnectionState`)
- **Package Extraction**: WildDuck and Indexer functionality moved to dedicated packages:
  - WildDuck hooks → `@sudobility/wildduck_client`
  - Indexer hooks → `@sudobility/indexer_client`
- **Enhanced NetworkResponse**: Added BaseResponse fields (success, timestamp)
- **Improved Type Safety**: Stricter typing with better error handling

### Type Migration Notes

**REQUIRED PATTERNS:**
- Use `Optional<T>` instead of `T | undefined | null`
- Import `Optional` from `@sudobility/types`
- All hook error states should be `Optional<string>`
- All nullable return types should use `Optional<T>`

**Updated Type Mappings:**
- `LoginMethod` → Use string literals ('email', 'wallet', 'google', etc.)
- `AppAnalyticsEvent` → `AnalyticsEvent` (from @sudobility/types)
- `StandardEmailFolder` → `MailboxType` (from @sudobility/types)
- `WalletConnectionState` → `ConnectionState` (from @sudobility/types)
- `ChainType.UNKNOWN` → No longer exists (use null or ConnectionState.UNKNOWN)

## Architecture Overview

```
src/
├── business/           # Core business logic (platform-agnostic)
│   ├── core/          # Domain operations
│   │   ├── analytics/ # Analytics business logic
│   │   ├── auth/      # Authentication logic
│   │   ├── navigation/# Navigation state
│   │   └── wallet/    # Wallet status management
│   ├── hooks/         # React hooks
│   │   ├── contracts/ # Blockchain contract hooks
│   │   └── core/      # Core utility hooks
│   └── context/       # React contexts
├── di/                # Dependency injection
├── network/           # HTTP clients
│   └── clients/       # API client implementations
├── storage/           # Storage services
├── types/             # TypeScript definitions
│   ├── api.ts         # API response types
│   └── services/      # Service interfaces
└── utils/             # Platform-specific implementations
    ├── async-helpers.ts
    ├── auth/          # Authentication utilities
    ├── blockchain/    # Blockchain utilities
    └── contracts/     # Smart contract utilities
```

## Common Tasks & Patterns

### Adding a New Service (Complete Example)

1. **Define Interface** (`src/types/services/my-service.interface.ts`)

   ```typescript
   import { Optional } from '@sudobility/types';

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
   import { Optional } from '@sudobility/types';
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
   import { Optional } from '@sudobility/types';
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
bun run build         # TypeScript compilation
bun run build:watch   # Watch mode compilation
bun test             # Run all tests
bun run test:watch   # Watch test mode
bun run lint         # ESLint checking
bun run lint:fix     # Auto-fix lint issues
bun run format       # Format code with Prettier
bun run typecheck    # Type checking without build
bun run check-all    # Run lint, typecheck, and tests
bun run validate     # Full validation with quality checks
bun run analyze:health # Health analysis
```

## AI Code Examples and Troubleshooting

### 🚀 Quick Start Templates

#### Creating a New Hook
```typescript
// File: src/business/hooks/data/useNewFeature.ts
import { useCallback, useState } from 'react';
import { Optional } from '@sudobility/types';

export const useNewFeature = (config: FeatureConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const fetchData = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Implementation logic
      const result = await performOperation(param);
      return result;
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

### 🔍 AI Search Commands

#### Find Similar Code
```bash
# Find all hooks with similar functionality
Grep -n "use.*" src/business/hooks/

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
2. **Unknown type**: Look in @sudobility/types first, then src/types/
3. **NetworkResponse<T> issues**: Ensure BaseResponse fields (success, timestamp)

```typescript
// Type assertion pattern for legacy code
const result = response.data as ExpectedType;

// Preferred Optional<T> pattern
const result: Optional<ExpectedType> = response.data;
```

#### Hook Issues
1. **Wrong parameter pattern**: Check hook signature and configuration requirements
2. **Missing config**: Ensure hooks receive required configuration objects
3. **State not updating**: Verify dependencies in useCallback/useMemo

#### API Client Issues
1. **Endpoint not found**: Check if endpoint exists in client class
2. **Authentication fails**: Verify authentication configuration
3. **CORS issues**: Check if using correct API URL

## External Dependencies

### Project Dependencies

- `@sudobility/types` (v1.9.43) - Shared TypeScript types and interfaces
  - Provides: Optional<T>, AnalyticsEvent, ConnectionState, MailboxType, etc.
  - **CRITICAL**: Always use Optional<T> for nullable types
- `@sudobility/contracts` (v1.17.53) - Smart contract interfaces
- `@sudobility/di` (v1.5.17) - Dependency injection interfaces
- `@sudobility/configs` (v0.0.56) - Configuration management
- `@sudobility/wildduck_client` (v2.3.39) - WildDuck email client
- `@sudobility/indexer_client` (v0.0.89) - Indexer client

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
- [ ] Run `bun run check-all`
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
- [ ] Run `bun run lint:fix`

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
import { Optional, AnalyticsEvent, ConnectionState } from '@sudobility/types';

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

Use consistent patterns for API client integration:

```typescript
// Authenticated endpoint pattern
async authenticatedCall(authToken: string, data: RequestData) {
  return this.client.post('/api/endpoint', data, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// Configuration-based clients
interface ClientConfig {
  apiUrl: string;
  apiToken: string;
  options?: RequestOptions;
}
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
import { Optional } from '@sudobility/types';

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
bun run typecheck  # Find all type errors
bun run build      # Full compilation check
```

**Test Failures:**

```bash
bun test -- --watch  # Run tests in watch mode
bun test -- path/to/specific.test.ts  # Run specific test
```

**Lint Issues:**

```bash
bun run lint:fix  # Auto-fix most issues
bun run format    # Format with Prettier
```

## Getting Help

### Resources

1. **Development Guide**: `docs/DEVELOPMENT.md`
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