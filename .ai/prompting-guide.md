# AI Prompting Guide - @johnqh/lib

This guide provides optimized prompts and templates for common AI-assisted development tasks.

## 🚀 Quick Start Prompts

### Project Analysis
```
Analyze the @johnqh/lib project structure and identify:
1. Current architecture patterns
2. Areas for improvement
3. Missing components or tests
4. Dependency optimization opportunities

Focus on: platform abstraction, type safety, and React Native compatibility.
```

### Code Generation
```
Create a new [service/hook/type] for @johnqh/lib following these requirements:
1. Follow the established patterns in src/[relevant-directory]
2. Include comprehensive TypeScript types
3. Support both web and React Native platforms
4. Add complete test coverage
5. Follow the interface-first design approach

The [feature] should [specific requirements].
```

## 📋 Task-Specific Prompts

### 1. New Service Implementation

#### Initial Analysis
```
I need to implement a new service for [feature description]. Please:

1. First, examine existing services in src/business/core/ and src/types/services/ 
2. Identify the appropriate patterns to follow
3. Check if similar functionality exists
4. Propose the interface design

Requirements:
- Platform-agnostic business logic
- TypeScript interface-first approach  
- Error handling with custom error types
- Testable architecture with dependency injection

Please start by showing me the proposed interface and asking for confirmation before implementation.
```

#### Implementation Request
```
Implement the [ServiceName] following these specifications:

**Interface Definition:**
- Location: src/types/services/[service-name].interface.ts
- Methods: [list methods with signatures]
- Error types: Custom error class extending Error

**Business Operations:**
- Location: src/business/core/[service-name]/[service-name]-operations.ts
- Input validation and business rules
- Error handling and mapping
- Platform-agnostic logic only

**Platform Implementations:**
- Web: src/utils/[service-name]/[service-name].web.ts
- React Native: src/utils/[service-name]/[service-name].reactnative.ts
- Factory: src/utils/[service-name]/index.ts with platform detection

**React Hook:**
- Location: src/business/hooks/data/use[ServiceName].ts
- State management for loading, error, and result
- Cleanup functions and error clearing
- Memoized callbacks for performance

**Tests:**
- Operations tests: src/business/core/[service-name]/__tests__/
- Hook tests: src/business/hooks/data/__tests__/
- Full coverage including error cases

Please implement all components and ensure proper exports in index files.
```

### 2. Indexer Hook Development

```
Create a new indexer hook for [feature] following the indexer pattern:

**Requirements:**
- Hook signature: `useIndexer[Feature](endpointUrl: string, dev: boolean)`
- Use IndexerClient from src/network/clients/indexer.ts
- Add new method to IndexerClient if needed: [methodName]
- Standard state management: isLoading, error, clearError
- Proper error handling with descriptive messages

**API Integration:**
- Endpoint: [API endpoint]
- Method: [HTTP method]
- Parameters: [parameter details]
- Authentication: [signature/headers as needed]

Please check existing indexer hooks for patterns and implement consistently.
```

### 3. WildDuck Hook Development

```
Create a new WildDuck hook for [feature] following the WildDuck pattern:

**Requirements:**
- Hook signature: `useWildduck[Feature](config: WildDuckConfig)`
- Handle both cloudflareWorkerUrl and backendUrl configurations
- Proper header management for different API modes
- Standard state management pattern
- Axios for HTTP requests

**Configuration Handling:**
- Cloudflare Worker: Bearer token + X-App-Source header
- Direct Backend: X-Access-Token header
- Content-Type: application/json

Please implement following existing WildDuck hook patterns.
```

### 4. Type Definition Requests

```
Define comprehensive TypeScript types for [feature]:

**Requirements:**
- Interface definitions for all public APIs
- Proper generic types where applicable
- Error type definitions extending base Error
- Type guards and validation functions
- Export from appropriate index files

**Validation:**
- Include runtime validation functions
- Type predicate functions (is[TypeName])
- Error handling for invalid types
- Integration with existing validation patterns

Please ensure types are compatible with both web and React Native environments.
```

### 5. Testing Implementation

