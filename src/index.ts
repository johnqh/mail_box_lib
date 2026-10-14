/**
 * @sudobility/mail_box_lib - Shared utilities and common functions for blockchain email projects
 *
 * This file exports only the symbols that are actively used by consumer projects.
 * Unused exports have been removed to reduce bundle size and improve tree-shaking.
 */

// ============================================================================
// BUSINESS LOGIC EXPORTS
// ============================================================================

// Core business operations and hooks
export {
  // Wallet operations
  connectWallet,
  disconnectWallet,
  verifyWallet,

  // Points system
  createPointsService,
  PointsService,
  type PointsServiceConfig,

  // Query management
  queryClient,

  // Core hooks
  useAccountMailboxes,
  useAccountWildduckAuth,
  clearAccountWildduckAuthCache,
  useKYC,
  useCustomAddress,
  useMailAccountSettings,
  useMailApp,
  useMailboxesAndSettings,
  useMailerClaims,
  useMailerClient,
  useMailerContractApproval,
  useMailerTemplates,
  useMailerWebhooks,
  useMailerDelegations,
  useMessage,
  useMessages,
  useMailerPermissions,
  usePoints,
  useWalletPoints,
  useReferralCode,
  useSelectedAccount,
  useSelectedChain,
  useWalletAccounts,
  useWalletDetector,
  useWalletStatus,

  // Constants
  SETTINGS_MAILBOX_ID,

  // React Query
  QueryClientProvider,
  STALE_TIMES,
  useQueryClient,

  // Network Context
  NetworkProvider,
  useNetwork,

  // Types
  Message,
  UserPoints,
  type Wallet,
} from './business';

// ============================================================================
// DEPENDENCY INJECTION EXPORTS (from @sudobility/di)
// ============================================================================

export type {
  // Analytics
  AnalyticsClient,
  AnalyticsContextProvider,
  AnalyticsEventData,
  AnalyticsEventProperties,

  // Configuration
  AppConfig,
  EnvironmentVariables,
  EnvProvider,

  // Network
  PlatformNetwork,

  // Notification
  NotificationCapabilities,
  NotificationConfig,
  NotificationOptions,
  NotificationPermissionResult,
  NotificationResult,
  NotificationService,

  // Storage
  AdvancedPlatformStorage,
  PlatformStorage,
  StorageService,
} from '@sudobility/di';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  // Authentication utilities
  createAuthMessage,
  createSIWEMessage,
  createSolanaSignMessage,

  // Address detection and validation
  detectAddressType,
  isValidAddress,
  isValidBlockchainUsername,

  // Name resolution
  ENSName,
  resolveNameOrAddress,
  SNSName,

  // Format utilities
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatWalletAddress,

  // URL/Search params
  createSearchParams,

  // Document/DOM utilities
  addDocumentEventListener,
  getDocumentElement,
  getDocumentTitle,

  // Notification utilities
  createNotificationHelper,

  // Global state management
  createGlobalState,

  // Wallet utilities
  isWalletAvailable,
  logWalletDiagnostics,

  // Navigation hooks
  useLocation,
  useSearchParams,

  // Referral code management
  ReferralConsumptionHelper,
  createReferralHelper,
  type ReferralStorage,
} from './utils';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export {
  // UI types
  DocSection,

  // Validation
  validateWalletAddress,

  // Persistence
  PersistenceOptions,
  PersistenceResult,
  PersistenceService,
  StorageInfo,
} from './types';

// Local business types with extensions
export { User, WalletUserData } from './types/email';

// ============================================================================
// EMAIL TRANSFORMATION EXPORTS
// ============================================================================

export type {
  TransformationEmailAddress,
  TransformationWalletAccount,
  WalletEmailGroup,
} from './utils/email/email-transformations';

export {
  chainTypeToString,
  flattenEmailGroups,
  transformWalletAccountsToEmailGroups,
} from './utils/email/email-transformations';

// Plus ("+tag") subaddressing helpers
export type { ParsedSubaddress } from './utils/email/plus-addressing';
export {
  parseSubaddress,
  stripSubaddressTag,
  getSubaddressTag,
  hasSubaddressTag,
  buildSubaddress,
  sameBaseAddress,
} from './utils/email/plus-addressing';

// From-identity selection (compose / reply)
export type {
  FromIdentity,
  FromIdentityAccount,
  FromIdentityKind,
  ReplyFromOptions,
} from './utils/email/from-identity';
export {
  buildFromIdentities,
  classifyIdentityKind,
  defaultFromIdentity,
  findIdentityForAddress,
  replyFromAddress,
} from './utils/email/from-identity';

// ============================================================================
// ATTACHMENT UTILITIES
// ============================================================================

export { convertFileToBase64Attachment } from './utils/attachment-utils';
