# AI Development Workflows

This guide provides step-by-step workflows for common AI-assisted development tasks in the @johnqh/lib project.

## 🚀 Quick Start Workflow

### Prerequisites Check
Before starting any development task, run these commands:

```bash
# Check project health
npm run analyze:code      # Get AI development analysis
npm run check-all         # Ensure all checks pass
npm run analyze:deps      # Check for dependency issues
```

## 📋 Common Development Workflows

### 1. Adding a New Feature Workflow

**Step 1: Analysis & Planning**
```bash
# Understand the codebase
npm run analyze:code

# Search for similar features
Grep -n "similar_feature" src/
Glob "**/*similar*.ts"
```

**Step 2: Define Types First**
```typescript
// Create interface file: src/types/services/new-feature.interface.ts
export interface NewFeatureService {
  performAction(data: ActionData): Promise<ActionResult>;
}

export interface ActionData {
  required: string;
  optional?: number;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

**Step 3: Generate Service Scaffold**
```bash
# Use AI-friendly generator
npm run create:service new-feature
```

**Step 4: Implement Business Logic**
```typescript
// File: src/business/core/new-feature/new-feature-operations.ts
export class NewFeatureOperations {
  constructor(private service: NewFeatureService) {}

  async businessMethod(data: ActionData): Promise<ActionResult> {
    // Pure business logic - no platform dependencies
    const result = await this.service.performAction(data);
    
    if (!result.success) {
      throw new NewFeatureError(result.error || 'Operation failed');
    }
    
    return {
      processed: true,
      timestamp: Date.now(),
      value: result.data
    };
  }
}
```

**Step 5: Create React Hook**
```bash
# Generate hook scaffold
npm run create:hook useNewFeature indexer  # or wildduck
```

**Step 6: Validation & Testing**
```bash
npm run check-all         # Full validation
npm run test:coverage     # Check test coverage
npm run analyze:code      # Verify AI development score
```

### 2. Fixing a Bug Workflow

**Step 1: Locate the Issue**
```bash
# Search for the problem
Grep -n "error_message" src/
Grep -n "function_name" src/

# Find related files
Glob "**/*component*.ts"
```

**Step 2: Write Failing Test**
```typescript
// Always write the test first
describe('BugFix', () => {
  it('should handle edge case properly', async () => {
    // Test that currently fails
    const result = await buggyFunction('edge_case');
    expect(result).toBe('expected_value');
  });
});
```

**Step 3: Implement Fix**
```typescript
// Fix the issue in the appropriate file
export function buggyFunction(input: string): string {
  // Add proper handling for edge case
  if (input === 'edge_case') {
    return 'expected_value';
  }
  
  return normalProcessing(input);
}
```

**Step 4: Verify Fix**
```bash
npm test -- --watch      # Watch tests
npm run check-all         # Full validation
```

### 3. Adding API Integration Workflow

**Step 1: Update API Client**
```typescript
// File: src/network/clients/indexer.ts or wildduck.ts
async newEndpoint(param: string): Promise<ResponseType> {
  const response = await this.get(`/api/new-endpoint/${param}`);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.data?.error}`);
  }
  
  return response.data as ResponseType;
}
```

**Step 2: Create Business Hook**
```typescript
// Follow the established pattern
export const useNewEndpoint = (endpointUrl: string, dev: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

**Step 3: Add Type Definitions**
```typescript
// File: src/types/api/new-endpoint.interface.ts
export interface NewEndpointRequest {
  param: string;
  options?: RequestOptions;
}

export interface NewEndpointResponse {
  data: ResultData;
  timestamp: number;
  status: 'success' | 'error';
}
```

**Step 4: Write Integration Tests**
```typescript
describe('useNewEndpoint', () => {
  it('should call API and return data', async () => {
    const mockClient = {
      newEndpoint: vi.fn().mockResolvedValue({ data: 'test' })
    };
    
    const { result } = renderHook(() => useNewEndpoint('url', true));
    const response = await result.current.fetchData('param');
    
    expect(response).toEqual({ data: 'test' });
    expect(mockClient.newEndpoint).toHaveBeenCalledWith('param');
  });
});
```

### 4. Refactoring Code Workflow

**Step 1: Analyze Current Code**
```bash
npm run analyze:code      # Get refactoring suggestions
npm run analyze:types     # Check type coverage
```

**Step 2: Create Refactoring Plan**
```typescript
// Document the changes needed
interface RefactoringPlan {
  currentIssues: string[];
  targetState: string[];
  breakingChanges: string[];
  migrationSteps: string[];
}
```

**Step 3: Implement Changes Incrementally**
```bash
# Make small, focused changes
git add -p                # Stage partial changes
npm run check-all         # Validate each step
```

**Step 4: Update Tests & Documentation**
```bash
npm run test:coverage     # Ensure no regression
npm run format            # Format code
npm run lint:fix          # Fix linting issues
```

## 🎯 AI-Specific Workflows

### 1. Using Project Analysis for Context

```bash
# Before starting any AI task
npm run analyze:code

