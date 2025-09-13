# TanStack Query Hooks in @johnqh/lib

This document provides comprehensive documentation for all TanStack Query hooks available in the @johnqh/lib library.

## Overview

All GET requests in @johnqh/lib have been migrated to use TanStack Query for optimal caching, background refetching, error handling, and performance. The library now provides **25+ TanStack Query hooks** across three main categories:

- **WildDuck API Hooks** - Email server operations  
- **Indexer API Hooks** - Blockchain indexing and points system
- **Name Service Hooks** - ENS and SNS resolution

## Benefits

✅ **Automatic Background Refetching** - Data stays fresh automatically  
✅ **Intelligent Caching** - Different strategies based on data volatility  
✅ **Request Deduplication** - Multiple components share the same requests  
✅ **Built-in Loading States** - `isLoading`, `isFetching`, `error` states  
✅ **Offline Support** - Graceful handling of network issues  
✅ **Retry Logic** - Smart exponential backoff for failed requests  
✅ **Type Safety** - Full TypeScript support with proper interfaces  

## Quick Start

```typescript
import { 
  useWildduckHealthQuery,
  useIndexerPointsLeaderboard,
  useENSFromWallet 
} from '@johnqh/lib';

function MyComponent() {
  const { data: health, isLoading } = useWildduckHealthQuery(config);
  const { data: leaderboard } = useIndexerPointsLeaderboard(endpoint, dev, 10);
  const { data: ensName } = useENSFromWallet('0x742d35Cc...');
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Server Status: {health?.status}</p>
      <p>Top User: {leaderboard?.data?.leaderboard?.[0]?.walletAddress}</p>
      <p>ENS: {ensName?.ensName}</p>
    </div>
  );
}
```

---

## 🏥 WildDuck API Hooks

WildDuck hooks provide access to the email server API with optimized caching strategies.

### Server Health

#### `useWildduckHealthQuery(config, options?)`

Monitor WildDuck server health and status.

```typescript
const { data, isLoading, error } = useWildduckHealthQuery(
  wildduckConfig,
  { 
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3 
  }
);

// Response type: WildduckHealthResponse
// {
//   status: string;
//   version: string; 
//   uptime: number;
// }
```

**Stale Time:** 1 minute  
**Use Case:** Server monitoring, status pages

### User Management

#### `useWildduckUsersListQuery(config, filters?, options?)`

Get a paginated list of users with optional filtering.

```typescript
const { data, isLoading } = useWildduckUsersListQuery(
  wildduckConfig,
  { page: 1, limit: 20, query: 'john' }
);

// Response: WildduckUsersListResponse with pagination
```

**Stale Time:** 5 minutes  
**Use Case:** Admin panels, user search

#### `useWildduckUserQuery(config, userId, options?)`

Get detailed information about a specific user.

```typescript
const { data: user } = useWildduckUserQuery(
  wildduckConfig,
  'user123',
  { enabled: !!userId }
);

// Response: WildduckUser with full profile data
```

**Stale Time:** 5 minutes  
**Use Case:** User profiles, account management

### Email Addresses

#### `useWildduckUserAddressesQuery(config, userId, options?)`

Get all email addresses for a user.

```typescript
const { data: addresses, refetch } = useWildduckUserAddressesQuery(
  wildduckConfig,
  userId
);

// Response: WildduckAddress[]
// [{ id, address, name, user, created, main }]
```

**Stale Time:** 2 minutes  
**Use Case:** Address management, email settings

### Mailboxes

#### `useWildduckUserMailboxesQuery(config, userId, options?, queryOptions?)`

Get user's mailbox structure with optional metadata.

```typescript
const { data: mailboxes } = useWildduckUserMailboxesQuery(
  wildduckConfig,
  userId,
  { 
    specialUse: true,    // Include special mailboxes (Inbox, Sent, etc.)
    counters: true,      // Include message counts
    sizes: true          // Include size information
  }
);

// Response: WildduckMailboxesResponse
// { success: boolean, results: WildduckMailbox[] }
```

**Stale Time:** 5 minutes  
**Use Case:** Mail client sidebar, folder structure

### Messages

#### `useWildduckUserMessagesQuery(config, userId, mailboxId, filters?, options?)`

Get messages from a specific mailbox with pagination and filtering.

