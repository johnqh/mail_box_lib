# mail_box_lib - AI Development Guide

## Overview

`@sudobility/mail_box_lib` is a React Native-compatible shared utilities library for blockchain email projects. It provides platform-agnostic business logic, multi-chain wallet management (Solana and EVM), on-chain mailer contract hooks, name service resolution (ENS/SNS), and Zustand-based state management. The library is designed as a foundational dependency consumed by both web and mobile applications in the 0xMail ecosystem.

- **Package**: `@sudobility/mail_box_lib`
- **Version**: 3.14.97
- **License**: BUSL-1.1
- **Package Manager**: Bun (never npm/yarn/pnpm)
- **Module Format**: ES Module (`"type": "module"`)
- **Build Output**: `dist/` (TypeScript compiled via `tsconfig.build.json`)
- **Node Requirement**: >=18.0.0

## Project Structure

```
src/
├── index.ts                          # Root barrel export (curated, tree-shakeable)
├── business/                         # Core business logic layer
│   ├── index.ts                      # Re-exports hooks, context, core, points, stores, types
│   ├── context/                      # React context providers
│   │   ├── QueryProvider.ts          # TanStack Query global client + QueryClientProvider
│   │   └── NetworkContext.tsx         # NetworkProvider/useNetwork (DI-based connectivity)
│   ├── core/                         # Domain operations (pure logic, no UI)
│   │   ├── analytics/                # Analytics event tracking operations
│   │   │   └── analytics-operations.ts  # DefaultAnalyticsOperations class (Firebase, Amplitude, Mixpanel)
│   │   ├── auth/                     # Auth business logic + email address validation
│   │   │   └── auth-business-logic.ts   # DefaultAuthBusinessLogic, DefaultEmailAddressBusinessLogic, EmailAddressHelper
│   │   ├── navigation/               # Navigation state management
│   │   │   └── navigation-state.ts   # DefaultNavigationOperations, NavigationStateManager
│   │   ├── query/                    # TanStack Query client config, keys, STALE_TIMES
│   │   │   ├── query-client.ts       # createQueryClient(), STALE_TIMES constants
│   │   │   └── query-keys.ts         # queryKeys factory, createQueryKey(), getServiceKeys()
│   │   └── wallet/                   # Wallet status management exports
│   │       └── index.ts              # Re-exports from useWalletStatus hook
│   ├── hooks/                        # React hooks (platform-agnostic)
│   │   ├── contracts/                # Blockchain contract hooks
│   │   │   ├── useMailerClient.ts    # OnchainMailerClient operations (send, delegate, claim)
│   │   │   ├── useMailerClaims.ts    # Revenue claiming from mailer contracts
│   │   │   ├── useMailerContractApproval.ts  # USDC approval for mailer
│   │   │   ├── useMailerDelegations.ts       # Delegation management
│   │   │   ├── useMailerPermissions.ts       # Permission management
│   │   │   ├── useMailerTemplates.ts         # Email template management
│   │   │   ├── useMailerWebhooks.ts          # Webhook management
│   │   │   ├── useContractConfig.ts          # Chain config resolution
│   │   │   └── useWalletDetector.ts          # Multi-chain wallet detection
│   │   ├── core/                     # Core utility hooks
│   │   │   ├── useWalletStatus.ts    # Global wallet state (createGlobalState-based)
│   │   │   ├── useWalletAccounts.ts  # Wallet account list management
│   │   │   ├── useSelectedAccount.ts # Account selection logic
│   │   │   ├── useSelectedChain.ts   # Chain selection management
│   │   │   ├── useMailApp.ts         # Central mail app orchestration hook
│   │   │   ├── useMailAccount.ts     # Mail account management
│   │   │   ├── useAccountMailboxes.ts        # Mailbox fetching per account
│   │   │   ├── useAccountWildduckAuth.ts     # WildDuck auth per account
│   │   │   ├── useMailboxesAndSettings.ts    # Combined mailboxes + settings
│   │   │   ├── useMailAccountSettings.ts     # Account settings management
│   │   │   ├── useMailboxMessages.ts         # Mailbox message list
│   │   │   ├── useMessages.ts                # Message list hook
│   │   │   ├── useMessage.ts                 # Single message detail hook
│   │   │   ├── usePoints.ts                  # Points display hook
│   │   │   ├── useWalletPoints.ts            # Wallet-specific points
│   │   │   ├── useReferralCode.ts            # Referral code management
│   │   │   ├── useReferralShare.ts           # Referral sharing
│   │   │   ├── useAsync.ts                   # Generic async operation wrapper
│   │   │   ├── useAsyncOperation.ts          # Typed async operation helper
│   │   │   ├── useDebounce.ts                # Debounce utility hook
│   │   │   └── useOptimizedState.ts          # Performance-optimized state
│   │   ├── kyc/                      # KYC verification hooks
│   │   │   └── useKYC.ts             # KYC status + initiation via Sumsub
│   │   └── nameservice/              # Name resolution hooks
│   │       └── useNameServiceQueries.ts  # ENS/SNS TanStack Query hooks
│   ├── points/                       # Points/rewards system
│   │   └── points.service.ts         # PointsService class (referrals, claims, leaderboard)
│   ├── stores/                       # Zustand stores
│   │   ├── mailboxStore.ts           # Mailbox cache by userId
│   │   ├── unifiedMessagesStore.ts   # Message list + detail cache (cross-populates on setMessages)
│   │   ├── mailTemplatesStore.ts     # Template cache by wallet address (lowercase-normalized)
│   │   └── mailWebhooksStore.ts      # Webhook cache by wallet address (lowercase-normalized)
│   └── types/                        # Business-layer types
│       └── message.ts                # Unified Message type + transform functions
├── types/                            # TypeScript type definitions
│   ├── index.ts                      # Barrel export for types
│   ├── api.ts                        # API response types, validation, error classes
│   ├── email.ts                      # User, EmailAddress, WalletUserData
│   ├── blockchain/                   # Blockchain-specific types
│   │   └── claimable-rewards.ts      # ClaimableReward, ClaimRewardResult
│   ├── business/                     # UI/business types
│   │   └── ui.ts                     # DocSection
│   ├── common/                       # Common utilities
│   │   └── validated-response.interface.ts  # ApiResponse validator, UserData validator
│   └── services/                     # Service interfaces
│       └── persistence.interface.ts  # PersistenceService, CacheService, DatabaseService, etc.
└── utils/                            # Utility functions and helpers
    ├── index.ts                      # Barrel export for utils
    ├── auth/                         # Authentication utilities
    │   └── blockchainAuth.ts         # SIWE/Solana sign messages, address detection, signature formatting
    ├── blockchain/                   # Blockchain helpers
    │   ├── walletCapabilities.ts     # Wallet availability checks (Phantom, Solflare, MetaMask, etc.)
    │   └── walletDebugger.ts         # Wallet diagnostics logging
    ├── contracts/                    # Smart contract utilities
    │   ├── mailService.ts            # Re-exports from mailerService
    │   └── mailerService.ts          # MailerContract class (viem-based EVM interactions, USDC approval)
    ├── email/                        # Email transformation utilities
    │   └── email-transformations.ts  # Wallet-to-email group transformations
    ├── nameservice/                  # Name resolution
    │   ├── nameResolution.ts         # NameResolutionService (ENS + SNS unified resolver)
    │   ├── ens.ts                    # ENSService (viem-based, subgraph queries, .box support)
    │   ├── sns.ts                    # SNS resolution (Bonfida dynamic import)
    │   └── testENSResolution.ts      # ENS test helper
    ├── navigation/                   # Platform-specific navigation
    │   ├── navigation.ts            # Platform-agnostic navigation hooks (useNavigation, useLocation, useSearchParams)
    │   ├── navigation.web.ts         # WebNavigationService (History API)
    │   └── navigation.reactnative.ts # ReactNativeNavigationService (React Navigation stubs)
    ├── notification/                 # Notification helpers
    │   └── notification.ts           # createNotificationHelper
    ├── useGlobalState.ts             # Provider-free global state (React Native compatible)
    ├── ReferralConsumptionHelper.ts  # Referral code processing (record/consume pattern)
    ├── attachment-utils.ts           # File-to-base64 conversion (chunked for large files)
    ├── document-helpers.ts           # DOM utility wrappers (web/RN compatible)
    ├── errorHandling.ts              # AppError class, retryWithBackoff, withErrorBoundary
    ├── formatters.ts                 # formatWalletAddress, formatFileSize, formatNumber, etc.
    └── url-params.ts                 # SimpleURLSearchParams, createSearchParams (cross-platform)
```

