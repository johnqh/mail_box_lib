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

// Data hooks (moved from /business/hooks/data)
export * from './useEmail';
export * from './useEmails';
export * from './useEmailAddresses';
export * from './useMailBoxes';

// New TanStack Query hooks (with prefixed names to avoid conflicts)
export {
  useWildduckHealth as useWildduckHealthQuery,
  useWildduckUsersList as useWildduckUsersListQuery,
  useWildduckUser as useWildduckUserQuery,
  useWildduckUserAddresses as useWildduckUserAddressesQuery,
  useWildduckUserMessages as useWildduckUserMessagesQuery,
  useWildduckMessage as useWildduckMessageQuery,
  useWildduckUserFilters as useWildduckUserFiltersQuery,
  useWildduckUserSettings as useWildduckUserSettingsQuery
} from './useWildduckQueries';
