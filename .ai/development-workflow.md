# Development Workflow - @johnqh/lib

This document outlines complete development processes for AI-assisted development.

## 🚀 Quick Development Workflow

### 1. Pre-Development Setup
```bash
# Ensure clean starting state
npm run validate
git status
git pull origin main

# Check project health
npm run analyze:health
```

### 2. Feature Development Flow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Generate code if using templates
npm run create:service -- --name MyFeature
# or
npm run create:hook -- --name useMyFeature --type indexer

# Develop following patterns
# Test continuously
npm run test:watch

# Validate before commit
npm run validate
git add .
git commit -m "feat: add MyFeature service with comprehensive tests"
```

## 📋 Complete Development Processes

### Process A: New Service Implementation

#### Phase 1: Analysis & Design
1. **Requirements Analysis**
   ```bash
   # Research existing patterns
   find src -name "*.interface.ts" | head -10
   find src/business/core -name "*-operations.ts" | head -5
   ```

2. **Interface Design**
   - Create interface in `src/types/services/`
   - Define error types
   - Plan method signatures
   - Consider platform requirements

3. **Architecture Validation**
   - Review with existing patterns
   - Ensure platform abstraction
   - Validate dependency injection approach

#### Phase 2: Core Implementation  
1. **Interface Definition**
   ```typescript
   // src/types/services/my-service.interface.ts
   export interface MyService {
     method(param: string): Promise<Result>;
   }
   ```

2. **Business Operations**
   ```typescript  
   // src/business/core/my-service/my-service-operations.ts
   export class MyServiceOperations {
     constructor(private service: MyService) {}
     // Pure business logic
   }
   ```

3. **Platform Implementations**
   ```typescript
   // src/utils/my-service/my-service.web.ts
   // src/utils/my-service/my-service.reactnative.ts
   // src/utils/my-service/index.ts
   ```

#### Phase 3: Hook Layer
1. **React Hook Implementation**
   ```typescript
   // src/business/hooks/data/useMyService.ts
   export const useMyService = () => {
     // Hook implementation with state management
   };
   ```

2. **Hook Integration**
   - Add to hook exports
   - Update index files
   - Ensure proper memoization

#### Phase 4: Testing
1. **Unit Tests**
   ```bash
   # Business operations tests
   npm test src/business/core/my-service/__tests__/
   ```

2. **Hook Tests**
   ```bash
   # Hook behavior tests
   npm test src/business/hooks/data/__tests__/useMyService.test.ts
   ```

3. **Integration Tests**
   ```bash
   # End-to-end functionality
   npm test src/__tests__/integration/my-service.integration.test.ts
   ```

#### Phase 5: Validation & Documentation
1. **Code Quality Validation**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

2. **Performance Validation**
   ```bash
   npm run analyze:size
   npm run analyze:types
   ```

3. **Documentation Updates**
   - Update interface documentation
   - Add usage examples
   - Update CLAUDE.md if needed

### Process B: Indexer Hook Development

#### Phase 1: API Analysis
1. **Endpoint Research**
   - Check IndexerClient for existing methods
   - Review API documentation  
   - Identify authentication requirements

2. **Pattern Analysis**
   ```bash
   # Study existing indexer hooks
   ls src/business/hooks/indexer/
   grep -r "useIndexer" src/business/hooks/indexer/
   ```

#### Phase 2: Client Extension
1. **Add API Method to IndexerClient**
   ```typescript
   // src/network/clients/indexer.ts
   async newEndpoint(param: string) {
     const response = await this.get(`/api/new-endpoint/${param}`);
     return response.data;
   }
   ```

2. **Client Method Testing**
   ```bash
   npm test src/network/clients/__tests__/indexer.test.ts
   ```

#### Phase 3: Hook Implementation
1. **Hook Creation**
   ```typescript
   // src/business/hooks/indexer/useIndexerMyFeature.ts
   export const useIndexerMyFeature = (endpointUrl: string, dev: boolean) => {
     // Standard indexer hook pattern
   };
   ```

2. **Hook Integration**
   - Export from indexer/index.ts
   - Add to main exports

#### Phase 4: Testing & Validation
1. **Hook Testing**
   ```bash
   npm test src/business/hooks/indexer/__tests__/useIndexerMyFeature.test.ts
   ```

2. **Integration Testing**
   - Test with real API (dev environment)
   - Test with mock responses
   - Validate error handling

### Process C: Bug Fix Workflow

#### Phase 1: Issue Analysis
1. **Problem Identification**
   ```bash
   # Reproduce the issue
   npm test -- --watch src/path/to/failing/test
   
   # Check logs and error messages
   npm run dev
   ```

2. **Root Cause Analysis**
   - Trace through the call stack
   - Identify the affected layer
   - Check related code for similar issues

#### Phase 2: Fix Implementation
1. **Test-First Approach**
   ```typescript
   // Write failing test that reproduces the bug
   it('should handle edge case correctly', () => {
     // Failing test case
   });
   ```

2. **Minimal Fix**
   - Implement the smallest possible fix
   - Maintain existing interfaces
   - Preserve backward compatibility

#### Phase 3: Validation
1. **Test Validation**
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Integration Validation**
   ```bash
   npm run build
   npm run validate
   ```

3. **Manual Testing**
   - Test in development environment
   - Verify fix doesn't break other features

## 🔄 Continuous Development Practices

### Daily Development Routine
```bash
# Morning setup
git checkout main
git pull origin main
npm install  # If dependencies changed
npm run validate

