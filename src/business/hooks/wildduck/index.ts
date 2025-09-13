/**
 * WildDuck API hooks for React and React Native
 */

// Legacy hooks
export * from './useWildduckHealth';
export * from './useWildduckSettings';
export * from './useWildduckMessages';
export * from './useWildduckMailboxes';
export * from './useWildduckUsers';
export * from './useWildduckFilters';
export * from './useWildduckAddresses';
export * from './useWildduckAuth';

// Legacy data hooks have been removed - use newer TanStack Query hooks or other alternatives

// New TanStack Query hooks (with prefixed names to avoid conflicts)
export {
  useWildduckHealth as useWildduckHealthQuery,
  useWildduckUsersList as useWildduckUsersListQuery,
  useWildduckUser as useWildduckUserQuery,
  useWildduckUserAddresses as useWildduckUserAddressesQuery,
  useWildduckUserMessages as useWildduckUserMessagesQuery,
  useWildduckMessage as useWildduckMessageQuery,
  useWildduckUserFilters as useWildduckUserFiltersQuery,
  useWildduckUserSettings as useWildduckUserSettingsQuery,
  useWildduckUserMailboxes as useWildduckUserMailboxesQuery,
  useWildduckAuthStatus as useWildduckAuthStatusQuery,
  useWildduckSearchMessages as useWildduckSearchMessagesQuery
} from './useWildduckQueries';

// Export types from TanStack Query hooks
export type {
  WildduckHealthResponse,
  WildduckUser,
  WildduckUsersListResponse,
  WildduckAddress,
  WildduckMessage,
  WildduckMessagesResponse,
  WildduckUserSettings,
  WildduckFilter,
  WildduckMailbox,
  WildduckMailboxesResponse,
  WildduckAuthStatusResponse
} from './useWildduckQueries';
