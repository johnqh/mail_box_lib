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
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
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

// WalletUserData is now imported from auth.interface.ts (more comprehensive definition)
import type { WalletUserData } from '../di/auth/auth.interface';
export type { WalletUserData };

// Re-export types from enums for backward compatibility
export { Theme, FontSize };

export { type Email, type Folder, type EmailAddress, type User };
