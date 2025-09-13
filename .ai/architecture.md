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
│   ├── email/      # Email management
│   ├── mailbox/    # Mailbox operations
│   └── wallet/     # Wallet management
├── hooks/          # React hooks layer
│   ├── indexer/    # mail_box_indexer API hooks
│   ├── wildduck/   # WildDuck API hooks
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
├── contracts/      # Contract utilities
├── indexer/        # Indexer utilities
└── nameservice/    # ENS/SNS utilities
```

### `/src/network/` - API Clients
```
network/
└── clients/
    ├── indexer.ts  # IndexerClient for mail_box_indexer
    └── wildduck.ts # WildDuckAPI for email services
```

## 🔌 API Integration Architecture

### Indexer API (mail_box_indexer v2.2.0)
```
IndexerClient → HTTP/GraphQL → mail_box_indexer
    │
    ├── Address validation & management
    ├── Email address resolution
    ├── Points & rewards system
    ├── Campaign management
    └── Solana wallet integration
```

**Authentication Pattern:**
- Signature-based authentication via headers
- `x-signature` and `x-message` for GET requests
- Body signature for POST requests

### WildDuck API (Email Backend)
```
WildDuckAPI → HTTPS → 0xmail.box
    │
    ├── User management
    ├── Mailbox operations
    ├── Message handling
    └── Address management
```

**Configuration Pattern:**
```typescript
interface WildDuckConfig {
  backendUrl?: string;
  cloudflareWorkerUrl?: string;
  apiToken: string;
}
```

## 🧩 Hook Patterns

### Indexer Hooks Pattern
```typescript
const useIndexerFeature = (endpointUrl: string, dev: boolean) => {
  const client = new IndexerClient(endpointUrl, dev);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const executeAction = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await client.apiMethod(param);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);
  
  return { executeAction, isLoading, error, clearError: () => setError(null) };
};
```

### WildDuck Hooks Pattern
```typescript
const useWildduckFeature = (config: WildDuckConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation using config
  
  return { /* hook interface */ };
};
```

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