/**
 * @0xmail/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Business Logic - Core business operations and enums (Goal 4)
export * from './business';

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
  WalletUserData,
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
  // Service interface types
  AuthManager,
  AuthService,
  AuthStorageService,
  AuthEmailAddressService,
  EmailService,
  MailboxService,
  EmailAddressService,
  EmailListOptions,
  Mailbox,
  MockDataProvider,
  StorageService,
  SerializedStorageService,
  AnalyticsService,
  AnalyticsClient,
  AnalyticsContextProvider,
  AnalyticsEventData,
  AnalyticsConfig,
  AnalyticsEventProperties,
  PersistenceService,
  PersistenceOptions,
  PersistenceResult,
  StorageInfo,
  // Environment types
  AppConfig,
  EnvironmentVariables,
  EnvProvider,
  // Storage types
  PlatformStorage,
  AdvancedPlatformStorage,
  StorageProvider,
} from './types';
