# @sudobility/mail_box_lib

Platform-agnostic shared utilities library for the 0xMail blockchain email ecosystem. Provides multi-chain wallet management (EVM and Solana), on-chain mailer contract hooks, name service resolution (ENS/SNS), Zustand-based state management, and TanStack Query integration. Designed as a foundational dependency consumed by both web and React Native applications.

## Installation

```bash
bun add @sudobility/mail_box_lib
```

Peer dependencies: `react` (>=18), `@tanstack/react-query` (>=5), `zustand` (>=5), `viem` (>=2), `@sudobility/types`, `@sudobility/contracts`, `@sudobility/di`, `@sudobility/configs`, `@sudobility/mail_box_types`, `@sudobility/wildduck_client`, `@sudobility/indexer_client`.

## Usage

```typescript
import {
  // Wallet management
  useWalletStatus, useWalletAccounts, useSelectedAccount,

  // Mail operations
  useMailApp, useAccountMailboxes, useMessages, useMessage,

  // Blockchain contracts
  useMailerClient, useMailerClaims, useMailerDelegations,

  // Name service
  useENSFromWallet, useSNSFromWallet, useNameServiceResolution,

  // Points and referrals
  usePoints, useWalletPoints, useReferralCode,

  // State management
  useMailboxStore, useUnifiedMessagesStore,

  // Providers
  QueryClientProvider, NetworkProvider,

  // Utilities
  createGlobalState, formatWalletAddress, createAuthMessage,
  type Optional, type Message,
} from '@sudobility/mail_box_lib';
```

### Core Hooks

```typescript
// Central mail app orchestration
const { accounts, selectedAccount, isLoading } = useMailApp(config);

// Wallet status (provider-free global state)
const { walletAddress, isConnected } = useWalletStatus();

// Contract operations
const { sendMessage, delegateTo, claimRevenue } = useMailerClient(config);

// Name resolution
const { name } = useENSFromWallet(walletAddress);
```

## API

### Hooks -- Core
`useWalletStatus`, `useWalletAccounts`, `useSelectedAccount`, `useSelectedChain`, `useMailApp`, `useAccountMailboxes`, `useMessages`, `useMessage`, `usePoints`, `useReferralCode`, `useKYC`, `useDebounce`

### Hooks -- Contracts
`useMailerClient`, `useMailerClaims`, `useMailerContractApproval`, `useMailerDelegations`, `useMailerPermissions`, `useMailerTemplates`, `useMailerWebhooks`, `useWalletDetector`, `useContractConfig`

### Hooks -- Name Service
`useENSFromWallet`, `useWalletFromENS`, `useSNSFromWallet`, `useWalletFromSNS`, `useNameServiceResolution`

### Stores (Zustand)
`useMailboxStore`, `useUnifiedMessagesStore`, `useMailTemplatesStore`, `useMailWebhooksStore`

### Utilities
`createGlobalState`, `createAuthMessage`, `createSIWEMessage`, `formatWalletAddress`, `detectAddressType`, `resolveNameOrAddress`, `convertFileToBase64Attachment`, `ReferralConsumptionHelper`

## Development

```bash
bun install
bun run check-all          # lint + typecheck + test:run
bun run build              # TypeScript compilation
bun test                   # Vitest (watch mode)
bun run test:coverage      # Coverage report
bun run typecheck          # tsc --noEmit
bun run lint               # ESLint
bun run format             # Prettier
```

## Related Packages

- `@sudobility/contracts` -- OnchainMailerClient, wallet types
- `@sudobility/wildduck_client` -- WildDuck email API client
- `@sudobility/indexer_client` -- indexer API client
- `@sudobility/di` -- dependency injection interfaces
- `@sudobility/configs` -- chain configuration (ChainInfo, RpcHelpers)
- `@sudobility/types` -- shared types (Optional, ChainType)
- `@sudobility/mail_box_types` -- WildDuck + indexer type definitions

## License

BUSL-1.1
