/**
 * @johnqh/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Business Logic - Core business operations and enums (Goal 4)
export * from './business';

// Dependency Injection - Interfaces only (Goal 2) - Selective exports to avoid conflicts
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
} from '@johnqh/di';

// Re-export enums from @johnqh/di that were removed from local definitions
export { AnalyticsEvent, WalletType, StorageType } from '@johnqh/di';

// Infrastructure - Separated networking and storage logic (Goal 3)
export * from './network';
export * from './storage';

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
  Email,
  EmailAddress,
  EmailListOptions,
  // Service interface types (email and persistence only)
  EmailService,
  Folder,
  FontSize,
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
  Theme,
  User,
  validateEmailAddress,
  validateObjectId,
  validateWalletAddress,
  ValidationError,
  WalletUserData,
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
