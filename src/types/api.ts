/**
 * @fileoverview Comprehensive API type definitions for 0xmail.box
 * @description Central location for all API types, interfaces, and response formats
 * This file provides complete type safety for WildDuck API
 *
 * Usage:
 * - Import specific types for your components/hooks
 * - All API responses are strongly typed
 * - Includes validation helpers and type guards
 * - Compatible with both REST and GraphQL APIs
 */

import {
  ChainType,
  MailboxSpecialUse,
  Optional,
  WildduckAddress,
  WildduckAddressResponse,
  WildduckAuthenticateRequest,
  WildduckAuthResponse,
  WildduckCreateMailboxRequest,
  WildduckCreateUserRequest,
  WildduckMailbox,
  WildduckMailboxResponse,
  WildduckMessage,
  WildduckMessageAddress,
  WildduckMessageAttachment,
  WildduckMessageBase,
  WildduckMessageDetail,
  WildduckMessageResponse,
  WildduckMessagesResponse,
  WildduckPreAuthRequest,
  WildduckPreAuthResponse,
  WildduckSimpleUserResponse,
  WildduckSubmitMessageRequest,
  WildduckUpdateUserRequest,
  WildduckUser,
} from '@sudobility/types';

// =============================================================================
// COMMON AUTHENTICATION TYPES
// =============================================================================

/**
 * Wallet signature data structure
 */
interface WalletSignature {
  /** The wallet address that signed the message */
  signerAddress: string;
  /** The message that was signed */
  message: string;
  /** The cryptographic signature */
  signature: string;
}

/**
 * Wallet authentication data structure
 */
interface WalletAuth {
  /** The wallet address (optional) */
  walletAddress: Optional<string>;
  /** The wallet signature (optional) */
  signature: Optional<WalletSignature>;
}

/**
 * GraphQL Types
 */
interface GraphQLResponse<T = any> {
  data?: T;
  errors: Optional<
    Array<{
      message: string;
      locations: Optional<Array<{ line: number; column: number }>>;
      path: Optional<(string | number)[]>;
    }>
  >;
}

interface GraphQLPaginationInput {
  first: Optional<number>;
  skip: Optional<number>;
  orderBy: Optional<string>;
  orderDirection: Optional<'asc' | 'desc'>;
}

interface GraphQLWhereInput {
  id: Optional<string>;
  id_in: Optional<string[]>;
  chainId: Optional<number>;
  chainId_in: Optional<number[]>;
  from: Optional<string>;
  from_in: Optional<string[]>;
  to: Optional<string>;
  to_in: Optional<string[]>;
  timestamp_gte: Optional<string>;
  timestamp_lte: Optional<string>;
  blockNumber_gte: Optional<string>;
  blockNumber_lte: Optional<string>;
  isActive: Optional<boolean>;
}

// =============================================================================
// SHARED TYPES AND UTILITIES
// =============================================================================

/**
 * Common API Response Pattern
 */
interface ApiResponse<T = any> {
  success: boolean;
  data: Optional<T>;
  error: Optional<string>;
  message: Optional<string>;
  timestamp: Optional<string>;
}

/**
 * Pagination Types
 */
interface PaginationParams {
  page: Optional<number>;
  limit: Optional<number>;
  offset: Optional<number>;
}

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Chain and Address Types
 */

interface ChainInfo {
  chainId: number;
  name: string;
  type: ChainType;
  rpcUrl: Optional<string>;
  explorerUrl: Optional<string>;
}

/**
 * Email Types (Frontend)
 * These match the frontend Email interface
 */
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | string;
  attachments: Optional<string[]>;
}

/**
 * Email Address Types (Frontend)
 */
interface EmailAddress {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

/**
 * Mailbox Types (Frontend)
 */
interface Mailbox {
  id: string;
  name: string;
  count: number;
  unreadCount: number;
  icon: Optional<string>;
}

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

/**
 * Type guards for runtime type checking
 * Re-exporting from @sudobility/types
 */
export { isWildduckAuthResponse, isWildduckMessage } from '@sudobility/types';

const isGraphQLResponse = (obj: any): obj is GraphQLResponse => {
  return obj && (obj.data !== undefined || obj.errors !== undefined);
};

/**
 * Validation helpers
 */
const validateObjectId = (id: string): boolean => {
  return /^[a-f0-9]{24}$/i.test(id);
};

const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateWalletAddress = (address: string, type: ChainType): boolean => {
  switch (type) {
    case 'evm':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'solana':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    default:
      return false;
  }
};

/**
 * Error types for API operations
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation failed',
    public field?: string
  ) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Request/Response interceptor types
 */
type ApiInterceptor<T = any> = (data: T) => T | Promise<T>;

interface ApiClientConfig {
  baseUrl: string;
  timeout: Optional<number>;
  headers: Optional<Record<string, string>>;
  requestInterceptors: Optional<ApiInterceptor[]>;
  responseInterceptors: Optional<ApiInterceptor[]>;
}

export {
  // Re-export WildDuck types from @sudobility/types
  MailboxSpecialUse,
  WildduckAddress,
  WildduckAddressResponse,
  WildduckAuthenticateRequest,
  WildduckAuthResponse,
  WildduckCreateMailboxRequest,
  WildduckCreateUserRequest,
  WildduckMailbox,
  WildduckMailboxResponse,
  WildduckMessage,
  WildduckMessageAddress,
  WildduckMessageAttachment,
  WildduckMessageBase,
  WildduckMessageDetail,
  WildduckMessageResponse,
  WildduckMessagesResponse,
  WildduckPreAuthRequest,
  WildduckPreAuthResponse,
  WildduckSimpleUserResponse,
  WildduckSubmitMessageRequest,
  WildduckUpdateUserRequest,
  WildduckUser,
  // Local types and utilities
  isGraphQLResponse,
  validateObjectId,
  validateEmailAddress,
  validateWalletAddress,
  ApiError,
  AuthenticationError,
  ValidationError,
  type WalletSignature,
  type WalletAuth,
  type GraphQLResponse,
  type GraphQLPaginationInput,
  type GraphQLWhereInput,
  type ApiResponse,
  type PaginationParams,
  type PaginationResponse,
  type ChainInfo,
  type Email,
  type EmailAddress,
  type Mailbox,
  type ApiClientConfig,
  type ChainType,
  type ApiInterceptor,
};
