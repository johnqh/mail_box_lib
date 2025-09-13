# AI-Assisted Development for @johnqh/lib

This directory contains comprehensive resources for AI-assisted development of the @johnqh/lib project.

## 🚀 Quick Start for AI Assistants

**Essential Reading Order:**
1. `/CLAUDE.md` - Primary development guide and context
2. `.ai/architecture.md` - Technical architecture deep dive
3. `.ai/development-patterns.md` - Code patterns and examples
4. `.ai/prompting-guide.md` - Optimized prompts for common tasks

## 📁 Directory Structure

```
.ai/
├── README.md              # This overview
├── architecture.md        # System architecture and relationships
├── development-patterns.md # Code patterns and templates
├── prompting-guide.md     # AI prompting templates
├── development-workflow.md # Complete development processes
├── adr/                   # Architectural Decision Records
├── templates/             # Code generation templates
└── tools/                 # AI development utilities
```

## 🎯 AI Development Principles

### **Context-First Development**
- Maximum context provided for efficient development
- Clear separation of business logic from platform code
- Comprehensive type definitions for IntelliSense

### **Pattern-Driven Architecture**
- Established patterns for hooks, services, and types
- Template-driven code generation
- Consistent naming conventions

### **Test-Integrated Workflow**
- Every component requires comprehensive test coverage
- Mock-friendly architecture for isolated testing
- Performance and security testing built-in

### **Platform-Agnostic Design**
- React Native compatibility throughout
- Interface-first development approach
- No direct platform imports in business logic

## 🛠️ AI Development Tools

### Code Generation
```bash
npm run create:hook      # Generate React hook with tests
npm run create:service   # Generate service with interface
npm run create:type      # Generate TypeScript definitions
```

### Analysis & Health Monitoring
```bash
npm run analyze:health   # Project health score and metrics
npm run analyze:deps     # Dependency analysis and updates
npm run analyze:types    # Type coverage and validation
```

### Validation & Testing
```bash
npm run validate        # Full validation with coverage
npm run quick-check     # Fast validation (no coverage)
npm run test:watch      # Watch mode testing
```

## 📋 AI Task Checklist

**Before starting any task:**
- [ ] Run `npm run validate` to ensure clean starting state
- [ ] Check existing patterns in relevant directories
- [ ] Review interface definitions in `src/types/`

**For new features:**
- [ ] Define TypeScript interfaces first (`src/types/services/`)
- [ ] Implement business logic (`src/business/core/`)
- [ ] Create platform implementations (`src/utils/`)
- [ ] Add React hooks (`src/business/hooks/`)
- [ ] Write comprehensive tests
- [ ] Update exports in index files

**For bug fixes:**
- [ ] Write failing test first
- [ ] Implement fix with minimal impact
- [ ] Verify tests pass
- [ ] Check for similar issues elsewhere

## 🔍 Quick Commands for AI

**Find similar code:**
```bash
# Find hooks with similar functionality
rg "use.*Hook" src/business/hooks/

# Find service patterns
rg "interface.*Service" src/types/services/

# Find business operations
rg "class.*Operations" src/business/core/
```

**Check project health:**
```bash
npm run analyze:health    # Overall health score
npm run check-all        # Build, lint, test validation
```

**Generate new code:**
```bash
npm run create:hook -- --name useMyFeature --type indexer
npm run create:service -- --name MyService --interface
```

## ⚡ Performance Guidelines

- Use React.memo for expensive components
- Implement proper dependency arrays in hooks
- Leverage lazy loading patterns in `src/utils/lazy-loading/`
- Monitor bundle size impact of new dependencies

## 🔐 Security Best Practices

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all external inputs
- Follow authentication patterns in `src/utils/auth/`

## 📈 Key Metrics to Monitor

- **Type Coverage**: Should be >95%
- **Test Coverage**: Should be >80%
- **Bundle Size**: Monitor impact of new dependencies
- **Performance**: Track hook re-render frequency

---

**For detailed information, always refer to `/CLAUDE.md` as the primary source of truth.**