/**
 * Query Key Factory for TanStack Query
 *
 * Provides type-safe, consistent query keys for all API endpoints.
 * Following TanStack Query best practices for key structure.
 *
 * Note: WildDuck query keys have been moved to @johnqh/wildduck_client
 */

const queryKeys = {
  // Add custom query keys here for other services
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
const getServiceKeys = (service: string) => {
  // Return empty array for now - add service-specific logic as needed
  return [service] as const;
};

export { queryKeys, createQueryKey, getServiceKeys, type QueryKey };
