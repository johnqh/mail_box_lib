# TanStack Query Migration Guide

## Overview

This project has been updated to use TanStack Query for all GET endpoint API calls. This replaces custom caching logic with a battle-tested solution that provides:

- **Automatic Background Refetching**: Fresh data without loading states
- **Stale-While-Revalidate**: Show cached data immediately, fetch updates in background
- **Smart Caching**: Efficient memory usage and cache invalidation
- **Error Handling**: Built-in retry logic and error states
- **Optimistic Updates**: Better user experience with instant feedback

## What Changed

### Before (Custom Caching)
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Custom cache management
const cached = cache.get(key);
if (cached && Date.now() - cached.timestamp < TTL) {
  setData(cached.data);
}

// Manual API calls with loading states
const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.getData();
    setData(result);
    cache.set(key, { data: result, timestamp: Date.now() });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### After (TanStack Query)
```typescript
const { data, isLoading, error, isStale, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.getData(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// That's it! TanStack Query handles everything else
```

## New Hooks Available

### Indexer API Hooks
```typescript
import { 
  useSigningMessage,
  useHowToEarnPoints,
  usePublicStats,
  useLeaderboard,
  useCampaigns,
  useCampaignStats,
  usePointsLeaderboard,
  useSiteStats,
  useSolanaStatus
} from '@johnqh/lib';

// Example usage
const { data, isLoading, error, refetch } = usePointsLeaderboard(10);
```

### WildDuck API Hooks
```typescript
import {
  useWildduckHealth,
  useWildduckUsersList,
  useWildduckUser,
  useWildduckUserAddresses,
  useWildduckUserMessages,
  useWildduckMessage,
  useWildduckUserFilters,
  useWildduckUserSettings
} from '@johnqh/lib';

// Example usage
const { data: users } = useWildduckUsersList({ page: 1, limit: 20 });
```

## Migration Path

### 1. Wrap Your App with QueryProvider

```typescript
import { QueryProvider } from '@johnqh/lib';

function App() {
  return (
    <QueryProvider>
      <YourAppComponents />
    </QueryProvider>
  );
}
```

### 2. Replace Custom Hooks

#### Old Points Leaderboard Hook
```typescript
// OLD: Custom caching logic
import { usePointsLeaderboard } from '@johnqh/lib';

function Component() {
  const { topUsers, loading, error, refresh } = useTopUsers(10);
  
  return (
    <div>
      {loading && <Loading />}
      {error && <Error message={error} />}
      {topUsers.map(user => <UserCard key={user.walletAddress} user={user} />)}
    </div>
  );
}
```

#### New TanStack Query Hook
```typescript
// NEW: TanStack Query with automatic caching
import { useTopUsers } from '@johnqh/lib';

function Component() {
  const { topUsers, loading, error, refetch } = useTopUsers(10);
  
  return (
    <div>
      {loading && <Loading />}
      {error && <Error message={error} />}
      {topUsers.map(user => <UserCard key={user.walletAddress} user={user} />)}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### 3. Benefit from Enhanced Features

#### Stale-While-Revalidate Behavior
```typescript
function Dashboard() {
  const { data, isStale, isFetching } = useSiteStats();
  
  return (
    <div>
      <Stats data={data} />
      {isStale && <Badge>Refreshing...</Badge>}
      {isFetching && <Spinner size="small" />}
    </div>
  );
}
```

#### Background Refetching
```typescript
function UserProfile({ userId }) {
  const { data: user, isStale } = useWildduckUser(userId, {
    // Data stays fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Refetch when user comes back to tab
    refetchOnWindowFocus: true,
    // Refetch when network reconnects
    refetchOnReconnect: true,
  });
  
  return (
    <Profile user={user} isStale={isStale} />
  );
}
```

#### Dependent Queries
```typescript
function UserMessages({ userId }) {
  const { data: user } = useWildduckUser(userId);
  const { data: messages } = useWildduckUserMessages(userId, {
    // Only fetch messages if we have a user
    enabled: !!user,
  });
  
  return <MessageList messages={messages} />;
}
```

## Key Benefits

### 1. Immediate Data Display
- Cached data displays instantly
- No loading spinners for cached content
- Background updates happen seamlessly

### 2. Smart Caching
- Memory-efficient garbage collection
- Automatic cache invalidation
- Configurable stale times per endpoint

### 3. Error Resilience
- Built-in retry logic with exponential backoff
- Network-aware operations
- Graceful fallbacks to cached data

### 4. Developer Experience
- Less boilerplate code
- Built-in loading and error states
- DevTools integration for debugging

## Configuration

### Global Configuration
```typescript
import { createQueryClient, STALE_TIMES } from '@johnqh/lib';

const queryClient = createQueryClient();

// Custom configuration example
const customQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.LEADERBOARD, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});
```

### Per-Query Configuration
```typescript
const { data } = usePointsLeaderboard(10, {
  // Override global settings
  staleTime: 1 * 60 * 1000, // 1 minute
  refetchInterval: 30 * 1000, // Poll every 30 seconds
  onSuccess: (data) => console.log('Data updated:', data),
  onError: (error) => console.error('Query failed:', error),
});
```

## Best Practices

### 1. Use Appropriate Stale Times
- **Static data** (campaigns, how-to-earn): 5-10 minutes
- **Dynamic data** (leaderboard, stats): 30 seconds - 2 minutes
- **Real-time data** (messages, status): 10-30 seconds

### 2. Leverage Query Keys for Cache Management
```typescript
// Invalidate specific data
queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

// Prefetch related data
queryClient.prefetchQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
```

### 3. Handle Loading States Appropriately
```typescript
function DataComponent() {
  const { data, isLoading, isFetching, isStale } = useMyQuery();
  
  // Initial load
  if (isLoading) return <Skeleton />;
  
  // Background updates
  return (
    <div>
      <Data data={data} />
      {isFetching && <RefreshIndicator />}
      {isStale && <StaleDataWarning />}
    </div>
  );
}
```

## Backward Compatibility

Most existing hooks maintain their interfaces for backward compatibility:

```typescript
// Still works exactly the same
const { topUsers, loading, error } = useTopUsers(10);

// New features available
const { topUsers, loading, error, refetch, isStale } = useTopUsers(10);
```

## Troubleshooting

### Common Issues

1. **Provider Not Found Error**
   - Ensure `<QueryProvider>` wraps your app
   - Check that the provider is high enough in the component tree

2. **Queries Not Updating**
   - Verify query keys are correct
   - Check network connectivity
   - Use React DevTools to inspect query state

3. **Memory Issues**
   - Adjust `gcTime` for unused queries
   - Use query key patterns for bulk invalidation
   - Monitor cache size in development

### DevTools

Install React Query DevTools for debugging:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryProvider>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
```

## Performance Impact

### Before vs After Metrics

| Metric | Before (Custom) | After (TanStack Query) |
|--------|-----------------|------------------------|
| Bundle Size | +0KB | +45KB (gzipped) |
| Memory Usage | Variable | Optimized |
| Cache Efficiency | Manual | Automatic |
| Network Requests | On every render | Smart deduplication |
| User Experience | Loading spinners | Instant + background refresh |

### Network Request Reduction
- Duplicate requests eliminated
- Background refetching only when needed
- Smart cache invalidation reduces unnecessary fetches

This migration significantly improves user experience by showing cached data immediately while ensuring data freshness through background updates.