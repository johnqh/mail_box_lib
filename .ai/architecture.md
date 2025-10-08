# System Architecture - @johnqh/lib

This document provides a comprehensive technical overview of the @johnqh/lib architecture for AI-assisted development.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    @johnqh/lib v3.1.4                      │
│                Platform-Agnostic Library                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │              Consumer Projects               │
        │  • mail_box (Web)  • React Native App      │
        │  • Other 0xmail.box projects               │
        └─────────────────────────────────────────────┘
```

## 📦 Package Dependencies

```
@johnqh/lib
├── @johnqh/di (v1.1.0)                    # DI interfaces and types
├── @johnqh/mail_box_contracts (v1.5.3)    # Smart contract clients
├── firebase (v12.2.1)                     # Backend services
├── @tanstack/react-query (v5.87.4)        # Data fetching
├── viem (v2.37.5)                         # Ethereum client
└── @solana/web3.js (v1.98.4)             # Solana client

Separated Packages (now independent):
├── @johnqh/wildduck_client                # Email server integration
└── @johnqh/indexer_client                 # Blockchain indexer integration
```

## 🎯 Core Design Principles

### 1. Platform Abstraction
- **Business logic** is completely platform-agnostic
- **Platform-specific implementations** in `src/utils/`
- **Interface-first design** ensures testability

### 2. Layered Architecture

```
┌─────────────────┐ ← Consumer Applications
│   React Hooks   │ ← src/business/hooks/
├─────────────────┤
│ Business Logic  │ ← src/business/core/
├─────────────────┤
│   Interfaces    │ ← src/types/
├─────────────────┤
│ Platform Utils  │ ← src/utils/
├─────────────────┤
│ Network Clients │ ← src/network/
└─────────────────┘
```

### 3. Dependency Injection
- All external dependencies injected through interfaces
- Mock-friendly architecture for testing
- Configuration provided by consumers

## 🔗 Module Dependencies

### Internal Dependencies (Controlled)
```
business/hooks/ → business/core/ → types/ → utils/
     ↓              ↓              ↓       ↓
network/clients/ ←─────────────────────────┘
```

### External Dependencies (Managed)
- `@johnqh/di`: Core DI interfaces and shared types
- `@johnqh/mail_box_contracts`: Smart contract integration
- Platform libraries: Firebase, TanStack Query, Viem, Solana

## 🏛️ Directory Structure Deep Dive

### `/src/business/` - Business Logic Layer
```
business/
├── core/           # Pure business logic (no React)
│   ├── auth/       # Authentication operations
│   ├── analytics/  # Analytics operations
│   ├── navigation/ # Navigation state
│   └── wallet/     # Wallet management
├── hooks/          # React hooks layer
│   ├── core/       # Utility hooks
│   └── contracts/  # Smart contract hooks
└── context/        # React Context providers
```

### `/src/types/` - Type Definitions
```
types/
├── services/       # Service interface definitions
├── business/       # Business domain types
├── common/         # Shared utility types
└── infrastructure/ # Infrastructure types
```

### `/src/utils/` - Platform Implementations
```
utils/
├── auth/           # Authentication utilities
├── blockchain/     # Blockchain utilities
└── contracts/      # Contract utilities
```

### `/src/network/` - API Clients
```
network/
└── clients/        # Core API client implementations
```

## 🔌 API Integration Architecture

### Separated API Clients

API integrations for WildDuck and Indexer have been moved to dedicated packages:

- **@johnqh/wildduck_client**: Email server operations (user management, mailboxes, messages)
- **@johnqh/indexer_client**: Blockchain indexing (address validation, points, rewards)

**Benefits:**
- Cleaner separation of concerns
- Independent versioning
- Smaller bundle sizes
- Focused documentation

**Configuration Pattern:**
```typescript
interface APIConfig {
  apiUrl: string;
  apiToken: string;
  options?: RequestOptions;
}
```

## 🧩 Hook Patterns

### Core Hook Pattern
```typescript
const useFeature = (config: FeatureConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const executeAction = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await performOperation(param);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return { executeAction, isLoading, error, clearError: () => setError(null) };
};
```

**Note:** WildDuck and Indexer hooks are now in separate packages:
- `@johnqh/wildduck_client` - Email server hooks
- `@johnqh/indexer_client` - Blockchain indexer hooks

## 🔄 Data Flow Architecture

### Typical Request Flow
```
React Component
    ↓ (calls hook)
React Hook
    ↓ (uses business operations)
Business Operations
    ↓ (calls service interface)
Platform Service Implementation
    ↓ (makes API call)
Network Client
    ↓ (HTTP/GraphQL)
External API
```

### Error Handling Flow
```
API Error
    ↓
Network Client (throws)
    ↓
Platform Service (catches, maps to business error)
    ↓
Business Operations (validates, enriches context)
    ↓
React Hook (sets error state)
    ↓
React Component (displays user-friendly message)
```

## 📊 Performance Architecture

### Bundle Optimization
- Tree-shakeable exports structure
- Lazy loading for non-critical features
- Minimal external dependencies
- Platform-specific code splitting

### Runtime Performance
- Memoization patterns in hooks
- Efficient state management
- Optimal re-render patterns
- Background processing for heavy operations

## 🧪 Testing Architecture

### Test Pyramid
```
┌─────────────────┐ ← E2E Tests (Consumer responsibility)
├─────────────────┤
│ Integration     │ ← Hook + Business Logic + Mocked Services
├─────────────────┤
│ Unit Tests      │ ← Business Logic, Network Clients, Utils
└─────────────────┘
```

### Mocking Strategy
- **Services**: Mock external service interfaces
- **Network**: Mock HTTP responses
- **Platform**: Mock platform-specific utilities
- **Time/Random**: Deterministic test environment

## 🔐 Security Architecture

### Data Protection
- No sensitive data stored in library
- Configuration injected by consumers
- Secure authentication patterns
- Input validation throughout

### API Security
- Signature-based authentication
- Request signing for sensitive operations
- HTTPS enforcement
- Rate limiting awareness

## 📈 Monitoring & Observability

### Health Metrics
- Type coverage percentage
- Test coverage percentage
- Bundle size tracking
- Performance benchmarks

### Error Tracking
- Structured error types
- Error context preservation
- Graceful degradation patterns
- Fallback mechanisms

## 🔄 Version Management

### Semantic Versioning
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Breaking Change Strategy
- Deprecation warnings in minor versions
- Migration guides for major versions
- Backward compatibility shims when possible
- Clear communication in changelog

---

This architecture enables efficient AI-assisted development through clear patterns, comprehensive types, and well-defined interfaces.