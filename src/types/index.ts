/**
 * Centralized type exports for @johnqh/lib
 * All interfaces and types are consolidated here
 */

// Environment types
export * from './environment';

// Infrastructure types
export * from './infrastructure/network';

// Email types (primary email interface)
export {
  Email,
  EmailAddress,
  Folder,
  User,
  WalletUserData,
  Theme,
  FontSize,
} from './email';

// API types (with aliased exports to avoid conflicts)
export {
  WalletSignature,
  WalletAuth,
  WildDuckAuthRequest,
  WildDuckAuthResponse,
  WildDuckPreAuthRequest,
  WildDuckPreAuthResponse,
  WildDuckUser,
  WildDuckCreateUserRequest,
  WildDuckUpdateUserRequest,
  WildDuckUserResponse,
  WildDuckMailbox,
  WildDuckMailboxResponse,
  WildDuckCreateMailboxRequest,
  WildDuckMessageAddress,
  WildDuckMessageAttachment,
  WildDuckMessageBase,
  WildDuckMessage,
  WildDuckMessageDetail,
  WildDuckMessagesResponse,
  WildDuckMessageResponse,
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
  IndexerWebhookEmailSentRequest,
  IndexerWebhookRecipientLoginRequest,
  IndexerWebhookLoginRequest,
  GraphQLResponse,
  GraphQLPaginationInput,
  GraphQLWhereInput,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  ChainInfo,
  Email as ApiEmail,
  EmailAddress as ApiEmailAddress,
  Mailbox as ApiMailbox,
  isWildDuckAuthResponse,
  isWildDuckMessage,
  isIndexerEmailResponse,
  isGraphQLResponse,
  validateObjectId,
  validateEmailAddress,
  validateWalletAddress,
  ApiError,
  AuthenticationError,
  ValidationError,
  ApiInterceptor,
  ApiClientConfig,
} from './api';

// Service types
export * from './services';

// Business domain types
export * from './business/ui';

// Mailbox types
export * from './mailbox';

// WildDuck shared types
export * from './wildduck';

// Common types and validation utilities
export * from './common';

// IndexerClient API response types
export * from './api/indexer-responses';
