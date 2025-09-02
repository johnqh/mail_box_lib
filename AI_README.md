# AI-Optimized Development Environment

This project has been optimized for AI-assisted development with comprehensive tooling, documentation, and automation.

## 🤖 AI Development Features

### Enhanced Documentation
- **Comprehensive Context**: `.claude_context` file with current project state
- **AI Development Guide**: `docs/AI_DEVELOPMENT.md` with patterns and best practices
- **Template Library**: `templates/` directory with complete code examples
- **Inline Documentation**: JSDoc comments explaining AI-relevant context

### Development Tools
- **VS Code Configuration**: Optimized settings for TypeScript and AI development
- **Automated Scripts**: Service generator and development helpers
- **Extended NPM Scripts**: Quick access to common development tasks
- **Debugging Support**: Pre-configured launch configurations

### Code Organization
- **Interface-First Design**: Clear separation between contracts and implementations
- **Platform Abstraction**: Consistent patterns for web/React Native compatibility
- **Template-Driven Development**: Generate new services following established patterns
- **Comprehensive Testing**: Test templates and patterns for all code types

## 🚀 Quick Start for AI Assistants

### Understanding the Project Structure
```
src/
├── business/           # Core business logic (pure, testable)
│   ├── core/          # Domain operations and business rules
│   └── hooks/         # React integration layer
├── types/             # TypeScript interfaces and types
│   └── services/      # Service interface definitions
├── utils/             # Platform-specific implementations
│   ├── *.web.ts       # Web-specific code
│   └── *.reactnative.ts # React Native-specific code
└── network/           # API clients and networking
```

### Creating New Features

#### 1. Using the Service Generator
```bash
npm run create:service my-feature
```

This creates a complete service implementation following project patterns:
- Interface definition
- Business operations
- Platform implementations (web + React Native)
- React hooks
- Test templates
- Export management

#### 2. Manual Development Pattern
```bash
# 1. Define the interface
touch src/types/services/my-service.interface.ts

# 2. Implement business logic
mkdir src/business/core/my-service/
touch src/business/core/my-service/my-service-operations.ts

# 3. Create platform implementations
mkdir src/utils/my-service/
touch src/utils/my-service/my-service.web.ts
touch src/utils/my-service/my-service.reactnative.ts

# 4. Add React hooks
mkdir src/business/hooks/my-service/
touch src/business/hooks/my-service/useMyService.ts

# 5. Write tests
touch src/business/core/my-service/__tests__/my-service-operations.test.ts
```

### API Integration Patterns

#### Current Indexer API (v2.1.0)
All protected endpoints require signature verification:
```typescript
await indexerClient.getEmailAddresses(walletAddress, signature, message);
await indexerClient.getPointsBalance(walletAddress, signature, message);
```

#### Points System API
- `POST /api/points` - Get user points (protected)
- `GET /api/points/leaderboard/:count` - Public leaderboard
- `GET /api/points/site-stats` - Site-wide statistics

#### Recent API Changes
- **No Admin Endpoints**: All `/admin/*` routes have been removed
- **Signature Protection**: POST endpoints require wallet signature verification
- **Unified Points API**: New `/api/points/*` structure

### Development Workflow

#### Daily Development Commands
```bash
npm run dev          # Start development with watch mode
npm run check-all    # Run all quality checks
npm run analyze      # Full analysis with coverage
```

#### Code Quality Pipeline
```bash
npm run lint         # ESLint checking
npm run typecheck    # TypeScript validation
npm run test:run     # Run all tests
npm run format       # Code formatting
```

#### VS Code Integration
- **Auto-save**: Enabled for seamless AI collaboration
- **Format on Save**: Consistent code formatting
- **File Nesting**: Related files grouped together
- **Task Integration**: Run npm scripts from VS Code
- **Debug Configuration**: Test and build debugging

## 🏗️ Architecture Principles

### Interface-First Development
Every service starts with a TypeScript interface that defines the contract:
```typescript
export interface MyService {
  initialize(config: MyServiceConfig): Promise<void>;
  performOperation(data: MyData): Promise<MyResult>;
}
```

