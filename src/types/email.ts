/**
 * @fileoverview Email and user type definitions for wallet-based email accounts.
 * Defines the core data shapes for email addresses, users, and wallet-linked user data
 * used throughout the 0xmail ecosystem.
 */

import { ChainType, Optional } from '@sudobility/types';
import { IndexerWalletAccount } from '@sudobility/mail_box_types';

/**
 * Represents a single email address associated with a user account.
 */
export interface EmailAddress {
  /** Unique identifier for the email address record */
  id: string;
  /** The full email address string (e.g., "0x742d...@0xmail.box") */
  address: string;
  /** Whether the email address has been verified */
  verified: boolean;
  /** Whether this is the user's primary email address */
  primary?: Optional<boolean>;
  /** When the email address was created */
  createdAt: Date;
  /** When the email address was last updated */
  updatedAt?: Optional<Date>;
}

/**
 * Represents a user in the 0xmail system with associated wallet accounts.
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** Display name */
  name: string;
  /** Primary email address */
  email: string;
  /** URL to the user's avatar image */
  avatar?: Optional<string>;
  /** List of wallet accounts linked to this user (from the indexer) */
  emailAddresses: IndexerWalletAccount[];
}

/**
 * Wallet-based user data containing blockchain-specific information.
 * Used when user identity is derived from a connected wallet.
 */
export interface WalletUserData {
  /** The wallet's public address (EVM hex or Solana base58) */
  walletAddress: string;
  /** The blockchain type (evm or solana) */
  chainType: ChainType;
  /** The wallet provider type (e.g., "metamask", "phantom") */
  walletType?: Optional<string>;
  /** Human-readable display name (e.g., ENS name) */
  displayName?: Optional<string>;
  /** URL to the user's avatar image */
  avatar?: Optional<string>;
  /** Additional key-value metadata */
  metadata?: Optional<Record<string, any>>;
  /** Wallet accounts linked to this wallet address (from the indexer) */
  emailAddresses?: Optional<IndexerWalletAccount[]>;
}