## Key Exports

### React Hooks - Core

| Hook | Purpose |
|------|---------|
| `useWalletStatus` | Global wallet connection/verification state management |
| `useWalletAccounts` | Fetches wallet accounts from the indexer |
| `useSelectedAccount` | Account selection with auto-select logic |
| `useSelectedChain` | Chain selection management |
| `useMailApp` | Central orchestration: account selection + WildDuck auth |
| `useAccountMailboxes` | Fetches mailboxes for selected account |
| `useMailboxesAndSettings` | Combined mailboxes + settings for an account |
| `useMailAccountSettings` | Account settings management |
| `useAccountWildduckAuth` | WildDuck authentication per account |
| `useMessages` / `useMessage` | Message list and detail hooks |
| `usePoints` / `useWalletPoints` | Points system display |
| `useReferralCode` | Referral code management |
| `useKYC` | KYC verification flow (Sumsub integration) |
| `useDebounce` | Debounce utility |
| `useAsync` / `useAsyncOperation` | Generic async operation wrappers |

### React Hooks - Blockchain Contracts

| Hook | Purpose |
|------|---------|
| `useMailerClient` | OnchainMailerClient operations (send, delegate, claim revenue) |
| `useMailerClaims` | Query and claim revenue from mailer contracts |
| `useMailerContractApproval` | USDC token approval management |
| `useMailerDelegations` | Delegation management on-chain |
| `useMailerPermissions` | Permission management on-chain |
| `useMailerTemplates` | On-chain email template management |
| `useMailerWebhooks` | Webhook management on-chain |
| `useWalletDetector` | Multi-chain wallet detection (EVM + Solana) |
| `useContractConfig` | Chain configuration resolution |

