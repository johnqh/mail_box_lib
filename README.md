# @sudobility/lib

**Version: 3.6.9**

React Native-compatible shared utilities library for blockchain email projects with comprehensive blockchain integration and type-safe patterns.

## Installation

```bash
npm install @sudobility/lib
```

## Features

### 🔐 Authentication & Wallet Integration
- Multi-chain wallet support (Ethereum, Solana)
- WildDuck email server authentication
- Wallet status management with global state
- ENS and SNS name resolution

### 📧 Email Management
- WildDuck API integration
- Mailbox and message management hooks
- Unified message types and transformations
- Email search and filtering

### 🔄 State Management
- TanStack Query integration for server state
- Zustand stores for client state
- Global state utilities for React Native compatibility

### 🌐 Platform Abstraction
- Works seamlessly on web and React Native
- Interface-first architecture
- Platform-specific implementations with automatic detection

### 📊 Business Logic
- Folder operations and navigation
- Analytics event tracking
- Points and rewards system
- Contract interaction utilities

## Quick Start

### Basic Usage

```typescript
import {
  useWalletStatus,
  useAccountMailboxes,
  useMessages,
  Optional
} from '@sudobility/lib';

// Wallet management
const { walletAddress, isConnected, connectWallet } = useWalletStatus();

// Email operations
const { mailboxes, isLoading } = useAccountMailboxes(
  'https://api.example.com',
  'api-token',
  'domain.com',
  storage,
  false
);

// Message management
const { messages, loadMore } = useMessages({
  endpointUrl: 'https://api.example.com',
  emailDomain: 'domain.com',
  storage,
  networkClient,
  searchText: '',
  searchScope: 'all',
});
```

### Type Safety with Optional<T>

```typescript
import { Optional } from '@sudobility/lib';

// Always use Optional<T> for nullable values
const user: Optional<User> = getUser();
const error: Optional<string> = null;

function getValue(): Optional<string> {
  return data?.value ?? null;
}
```

### Blockchain Integration

```typescript
import {
  OnchainMailerClient,
  WalletDetector,
  useContractConfig,
  useMailerClaims
} from '@sudobility/lib';

// Contract interaction
const { config } = useContractConfig(chainId);
const mailer = new OnchainMailerClient(config);

// Reward claiming
const { rewards, claim } = useMailerClaims({
  indexerUrl: 'https://indexer.example.com',
  contracts: contractConfig,
});
```

## Environment Variables

The library supports platform-specific environment management:

### Web (Vite)
- `VITE_INDEXER_API_URL`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_PRIVY_APP_ID`
- `VITE_FIREBASE_*` (Firebase configuration)

### React Native
Use `react-native-config` or environment-specific configuration.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive AI assistant guide
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Full development guide
- **[docs/AI_DEVELOPMENT.md](./docs/AI_DEVELOPMENT.md)** - AI-assisted development patterns
- **[docs/API.md](./docs/API.md)** - API documentation
- **[docs/TYPES.md](./docs/TYPES.md)** - Type system documentation
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security policy

## Development

```bash
# Install dependencies
npm install

# Run all checks (lint, typecheck, tests)
npm run check-all

# Development
npm run typecheck          # TypeScript validation
npm test                   # Run all 116 tests
npm run lint:fix           # Auto-fix linting
npm run build              # Build to dist/

# Watch modes
npm run build:watch        # Watch TypeScript compilation
npm run test:watch         # Watch tests
npm run typecheck:watch    # Watch type checking
```

## Architecture

```
src/
├── business/           # Platform-agnostic business logic
│   ├── core/          # Domain operations
│   ├── hooks/         # React hooks with TanStack Query
│   ├── stores/        # Zustand state management
│   └── types/         # Business type definitions
├── di/                # Dependency injection
├── types/             # TypeScript type definitions
└── utils/             # Platform-specific utilities
```

## Dependencies

### Peer Dependencies
- `@sudobility/contracts` - Smart contract interfaces
- `@sudobility/di` - Dependency injection framework
- `@sudobility/types` - Shared TypeScript types
- `@sudobility/indexer_client` - Indexer API client
- `@sudobility/wildduck_client` - WildDuck email API client
- `@tanstack/react-query` - Server state management
- `react` - React framework

### Direct Dependencies
- `zustand` - Client state management

## Recent Changes (v3.6.9)

### Dependency Updates
- Updated @sudobility packages to latest versions
- Fixed type imports after package refactoring
- Migrated to new type import locations

### Breaking Changes
None - all changes are backward compatible type migrations.

## Contributing

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for contribution guidelines.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Report an issue](https://github.com/johnqh/mail_box_lib/issues)
- Documentation: See docs/ directory
- AI Assistance: See CLAUDE.md for AI assistant context
