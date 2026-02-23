# mail_box_lib - Improvement Plans

## Priority 1: Critical / High Impact

### 1.1 Remove `require('bs58')` in blockchainAuth.ts
- **File**: `src/utils/auth/blockchainAuth.ts` line 157
- **Issue**: `require('bs58')` breaks ESM compatibility and tree-shaking. This is the only CommonJS require in the library.
- **Fix**: Replace with a dynamic `import('bs58')` or accept a base58 encoder via DI/parameter injection.
- **Impact**: Build correctness, ESM compliance, React Native compatibility.

### 1.2 Add `@fileoverview` JSDoc to remaining source files
- **Issue**: Many hook files, store files, and utility files lack `@fileoverview` documentation. This makes it harder for AI tools and IDEs to understand file purpose at a glance.
- **Files needing attention**: Most files in `src/business/hooks/`, all store files, `src/utils/blockchain/`, `src/utils/email/`, `src/utils/navigation/`.
- **Impact**: Developer experience, AI-assisted development, onboarding.

### 1.3 Increase test coverage for business hooks
- **Issue**: Many hooks in `src/business/hooks/core/` and `src/business/hooks/contracts/` have limited or no test coverage. The coverage thresholds (70% global) suggest gaps exist.
- **Priority files**: `useMailApp.ts`, `useWalletAccounts.ts`, `useSelectedAccount.ts`, `useMailerClient.ts`.
- **Impact**: Regression prevention, refactoring confidence.

## Priority 2: Important / Medium Impact

### 2.1 Consolidate error handling patterns
- **Issue**: Error handling is split between `AppError` in `utils/errorHandling.ts` and `ApiError`/`AuthenticationError`/`ValidationError` in `types/api.ts`. Hooks use inconsistent error extraction patterns.
- **Fix**: Unify under a single error hierarchy. Make `AppError` the base, with `ApiError`, `AuthenticationError`, and `ValidationError` extending it. Export from one location.
- **Impact**: Consistency, debugging, error tracking.

### 2.2 Type-safe store cache keys
- **Issue**: Zustand stores use string-based cache keys (userId, wallet address). There is no compile-time guarantee that callers pass the correct key format.
- **Fix**: Introduce branded types (e.g., `UserId`, `WalletAddress`) for cache keys to prevent accidental key misuse.
- **Impact**: Type safety, bug prevention.

### 2.3 Extract API URL/endpoint configuration
- **Issue**: Backend API URLs are scattered across hooks and services. Some use DI-provided config, others hardcode paths.
- **Fix**: Create a centralized `ApiEndpoints` configuration that can be injected via DI, with all endpoint paths defined in one place.
- **Impact**: Maintainability, environment configuration.

### 2.4 Add `@param` and `@returns` JSDoc to all exported hook functions
- **Issue**: While some hooks have partial documentation, many exported functions lack `@param` and `@returns` tags. This impacts IDE autocomplete and generated docs.
- **Files**: All hooks in `src/business/hooks/core/` and `src/business/hooks/contracts/`.
- **Impact**: Developer experience, API documentation.

## Priority 3: Nice to Have / Low Impact

### 3.1 Remove unused script entries from package.json
- **Issue**: `package.json` contains 50+ script entries, many of which reference scripts that may not exist or are rarely used (e.g., `intelligence:self-healing`, `learning:pattern-recognition`, `automation:predictive`).
- **Fix**: Audit all scripts, remove those with missing script files, and consolidate related scripts.
- **Impact**: Developer clarity, `bun run` discoverability.

### 3.2 Add stale-while-revalidate pattern documentation
- **Issue**: The `STALE_TIMES` constants and TanStack Query configuration are well-implemented but not documented for consumers. New developers may not understand the caching strategy.
- **Fix**: Add a "Caching Strategy" section to CLAUDE.md explaining each `STALE_TIMES` category and when to use which.
- **Impact**: Onboarding, consistency.

### 3.3 Migrate `SimpleURLSearchParams` to a shared package
- **Issue**: `url-params.ts` implements a cross-platform URLSearchParams. This utility is generic enough to live in `@sudobility/types` or a shared utils package.
- **Fix**: Move to a shared package so other projects can reuse it without depending on `mail_box_lib`.
- **Impact**: Code reuse, package boundaries.

### 3.4 Add integration test for the full auth flow
- **Issue**: Auth business logic (`DefaultAuthBusinessLogic`) orchestrates wallet connection, challenge creation, signing, and verification. Unit tests exist for individual pieces, but no integration test validates the full flow.
- **Fix**: Add an integration test that mocks the backend and walks through connect -> challenge -> sign -> verify.
- **Impact**: End-to-end confidence.

### 3.5 Document the MailerContract gas estimation behavior
- **Issue**: `MailerContract` in `mailerService.ts` performs on-chain transactions with viem but does not expose gas estimation to callers. The 90/10 revenue split logic is embedded in code comments only.
- **Fix**: Add JSDoc explaining the revenue model and consider adding a `estimateGas` method or parameter.
- **Impact**: Developer understanding, UX (showing estimated costs).

### 3.6 Consider extracting navigation to its own package
- **Issue**: The navigation abstraction (`navigation.ts`, `navigation.web.ts`, `navigation.reactnative.ts`) with platform auto-detection is a self-contained module. It could benefit other projects in the ecosystem.
- **Fix**: Extract to `@sudobility/navigation` or similar.
- **Impact**: Reusability, smaller bundle for consumers who do not need navigation.