### React Hooks - Name Service

| Hook | Purpose |
|------|---------|
| `useENSFromWallet` | Reverse resolve wallet to ENS name |
| `useWalletFromENS` | Forward resolve ENS name to wallet |
| `useSNSFromWallet` | Reverse resolve wallet to SNS name |
| `useWalletFromSNS` | Forward resolve SNS name to wallet |
| `useNameServiceResolution` | Unified name resolution (ENS + SNS) |

### Providers and Context

| Export | Purpose |
|--------|---------|
| `QueryClientProvider` / `useQueryClient` | TanStack Query provider (re-exported) |
| `NetworkProvider` / `useNetwork` | DI-based network connectivity context |
| `STALE_TIMES` | Pre-configured stale times for different query categories |

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `useMailboxStore` | Caches mailboxes by userId |
| `useUnifiedMessagesStore` | Caches message lists (by mailbox) and individual messages |
| `useMailTemplatesStore` | Caches templates by wallet address |
| `useMailWebhooksStore` | Caches webhooks by wallet address |

### Utilities

| Export | Purpose |
|--------|---------|
| `connectWallet` / `disconnectWallet` / `verifyWallet` | Wallet lifecycle operations |
| `createAuthMessage` / `createSIWEMessage` / `createSolanaSignMessage` | Auth message creation |
| `detectAddressType` / `isValidAddress` / `isValidBlockchainUsername` | Address validation |
| `resolveNameOrAddress` / `ENSName` / `SNSName` | Name resolution |
| `formatWalletAddress` / `formatFileSize` / `formatNumber` / `formatPercentage` | Formatters |
| `createGlobalState` / `getGlobalState` / `setGlobalState` | Provider-free global state |
| `createNotificationHelper` | Notification utility factory |
| `createPointsService` / `PointsService` | Points/rewards system |
| `ReferralConsumptionHelper` / `createReferralHelper` | Referral code management |
| `convertFileToBase64Attachment` | Attachment encoding |
| `chainTypeToString` / `flattenEmailGroups` / `transformWalletAccountsToEmailGroups` | Email transforms |

### Type Exports

| Type | Source |
|------|--------|
| `Optional<T>` | `@sudobility/types` (re-used everywhere, not re-exported) |
| `Message` | `business/types/message.ts` - Unified message type |
| `User` / `WalletUserData` / `EmailAddress` | `types/email.ts` |
| `Wallet` / `EVMWallet` / `SolanaWallet` | `@sudobility/contracts` (re-exported) |
| `PersistenceService` / `PersistenceResult` | `types/services/persistence.interface.ts` |
| DI types (`AnalyticsClient`, `AppConfig`, `PlatformStorage`, `NotificationService`, etc.) | `@sudobility/di` (re-exported) |

## Development Commands

