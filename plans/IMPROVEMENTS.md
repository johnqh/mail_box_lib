# Improvement Plans for @sudobility/mail_box_lib

## Priority 1 - High Impact

### 1. Improve Test Coverage for Contract Hooks
- The library contains 9 contract hooks (`useMailerClient`, `useMailerClaims`, `useMailerContractApproval`, `useMailerDelegations`, `useMailerPermissions`, `useMailerTemplates`, `useMailerWebhooks`, `useContractConfig`, `useWalletDetector`) in `src/business/hooks/contracts/`. The CLAUDE.md references coverage thresholds of 70% global and 80% for `src/business/core/`, but contract hooks involve complex async wallet interactions that are particularly prone to edge-case bugs. Each contract hook should have test coverage for success paths, error paths, loading states, and wallet disconnection scenarios.

### 2. Add JSDoc to All Exported Hooks
- The library exports approximately 30+ hooks from `src/index.ts`, but the hook files themselves vary in documentation quality. Every exported hook should have a JSDoc comment describing its purpose, parameters, return type, and any side effects. The `useMailApp` orchestration hook is especially critical to document since it coordinates account selection and WildDuck authentication.

### 3. Strengthen Error Handling in MailerContract Class
- The `MailerContract` class in `utils/contracts/mailerService.ts` wraps viem-based EVM interactions. Smart contract calls can fail due to reverts, gas estimation failures, insufficient USDC approval, or network timeouts. The error handling should map these failure modes to descriptive error types rather than passing through raw viem errors, which are difficult for UI layers to interpret.

## Priority 2 - Medium Impact

### 4. Add Zustand Store Unit Tests
- The four Zustand stores (`useMailboxStore`, `useUnifiedMessagesStore`, `useMailTemplatesStore`, `useMailWebhooksStore`) implement caching with `cachedAt` timestamps and cross-population logic (in `unifiedMessagesStore`). These stores need dedicated unit tests verifying cache invalidation timing, cross-population correctness, and `clearAll` behavior.

### 5. Consolidate Error Handling Patterns
- Error handling is split between `AppError` in `utils/errorHandling.ts` and `ApiError`/`AuthenticationError`/`ValidationError` in `types/api.ts`. Hooks use inconsistent error extraction patterns. Unifying under a single error hierarchy with `AppError` as the base would improve consistency across the library and make error tracking easier for consuming applications.

## Priority 3 - Nice to Have

### 6. Add Performance Benchmarks for Name Resolution
- The `NameResolutionService` handles ENS and SNS resolution with viem calls and Bonfida dynamic imports. These are network-dependent operations with highly variable latency. Adding instrumentation or logging around resolution times would help identify slow name service queries that degrade user experience.

### 7. Consolidate Async Hook Patterns
- The library has both `useAsync` and `useAsyncOperation` hooks that appear to serve overlapping purposes. Consolidating into a single, well-documented async operation wrapper would reduce confusion and maintenance burden.

### 8. Audit Platform-Agnostic Navigation Implementation
- The navigation abstraction (`navigation.ts`, `navigation.web.ts`, `navigation.reactnative.ts`) provides platform-specific implementations detected at module load time. However, the React Native stub references `@react-navigation/native` which may not be installed in web-only contexts. Verify that tree-shaking properly eliminates unused platform code and that the detection logic is robust.
