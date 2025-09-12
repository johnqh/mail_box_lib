interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  important?: boolean;
  folder: EmailFolder;
  labels?: string[];
  attachments?: string[];
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
  primary?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailAddresses: EmailAddress[];
}

import {
  ChainType as _ChainType,
  EmailFolder,
  FontSize,
  Theme,
} from '../business/core/enums';

// WalletUserData interface for wallet-based user information
export interface WalletUserData {
  walletAddress: string;
  chainType: string;
  walletType?: string;
  displayName?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

// Re-export types from enums for backward compatibility
export { Theme, FontSize };

export { type Email, type Folder, type EmailAddress, type User };
