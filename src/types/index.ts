/**
 * Centralized type exports for @sudobility/lib
 * All interfaces and types are consolidated here
 */

// Environment types
export * from './environment';

// Email types (primary email interface)
export { EmailAddress, User, WalletUserData, Theme, FontSize } from './email';

// API types (with aliased exports to avoid conflicts)
export {
  MailboxSpecialUse,
  WildduckAuthenticateRequest,
  WildduckAuthResponse,
  WildduckPreAuthRequest,
  WildduckPreAuthResponse,
  WildduckUser,
  WildduckCreateUserRequest,
  WildduckUpdateUserRequest,
  WildduckSimpleUserResponse,
  WildduckMailbox,
  WildduckMailboxResponse,
  WildduckCreateMailboxRequest,
  WildduckMessageAddress,
  WildduckMessageAttachment,
  WildduckMessageBase,
  WildduckMessage,
  WildduckMessageDetail,
  WildduckMessagesResponse,
  WildduckMessageResponse,
  WildduckSubmitMessageRequest,
  WildduckAddress,
  WildduckAddressResponse,
  GraphQLResponse,
  GraphQLPaginationInput,
  GraphQLWhereInput,
  ApiResponse,
  ChainInfo,
  isWildduckAuthResponse,
  isWildduckMessage,
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

// Common types and validation utilities
export * from './common';

// Blockchain types
export * from './blockchain';

// IndexerClient API response types are now in @sudobility/types
// WildDuck types are now in @sudobility/wildduck_client
