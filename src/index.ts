/**
 * @sudobility/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Business Logic - Core business operations and enums (Goal 4)
export {
  AnalyticsOperations,
  AuthBusinessLogic,
  ChainClaimInfo,
  ClaimablePoints,
  connectWallet,
  createQueryClient,
  createQueryKey,
  DefaultAnalyticsOperations,
  DefaultAuthBusinessLogic,
  // Core Business Logic
  DefaultFolderOperations,
  DefaultNavigationOperations,
  disconnectWallet,
  // Helper Types
  EmailAddressBusinessLogic,
  EmailAddressHelper,
  ENSResolutionResponse,
  FolderInfo,
  FolderOperations,
  getGlobalQueryClient,
  getQueryClient,
  getServiceKeys,
  getWalletAddress,
  // Wallet Status Management
  getWalletStatus,
  initializeQueryClient,
  LeaderboardEntry,
  // Message Types
  Message,
  messageFromDetailedResponse,
  messageFromListItem,
  NavigationOperations,
  NavigationStateManager,
  ParsedEmailAddress,
  PointsAction,
  // Points System
  pointsService,
  PointsService,
  queryClient,
  // Context
  QueryClientProvider,
  QueryKey,
  // Query Management
  queryKeys,
  ReferralLink,
  SiteStats,
  SNSResolutionResponse,
  STALE_TIMES,
  useAccountMailboxes,
  UseAccountMailboxesReturn,
  // Utility Hooks
  useArrayState,
  // Core Hooks
  useAsync,
  useAsyncOperation,
  UseAsyncOperationOptions,
  UseAsyncOperationReturn,
  useBatchedState,
  useChangedValues,
  useClaimableRewards,
  UseClaimableRewardsConfig,
  UseClaimableRewardsReturn,
  // Contract Hooks
  useContractConfig,
  UseContractConfigReturn,
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useENSFromWallet,
  useGlobalSelectedAccount,
  useGlobalSelectedMailboxId,
  useGlobalSelectedMessageId,
  useGlobalWalletAccounts,
  useGlobalWildduckAuth,
  // KYC Hooks
  useKYC,
  useLocalStorage,
  useMailboxMessages,
  UseMailboxMessagesReturn,
  useMailerClient,
  UseMailerClientOptions,
  UseMailerClientReturn,
  useMailTemplates,
  UseMailTemplatesConfig,
  UseMailTemplatesReturn,
  useMailWebhooks,
  UseMailWebhooksConfig,
  UseMailWebhooksReturn,
  useMapState,
  useMessage,
  UseMessageReturn,
  useMessages,
  UseMessagesParams,
  UseMessagesReturn,
  // Name Service Hooks
  useNameServiceResolution,
  useOptimizedState,
  usePoints,
  UsePointsConfig,
  UsePointsReturn,
  usePrevious,
  useQueryClient,
  useRecipientClaims,
  UseRecipientClaimsConfig,
  UseRecipientClaimsReturn,
  useReferralCode,
  UseReferralCodeReturn,
  useReferralShare,
  UseReferralShareReturn,
  UserPoints,
  UserPointsBalance,
  UserProperties,
  useSelectedAccount,
  useSNSFromWallet,
  useWalletAccounts,
  useWalletAddress,
  useWalletConnectionState,
  useWalletDetector,
  UseWalletDetectorReturn,
  useWalletFromENS,
  useWalletFromSNS,
  // Wallet Hooks
  useWalletStatus,
  UseWalletStatusReturn,
  verifyWallet,
  WalletInfo,
  WalletResolutionResponse,
} from './business';

// Platform Types no longer exported - use direct DI instead

// Dependency Injection - All DI types and interfaces from local di module
export type {
  AdvancedPlatformStorage,
  AnalyticsClient,
  AnalyticsContextProvider,
  AnalyticsEventData,
  AnalyticsEventProperties,
  AppConfig,
  EnvironmentVariables,
  // Environment types
  EnvProvider,
  LocationHook,
  NavigationConfig,
  NavigationHook,
  NavigationOptions,
  // Navigation types
  NavigationService,
  NavigationState,
  NotificationCapabilities,
  NotificationClient,
  NotificationConfig,
  NotificationContextProvider,
  NotificationOptions,
  NotificationPermissionResult,
  NotificationResult,
  // Notification types
  NotificationService,
  // Storage types
  PlatformStorage,
  SerializedStorageService,
  StorageProvider,
  StorageService,
} from './di';

// Infrastructure - Network clients moved to dedicated packages

// Utilities - General utility functions
export {
  addDocumentEventListener,
  appendToDocumentHead,
  // Direct Utils
  AppError,
  // Contract Utils
  ClaimableInfo,
  clearAllGlobalStates,
  createAuthMessage,
  createDocumentElement,
  // React Utils
  createGlobalState,
  createMailerContract,
  createMailServiceContract,
  // Notification Utils
  createNotificationHelper,
  // URL/Search Params Utils
  createSearchParams,
  createSIWEMessage,
  createSolanaSignMessage,
  createURLSearchParams,
  DelegationResult,
  detectAddressType,
  // Name Service Utils
  ENSName,
  formatCurrency,
  formatEmailDate,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatWalletAddress,
  generateWalletDiagnostics,
  getDisplayTextForResolution,
  getDocumentElement,
  getDocumentElementById,
  getDocumentHead,
  getDocumentTitle,
  getENSNames,
  getErrorMessage,
  getGlobalState,
  getMailerContract,
  getMailServiceContract,
  // Navigation Utils
  getNavigationService,
  getSNSNames,
  getWalletCapabilities,
  handleApiError,
  isAppError,
  isDOMSupported,
  isValidAddress,
  isValidBlockchainUsername,
  isWalletAvailable,
  isWebEnvironment,
  logError,
  logWalletDiagnostics,
  MAIL_SERVICE_ABI,
  MAIL_SERVICE_CONTRACT_ADDRESS,
  MAILER_ABI,
  MAILER_CONTRACT_ADDRESS,
  MailerContract,
  MailResult,
  MailServiceContract,
  NameResolutionResult,
  navigationHelper,
  needsChainSelection,
  parseSearchParams,
  resetGlobalState,
  resolveENSName,
  resolveNameOrAddress,
  resolveSNSDomain,
  resolveSNSName,
  retryWithBackoff,
  searchParamsToString,
  setDocumentTitle,
  setGlobalState,
  // Auth Utils
  SigninMessage,
  SNSName,
  testENSResolution,
  URLSearchParamsLike,
  USDC_ABI,
  USDC_CONTRACT_ADDRESS,
  useLocation,
  useNavigation,
  useSearchParams,
  validateENSName,
  validateNameOrAddressInput,
  validateSNSName,
  // Blockchain Utils
  WalletCapability,
  WalletDebugInfo,
  withErrorBoundary,
} from './utils';

// Types - Selective exports to avoid conflicts (Goal 1)
// Export main email/API types but let business logic take precedence for enums
export {
  ApiClientConfig,
  // Error types
  ApiError,
  // Configuration types
  ApiInterceptor,
  ApiResponse,
  AuthenticationError,
  ChainInfo,
  // Blockchain types
  ClaimableReward,
  ClaimRewardResult,
  // UI types
  DocSection,
  GraphQLPaginationInput,
  GraphQLWhereInput,
  isGraphQLResponse,
  // Type guards and validators
  MailboxSpecialUse,
  PersistenceOptions,
  PersistenceResult,
  PersistenceService,
  StorageInfo,
  validateEmailAddress,
  validateObjectId,
  validateWalletAddress,
  ValidationError,
  WildduckMailbox,
} from './types';

// Local business types with extensions
export { EmailAddress, User, WalletUserData } from './types/email';

// Email transformation utilities
export type {
  TransformationEmailAddress,
  TransformationWalletAccount,
  WalletEmailGroup,
} from './utils/email/email-transformations';

export {
  chainTypeToString,
  flattenEmailGroups,
  transformWalletAccountsToEmailGroups,
  transformWildDuckAccountsToWalletAccounts,
} from './utils/email/email-transformations';

// Attachment utilities
export {
  convertFilesToBase64Attachments,
  convertFileToBase64Attachment,
} from './utils/attachment-utils';