```typescript
const { data: messages } = useWildduckUserMessagesQuery(
  wildduckConfig,
  userId,
  mailboxId,
  { 
    limit: 50,
    page: 1,
    unseen: true,        // Only unread messages
    flagged: false       // Exclude flagged messages
  }
);

// Response: WildduckMessagesResponse with pagination
```

**Stale Time:** 30 seconds  
**Use Case:** Message lists, inbox display

#### `useWildduckMessageQuery(config, userId, messageId, options?)`

Get detailed content of a specific message.

```typescript
const { data: message } = useWildduckMessageQuery(
  wildduckConfig,
  userId,
  messageId
);

// Response: WildduckMessage with full content
```

**Stale Time:** 5 minutes  
**Use Case:** Message viewer, email details

#### `useWildduckSearchMessagesQuery(config, userId, mailboxId, query, searchOptions?, queryOptions?)`

Search messages within a mailbox.

```typescript
const { data: results } = useWildduckSearchMessagesQuery(
  wildduckConfig,
  userId,
  mailboxId,
  'important meeting',
  { limit: 20 }
);
```

**Stale Time:** 30 seconds  
**Use Case:** Email search functionality

### Authentication

#### `useWildduckAuthStatusQuery(config, token?, options?)`

Check authentication status and get user info.

```typescript
const { data: authStatus } = useWildduckAuthStatusQuery(
  wildduckConfig,
  accessToken
);

// Response: WildduckAuthStatusResponse
// { success: boolean, authenticated: boolean, user?: UserInfo }
```

**Stale Time:** 5 minutes  
**Use Case:** Login verification, session management

### Filters & Settings

#### `useWildduckUserFiltersQuery(config, userId, options?)`
#### `useWildduckUserSettingsQuery(config, userId, options?)`

Get user email filters and account settings.

```typescript
const { data: filters } = useWildduckUserFiltersQuery(config, userId);
const { data: settings } = useWildduckUserSettingsQuery(config, userId);
```

**Stale Time:** 5 minutes  
**Use Case:** Settings pages, filter management

---

## 🔗 Indexer API Hooks

Indexer hooks provide access to blockchain data, points system, and mail indexing.

### Public Endpoints

#### `useAddressValidation(endpointUrl, dev, address, options?)`

Validate cryptocurrency address formats.

```typescript
const { data: validation } = useAddressValidation(
  indexerUrl,
  devMode,
  '0x742d35Cc6...'
);

// Response: AddressValidationResponse
// { 
//   isValid: boolean,
//   addressType: string,
//   normalizedAddress: string,
//   formats?: { standard: string, checksummed?: string }
// }
```

**Stale Time:** 10 minutes  
**Use Case:** Address input validation, format normalization

#### `useSigningMessage(endpointUrl, dev, chainId, walletAddress, domain, url, options?)`

Get signing message for wallet verification.

```typescript
const { data: signingInfo } = useSigningMessage(
  indexerUrl,
  devMode,
  1, // Ethereum mainnet
  walletAddress,
  '0xmail.box',
  window.location.href
);

// Response: SigningMessageResponse with message and instructions
```

**Stale Time:** 5 minutes  
**Use Case:** Wallet connection flow, signature verification

#### `useIndexerPointsLeaderboard(endpointUrl, dev, count?, options?)`

Get points leaderboard data.

```typescript
const { data: leaderboard, refetch } = useIndexerPointsLeaderboard(
  indexerUrl,
  devMode,
  50 // Top 50 users
);

// Response: PointsLeaderboardResponse
// { 
//   success: boolean,
//   data: { 
//     leaderboard: [{ walletAddress, pointsEarned, rank }],
//     count: number 
//   }
// }
```

**Stale Time:** 30 seconds  
**Use Case:** Leaderboards, gamification displays

#### `useSiteStats(endpointUrl, dev, options?)`

Get site-wide statistics.

```typescript
const { data: stats } = useSiteStats(indexerUrl, devMode);

// Response: SiteStatsResponse
// { 
//   success: boolean,
//   data: { totalPoints, totalUsers, lastUpdated }
// }
```

**Stale Time:** 2 minutes  
**Use Case:** Dashboard metrics, public statistics

#### `useSolanaStatus(endpointUrl, dev, options?)`

Get Solana indexer status and chain information.

```typescript
const { data: solanaStatus } = useSolanaStatus(indexerUrl, devMode);

// Response: SolanaStatusResponse
// {
//   solanaIndexers: [{ chainId, initialized, networkName }],
//   totalIndexers: number,
//   configured: boolean
// }
```

