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

### Quick Start for AI Assistants

**Essential Commands:**
```bash
npm run typecheck    # Check TypeScript types (run this first!)
npm test            # Run all tests
npm run lint:fix    # Fix code formatting
npm run build       # Build the library
```

**File Search Patterns:**
- Interfaces: `**/*.interface.ts`
- Platform implementations: `**/*.web.ts`, `**/*.reactnative.ts`
- Business operations: `**/business/core/**/*-operations.ts`
- React hooks: `**/business/hooks/**/*.ts`
- Tests: `**/__tests__/**/*.test.ts`

### Adding New Features (AI-Optimized)

**Step 1: Use the Service Template**
Copy `templates/service-template.ts` and replace all placeholders:
- `{{ServiceName}}` → Your service name (PascalCase)
- `{{serviceName}}` → camelCase version
- `{{service-name}}` → kebab-case version

**Step 2: Define the Interface**
```typescript
// src/types/services/my-service.interface.ts
export interface MyService {
  doSomething(input: string): Promise<Result>;
}
```

**Step 3: Implement Business Logic**
```typescript
// src/business/core/my-feature/my-operations.ts
export class MyOperations {
  constructor(private myService: MyService) {}
  
  async performOperation(input: string): Promise<Result> {
    // Pure business logic - NO platform imports!
  }
}
```

**Step 4: Create Platform Implementations**
```typescript
// src/utils/my-service/my-service.web.ts
export class WebMyService implements MyService {
  async doSomething(input: string): Promise<Result> {
    // Web-specific implementation using fetch, localStorage, etc.
  }
}

// src/utils/my-service/my-service.reactnative.ts  
export class ReactNativeMyService implements MyService {
  async doSomething(input: string): Promise<Result> {
    // React Native implementation using AsyncStorage, etc.
  }
}

// src/utils/my-service/index.ts
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

**Step 5: Add React Hook (Optional)**
```typescript
// src/business/hooks/data/useMyFeature.ts
export const useMyFeature = () => {
  // Use the hook template pattern
}
```

**Step 6: Write Tests**
```typescript
// src/business/core/my-feature/__tests__/my-operations.test.ts
describe('MyOperations', () => {
  // Test business logic with mocks
});
```

**Step 7: Update Exports (CRITICAL!)**
```typescript
// Add to src/types/services/index.ts:
export * from './my-service.interface';

// Add to src/business/core/index.ts:  
export * from './my-feature/my-operations';

// Add to src/business/hooks/data/index.ts:
export { useMyFeature } from './useMyFeature';
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

## AI Assistant Workflows

### Bug Fixing Workflow
1. **Search for the issue**: Use Grep to find relevant code
2. **Understand the context**: Read surrounding files and imports
3. **Write failing test**: Reproduce the bug in a test
4. **Fix the implementation**: Make minimal changes
5. **Verify the fix**: Ensure test passes and no regressions
6. **Run quality checks**: `npm run typecheck && npm test && npm run lint:fix`

### Code Review Checklist
- [ ] No platform-specific imports in business logic
- [ ] All interfaces properly implemented
- [ ] Tests cover both success and error cases
- [ ] Exports added to relevant index.ts files
- [ ] TypeScript types are strict (no `any`)
- [ ] Error handling follows patterns
- [ ] Documentation is updated

### Migration Patterns
When updating existing services:
1. Use `templates/migration-template.ts` for guidance
2. Create adapter classes for backward compatibility
3. Add deprecation warnings for old methods
4. Use feature flags for gradual rollout
5. Document migration path clearly

## Debugging Tips

### Common Issues & Solutions

**Platform detection not working:**
```typescript
// ✅ Correct import
import { Platform } from '../../types/environment';
// ❌ Wrong - don't import from react-native!
```

**Import errors:**
```bash
# Check exports in index.ts files
npm run typecheck  # Will show missing exports
```

**Interface compliance errors:**
```typescript
// Make sure implementations match interfaces exactly
class MyService implements MyServiceInterface {
  // Must implement ALL interface methods
}
```

**Test mocking issues:**
```typescript
// Use vi.mocked() for better type safety
const mockService = vi.mocked(createMockService());
```

### Debugging Tools
- Use `npm run typecheck` first - catches most issues
- Leverage TypeScript compiler errors for guidance
- Use `console.log` with service names for clarity
- Check network requests in browser dev tools
- Use `npm test -- --watch` for rapid iteration

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