```bash
# Primary validation (run before any PR)
bun run check-all         # lint + typecheck + test:run

# Building
bun run build             # TypeScript compilation (tsc -p tsconfig.build.json)
bun run build:watch       # Watch mode compilation
bun run clean             # Remove dist/

# Testing (Vitest + happy-dom)
bun test                  # Run all tests (watch mode by default)
bun run test:run          # Run all tests once
bun run test:coverage     # Run tests with V8 coverage
bun run test:watch        # Explicit watch mode

# Linting & Formatting
bun run lint              # ESLint check
bun run lint:fix          # ESLint auto-fix
bun run format            # Prettier format
bun run format:check      # Prettier check

# Type checking
bun run typecheck         # tsc --noEmit
bun run typecheck:watch   # Watch mode typecheck

# Quick checks
bun run quick-check       # lint + typecheck (no tests)

# Code generation
bun run create:hook       # Generate new hook from template
bun run create:service    # Generate new service from template
bun run create:type       # Generate new type definition
bun run create:test       # Generate new test file

# Analysis
bun run analyze:health    # Health analysis
bun run analyze:deps      # Dependency check (outdated + audit)
bun run analyze:size      # Build size check
bun run quality-check     # Full quality analysis
```

## Architecture and Patterns

### Optional\<T\> Pattern (Mandatory)

All nullable and undefined values must use `Optional<T>` from `@sudobility/types`. This is the single most important type pattern in the codebase.

```typescript
import { Optional } from '@sudobility/types';

// Correct
const [error, setError] = useState<Optional<string>>(null);
function getUser(): Optional<User> { ... }

// Incorrect - never do this
const [error, setError] = useState<string | null>(null);
function getUser(): User | undefined | null { ... }
```

### TanStack Query Integration

Server state is managed via TanStack React Query v5. The library provides:
- A pre-configured `QueryClient` with smart retry logic (no retry on 4xx, exponential backoff) via `createQueryClient()`
- Pre-defined `STALE_TIMES` constants for different data categories (messages: 30s, mailboxes: 5min, etc.)
- `QueryClientProvider` re-exported for consumers to wrap their apps
- Name service hooks use `useQuery` for cached resolution

### Zustand Stores

Client-side caching uses Zustand v5 stores for mailboxes, messages, templates, and webhooks. Stores follow a consistent pattern:
- Cache keyed by userId or walletAddress (templates/webhooks normalize to lowercase)
- `cachedAt` timestamps on all entries
- `set`/`get`/`clear`/`clearAll` operations
- The `unifiedMessagesStore` automatically cross-populates individual message cache from list responses and updates list caches when a detailed message is set

### Global State (Provider-Free)

`createGlobalState` in `utils/useGlobalState.ts` provides module-level shared state without React Context providers. This is critical for React Native compatibility. Used for wallet status and other singleton states.

```typescript
const useGlobalWalletStatus = createGlobalState<Optional<WalletStatus>>('walletStatus', undefined);
```

### Multi-Chain Architecture

The library supports both EVM (Ethereum, etc.) and Solana chains:
- `ChainType` enum from `@sudobility/types` distinguishes chain families
- `OnchainMailerClient` from `@sudobility/contracts` is chain-agnostic (wallet + chainInfo per operation)
- Authentication messages differ per chain (SIWE for EVM, custom format for Solana)
- Signature encoding differs per chain (base64 for EVM, base58 for Solana)
- Name resolution supports ENS (.eth, .box) and SNS (.sol)
- Wallet capabilities detection for multi-chain wallets (Phantom, Backpack, Torus)

### Dependency Injection

Platform-specific services are injected via interfaces from `@sudobility/di`:
- `PlatformNetwork` for `NetworkProvider`
- `StorageService` for persistence
- `AnalyticsClient` for analytics
- `NotificationService` for notifications
- `NavigationService` for platform-agnostic navigation

This ensures business logic remains platform-agnostic.

### Hook Pattern

All hooks follow a consistent structure:

```typescript
export const useFeature = (config: FeatureConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const action = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await performOperation(...args);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return { action, isLoading, error, clearError: () => setError(null) };
};
```

### Unified Message Type

The `Message` type in `business/types/message.ts` merges list-view (`WildduckMessage`) and detail-view (`WildduckMessageDetail`) into a single interface. Transform functions `messageFromListItem()` and `messageFromDetailedResponse()` handle conversion. The `hasDetailedContent` flag distinguishes whether full content is loaded.

### MailerContract (EVM)

The `MailerContract` class in `utils/contracts/mailerService.ts` provides low-level viem-based interaction with the on-chain mailer contract. It handles:
- Priority and regular email sending (with automatic USDC approval)
- Recipient and owner share claiming
- Fee querying and USDC balance checks
- 90/10 revenue split (recipients get 90% from priority emails)

### Navigation Abstraction

The navigation system provides platform-agnostic hooks (`useNavigation`, `useLocation`, `useSearchParams`) that work identically on web (via History API) and React Native (via React Navigation stubs). Platform detection happens automatically in `navigation.ts`.