**Stale Time:** 1 minute  
**Use Case:** Network status, multi-chain support info

### Protected Endpoints

All protected endpoints require wallet signature authentication.

#### `useIndexerEmailAddresses(endpointUrl, dev, walletAddress, signature, message, options?)`

Get email addresses associated with a wallet.

```typescript
const { data: emailAddresses } = useIndexerEmailAddresses(
  indexerUrl,
  devMode,
  walletAddress,
  signature,
  signedMessage
);

// Response: IndexerEmailAddressesResponse
// { 
//   success: boolean,
//   data: [{ address, verified, primary? }]
// }
```

**Stale Time:** 2 minutes  
**Use Case:** Profile management, email verification

#### `useIndexerDelegated(endpointUrl, dev, walletAddress, signature, message, options?)`
#### `useIndexerDelegatedTo(endpointUrl, dev, walletAddress, signature, message, options?)`

Get delegation information for wallet addresses.

```typescript
const { data: delegated } = useIndexerDelegated(
  indexerUrl, devMode, walletAddress, signature, message
);
const { data: delegatedTo } = useIndexerDelegatedTo(
  indexerUrl, devMode, walletAddress, signature, message
);

// Response: IndexerDelegatedResponse
// { 
//   success: boolean,
//   data: [{ delegatedAddress, permissions }]
// }
```

**Stale Time:** 2 minutes  
**Use Case:** Delegation management, permission systems

#### `useIndexerPointsBalance(endpointUrl, dev, walletAddress, signature, message, options?)`

Get detailed points balance for a wallet.

```typescript
const { data: points } = useIndexerPointsBalance(
  indexerUrl,
  devMode,
  walletAddress,
  signature,
  message
);

// Response: IndexerPointsBalanceResponse
// { 
//   success: boolean,
//   data: { 
//     walletAddress, 
//     pointsEarned, 
//     totalTransactions, 
//     lastUpdated 
//   }
// }
```

**Stale Time:** 1 minute  
**Use Case:** User dashboards, points tracking

#### `useIndexerNameServiceEntitlement(endpointUrl, dev, walletAddress, signature, message, options?)`

Check name service subscription entitlements.

```typescript
const { data: entitlement } = useIndexerNameServiceEntitlement(
  indexerUrl,
  devMode,
  walletAddress,
  signature,
  message
);

// Response: IndexerNameServiceEntitlementResponse
// { 
//   success: boolean,
//   data: { entitled, subscriptionType?, expiresAt? }
// }
```

**Stale Time:** 5 minutes  
**Use Case:** Subscription management, premium features

---

## 🌐 Name Service Hooks

Name service hooks provide ENS and SNS resolution with intelligent caching.

### ENS (Ethereum Name Service)

#### `useENSFromWallet(walletAddress, options?)`

Resolve ENS name from Ethereum wallet address.

```typescript
const { data: ensResolution } = useENSFromWallet(
  '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398'
);

// Response: ENSResolutionResponse
// { 
//   address: string,
//   ensName: string | null,
//   success: boolean 
// }
```

**Stale Time:** 5 minutes  
**Use Case:** Display names, user identification

#### `useWalletFromENS(ensName, options?)`

Resolve wallet address from ENS name.

```typescript
const { data: walletResolution } = useWalletFromENS('vitalik.eth');

// Response: WalletResolutionResponse
// { 
//   nameService: 'ens',
//   domain: string,
//   walletAddress: string | null,
//   success: boolean 
// }
```

**Stale Time:** 5 minutes  
**Use Case:** Address input, name resolution

### SNS (Solana Name Service)

#### `useSNSFromWallet(walletAddress, options?)`

Resolve SNS name from Solana wallet address.

```typescript
const { data: snsResolution } = useSNSFromWallet(
  'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy'
);

// Response: SNSResolutionResponse
// { 
//   address: string,
//   snsName: string | null,
//   success: boolean 
// }
```

#### `useWalletFromSNS(snsName, options?)`

Resolve wallet address from SNS name.

```typescript
const { data: walletResolution } = useWalletFromSNS('example.sol');
```

**Stale Time:** 5 minutes  
**Use Case:** Solana ecosystem integration

### Auto-Detection

#### `useNameServiceResolution(input, options?)`

Automatically detect and resolve ENS or SNS based on input format.

```typescript
const { data: resolution } = useNameServiceResolution(inputValue);
// Works with: wallet addresses, ENS names, SNS names
```

