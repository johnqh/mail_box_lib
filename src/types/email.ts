import {
  ChainType,
  FontSize,
  IndexerWalletAccount,
  Optional,
  Theme,
} from '@sudobility/types';

// Re-export with legacy name for backward compatibility
export type WalletAccount = IndexerWalletAccount;

interface EmailAddress {
  id: string;
  address: string;
  verified: boolean;
  primary?: Optional<boolean>;
  createdAt: Date;
  updatedAt?: Optional<Date>;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: Optional<string>;
  emailAddresses: WalletAccount[];
}

// WalletUserData interface for wallet-based user information
export interface WalletUserData {
  walletAddress: string;
  chainType: ChainType;
  walletType?: Optional<string>;
  displayName?: Optional<string>;
  avatar?: Optional<string>;
  metadata?: Optional<Record<string, any>>;
  emailAddresses?: Optional<WalletAccount[]>;
}

// Re-export types from enums for backward compatibility
export { Theme, FontSize };

export { type EmailAddress, type User };
