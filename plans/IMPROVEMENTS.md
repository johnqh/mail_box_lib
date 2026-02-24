# Improvement Plans for @sudobility/mail_box_lib

## Priority 1 - High Impact

### 1. Improve Test Coverage for Contract Hooks
- The library contains 9 contract hooks (`useMailerClient`, `useMailerClaims`, `useMailerContractApproval`, `useMailerDelegations`, `useMailerPermissions`, `useMailerTemplates`, `useMailerWebhooks`, `useContractConfig`, `useWalletDetector`) in `src/business/hooks/contracts/`. The CLAUDE.md references coverage thresholds of 70% global and 80% for `src/business/core/`, but contract hooks involve complex async wallet interactions that are particularly prone to edge-case bugs. Each contract hook should have test coverage for success paths, error paths, loading states, and wallet disconnection scenarios.
- **Status:** Partially complete. Tests exist for `useMailerClaims`, `useMailerDelegations`, `useMailerPermissions`, and `useMailerWebhooks`. Remaining hooks (`useMailerClient`, `useMailerContractApproval`, `useContractConfig`, `useWalletDetector`) require complex mock infrastructure for wallet providers and are deferred.

### 2. Add JSDoc to All Exported Hooks ✅
- The library exports approximately 30+ hooks from `src/index.ts`, but the hook files themselves vary in documentation quality. Every exported hook should have a JSDoc comment describing its purpose, parameters, return type, and any side effects. The `useMailApp` orchestration hook is especially critical to document since it coordinates account selection and WildDuck authentication.
- **Status:** Complete. Added comprehensive JSDoc with `@fileoverview`, `@param`, `@returns`, and `@example` blocks to all exported hooks:
  - Core hooks: `useMailApp`, `useWalletStatus`, `useSelectedAccount`, `useWalletAccounts`, `useAccountMailboxes`, `useMessages`, `useMessage`, `usePoints`, `useWalletPoints`, `useReferralCode`, `useReferralShare`, `useSelectedChain`, `useKYC`
  - Contract hooks: `useMailerClient`, `useMailerClaims`, `useMailerContractApproval`, `useMailerDelegations`, `useMailerPermissions`, `useMailerTemplates`, `useMailerWebhooks`, `useContractConfig`, `useWalletDetector`
  - Utility hooks: `useDebounce`, `useDebouncedCallback`, `useAsync`, `useAsyncOperation`, `useApiOperation`, `useAuthenticatedOperation`, `useOptimizedState`
  - Name service hooks: `useENSFromWallet`, `useWalletFromENS`, `useSNSFromWallet`, `useWalletFromSNS`, `useNameServiceResolution`

### 3. Strengthen Error Handling in MailerContract Class ✅
- The `MailerContract` class in `utils/contracts/mailerService.ts` wraps viem-based EVM interactions. Smart contract calls can fail due to reverts, gas estimation failures, insufficient USDC approval, or network timeouts. The error handling should map these failure modes to descriptive error types rather than passing through raw viem errors, which are difficult for UI layers to interpret.
- **Status:** Complete. Implemented:
  - `MailerContractError` class extending `AppError` with contract-specific error codes
  - `MailerContractErrorCode` constant object with codes: `WALLET_NOT_INITIALIZED`, `INSUFFICIENT_BALANCE`, `APPROVAL_FAILED`, `CONTRACT_REVERT`, `GAS_ESTIMATION_FAILED`, `TRANSACTION_REVERTED`, `NETWORK_ERROR`, `USER_REJECTED`, `CONTRACT_ERROR`
  - `classifyContractError()` function that maps raw viem/wallet errors to structured `MailerContractError` instances by analyzing error message patterns
  - `MailResult` type extended with `errorCode` field for programmatic error handling
  - All `MailerContract` methods updated to use structured error classification instead of raw `error.message` pass-through

## Priority 2 - Medium Impact

