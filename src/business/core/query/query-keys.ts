/**
 * Query Key Factory for TanStack Query
 *
 * Provides type-safe, consistent query keys for all API endpoints.
 * Following TanStack Query best practices for key structure.
 */

/**
 * Query key factory for the indexer API
 *
 * Structure: [service, resource, ...identifiers, filters]
 */
// Create base key functions first to avoid circular references
const indexerBase = () => ['indexer'] as const;
const wildduckBase = () => ['wildduck'] as const;

const queryKeys = {
  // Indexer API keys
  indexer: {
    all: indexerBase,

    // Address validation
    addresses: () => [...indexerBase(), 'addresses'] as const,
    validateAddress: (address: string) =>
      [...indexerBase(), 'addresses', 'validate', address] as const,

    // Message signing
    messages: () => [...indexerBase(), 'messages'] as const,
    message: (
      chainId: number,
      walletAddress: string,
      domain: string,
      url: string
    ) =>
      [
        ...indexerBase(),
        'messages',
        { chainId, walletAddress, domain, url },
      ] as const,

    // Points system
    points: () => [...indexerBase(), 'points'] as const,
    howToEarn: () => [...indexerBase(), 'points', 'how-to-earn'] as const,
    publicStats: () => [...indexerBase(), 'points', 'public-stats'] as const,
    siteStats: () => [...indexerBase(), 'points', 'site-stats'] as const,

    // Leaderboards
    leaderboards: () => [...indexerBase(), 'leaderboards'] as const,
    leaderboard: (limit?: number, offset?: number) =>
      [...indexerBase(), 'leaderboards', { limit, offset }] as const,
    pointsLeaderboard: (count: number) =>
      [...indexerBase(), 'leaderboards', 'points', { count }] as const,

    // Campaigns
    campaigns: () => [...indexerBase(), 'campaigns'] as const,
    campaignsList: () => [...indexerBase(), 'campaigns', 'list'] as const,
    campaignStats: (campaignId: string) =>
      [...indexerBase(), 'campaigns', 'stats', campaignId] as const,

    // Solana
    solana: () => [...indexerBase(), 'solana'] as const,
    solanaStatus: () => [...indexerBase(), 'solana', 'status'] as const,
  },

  // WildDuck API keys
  wildduck: {
    all: wildduckBase,

    // Health and status
    health: () => [...wildduckBase(), 'health'] as const,

    // User management
    users: () => [...wildduckBase(), 'users'] as const,
    usersList: (filters?: Record<string, unknown>) =>
      [...wildduckBase(), 'users', 'list', filters] as const,
    user: (userId: string) => [...wildduckBase(), 'users', userId] as const,

    // Email addresses
    addresses: () => [...wildduckBase(), 'addresses'] as const,
    userAddresses: (userId: string) =>
      [...wildduckBase(), 'addresses', userId] as const,
    forwardedAddresses: (userId: string) =>
      [...wildduckBase(), 'addresses', 'forwarded', userId] as const,
    resolveAddress: (address: string) =>
      [...wildduckBase(), 'addresses', 'resolve', address] as const,

    // Mailboxes
    mailboxes: () => [...wildduckBase(), 'mailboxes'] as const,
    userMailboxes: (userId: string, options?: Record<string, unknown>) =>
      [...wildduckBase(), 'mailboxes', userId, options] as const,

    // Messages
    messages: () => [...wildduckBase(), 'messages'] as const,
    userMessages: (
      userId: string,
      mailboxId: string,
      filters?: Record<string, unknown>
    ) => [...wildduckBase(), 'messages', userId, mailboxId, filters] as const,
    message: (userId: string, messageId: string) =>
      [...wildduckBase(), 'messages', userId, messageId] as const,
    searchMessages: (
      userId: string,
      mailboxId: string,
      query: string,
      options?: Record<string, unknown>
    ) =>
      [
        ...wildduckBase(),
        'messages',
        'search',
        userId,
        mailboxId,
        { query, ...options },
      ] as const,

    // Filters and settings
    filters: () => [...wildduckBase(), 'filters'] as const,
    userFilters: (userId: string) =>
      [...wildduckBase(), 'filters', userId] as const,

    settings: () => [...wildduckBase(), 'settings'] as const,
    userSettings: (userId: string) =>
      [...wildduckBase(), 'settings', userId] as const,

    // Authentication
    auth: () => [...wildduckBase(), 'auth'] as const,
    authStatus: (token?: string) =>
      [...wildduckBase(), 'auth', 'status', token] as const,
  },
} as const;

/**
 * Utility type to extract query key from the factory
 */
type QueryKey = readonly unknown[];

/**
 * Helper function to create a query key for custom endpoints
 * Use this when you need a one-off query key that doesn't fit the factory pattern
 */
const createQueryKey = (
  service: string,
  ...parts: (string | number | object)[]
): readonly unknown[] => {
  return [service, ...parts] as const;
};

/**
 * Helper to get all keys for a service (useful for invalidation)
 */
const getServiceKeys = (service: 'indexer' | 'wildduck') => {
  return queryKeys[service].all();
};

export { queryKeys, createQueryKey, getServiceKeys, type QueryKey };
