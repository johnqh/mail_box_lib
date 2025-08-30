/**
 * Platform-agnostic enums for discrete states
 * These replace string literals throughout the application
 */

// Authentication states
export enum AuthStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  VERIFIED = 'verified',
}

// Chain types
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  UNKNOWN = 'unknown',
}

// Theme states
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Font sizes
export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

// Standard email folder types (users can also create custom folders)
export enum StandardEmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  SPAM = 'spam',
  TRASH = 'trash',
  STARRED = 'starred',
  SNOOZED = 'snoozed',
  ARCHIVE = 'archive',
}

// Helper type that allows both standard folders and custom folder names
export type EmailFolder = StandardEmailFolder | string;

// Utility functions for working with email folders
export const EmailFolderUtils = {
  /**
   * Check if a folder name is one of the standard folders
   */
  isStandardFolder(folder: string): folder is StandardEmailFolder {
    return Object.values(StandardEmailFolder).includes(
      folder as StandardEmailFolder
    );
  },

  /**
   * Get all standard folder names
   */
  getStandardFolders(): StandardEmailFolder[] {
    return Object.values(StandardEmailFolder);
  },

  /**
   * Check if a folder is a custom folder (not one of the standard ones)
   */
  isCustomFolder(folder: string): boolean {
    return !this.isStandardFolder(folder);
  },

  /**
   * Normalize folder name for display (capitalize first letter)
   */
  displayName(folder: EmailFolder): string {
    return folder.charAt(0).toUpperCase() + folder.slice(1);
  },
};

// Email compose types
export enum EmailComposeType {
  NEW = 'new',
  REPLY = 'reply',
  REPLY_ALL = 'replyAll',
  FORWARD = 'forward',
}

// Mobile navigation views
export enum MobileView {
  EMAIL_ADDRESSES = 'emailAddresses',
  FOLDERS = 'folders',
  EMAILS = 'emails',
  EMAIL_BODY = 'emailBody',
}

// Medium screen navigation
export enum MediumView {
  LEFT = 'left',
  RIGHT = 'right',
}

// Analytics events
export enum AnalyticsEvent {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  EMAIL_OPEN = 'email_open',
  EMAIL_REPLY = 'email_reply',
  EMAIL_FORWARD = 'email_forward',
  EMAIL_DELETE = 'email_delete',
  EMAIL_STAR = 'email_star',
  EMAIL_COMPOSE = 'email_compose',
  PAGE_VIEW = 'page_view',
  FOLDER_SWITCH = 'folder_switch',
  SUBSCRIPTION_VIEW = 'subscription_view',
  SUBSCRIPTION_PURCHASE = 'subscription_purchase',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  SEARCH_PERFORMED = 'search_performed',
  SETTINGS_CHANGED = 'settings_changed',
  ERROR_OCCURRED = 'error_occurred',
  AB_TEST_VIEWED = 'ab_test_viewed',
  AB_TEST_CONVERTED = 'ab_test_converted',
}

// Email actions
export enum EmailAction {
  OPEN = 'open',
  REPLY = 'reply',
  FORWARD = 'forward',
  DELETE = 'delete',
  STAR = 'star',
  UNSTAR = 'unstar',
  MARK_READ = 'mark_read',
  MARK_UNREAD = 'mark_unread',
}

// Subscription actions
export enum SubscriptionAction {
  VIEW = 'view',
  PURCHASE = 'purchase',
  CANCEL = 'cancel',
  RESTORE = 'restore',
}

// Network request states
export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Storage types
export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
  MEMORY = 'memory',
}

// Notification types
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

// Email address types
export enum EmailAddressType {
  DIRECT = 'direct',
  ENS = 'ens',
  SNS = 'sns',
  CUSTOM = 'custom',
}

// Mailbox sort orders
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Email sort criteria
export enum EmailSortCriteria {
  DATE = 'date',
  SUBJECT = 'subject',
  FROM = 'from',
  SIZE = 'size',
}

// Mailbox types
export enum MailboxType {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  TRASH = 'trash',
  SPAM = 'spam',
  ARCHIVE = 'archive',
  CUSTOM = 'custom',
}

// Login methods
export enum LoginMethod {
  WALLET = 'wallet',
  EMAIL = 'email',
  SOCIAL = 'social',
}

// Wallet types for analytics
export enum WalletType {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  METAMASK = 'metamask',
  PHANTOM = 'phantom',
  COINBASE = 'coinbase',
  WALLETCONNECT = 'walletconnect',
}

// Network status
export enum NetworkStatus {
  UNKNOWN = 'unknown',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  LIMITED = 'limited',
}

// Connection types
export enum ConnectionType {
  UNKNOWN = 'unknown',
  NONE = 'none',
  WIFI = 'wifi',
  CELLULAR_2G = '2g',
  CELLULAR_3G = '3g',
  CELLULAR_4G = '4g',
  CELLULAR_5G = '5g',
  ETHERNET = 'ethernet',
}

// Connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// Platform types
export enum PlatformType {
  WEB = 'web',
  REACT_NATIVE = 'react_native',
  DESKTOP = 'desktop',
}

// Email validation states
export enum EmailValidationState {
  VALID = 'valid',
  INVALID = 'invalid',
  PENDING = 'pending',
  UNKNOWN = 'unknown',
}

// Feature flags
export enum FeatureFlag {
  AI_SEARCH = 'ai_search',
  SMART_COMPOSE = 'smart_compose',
  ADVANCED_FILTERS = 'advanced_filters',
  DARK_MODE = 'dark_mode',
  NOTIFICATIONS = 'notifications',
  ANALYTICS = 'analytics',
}

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

// Currency types for subscriptions
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
}