**Stale Time:** 5 minutes  
**Use Case:** Universal name resolution, search functionality

---

## Configuration

### Stale Times

The library uses intelligent stale times based on data volatility:

```typescript
const STALE_TIMES = {
  // Static data (rarely changes)
  USER_PROFILE: 5 * 60 * 1000,           // 5 minutes
  MAILBOXES: 5 * 60 * 1000,              // 5 minutes
  ADDRESS_VALIDATION: 10 * 60 * 1000,    // 10 minutes
  
  // Moderate frequency
  EMAIL_ADDRESSES: 2 * 60 * 1000,        // 2 minutes
  HEALTH_STATUS: 1 * 60 * 1000,          // 1 minute
  
  // Dynamic data (changes frequently)  
  MESSAGES: 30 * 1000,                   // 30 seconds
  LEADERBOARD: 30 * 1000,                // 30 seconds
  POINTS_BALANCE: 1 * 60 * 1000,         // 1 minute
  
  // Name service resolution
  NAME_SERVICE_RESOLUTION: 5 * 60 * 1000, // 5 minutes
};
```

### Global Query Client

All hooks share a configured QueryClient with optimized defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,          // 1 minute default
      gcTime: 5 * 60 * 1000,             // 5 minutes cache retention
      retry: (failureCount, error) => {
        // Don't retry 4xx client errors
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  }
});
```

## Best Practices

### 1. Use Enabled Option

Prevent unnecessary requests with conditional execution:

```typescript
const { data } = useWildduckUserQuery(
  config,
  userId,
  { enabled: !!userId && isAuthenticated }
);
```

### 2. Handle Loading States

Always handle loading and error states:

```typescript
const { data, isLoading, error, isFetching } = useIndexerPointsBalance(
  endpoint, dev, wallet, signature, message
);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <PointsDisplay points={data.data.pointsEarned} />;
```

### 3. Refetch on User Actions

Use refetch for manual updates:

```typescript
const { data, refetch } = useWildduckUserMessagesQuery(config, userId, mailboxId);

const handleMarkAsRead = async () => {
  await markMessageAsRead(messageId);
  refetch(); // Refresh message list
};
```

### 4. Optimize with Query Options

Customize behavior per use case:

```typescript
// Dashboard - frequent updates
const { data } = useIndexerPointsLeaderboard(
  endpoint, dev, 10,
  { 
    refetchInterval: 10000,  // Update every 10 seconds
    staleTime: 5000          // Consider stale after 5 seconds
  }
);

// Settings - less frequent updates  
const { data } = useWildduckUserSettingsQuery(
  config, userId,
  { 
    staleTime: 10 * 60 * 1000,  // 10 minutes
    refetchOnWindowFocus: false  // Don't auto-refetch
  }
);
```

### 5. Type Safety

Always use proper TypeScript types:

```typescript
import { 
  WildduckMessage,
  IndexerPointsBalanceResponse,
  ENSResolutionResponse 
} from '@johnqh/lib';

const { data }: { data?: IndexerPointsBalanceResponse } = 
  useIndexerPointsBalance(endpoint, dev, wallet, signature, message);
```

## Migration Guide

### From Legacy Hooks

If migrating from legacy hooks, use the Query equivalents:

```typescript
// OLD
import { useWildduckMessages } from '@johnqh/lib';
const { messages, loading, error } = useWildduckMessages(config, userId, mailboxId);

// NEW  
import { useWildduckUserMessagesQuery } from '@johnqh/lib';
const { data, isLoading, error } = useWildduckUserMessagesQuery(config, userId, mailboxId);
const messages = data?.results || [];
```

### From Direct API Calls

Replace direct client usage with hooks:

```typescript
// OLD
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await indexerClient.getPointsLeaderboard(10);
      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// NEW
const { data, isLoading } = useIndexerPointsLeaderboard(endpoint, dev, 10);
```

## Troubleshooting

### Common Issues

1. **Hook not updating**: Check enabled conditions and dependencies
2. **Stale data**: Verify stale time configuration
3. **Too many requests**: Use proper query keys and request deduplication
4. **Type errors**: Import correct response types

### Debug with DevTools

Install TanStack Query DevTools for debugging:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

This completes the comprehensive documentation for all TanStack Query hooks in @johnqh/lib. The hooks provide a powerful, performant, and developer-friendly way to handle all GET requests with built-in caching, error handling, and optimistic updates.