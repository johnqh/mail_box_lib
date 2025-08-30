# Claude Code Assistant Instructions

This document provides context and instructions for AI assistants working on the @0xmail/lib project.

## Project Context

### What is @0xmail/lib?
A React Native-compatible shared utilities library for 0xmail.box projects, providing:
- Platform-agnostic business logic
- Email management services
- Blockchain integration utilities
- Authentication services
- UI hooks and utilities

### Key Principles
1. **Platform Abstraction**: Code works on both web and React Native
2. **Interface-First Design**: Always define interfaces before implementations
3. **Business Logic Separation**: Pure domain logic separate from platform code
4. **Comprehensive Testing**: All business logic must be tested
5. **Type Safety**: Everything is strictly typed with TypeScript

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

### Adding a New Service

1. **Define Interface** (`src/types/services/`)
   ```typescript
   export interface MyService {
     method(param: string): Promise<Result>;
   }
   ```

2. **Create Business Operations** (`src/business/core/my-service/`)
   ```typescript
   export class MyOperations {
     constructor(private myService: MyService) {}
     
     async businessMethod(data: BusinessData): Promise<BusinessResult> {
       // Pure business logic here
     }
   }
   ```

3. **Implement Platform Services** (`src/utils/my-service/`)
   ```typescript
   // my-service.web.ts
   export class WebMyService implements MyService {
     // Web implementation
   }
   
   // my-service.reactnative.ts  
   export class ReactNativeMyService implements MyService {
     // React Native implementation
   }
   ```

4. **Create React Hook** (if needed) (`src/business/hooks/data/`)
   ```typescript
   export const useMyService = () => {
     // Hook implementation
   };
   ```

5. **Write Tests** (`__tests__` directories)
   ```typescript
   describe('MyOperations', () => {
     // Comprehensive tests
   });
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

### When Writing Code
1. **Follow Established Patterns**: Look at existing code for patterns
2. **Check Dependencies**: Verify required services/dependencies exist
3. **Add Proper Types**: Always include TypeScript type definitions
4. **Write Tests**: Include comprehensive test coverage
5. **Update Documentation**: Update API docs if adding public interfaces

### When Debugging
1. **Check Platform Detection**: Verify correct platform implementation is used
2. **Verify Interface Compliance**: Ensure implementations match interfaces
3. **Review Dependency Injection**: Check service registration and resolution
4. **Validate Type Safety**: Run type checking to catch type errors

### When Refactoring
1. **Maintain Interface Compatibility**: Don't break existing APIs
2. **Update Tests**: Ensure tests still pass after changes
3. **Check All Platforms**: Verify changes work on both web and React Native
4. **Update Documentation**: Keep docs in sync with code changes

### Common Pitfalls to Avoid
- Don't mix platform-specific code in business logic
- Don't skip interface definitions
- Don't forget to export new services from index files
- Don't ignore TypeScript errors
- Don't skip testing for new functionality

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