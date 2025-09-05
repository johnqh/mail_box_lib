# AI Assistant Quick Reference

This file provides essential information for AI assistants working on @johnqh/lib.

## 🚀 Quick Start

**Before any code changes:**
```bash
npm run typecheck  # Must pass!
```

**After making changes:**
```bash
npm run typecheck && npm test && npm run lint:fix
```

## 📁 Project Structure

```
src/
├── business/           # 🧠 Pure business logic (platform-agnostic)
│   ├── ai/            # AI services
│   ├── core/          # Domain operations  
│   ├── hooks/         # React hooks
│   └── points/        # Rewards system
├── di/                # 🔌 Dependency injection
├── network/           # 🌐 HTTP clients
├── storage/           # 💾 Storage abstraction
├── types/             # 📝 TypeScript definitions
└── utils/             # ⚙️  Platform-specific code
```

## 🎯 Common Tasks

### Adding a Service
1. Copy `templates/service-template.ts`
2. Replace `{{ServiceName}}` placeholders
3. Define interface in `src/types/services/`
4. Implement business logic in `src/business/core/`
5. Create platform implementations in `src/utils/`
6. Update all `index.ts` files
7. Write tests

### Fixing a Bug
1. Search code with Grep tool
2. Write failing test first
3. Fix implementation
4. Verify test passes
5. Run `npm run typecheck`

### Adding a Hook
1. Use `templates/hook-template.ts`
2. Place in `src/business/hooks/data/`
3. Follow error handling patterns
4. Test with @testing-library/react

## 🔍 Search Patterns

```bash
# Find interfaces
**/*.interface.ts

# Find platform implementations  
**/*.web.ts
**/*.reactnative.ts

# Find business operations
**/business/core/**/*-operations.ts

# Find React hooks
**/business/hooks/**/*.ts

# Find tests
**/__tests__/**/*.test.ts
```

## ⚠️ Critical Rules

### ❌ Never Do This
- Import React Native modules in business logic
- Skip interface definitions
- Forget to update index.ts exports
- Use `any` type without justification
- Mix platform concerns in business logic

### ✅ Always Do This
- Define interfaces first
- Keep business logic pure
- Write comprehensive tests
- Use strict TypeScript typing
- Follow existing patterns

## 🧪 Testing

**Mock Services:**
```typescript
const mockService = {
  method: vi.fn().mockResolvedValue({ success: true })
};
```

**Test Hooks:**
```typescript
const { result } = renderHook(() => useMyHook());
await waitFor(() => expect(result.current.loading).toBe(false));
```

**Test Operations:**
```typescript
describe('MyOperations', () => {
  it('should handle success case', async () => {
    // Test implementation
  });
  
  it('should handle error case', async () => {
    // Test error handling
  });
});
```

## 🔧 Platform Patterns

**Web Implementation:**
```typescript
// src/utils/service/service.web.ts
export class WebService implements ServiceInterface {
  async method(): Promise<Result> {
    const response = await fetch('/api/endpoint');
    return response.json();
  }
}
```

**React Native Implementation:**
```typescript
// src/utils/service/service.reactnative.ts
export class ReactNativeService implements ServiceInterface {
  async method(): Promise<Result> {
    // Use React Native specific APIs
    const result = await AsyncStorage.getItem('key');
    return { data: result };
  }
}
```

**Platform Detection:**
```typescript
// src/utils/service/index.ts
import { Platform } from '../../types/environment';

export const createService = (): ServiceInterface => {
  if (Platform.OS === 'web') {
    const { WebService } = require('./service.web');
    return new WebService();
  } else {
    const { ReactNativeService } = require('./service.reactnative');
    return new ReactNativeService();
  }
};
```

## 🏗️ Architecture Layers

**1. Types Layer** (`src/types/`)
- Interface definitions
- Type declarations
- Platform abstractions

**2. Business Layer** (`src/business/`)  
- Pure domain logic
- React hooks
- Operations classes

**3. Infrastructure Layer** (`src/utils/`, `src/network/`, `src/storage/`)
- Platform-specific implementations
- External service adapters
- Storage providers

## 🚨 Common Pitfalls

1. **Platform Import in Business Logic**
   ```typescript
   // ❌ Wrong
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // ✅ Correct  
   import { StorageService } from '../../../types/services/storage.interface';
   ```

2. **Missing Interface**
   ```typescript
   // ❌ Wrong - no interface
   export class MyService {
     doSomething() { }
   }
   
   // ✅ Correct - interface first
   export interface MyService {
     doSomething(): Promise<void>;
   }
   ```

3. **Forgetting Exports**
   ```typescript
   // ✅ Always update index.ts files
   export * from './my-new-service.interface';
   ```

## 🔄 API Integration

**Current API Patterns:**
- All indexer endpoints require signature authentication
- Points API: `/api/points/*`
- Solana API: `/api/solana/*`
- No admin endpoints (removed in v2.1.0)

**Signature Auth Pattern:**
```typescript
async protectedCall(walletAddress: string, signature: string, message: string) {
  return this.client.post('/api/endpoint', {
    walletAddress,
    signature, 
    message,
    // ... other data
  });
}
```

## 📚 Key Files

- `CLAUDE.md` - Comprehensive AI instructions
- `DEVELOPMENT.md` - Detailed development guide
- `.claude_context` - Project context for AI
- `templates/` - Code templates and patterns
- `package.json` - Dependencies and scripts

## 🎯 Success Checklist

Before completing any task:
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code follows established patterns
- [ ] Interfaces properly defined
- [ ] Platform abstraction maintained
- [ ] Exports added to index files
- [ ] Documentation updated if needed

## 🆘 Getting Help

1. Check existing similar implementations
2. Review templates for patterns
3. Run `npm run typecheck` for type guidance
4. Check test files for usage examples
5. Review CLAUDE.md for detailed patterns