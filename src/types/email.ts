import {
  ChainType,
  EmailFolder,
  FontSize,
  IndexerWalletAccount,
  Optional,
  Theme,
} from '@johnqh/types';

// Re-export with legacy name for backward compatibility
export type WalletAccount = IndexerWalletAccount;

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  important?: Optional<boolean>;
  folder: EmailFolder;
  labels?: Optional<string[]>;
  attachments?: Optional<string[]>;
}

interface Folder {
  name: string;
  count: number;
  unreadCount: number;
}

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

export { type Email, type Folder, type EmailAddress, type User };
