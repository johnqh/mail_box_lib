/**
 * Platform-agnostic React hooks that work in both React and React Native
 */

// Core utility hooks
export * from './core';

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
  useIndexerPointsLeaderboard as usePointsLeaderboardQuery,
  useSiteStats,
  useSolanaStatus,
} from './indexer';

// Points hooks (new TanStack Query based)
export * from './points';