### Platform Abstraction
Business logic remains pure while platform-specific code is isolated:
```typescript
// Business logic (platform-agnostic)
export class MyOperations {
  constructor(private service: MyService) {}
  
  async businessMethod(input: BusinessInput): Promise<BusinessOutput> {
    // Pure business logic here
  }
}

// Platform implementations
export class WebMyService implements MyService { /* web-specific */ }
export class ReactNativeMyService implements MyService { /* RN-specific */ }
```

### Clean Architecture
- **Domain Layer**: Business operations and rules
- **Service Layer**: External integrations and APIs
- **Presentation Layer**: React hooks and UI concerns
- **Infrastructure Layer**: Platform-specific implementations

## 🧪 Testing Strategy

### Business Logic Testing
Focus on testing business operations with mocked dependencies:
```typescript
describe('MyOperations', () => {
  let mockService: MockedService;
  let operations: MyOperations;

  beforeEach(() => {
    mockService = createMockService();
    operations = new MyOperations(mockService);
  });

  it('should handle business scenario', async () => {
    // Test business logic
  });
});
```

### Hook Testing
Use React Testing Library for hook integration:
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useMyService', () => {
  it('should manage state correctly', async () => {
    const { result } = renderHook(() => useMyService());
    // Test hook behavior
  });
});
```

## 🔧 AI Development Tips

### When Adding Features
1. **Start with Documentation**: Update `.claude_context` with new context
2. **Interface First**: Define TypeScript interfaces before implementation
3. **Follow Patterns**: Use existing code as templates
4. **Test Early**: Write tests alongside implementation
5. **Quality Gates**: Run `npm run check-all` before completion

### When Debugging
1. **Check Platform Detection**: Verify correct implementation is loaded
2. **Validate API Signatures**: Ensure client matches backend endpoints
3. **Review Types**: Run `npm run typecheck` for type errors
4. **Test Coverage**: Use `npm run test:coverage` to find gaps

### When Refactoring
1. **Maintain Interfaces**: Don't break existing contracts
2. **Update Tests**: Ensure tests reflect new behavior
3. **Check All Platforms**: Verify web and React Native compatibility
4. **Update Documentation**: Keep AI context current

## 📚 Key Resources

### Documentation Files
- `CLAUDE.md` - Project-specific AI instructions
- `docs/AI_DEVELOPMENT.md` - Comprehensive development guide
- `.claude_context` - Current project context and patterns
- `templates/` - Complete code templates for all patterns

### Configuration Files
- `.vscode/settings.json` - Optimized VS Code settings
- `.vscode/tasks.json` - Development task definitions
- `.vscode/launch.json` - Debug configurations
- `eslint.config.js` - Code quality rules
- `tsconfig.json` - TypeScript configuration

### Development Scripts
- `scripts/create-service.js` - Automated service generation
- `package.json` - Extended npm scripts for development

## 🎯 Success Metrics

### Code Quality
- ✅ All TypeScript errors resolved (`npm run typecheck`)
- ✅ ESLint rules passing (`npm run lint`)
- ✅ Test coverage maintained (`npm run test:coverage`)
- ✅ Consistent formatting (`npm run format:check`)

### AI Collaboration
- ✅ Clear documentation for context understanding
- ✅ Template-driven development for consistency
- ✅ Automated quality checks for reliability
- ✅ Platform abstraction for maintainability

## 🚨 Common Pitfalls

### For AI Assistants
1. **Don't mix platform code in business logic**
2. **Always implement complete interfaces**
3. **Update exports in index files**
4. **Follow existing naming conventions**
5. **Write tests for all business logic**

### API Integration Issues
1. **Check backend API changes before updating client**
2. **Ensure signature verification for protected endpoints**
3. **Handle both success and error responses**
4. **Update hooks when client methods change**

This project is designed to maximize AI development productivity while maintaining code quality and architectural consistency.