```
Create comprehensive tests for [component/service/hook]:

**Test Requirements:**
- Unit tests for business logic (vitest)
- Hook tests using @testing-library/react
- Mock external dependencies appropriately
- Test error conditions and edge cases
- Achieve >80% code coverage

**Mock Strategy:**
- Mock external services via interfaces
- Mock platform-specific utilities
- Mock network clients with realistic responses
- Use deterministic data for consistent tests

Please follow existing test patterns and ensure tests are reliable and fast.
```

## 🔧 Maintenance & Debugging Prompts

### Code Review
```
Review the following code changes for @johnqh/lib:
[code changes]

Please check for:
1. Adherence to architectural patterns
2. TypeScript type safety
3. Platform compatibility (web + React Native)
4. Error handling completeness
5. Test coverage requirements
6. Performance implications
7. Breaking change considerations

Provide specific suggestions for improvement.
```

### Bug Investigation
```
Help debug this issue in @johnqh/lib:
[issue description]

Please:
1. Analyze the error and potential root causes
2. Check related code patterns in the codebase
3. Identify the appropriate layer for the fix (business/platform/network)
4. Suggest the minimal change needed
5. Recommend additional tests to prevent regression

Focus on maintaining platform abstraction and type safety.
```

### Dependency Updates
```
Analyze the impact of updating [dependency] in @johnqh/lib:

1. Check all usage locations in the codebase
2. Identify potential breaking changes
3. Review compatibility with React Native
4. Assess impact on bundle size
5. Recommend migration strategy if needed

Please provide a detailed analysis before proceeding with updates.
```

## 📊 Analysis & Optimization Prompts

### Performance Analysis
```
Analyze the performance characteristics of @johnqh/lib:

1. Bundle size analysis - identify large dependencies
2. Hook re-render patterns - check dependency arrays
3. Memory usage patterns - identify potential leaks
4. Network efficiency - batch operations where possible
5. Lazy loading opportunities

Provide specific recommendations with code examples.
```

### Architecture Review
```
Review the current architecture of @johnqh/lib and suggest improvements:

1. Dependency structure and coupling
2. Interface design and abstraction layers
3. Error handling consistency
4. Testing strategy effectiveness
5. Platform abstraction completeness

Focus on maintainability and extensibility for AI-assisted development.
```

### Security Audit
```
Perform a security review of @johnqh/lib:

1. Input validation and sanitization
2. Error message information leakage
3. Dependency vulnerabilities
4. Authentication and authorization patterns
5. Data exposure risks

Provide actionable security improvements.
```

## 🎯 Specialized Prompts

### React Native Compatibility
```
Ensure React Native compatibility for [component/feature]:

1. Check for web-specific APIs or imports
2. Verify platform detection logic
3. Test on React Native environment
4. Update platform-specific implementations
5. Add React Native-specific tests if needed

Focus on maintaining full feature parity across platforms.
```

### AI Training Data Generation
```
Generate comprehensive training data for [feature]:

1. Create diverse usage examples
2. Include error handling scenarios  
3. Show integration patterns
4. Provide configuration examples
5. Document expected behaviors

Format as clear, commented code examples suitable for AI training.
```

## 🚨 Emergency Response Prompts

### Critical Bug Fix
```
URGENT: Fix critical issue in @johnqh/lib:
[issue description]

Priority requirements:
1. Minimal, targeted fix
2. Maintain backward compatibility
3. No breaking changes
4. Quick test verification
5. Clear rollback plan

Please provide the safest possible fix with explanation.
```

### Hotfix Deployment
```
Prepare hotfix for @johnqh/lib v[version]:

1. Isolate the specific issue
2. Create minimal patch
3. Update version appropriately (patch bump)
4. Verify no regression in existing functionality
5. Update changelog with fix description

Focus on stability and minimal risk.
```

## 💡 Best Practices for Prompting

### Context Provision
- Always mention the specific directory/file being worked on
- Reference existing patterns when requesting new code
- Include relevant type definitions and interfaces
- Specify platform requirements (web/React Native)

### Specificity
- Be explicit about patterns to follow
- Mention error handling requirements
- Specify test coverage expectations
- Include performance considerations

### Validation Requests
- Ask for pattern verification before implementation
- Request explanation of design decisions
- Validate against existing architecture
- Confirm compatibility requirements

### Incremental Development
- Break large features into smaller tasks
- Request interface definitions first
- Implement core logic before platform specifics
- Add tests after each component

---

These prompts are designed to work efficiently with AI assistants while maintaining the high quality standards of @johnqh/lib.