# Development Guide

## Project Setup

```bash
npm install
npm run build
npm test
```

## Architecture Overview

This library follows a layered architecture with platform abstraction:

### Business Logic Layer (`src/business/`)
Pure business logic that works across platforms:
- **Core Operations**: Domain logic for email, auth, analytics
- **AI Services**: LLM-powered email processing
- **React Hooks**: Data fetching and state management
- **Points System**: Rewards and engagement logic

### Platform Abstraction (`src/`)
Interface-first design with platform-specific implementations:
- **Interfaces**: `.interface.ts` files define contracts
- **Web**: `.web.ts` files for browser environments  
- **React Native**: `.reactnative.ts` files for mobile apps
- **Auto-detection**: Main files automatically choose platform

### Dependency Injection (`src/di/`)
Environment and service configuration:
- Environment variable management
- Service registration and resolution
- Platform-specific configurations

## Development Workflow

### Adding New Features

1. **Define the Interface**
   ```typescript
   // src/types/services/my-service.interface.ts
   export interface MyService {
     doSomething(input: string): Promise<Result>;
   }
   ```

2. **Implement Business Logic**
   ```typescript
   // src/business/core/my-feature/my-operations.ts
   export class MyOperations {
     constructor(private myService: MyService) {}
     
     async performOperation(input: string): Promise<Result> {
       // Pure business logic here
     }
   }
   ```

3. **Create Platform Implementations**
   ```typescript
   // src/utils/my-service/my-service.web.ts
   export class WebMyService implements MyService {
     async doSomething(input: string): Promise<Result> {
       // Web-specific implementation
     }
   }
   ```

4. **Add React Hook (if needed)**
   ```typescript
   // src/business/hooks/data/useMyFeature.ts
   export const useMyFeature = () => {
     // React hook implementation
   }
   ```

5. **Write Tests**
   ```typescript
   // src/business/core/my-feature/__tests__/my-operations.test.ts
   describe('MyOperations', () => {
     // Test business logic
   });
   ```

### Code Style Guidelines

#### File Organization
- Group related files in directories
- Use `index.ts` for clean exports
- Keep platform-specific code separate
- Place tests in `__tests__` directories

#### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)

#### TypeScript Best Practices
```typescript
// ✅ Good: Explicit interfaces
interface UserData {
  id: string;
  email: string;
  preferences: UserPreferences;
}

// ✅ Good: Generic types for reusability
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ✅ Good: Error handling
async function fetchUser(id: string): Promise<UserData> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}
```

### Testing Strategy

#### Unit Tests
- Test business logic in isolation
- Mock external dependencies
- Use descriptive test names
- Group tests by functionality

```typescript
describe('EmailOperations', () => {
  let emailOps: EmailOperations;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockEmailService = createMockEmailService();
    emailOps = new EmailOperations(mockEmailService);
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      // Test implementation
    });

    it('should handle send failures gracefully', async () => {
      // Error case testing
    });
  });
});
```

#### Integration Tests
- Test platform implementations
- Test React hooks with realistic scenarios
- Use test utilities for common setups

### Platform-Specific Development

#### Web Platform
```typescript
// Use browser APIs
const webStorage: StorageProvider = {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  
  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
};
```

#### React Native Platform  
```typescript
// Use React Native APIs
import AsyncStorage from '@react-native-async-storage/async-storage';

const rnStorage: StorageProvider = {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
};
```

## Common Patterns

### Error Handling
```typescript
// Use custom error types
export class EmailServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

// Handle errors consistently
try {
  await emailService.sendEmail(email);
} catch (error) {
  if (error instanceof EmailServiceError) {
    // Handle specific error
  }
  throw error; // Re-throw if not handled
}
```

### Async Operations
```typescript
// Use async/await consistently
async function processEmails(emails: Email[]): Promise<ProcessedEmail[]> {
  const results = await Promise.allSettled(
    emails.map(email => processEmail(email))
  );
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}
```

### State Management
```typescript
// Use React hooks for state
export const useEmailList = (mailboxId: string) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await emailService.getEmails(mailboxId);
      setEmails(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [mailboxId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { emails, loading, error, refetch };
};
```

## Debugging Tips

### Common Issues
1. **Platform detection not working**: Check environment setup
2. **Import errors**: Verify index.ts exports are correct
3. **Type errors**: Check interface implementations match
4. **Tests failing**: Ensure mocks are properly configured

### Debugging Tools
- Use `console.log` with clear prefixes
- Leverage TypeScript compiler for type checking
- Use debugger statements in development
- Check network requests in browser dev tools

## Performance Considerations

### Bundle Size
- Use tree-shaking friendly exports
- Avoid importing entire libraries
- Use dynamic imports for large dependencies

### Memory Management  
- Clean up event listeners in hooks
- Use weak references where appropriate
- Avoid memory leaks in long-running operations

### Caching
- Implement proper caching strategies
- Use React Query for server state
- Cache expensive computations

## Deployment

### Build Process
```bash
npm run clean
npm run build
npm test
```

### Publishing
The library is published as `@johnqh/lib` and should work in both web and React Native environments.

### Version Management
Follow semantic versioning:
- Major: Breaking changes
- Minor: New features, backward compatible
- Patch: Bug fixes