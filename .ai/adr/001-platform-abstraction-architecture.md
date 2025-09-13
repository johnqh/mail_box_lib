# ADR-001: Platform Abstraction Architecture

**Date:** 2025-01-13  
**Status:** Accepted  
**Context:** AI-assisted development optimization

## Context

@johnqh/lib needs to support both web (React) and mobile (React Native) platforms while maintaining a single codebase. The library provides business logic, API integrations, and React hooks that must work seamlessly across both environments without requiring platform-specific versions.

## Decision

Implement a layered platform abstraction architecture with the following structure:

1. **Business Logic Layer** (`src/business/core/`): Platform-agnostic operations
2. **Interface Layer** (`src/types/services/`): Abstract service definitions
3. **Platform Implementation Layer** (`src/utils/`): Platform-specific implementations
4. **Hook Layer** (`src/business/hooks/`): React hooks consuming business operations
5. **Network Layer** (`src/network/`): API clients and network operations

Platform detection occurs at the utility layer, with dynamic imports selecting appropriate implementations:

```typescript
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

## Consequences

### Positive
- Single codebase supports both web and React Native
- Clear separation of concerns enables easier testing
- Business logic remains platform-agnostic and highly testable
- AI assistants can understand and work with consistent patterns
- New platform support can be added without changing business logic

### Negative
- Slightly more complex file structure with multiple implementations
- Requires discipline to avoid platform-specific imports in business logic
- Dynamic requires can complicate static analysis

### Neutral
- Adds abstraction layer that may be overkill for simple utilities
- Requires understanding of platform detection patterns for new developers

## Implementation

1. **Directory Structure**:
   ```
   src/
   ├── business/core/     # Pure business logic
   ├── business/hooks/    # React hooks
   ├── types/services/    # Interface definitions
   ├── utils/             # Platform implementations
   └── network/           # API clients
   ```

2. **Platform Detection**:
   - Use `Platform.OS` from `src/types/environment.ts`
   - Dynamic imports for platform-specific implementations
   - Factory functions for service creation

3. **Interface Pattern**:
   - All services must implement defined interfaces
   - Business operations consume interfaces, not implementations
   - Error types defined alongside interfaces

## Alternatives Considered

1. **Separate Platform Packages**: Create `@johnqh/lib-web` and `@johnqh/lib-rn`
   - Rejected: Increases maintenance burden and code duplication

2. **Monorepo with Platform Workspaces**: Use monorepo structure for platform separation
   - Rejected: Adds complexity without significant benefits

3. **Runtime Platform Detection with Conditional Imports**: Check platform at runtime
   - Rejected: Can cause issues with bundlers and static analysis

4. **Platform-Specific Entry Points**: Different entry points per platform
   - Rejected: Complicates consumer integration and documentation