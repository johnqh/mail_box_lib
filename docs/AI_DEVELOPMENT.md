# AI-Assisted Development Guide

## Quick Start for AI Developers

### Understanding the Project
This is a React Native-compatible library that follows strict architectural patterns:
- **Interface-first design**: Every service has a TypeScript interface
- **Platform abstraction**: Code works on both web and React Native
- **Clean architecture**: Business logic is separate from platform concerns
- **Dependency injection**: Services are configurable and testable

### Common AI Assistant Tasks

#### 1. Adding a New Service
```bash
# Step 1: Define the interface
touch src/types/services/my-service.interface.ts

# Step 2: Create business operations
mkdir -p src/business/core/my-service
touch src/business/core/my-service/my-service-operations.ts
touch src/business/core/my-service/index.ts

# Step 3: Platform implementations
mkdir -p src/utils/my-service
touch src/utils/my-service/my-service.web.ts
touch src/utils/my-service/my-service.reactnative.ts
touch src/utils/my-service/index.ts

# Step 4: React hooks (if needed)
mkdir -p src/business/hooks/my-service
touch src/business/hooks/my-service/useMyService.ts
touch src/business/hooks/my-service/index.ts

# Step 5: Tests
mkdir -p src/business/core/my-service/__tests__
touch src/business/core/my-service/__tests__/my-service-operations.test.ts
```

#### 2. Updating API Clients
When backend APIs change:
1. Update the client in `src/network/clients/`
2. Update corresponding hooks in `src/business/hooks/`
3. Run `npm run typecheck` to catch signature mismatches
4. Update tests to reflect new behavior

**Note:** WildDuck and Indexer API clients are now in separate packages:
- `@johnqh/wildduck_client` for email server operations
- `@johnqh/indexer_client` for blockchain indexing

#### 3. Platform-Specific Implementations
```typescript
// Example: src/utils/storage/storage.web.ts
export class WebStorageService implements StorageService {
  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
}

// Example: src/utils/storage/storage.reactnative.ts
export class ReactNativeStorageService implements StorageService {
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
}
```

### API Signature Patterns

#### Authentication Patterns
API clients should follow consistent authentication patterns:

```typescript
// Configuration-based authentication
interface APIConfig {
  apiUrl: string;
  apiToken: string;
  options?: RequestOptions;
}

// Token-based authentication
const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};
```

### Testing Patterns

#### Business Logic Tests
```typescript
// Focus on testing business operations, not platform implementations
describe('EmailOperations', () => {
  it('should parse email addresses correctly', () => {
    const operations = new EmailOperations(mockEmailService);
    const result = operations.parseAddresses('test@example.com');
    expect(result).toEqual([{ email: 'test@example.com', type: 'primary' }]);
  });
});
```

#### Hook Tests
```typescript
// Use React Testing Library for hooks
import { renderHook, act } from '@testing-library/react';

describe('useFeature', () => {
  it('should handle operations correctly', async () => {
    const { result } = renderHook(() => useFeature(config));
    await act(async () => {
      await result.current.executeAction(param);
    });
    expect(result.current.error).toBeNull();
  });
});
```

### Code Quality Standards

#### TypeScript Guidelines
- Use strict typing: no `any` types unless absolutely necessary
- Define interfaces before implementations
- Export types alongside implementations
- Use generics for reusable code

#### File Organization
- Keep related files together in feature directories
- Use `index.ts` files for clean exports
- Follow naming conventions consistently
- Separate interfaces from implementations

#### Error Handling
```typescript
// Create custom error types
export class IndexerApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'IndexerApiError';
  }
}

// Use consistent error handling in operations
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof IndexerApiError) {
    // Handle API-specific errors
    throw new BusinessLogicError(`API Error: ${error.message}`);
  }
  // Re-throw unexpected errors
  throw error;
}
```

### Debugging Checklist

When things go wrong, check these in order:

1. **TypeScript Errors**: Run `npm run typecheck`
2. **Linting Issues**: Run `npm run lint`
3. **Platform Detection**: Verify correct implementation is loaded
4. **API Signatures**: Check if backend API has changed
5. **Environment Config**: Validate configuration values
6. **Dependency Injection**: Check service registration
7. **Interface Compliance**: Ensure implementations match interfaces

### Performance Considerations

#### Code Splitting
- Use dynamic imports for platform-specific code
- Lazy load heavy dependencies
- Tree-shake unused exports

#### Memory Management
- Avoid memory leaks in React hooks
- Clean up subscriptions and timers
- Use React.memo for expensive components

### Security Guidelines

#### Sensitive Data
- Never log sensitive information (private keys, signatures)
- Use secure storage for credentials
- Validate all inputs and API responses
- Sanitize data before displaying to users

#### API Security
- All wallet operations require signature verification
- Use HTTPS for all network requests
- Validate server certificates
- Handle rate limiting gracefully

### Common Pitfalls

1. **Platform Mixing**: Don't use platform-specific APIs in business logic
2. **Interface Violations**: Always implement all interface methods
3. **Missing Exports**: Update index files when adding new modules
4. **Test Coverage**: Write tests for all business logic
5. **Type Safety**: Avoid `any` types, use proper TypeScript
6. **Error Swallowing**: Don't catch and ignore errors silently

### External Dependencies

#### Separated Packages
- `@johnqh/wildduck_client` → WildDuck email server integration
- `@johnqh/indexer_client` → Blockchain indexer integration

These are now separate npm packages with their own documentation.

#### Key Libraries
- `@solana/web3.js` - Solana blockchain integration
- `viem` - Ethereum and EVM chain integration
- `@noble/hashes` - Cryptographic hashing
- `bs58` - Base58 encoding for addresses
- `firebase` - Backend services

### Development Workflow

1. **Before starting**: Read relevant documentation and existing code
2. **Interface first**: Define TypeScript interfaces
3. **Business logic**: Implement pure domain logic
4. **Platform code**: Create platform-specific implementations
5. **Integration**: Add React hooks if needed
6. **Testing**: Write comprehensive tests
7. **Quality**: Run lint, typecheck, and format
8. **Documentation**: Update relevant docs

### Getting Help

- Check `CLAUDE.md` for project-specific instructions
- Review `DEVELOPMENT.md` for detailed development info
- Look at existing implementations for patterns
- Check `templates/` directory for code examples
- Review test files to understand expected behavior