### 4. Add Zustand Store Unit Tests ✅
- The four Zustand stores (`useMailboxStore`, `useUnifiedMessagesStore`, `useMailTemplatesStore`, `useMailWebhooksStore`) implement caching with `cachedAt` timestamps and cross-population logic (in `unifiedMessagesStore`). These stores need dedicated unit tests verifying cache invalidation timing, cross-population correctness, and `clearAll` behavior.
- **Status:** Complete. Created test files:
  - `src/business/stores/__tests__/mailboxStore.test.ts` (14 tests) - covers set, get, clear, clearAll, timestamp validation, edge cases
  - `src/business/stores/__tests__/mailTemplatesStore.test.ts` (17 tests) - covers set, get, getCacheEntry, clear, clearAll, lowercase normalization, edge cases
  - `src/business/stores/__tests__/unifiedMessagesStore.test.ts` (18 tests) - covers list operations, individual message operations, cross-population from list to individual cache, cross-population from individual to list cache, append, clearAll
  - `src/business/stores/__tests__/mailWebhooksStore.test.ts` (already existed, 17 tests)
  - Total: 66 store tests across 4 files

### 5. Consolidate Error Handling Patterns ✅
- Error handling is split between `AppError` in `utils/errorHandling.ts` and `ApiError`/`AuthenticationError`/`ValidationError` in `types/api.ts`. Hooks use inconsistent error extraction patterns. Unifying under a single error hierarchy with `AppError` as the base would improve consistency across the library and make error tracking easier for consuming applications.
- **Status:** Complete. Unified error hierarchy:
  - `AppError` (base) in `utils/errorHandling.ts` - unchanged, provides `code`, `statusCode`, `details`
  - `ApiError extends AppError` in `types/api.ts` - now extends AppError instead of Error, adds `response` field
  - `AuthenticationError extends ApiError` - sets code to `AUTHENTICATION_ERROR`, statusCode 401
  - `ValidationError extends ApiError` - sets code to `VALIDATION_ERROR`, statusCode 400, adds `field`
  - `MailerContractError extends AppError` in `utils/contracts/mailerService.ts` - new, for contract-specific errors
  - All error classes can now be checked with `isAppError()` from `errorHandling.ts`

## Priority 3 - Nice to Have

### 6. Add Performance Benchmarks for Name Resolution
- The `NameResolutionService` handles ENS and SNS resolution with viem calls and Bonfida dynamic imports. These are network-dependent operations with highly variable latency. Adding instrumentation or logging around resolution times would help identify slow name service queries that degrade user experience.
- **Status:** Deferred. Requires runtime instrumentation infrastructure and metrics collection service integration.

### 7. Consolidate Async Hook Patterns ✅
- The library has both `useAsync` and `useAsyncOperation` hooks that appear to serve overlapping purposes. Consolidating into a single, well-documented async operation wrapper would reduce confusion and maintenance burden.
- **Status:** Complete (documentation approach). Rather than merging the hooks (which would break consumers), added comprehensive JSDoc documentation to both hooks that clearly explains their distinct use cases:
  - `useAsync` - Takes the async function at hook creation time, suitable for data fetching on mount/dependency change. Lifecycle-safe with `isMountedRef`.
  - `useAsyncOperation` - Takes the operation at execution time via `execute()`, suitable for event-driven flows (button clicks, form submits). Supports fallback operations.
  - `useApiOperation` - API-specific specialization with mock service fallback
  - `useAuthenticatedOperation` - Authentication-gated wrapper around `useAsyncOperation`
  - All hooks now have `@fileoverview`, `@param`, `@returns`, `@example` documentation clearly distinguishing when to use each one.

### 8. Audit Platform-Agnostic Navigation Implementation
- The navigation abstraction (`navigation.ts`, `navigation.web.ts`, `navigation.reactnative.ts`) provides platform-specific implementations detected at module load time. However, the React Native stub references `@react-navigation/native` which may not be installed in web-only contexts. Verify that tree-shaking properly eliminates unused platform code and that the detection logic is robust.
- **Status:** Deferred. Requires testing across multiple bundler configurations and platform environments to verify tree-shaking behavior.