# Use output to understand:
# - Project structure
# - Code patterns
# - Quality metrics
# - AI readiness score
```

### 2. Generating Code with Templates

```bash
# Use AI-friendly templates
npm run create:service my-service    # Complete service scaffold
npm run create:hook useMyHook indexer # Indexer hook
npm run create:hook useMyHook wildduck # WildDuck hook
npm run create:type MyInterface      # Type definitions
```

### 3. Finding Code Patterns

```bash
# AI assistants should use these commands
Grep -n "pattern" src/                    # Search content
Glob "**/*pattern*.ts"                    # Find files
npm run analyze:deps                      # Check dependencies
npm run analyze:size                      # Bundle analysis
```

## 🔍 Debugging Workflows

### 1. Type Error Resolution

**Step 1: Identify the Error**
```bash
npm run typecheck        # Find all type errors
```

**Step 2: Check Dependencies**
```typescript
// Common issues and solutions:

// Missing @johnqh/di import
import { MissingType } from '@johnqh/di';

// Type assertion needed
const result = response.data as ExpectedType;

// Interface mismatch
// Update interface to match implementation
```

**Step 3: Fix and Validate**
```bash
npm run typecheck        # Verify fix
npm run check-all        # Full validation
```

### 2. Test Failure Resolution

**Step 1: Run Specific Test**
```bash
npm test -- --watch path/to/test.ts
```

**Step 2: Debug the Issue**
```typescript
// Add debug logging
console.log('Debug:', { input, output, expected });

// Check mock configuration
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
```

**Step 3: Fix and Verify**
```bash
npm run test:coverage    # Check coverage
npm test                 # Run all tests
```

### 3. Runtime Error Resolution

**Step 1: Identify Platform Issues**
```typescript
// Check platform detection
import { Platform } from '../../types/environment';
console.log('Platform:', Platform.OS);
```

**Step 2: Fix Implementation**
```typescript
// Ensure proper platform handling
const service = Platform.OS === 'web' 
  ? new WebService() 
  : new ReactNativeService();
```

## 🚀 Performance Optimization Workflows

### 1. Bundle Size Analysis

```bash
npm run analyze:size     # Check current size
npm run build           # Generate bundle
du -sh dist/            # Manual size check
```

### 2. Type Coverage Optimization

```bash
npm run analyze:types    # Check type coverage
npm run types:validate   # Strict type checking
```

### 3. Dependency Optimization

```bash
npm run analyze:deps     # Check for issues
npm audit               # Security audit
npm outdated            # Update opportunities
```

## 📊 Quality Assurance Workflows

### 1. Pre-commit Workflow

```bash
npm run quick-check      # Fast validation (2-3 minutes)
npm run check-all        # Full validation (5-10 minutes)
npm run validate        # Complete validation with coverage
```

### 2. Release Preparation Workflow

```bash
npm run analyze:code     # Project health check
npm run check-all        # All validations
npm run test:coverage    # Coverage report
npm run build           # Production build
npm run analyze:size     # Bundle size check
```

### 3. CI/CD Simulation

```bash
# Simulate CI pipeline locally
npm install             # Clean install
npm run lint            # Linting
npm run typecheck       # Type checking  
npm run test:run        # Test execution
npm run build           # Build process
```

## 🤖 AI Assistant Best Practices

### 1. Context Gathering
```bash
# Always start with analysis
npm run analyze:code

# Understand the request
Grep -n "related_code" src/
Glob "**/*relevant*.ts"
```

### 2. Implementation Strategy
```typescript
// Follow established patterns
// Use existing interfaces
// Maintain consistency
// Write tests first
```

### 3. Validation Process
```bash
# Always validate changes
npm run check-all
npm run test:coverage
npm run analyze:code
```

### 4. Documentation Updates
```markdown
# Keep documentation in sync
# Update interfaces
# Add examples
# Include migration notes
```

## 🎓 Learning Resources

### Understanding the Codebase
1. Read `npm run analyze:code` output
2. Study `src/types/` for interfaces
3. Examine `src/business/hooks/` for patterns
4. Review `templates/` for scaffolding

### Common Patterns
1. **Service Pattern**: Interface → Operations → Hook
2. **Platform Pattern**: Web + ReactNative implementations
3. **Hook Pattern**: Indexer (endpointUrl, dev) | WildDuck (config)
4. **Error Pattern**: Custom errors with codes

### Testing Strategies
1. **Unit Tests**: Business operations
2. **Integration Tests**: API clients
3. **Hook Tests**: React hook behavior
4. **Type Tests**: TypeScript validation

## 📝 Workflow Checklists

### New Feature Checklist
- [ ] Run `npm run analyze:code`
- [ ] Define interfaces first
- [ ] Use `npm run create:service`
- [ ] Implement business logic
- [ ] Create React hooks
- [ ] Write comprehensive tests
- [ ] Update exports in index files
- [ ] Run `npm run check-all`
- [ ] Update documentation

### Bug Fix Checklist
- [ ] Reproduce the bug
- [ ] Write failing test
- [ ] Locate root cause
- [ ] Implement minimal fix
- [ ] Verify test passes
- [ ] Check for similar issues
- [ ] Run full test suite
- [ ] Update documentation if needed

### Refactoring Checklist
- [ ] Plan the changes
- [ ] Ensure backward compatibility
- [ ] Make incremental changes
- [ ] Keep tests passing
- [ ] Update all references
- [ ] Run type checking
- [ ] Update documentation
- [ ] Verify no regressions

This workflow guide ensures consistent, high-quality development practices while maximizing the effectiveness of AI-assisted development.