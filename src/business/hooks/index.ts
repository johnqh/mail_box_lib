/**
 * Platform-agnostic React hooks that work in both React and React Native
 */

// State management hooks
export * from './useDebounce';
export * from './useAsync';
export * from './useAsyncOperation';
export * from './useOptimizedState';
export * from './useLocalStorage';
export * from './useStorage';

// Service layer hooks
export * from './useServices';

// Data layer hooks
export * from './data/useEmail';
export * from './data/useEmails';
export * from './data/useEmailAddresses';
export * from './data/useMailBoxes';

// WildDuck API hooks
export * from './wildduck';

// Indexer hooks (excluding conflicting exports)
export {
  useIndexerPoints,
  useIndexerGraphQL,
  useIndexerMail,
  useIndexerSolana,
  // TanStack Query hooks
  useSigningMessage,
  useHowToEarnPoints,
  usePublicStats,
  useLeaderboard,
  useCampaigns,
  useCampaignStats,
  usePointsLeaderboard as usePointsLeaderboardQuery,
  useSiteStats,
  useSolanaStatus,
} from './indexer';

// Points hooks (new TanStack Query based)
export * from './points';
