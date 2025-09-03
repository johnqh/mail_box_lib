/**
 * Centralized type exports for @johnqh/lib
 * All interfaces and types are consolidated here
 */

// Environment types
export * from './environment';

// Network types
export * from './network';

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

// UI types
export * from './ui';
