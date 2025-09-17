/**
 * @johnqh/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Business Logic - Core business operations and enums (Goal 4)
export * from './business';

// Dependency Injection - All DI types and interfaces from local di module
export type {
  AdvancedPlatformStorage,
  AnalyticsClient,
  AnalyticsConfig,
  AnalyticsContextProvider,
  AnalyticsEventData,
  AnalyticsEventProperties,
  // Analytics types
  AnalyticsService,
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
  // Network types
  NetworkClient,
  NetworkResponse,
  NetworkRequestOptions,
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

// Re-export enums from local di module
export { AnalyticsEvent, WalletType, StorageType, NetworkError } from './di';

// Re-export common enums and types from @johnqh/types
export {
  // Business enums
  AuthStatus,
  ChainType,
  Theme,
  FontSize,
  StandardEmailFolder,
  EmailFolder,
  EmailComposeType,
  MobileView,
  RequestStatus,
  NotificationType,
  EmailFolderUtils,
  AppAnalyticsEvent,
  EmailAction,
  SubscriptionAction,
  EmailAddressType,
  SortOrder,
  EmailSortCriteria,
  MailboxType,
  PlatformType,
  ConnectionType,
  ConnectionState,
  NetworkStatus,
  EmailValidationState,
  FeatureFlag,
  ErrorType,
  Currency,

  // Constants
  ERROR_MESSAGES,

  // Utility functions
  formatWalletAddress,
  getAddressType,
  AddressType,

  // Business interfaces
  Email,
  Folder,
  MailBox,
} from '@johnqh/types';

// Infrastructure - Network clients only
export * from './network';

// Utilities - General utility functions
export * from './utils';

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
  // UI types
  DocSection,
  EmailListOptions,
  // Service interface types (email and persistence only)
  EmailService,
  GraphQLPaginationInput,
  GraphQLResponse,
  GraphQLWhereInput,
  IndexerCampaign,
  IndexerCampaignsResponse,
  IndexerCampaignStatsResponse,
  IndexerDelegatedToResponse,
  IndexerDelegation,
  IndexerDelegationResponse,
  IndexerEarnMethod,
  IndexerEmailAddress,
  IndexerEmailResponse,
  IndexerEntitlementResponse,
  IndexerHowToEarnResponse,
  IndexerLeaderboardEntry,
  IndexerLeaderboardResponse,
  IndexerMail,
  IndexerMessageResponse,
  IndexerNonceResponse,
  IndexerPointsHistoryEntry,
  IndexerPointsHistoryResponse,
  IndexerPointsSummary,
  IndexerPointsSummaryResponse,
  IndexerPreparedMail,
  IndexerPromoCodeResponse,
  IndexerPromoValidationResponse,
  IndexerPublicStatsResponse,
  IndexerRefereeLoginResponse,
  IndexerReferralResponse,
  IndexerSignatureRequest,
  IndexerSignatureVerification,
  isGraphQLResponse,
  isIndexerEmailResponse,
  // Type guards and validators
  isWildDuckAuthResponse,
  isWildDuckMessage,
  Mailbox,
  MailboxService,
  MockDataProvider,
  PaginationParams,
  PaginationResponse,
  PersistenceOptions,
  PersistenceResult,
  PersistenceService,
  StorageInfo,
  validateEmailAddress,
  validateObjectId,
  validateWalletAddress,
  ValidationError,
  WildDuckAddress,
  WildDuckAddressResponse,
  // API types
  WildDuckAuthRequest,
  WildDuckAuthResponse,
  WildDuckCreateMailboxRequest,
  WildDuckCreateUserRequest,
  WildDuckMessageAddress,
  WildDuckMessageAttachment,
  WildDuckMessageBase,
  WildDuckMessageDetail,
  WildDuckPreAuthRequest,
  WildDuckPreAuthResponse,
  WildDuckSendMessageRequest,
  WildDuckUpdateUserRequest,
  WildDuckUser,
  WildDuckUserResponse,
} from './types';

// Local business types with extensions
export { WalletUserData, User, EmailAddress } from './types/email';
export { WalletEmailAccounts } from '@johnqh/types';
