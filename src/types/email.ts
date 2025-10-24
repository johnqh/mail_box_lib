import { ChainType, IndexerWalletAccount, Optional } from '@sudobility/types';

export interface EmailAddress {
  id: string;
  address: string;
  verified: boolean;
  primary?: Optional<boolean>;
  createdAt: Date;
  updatedAt?: Optional<Date>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: Optional<string>;
  emailAddresses: IndexerWalletAccount[];
}

// WalletUserData interface for wallet-based user information
export interface WalletUserData {
  walletAddress: string;
  chainType: ChainType;
  walletType?: Optional<string>;
  displayName?: Optional<string>;
  avatar?: Optional<string>;
  metadata?: Optional<Record<string, any>>;
  emailAddresses?: Optional<IndexerWalletAccount[]>;
}
