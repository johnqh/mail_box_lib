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

// Mailer claims management
export * from './useMailerClaims';

// USDC approval management for Mailer contracts
export * from './useMailerContractApproval';

// Mailer permissions management
export * from './useMailerPermissions';

// Mailer delegations management
export * from './useMailerDelegations';

// Mailer webhooks management
export * from './useMailerWebhooks';

// Mailer templates management
export * from './useMailerTemplates';

// Re-export types from the contracts package for convenience
export type {
  UnifiedTransaction,
  ChainConfig,
  EVMConfig,
  SolanaConfig,
  MessageResult,
  DomainResult,
  DelegationResult as ContractDelegationResult,
  Wallet,
  EVMWallet,
  SolanaWallet,
} from '@sudobility/contracts';
