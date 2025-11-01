/**
 * @sudobility/lib - Shared utilities and common functions for 0xmail.box projects
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
  pointsService,

  // Query management
  queryClient,

  // Core hooks
  useAccountMailboxes,
  useGlobalWalletAccounts,
  useKYC,
  useMailerContractApproval,
  useMailTemplates,
  useMailWebhooks,
  useMessage,
  useMessages,
  usePoints,
  useRecipientClaims,
  useSelectedAccount,
  useWalletAccounts,
  useWalletDetector,
  useWalletStatus,

  // React Query
  QueryClientProvider,
  STALE_TIMES,
  useQueryClient,

  // Types
  Message,
  UserPoints,
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

  // Smart contract utilities
  createMailServiceContract,

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

// ============================================================================
// ATTACHMENT UTILITIES
// ============================================================================

export { convertFileToBase64Attachment } from './utils/attachment-utils';
