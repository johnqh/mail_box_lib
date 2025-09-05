# Claude Code Assistant Instructions

This document provides context and instructions for AI assistants working on the @johnqh/lib project.

## Quick Reference
- **Version**: 2.1.0
- **Package**: @johnqh/lib
- **Type**: React Native-compatible shared library
- **Primary Use**: 0xmail.box projects (web & mobile)

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
5. **Type Safety**: Everything is strictly typed with TypeScript
6. **No Direct Platform Imports**: Never import React Native or web-specific modules in business logic

## Architecture Overview

```
src/
├── business/           # Core business logic (platform-agnostic)
│   ├── ai/            # AI-powered services
│   ├── core/          # Domain operations
│   ├── hooks/         # React hooks
│   └── points/        # Rewards system
├── di/                # Dependency injection
├── network/           # HTTP clients
├── storage/           # Storage services
├── types/             # TypeScript definitions
└── utils/             # Platform-specific implementations
```

## Common Tasks & Patterns

### Adding a New Service (Complete Example)

1. **Define Interface** (`src/types/services/my-service.interface.ts`)
   ```typescript
   export interface MyService {
     method(param: string): Promise<Result>;
   }
   
   export interface Result {
     success: boolean;
     data?: any;
     error?: string;
   }
   ```

2. **Create Business Operations** (`src/business/core/my-service/my-service-operations.ts`)
   ```typescript
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
         value: result.data
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

3. **Implement Platform Services** 
   
   Web Implementation (`src/utils/my-service/my-service.web.ts`):
   ```typescript
   import { MyService } from '../../types/services/my-service.interface';
   
   export class WebMyService implements MyService {
     async method(param: string): Promise<Result> {
       // Web-specific implementation
       const response = await fetch('/api/my-service', {
         method: 'POST',
         body: JSON.stringify({ param })
       });
       return response.json();
     }
   }
   ```
   
   React Native Implementation (`src/utils/my-service/my-service.reactnative.ts`):
   ```typescript
   import { MyService } from '../../types/services/my-service.interface';
   
   export class ReactNativeMyService implements MyService {
     async method(param: string): Promise<Result> {
       // React Native-specific implementation
       // Can use React Native specific APIs here
       return { success: true, data: param };
     }
   }
   ```
   
   Platform Detection (`src/utils/my-service/index.ts`):
   ```typescript
   import { Platform } from '../../types/environment';
   
   export const createMyService = (): MyService => {
     if (Platform.OS === 'web') {
       const { WebMyService } = require('./my-service.web');
       return new WebMyService();
     } else {
       const { ReactNativeMyService } = require('./my-service.reactnative');
       return new ReactNativeMyService();
     }
   };
   ```

4. **Create React Hook** (`src/business/hooks/data/useMyService.ts`)
   ```typescript
   import { useState, useCallback } from 'react';
   import { MyServiceOperations } from '../../core/my-service/my-service-operations';
   import { createMyService } from '../../../utils/my-service';
   
   export const useMyService = () => {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<Error | null>(null);
     
     const operations = new MyServiceOperations(createMyService());
     
     const executeMethod = useCallback(async (data: BusinessData) => {
       setLoading(true);
       setError(null);
       
       try {
         const result = await operations.businessMethod(data);
         return result;
       } catch (err) {
         setError(err as Error);
         throw err;
       } finally {
         setLoading(false);
       }
     }, []);
     
     return {
       executeMethod,
       loading,
       error
     };
   };
   ```

5. **Write Tests** (`src/business/core/my-service/__tests__/my-service-operations.test.ts`)
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { MyServiceOperations } from '../my-service-operations';
   
   describe('MyServiceOperations', () => {
     it('should process data successfully', async () => {
       const mockService = {
         method: vi.fn().mockResolvedValue({
           success: true,
           data: 'processed'
         })
       };
       
       const operations = new MyServiceOperations(mockService);
       const result = await operations.businessMethod({ param: 'test' });
       
       expect(result.processed).toBe(true);
       expect(result.value).toBe('processed');
       expect(mockService.method).toHaveBeenCalledWith('test');
     });
     
     it('should handle errors properly', async () => {
       const mockService = {
         method: vi.fn().mockResolvedValue({
           success: false,
           error: 'Failed'
         })
       };
       
       const operations = new MyServiceOperations(mockService);
       
       await expect(
         operations.businessMethod({ param: 'test' })
       ).rejects.toThrow('Failed');
     });
   });
   ```

6. **Export from Index Files**
   
   Add to `src/types/services/index.ts`:
   ```typescript
   export * from './my-service.interface';
   ```
   
   Add to `src/business/core/index.ts`:
   ```typescript
   export * from './my-service/my-service-operations';
   ```
   
   Add to `src/business/hooks/data/index.ts`:
   ```typescript
   export { useMyService } from './useMyService';
   ```