# Feature work
git checkout -b feature/new-feature
# ... development work ...
npm run test:watch  # Keep running during development

# Pre-commit validation
npm run validate
git add .
git commit -m "feat: descriptive commit message"

# Push and create PR
git push origin feature/new-feature
```

### Code Quality Gates
1. **Pre-commit Checks**
   - TypeScript compilation
   - ESLint passing
   - Unit tests passing
   - No failing builds

2. **Pre-push Checks**
   - All tests passing
   - Coverage requirements met
   - Bundle size analysis
   - Integration tests passing

3. **Pre-merge Checks**
   - Code review completed
   - CI/CD pipeline green
   - Documentation updated
   - Breaking changes documented

### Performance Monitoring
```bash
# Regular performance checks
npm run analyze:size     # Bundle size analysis
npm run analyze:deps     # Dependency analysis
npm run analyze:types    # Type coverage analysis

# Performance regression detection
npm run test:performance  # Performance benchmarks
```

## 🧪 Testing Workflows

### Test-Driven Development (TDD)
1. **Red Phase** - Write failing test
   ```typescript
   it('should handle new feature', () => {
     expect(newFeature()).toBe(expected);  // This will fail
   });
   ```

2. **Green Phase** - Implement minimal code to pass
   ```typescript
   export const newFeature = () => expected;
   ```

3. **Refactor Phase** - Improve implementation
   ```typescript
   export const newFeature = (input) => {
     // Proper implementation
     return processInput(input);
   };
   ```

### Testing Strategies by Component Type

#### Business Operations Testing
```typescript
// Mock all external dependencies
const mockService = {
  method: vi.fn().mockResolvedValue(expectedResult),
};

// Test business logic in isolation
const operations = new MyOperations(mockService);
```

#### Hook Testing
```typescript
// Use React Testing Library
import { renderHook, act } from '@testing-library/react';

// Test hook state management
const { result } = renderHook(() => useMyHook());
```

#### Integration Testing
```typescript
// Test complete flows
const TestComponent = () => {
  const { data, execute } = useMyService();
  return <div>{data?.value}</div>;
};
```

## 🚨 Emergency Workflows

### Hotfix Process
1. **Immediate Response**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. **Quick Fix**
   - Identify minimal change
   - Implement targeted fix
   - Add regression test

3. **Rapid Deployment**
   ```bash
   npm run validate
   npm version patch
   git add .
   git commit -m "fix: critical issue description"
   git push origin hotfix/critical-fix
   ```

### Rollback Process
1. **Identify Issue**
   - Determine affected version
   - Assess impact scope

2. **Quick Rollback**
   ```bash
   git checkout main
   git revert SHA_OF_PROBLEMATIC_COMMIT
   npm version patch
   ```

3. **Communicate**
   - Update changelog
   - Notify affected projects
   - Plan proper fix

## 📊 Quality Metrics

### Development KPIs
- **Code Coverage**: >80% for business logic
- **Type Coverage**: >95% for all code  
- **Build Time**: <30 seconds
- **Test Execution**: <10 seconds
- **Bundle Size**: Monitor for significant increases

### Code Quality Metrics
- **Cyclomatic Complexity**: <10 per function
- **File Size**: <500 lines per file
- **Function Length**: <50 lines per function
- **Parameter Count**: <5 parameters per function

### Documentation Coverage
- **Public APIs**: 100% documented
- **Complex Logic**: Comments explaining why
- **Examples**: Usage examples for all hooks
- **Migration Guides**: For breaking changes

---

These workflows ensure consistent, high-quality development that works efficiently with AI assistance while maintaining the architectural principles of @johnqh/lib.