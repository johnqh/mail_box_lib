/**
 * Types for claimable rewards across multiple chains
 */

import { ChainType } from '@sudobility/types';

/**
 * Claimable reward information for a specific chain
 */
export interface ClaimableReward {
  /** The chain type (EVM or Solana) */
  chainType: ChainType;

  /** Claimable amount in USDC micro-units (6 decimals) */
  claimableAmount: bigint;

  /** Optional chain identifier (e.g., chainId for EVM, 'mainnet-beta' for Solana) */
  chainId?: number | string;

  /** Optional RPC endpoint used */
  rpcEndpoint?: string;
}

/**
 * Result of claiming rewards on a specific chain
 */
export interface ClaimRewardResult {
  /** The chain type where the claim was made */
  chainType: ChainType;

  /** Transaction hash */
  transactionHash: string;

  /** Amount claimed in USDC micro-units */
  amountClaimed: bigint;

  /** Whether the claim was successful */
  success: boolean;
}
