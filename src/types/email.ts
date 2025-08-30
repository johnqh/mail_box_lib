export interface Email {
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

export interface Folder {
  name: string;
  count: number;
  unreadCount: number;
}

export interface EmailAddress {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailAddresses: EmailAddress[];
}

import { ChainType, Theme, FontSize, EmailFolder } from "../business/core/enums";

// WalletUserData is now imported from auth.interface.ts (more comprehensive definition)
import type { WalletUserData } from './services/auth.interface';
export type { WalletUserData };

// Re-export types from enums for backward compatibility
export { Theme, FontSize };