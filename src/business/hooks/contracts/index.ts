/**
 * Contract hooks for interacting with @johnqh/mail_box_contracts
 * Provides React hooks for OnchainMailerClient and related utilities
 */

// Main client hook
export * from './useMailerClient';

// Wallet detection utilities
export * from './useWalletDetector';

// Contract configuration management
export * from './useContractConfig';

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
} from '@johnqh/mail_box_contracts';
