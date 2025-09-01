/**
 * @johnqh/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Business Logic - Core business operations and enums (Goal 4)
export * from './business';

// Dependency Injection - Interfaces only (Goal 2) - Selective exports to avoid conflicts
export type {
  // Environment types
  EnvProvider,
  AppConfig,
  EnvironmentVariables,
  // Auth types
  AuthService,
  AuthStorageService,
  AuthEmailAddressService,
  AuthManager,
  WalletUserData,
  // Analytics types
  AnalyticsService,
  AnalyticsClient,
  AnalyticsContextProvider,
  AnalyticsEventData,
  AnalyticsConfig,
  AnalyticsEventProperties,
  // Navigation types
  NavigationService,
  NavigationOptions,
  NavigationConfig,
  NavigationHook,
  LocationHook,
  NavigationState,
  // Notification types
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationPermissionResult,
  NotificationCapabilities,
  NotificationConfig,
  NotificationClient,
  NotificationContextProvider,
  // Storage types
  PlatformStorage,
  AdvancedPlatformStorage,
  StorageProvider,
  StorageService,
  SerializedStorageService,
} from './di';

// Infrastructure - Separated networking and storage logic (Goal 3)
export * from './network';
export * from './storage';

// Utilities - General utility functions
export * from './utils';

// Types - Selective exports to avoid conflicts (Goal 1)
// Export main email/API types but let business logic take precedence for enums
export {
  Email,
  EmailAddress,
  Folder,
  User,
  Theme,
  FontSize,
  // API types
  WildDuckAuthRequest,
  WildDuckAuthResponse,
  WildDuckPreAuthRequest,
  WildDuckPreAuthResponse,
  WildDuckUser,
  WildDuckCreateUserRequest,
  WildDuckUpdateUserRequest,
  WildDuckUserResponse,
  WildDuckCreateMailboxRequest,
  WildDuckMessageAddress,
  WildDuckMessageAttachment,
  WildDuckMessageBase,
  WildDuckMessageDetail,
  WildDuckSendMessageRequest,
  WildDuckAddress,
  WildDuckAddressResponse,
  IndexerEmailAddress,
  IndexerEmailResponse,
  IndexerSignatureRequest,
  IndexerSignatureVerification,
  IndexerDelegationResponse,
  IndexerDelegatedToResponse,
  IndexerMessageResponse,
  IndexerNonceResponse,
  IndexerEntitlementResponse,
  IndexerMail,
  IndexerPreparedMail,
  IndexerDelegation,
  IndexerEarnMethod,
  IndexerHowToEarnResponse,
  IndexerPublicStatsResponse,
  IndexerPointsSummary,
  IndexerPointsSummaryResponse,
  IndexerPointsHistoryEntry,
  IndexerPointsHistoryResponse,
  IndexerPromoCodeResponse,
  IndexerPromoValidationResponse,
  IndexerReferralResponse,
  IndexerRefereeLoginResponse,
  IndexerLeaderboardEntry,
  IndexerLeaderboardResponse,
  IndexerCampaign,
  IndexerCampaignsResponse,
  IndexerCampaignStatsResponse,
  GraphQLResponse,
  GraphQLPaginationInput,
  GraphQLWhereInput,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  ChainInfo,
  // Type guards and validators
  isWildDuckAuthResponse,
  isWildDuckMessage,
  isIndexerEmailResponse,
  isGraphQLResponse,
  validateObjectId,
  validateEmailAddress,
  validateWalletAddress,
  // Error types
  ApiError,
  AuthenticationError,
  ValidationError,
  // Configuration types
  ApiInterceptor,
  ApiClientConfig,
  // UI types
  DocSection,
  // Service interface types (email and persistence only)
  EmailService,
  MailboxService,
  EmailAddressService,
  EmailListOptions,
  Mailbox,
  MockDataProvider,
  PersistenceService,
  PersistenceOptions,
  PersistenceResult,
  StorageInfo,
} from './types';
