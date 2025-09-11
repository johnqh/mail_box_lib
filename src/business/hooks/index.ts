/**
 * Platform-agnostic React hooks that work in both React and React Native
 */

// Core utility hooks
export * from './core';

// WildDuck API hooks (includes data hooks moved from /data)
export * from './wildduck';

// Indexer hooks (excludes conflicting exports)
export {
  useIndexerPoints,
  useIndexerMail,
  useIndexerSolana,
  // TanStack Query hooks
  useSigningMessage,
  useIndexerPointsLeaderboard as usePointsLeaderboardQuery,
  useSiteStats,
  useSolanaStatus,
  // Points hooks (moved from /points)
  useTopUsers,
  usePointsSiteStats,
  usePointsLeaderboard,
  useTopUsersLegacy,
} from './indexer';

// Contract hooks for @johnqh/mail_box_contracts
export * from './contracts';
