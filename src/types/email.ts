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

import { ChainType, EmailFolder, FontSize, Theme } from '@johnqh/types';

// WalletUserData interface for wallet-based user information
export interface WalletUserData {
  walletAddress: string;
  chainType: ChainType;
  walletType?: string;
  displayName?: string;
  avatar?: string;
  metadata?: Record<string, any>;
  emailAddresses?: EmailAddress[];
}

// Re-export types from enums for backward compatibility
export { Theme, FontSize };

export { type Email, type Folder, type EmailAddress, type User };
