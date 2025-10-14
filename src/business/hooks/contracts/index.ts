/**
 * Contract hooks for interacting with @sudobility/contracts
 * Provides React hooks for OnchainMailerClient and related utilities
 */

// Main client hook
export * from './useMailerClient';

// Wallet detection utilities
export * from './useWalletDetector';

// Contract configuration management
export * from './useContractConfig';

// Claimable rewards management
export * from './useClaimableRewards';

// Re-export types from the contracts package for convenience
export type {
  UnifiedTransaction,
  UnifiedWallet,
  ChainConfig,
  EVMConfig,
  SolanaConfig,
  MessageResult,
  DomainResult,
  DelegationResult as ContractDelegationResult,
} from '@sudobility/contracts';
