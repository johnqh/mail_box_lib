# TanStack Query Hooks - Package Migration

## Important Notice

TanStack Query hooks for WildDuck and Indexer APIs have been moved to dedicated packages for better modularity and maintainability.

## Migrated Packages

### WildDuck API Hooks
All WildDuck-related TanStack Query hooks are now available in:
```bash
npm install @johnqh/wildduck_client
```

**Documentation:** See `@johnqh/wildduck_client` package documentation

**Includes:**
- Server health monitoring hooks
- User management hooks
- Email address hooks
- Mailbox operation hooks
- Message handling hooks
- Authentication hooks
- Filters and settings hooks

### Indexer API Hooks
All Indexer-related TanStack Query hooks are now available in:
```bash
npm install @johnqh/indexer_client
```

**Documentation:** See `@johnqh/indexer_client` package documentation

**Includes:**
- Address validation hooks
- Signing message hooks
- Points leaderboard hooks
- Site statistics hooks
- Solana status hooks
- Email address management hooks
- Delegation hooks
- Points balance hooks
- Name service entitlement hooks

## Migration Guide

### Before (Old)
```typescript
import {
  useWildduckHealthQuery,
  useIndexerPointsLeaderboard
} from '@johnqh/lib';
```

### After (New)
```typescript
import { useWildduckHealthQuery } from '@johnqh/wildduck_client';
import { useIndexerPointsLeaderboard } from '@johnqh/indexer_client';
```

## Benefits of Package Separation

1. **Smaller Bundle Size**: Only import the packages you need
2. **Independent Versioning**: Each package can be updated independently
3. **Clearer Dependencies**: Better separation of concerns
4. **Focused Documentation**: Package-specific docs are easier to navigate
5. **Faster Builds**: Reduced dependency tree complexity

## Core Library Focus

The `@johnqh/lib` package now focuses on:
- Platform-agnostic business logic
- Blockchain integration utilities
- Authentication services
- Core UI hooks and utilities
- Shared type definitions

For email server operations, use `@johnqh/wildduck_client`
For blockchain indexing and points, use `@johnqh/indexer_client`
