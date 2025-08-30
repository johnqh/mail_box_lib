/**
 * Centralized type exports for @0xmail/lib
 * All interfaces and types are consolidated here
 */

// Environment types
export * from './environment';

// Network types
export * from './network';

// Storage types
export * from './storage';

// Navigation types
export * from './navigation';

// Analytics types
export * from './analytics';

// Notification types
export * from './notification';

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
  IndexerMail,
  IndexerPreparedMail,
  IndexerDelegation,
  IndexerUserPoints,
  IndexerLeaderboardEntry,
  IndexerLeaderboardResponse,
  IndexerPointsActivity,
  IndexerCampaign,
  IndexerCampaignsResponse,
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
