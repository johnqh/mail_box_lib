/**
 * Centralized type exports for @sudobility/mail_box_lib
 * All interfaces and types are consolidated here
 */

// Email types (primary email interface)
export { EmailAddress, User, WalletUserData } from './email';

// API types (local types only - no re-exports from external packages)
export {
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