## Common Tasks

### Adding a New Hook

1. Create the hook file in the appropriate directory:
   - `src/business/hooks/core/` for general hooks
   - `src/business/hooks/contracts/` for blockchain contract hooks
2. Follow the standard hook pattern (loading, error, clearError, useCallback)
3. Use `Optional<T>` for all nullable state
4. Export from the directory's `index.ts`
5. Add to `src/business/hooks/index.ts` if in a new subdirectory
6. Add to `src/index.ts` if it should be a public export
7. Write tests in `__tests__/` directory adjacent to the hook
8. Run `bun run check-all`

### Adding a New Zustand Store

1. Create in `src/business/stores/`
2. Follow the existing pattern: interface for cache entry, interface for state, `create<State>()` call
3. Include `cachedAt: number` in cache entries
4. Provide `set`, `get`, `clear`, `clearAll` methods
5. Export from `src/business/stores/index.ts`

### Adding a Blockchain Operation

1. Contract hooks go in `src/business/hooks/contracts/`
2. Use `OnchainMailerClient` from `@sudobility/contracts` (stateless API)
3. Pass `connectedWallet: Wallet` and `chainInfo: ChainInfo` per operation
4. Use `useMemo(() => new OnchainMailerClient(), [])` for the client instance
5. Low-level viem contract interactions go in `src/utils/contracts/`

### Adding a New Type

1. Define interface in `src/types/` (or `src/types/services/` for service interfaces)
2. Use `Optional<T>` for nullable fields
3. Export from `src/types/index.ts`
4. If it should be a public export, add to `src/index.ts`

## Testing

- **Framework**: Vitest with happy-dom environment
- **Test helpers**: `@testing-library/react` for hook testing (`renderHook`, `act`, `waitFor`)
- **Mocking**: `vi.mock()` for external packages, `vi.fn()` for function stubs
- **Coverage thresholds**: 70% global, 80% for `src/business/core/`, 75% for `src/network/clients/`
- **Test location**: `__tests__/` directories co-located with source files
- **Setup file**: `src/test/setup.ts`

```bash
bun test                          # Watch mode (default)
bun run test:run                  # Run once
bun run test:coverage             # With coverage report
bun test src/business/hooks/contracts/__tests__/useMailerClaims.test.ts  # Specific file
```

## Peer Dependencies

These must be provided by the consuming application:

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | >=18.0.0 | React framework |
| `@tanstack/react-query` | >=5.0.0 | Server state management |
| `zustand` | >=5.0.0 | Client state management |
| `viem` | >=2.0.0 | EVM blockchain interactions |
| `@bonfida/spl-name-service` | >=3.0.0 | Solana name service resolution |
| `@sudobility/types` | ^1.9.53 | Shared types (Optional\<T\>, ChainType, etc.) |
| `@sudobility/contracts` | ^1.17.66 | OnchainMailerClient, wallet types |
| `@sudobility/di` | ^1.5.38 | DI interfaces (storage, network, analytics) |
| `@sudobility/configs` | ^0.0.65 | Configuration (ChainInfo, RpcHelpers) |
| `@sudobility/mail_box_types` | ^1.0.12 | WildDuck + indexer type definitions |
| `@sudobility/wildduck_client` | ^2.3.68 | WildDuck API client |
| `@sudobility/indexer_client` | ^0.0.112 | Indexer API client |

## Key Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | ^5.9.3 - Strict mode enabled |
| `vitest` | ^4.0.4 - Test framework |
| `@testing-library/react` | ^16.3.0 - Hook/component testing |
| `eslint` | ^9.37.0 - Linting |
| `prettier` | ^3.6.2 - Code formatting |
| `happy-dom` | ^20.0.0 - DOM environment for tests |
| `@solana/web3.js` | ^1.98.4 - Solana blockchain SDK |

## TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **Strict mode**: Fully enabled (all strict flags on)
- **Extra checks**: `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- **JSX**: react-jsx
- **Build config** (`tsconfig.build.json`): Relaxes `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` for build compatibility
- **Tests excluded** from compilation (`**/*.test.ts`, `**/*.spec.ts`)

## ESLint Configuration

- Flat config format (`eslint.config.js`)
- TypeScript parser with project-aware rules
- React hooks plugin (`exhaustive-deps: warn`)
- Prettier integration (`prettier/prettier: error`)
- `@typescript-eslint/no-explicit-any: off`
- Unused vars allowed with `_` prefix
- Sort imports enabled (ignoreCase, ignoreDeclarationSort)
- Test files have relaxed rules (no-explicit-any off)