### File Naming Conventions
- Interfaces: `*.interface.ts`
- Web implementations: `*.web.ts`
- React Native implementations: `*.reactnative.ts`
- Business operations: `*-operations.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Import/Export Patterns
```typescript
// Always export interfaces and implementations separately
export { MyService } from './my-service.interface';
export { WebMyService } from './my-service.web';
export { ReactNativeMyService } from './my-service.reactnative';

// Use barrel exports in index.ts files
export * from './service-a';
export * from './service-b';
```

## Development Commands

Essential commands to know:
```bash
npm run build         # TypeScript compilation
npm test             # Run all tests
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format code with Prettier
npm run typecheck    # Type checking without build
```

## Code Quality Standards

### TypeScript
- Use strict typing throughout
- Define interfaces for all data structures
- Use generics for reusable components
- Avoid `any` type unless absolutely necessary

### Error Handling
```typescript
// Use custom error types
export class MyServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MyServiceError';
  }
}

// Handle errors consistently
try {
  await service.method();
} catch (error) {
  if (error instanceof MyServiceError) {
    // Handle specific error
  }
  throw error; // Re-throw if not handled
}
```

### Testing
- Test all business logic
- Mock external dependencies
- Use descriptive test names
- Group tests by functionality
- Test both happy path and error cases

## AI Assistant Guidelines

### Task Checklist for Common Operations

#### Adding a New Feature
- [ ] Define TypeScript interfaces first
- [ ] Implement business logic in `src/business/core/`
- [ ] Create platform implementations in `src/utils/`
- [ ] Add React hooks in `src/business/hooks/`
- [ ] Write comprehensive tests
- [ ] Update index.ts exports
- [ ] Run `npm run typecheck`
- [ ] Run `npm test`
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
**/__tests__/**/*.spec.ts
```

### Common Import Patterns

```typescript
// Importing interfaces (ALWAYS use interface imports)
import { MyService } from '../../types/services/my-service.interface';

# Importing from barrel exports
import { ServiceA, ServiceB } from '../services';

// Platform-aware imports (use dynamic requires)
const Service = Platform.OS === 'web' 
  ? require('./service.web').WebService
  : require('./service.reactnative').ReactNativeService;

// Business logic imports
import { MyOperations } from '../../business/core/my-service/my-service-operations';
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
// Mock platform detection
vi.mock('../../types/environment', () => ({
  Platform: { OS: 'web' }
}));

// Mock services
const mockService = {
  method: vi.fn().mockResolvedValue({ success: true })
};

// Test async operations
await expect(promise).resolves.toBe(expected);
await expect(promise).rejects.toThrow(ErrorType);

// Test hooks
const { result } = renderHook(() => useMyHook());
await waitFor(() => expect(result.current.loading).toBe(false));
```

### Common Pitfalls to Avoid
- ❌ Don't import React Native modules in business logic
- ❌ Don't skip interface definitions
- ❌ Don't forget platform detection in index files
- ❌ Don't hardcode API endpoints (use config)
- ❌ Don't ignore TypeScript errors
- ❌ Don't mix concerns (business/platform/UI)
- ❌ Don't skip error handling
- ❌ Don't forget to export from index files

### Quick Fixes for Common Issues

**Platform Detection Not Working:**
```typescript
// Check Platform import
import { Platform } from '../../types/environment';
// NOT from 'react-native'!
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

## External Dependencies

### Symbolic Links
- `./indexer` → `~/mail_box_indexer` (Email indexing service)
- `./wildduck` → `~/wildduck` (Email server)

These are external projects linked for development but should not be modified directly.

### Key Libraries
- **React/React Native**: UI framework compatibility
- **Firebase**: Backend services
- **Blockchain**: @solana/web3.js, viem for crypto operations
- **Testing**: Vitest, @testing-library/react
- **Crypto**: @noble/hashes, bs58

## Project Files Structure

### Important Files
- `.claude_context`: AI development context
- `DEVELOPMENT.md`: Detailed development guide
- `docs/API.md`: API documentation
- `docs/TYPES.md`: TypeScript type documentation
- `templates/`: Code templates for common patterns

### Configuration Files
- `tsconfig.json`: TypeScript configuration
- `.eslintrc.js`: Linting rules
- `.prettierrc`: Code formatting rules
- `vitest.config.ts`: Test configuration
- `package.json`: Dependencies and scripts

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

## Deployment & CI/CD

### Automated Processes
- **CI Pipeline**: Runs on every push/PR
- **AI Code Review**: Automated analysis of changes
- **Security Audits**: Vulnerability scanning
- **Multi-platform Testing**: Tests on different OS/Node versions
- **Auto-publishing**: Publishes to npm on version changes

### Manual Processes
- **Version Updates**: Update package.json version manually
- **Documentation Updates**: Keep docs in sync with code changes
- **Breaking Changes**: Document in CHANGELOG.md

Remember: This is a foundational library used by multiple projects, so stability and backward compatibility are crucial!