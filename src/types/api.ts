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

import { ChainType, Optional } from '@johnqh/types';

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

// =============================================================================
// WILDDUCK API TYPES
// =============================================================================

/**
 * WildDuck Authentication Types
 * Used for blockchain-based authentication with wallet signatures
 */
interface WildDuckAuthRequest {
  username: string;
  signature: string;
  nonce: string;
  scope: Optional<string>;
  token: Optional<boolean>;
  protocol: Optional<string>;
  sess: Optional<string>;
  ip: Optional<string>;
}

interface WildDuckAuthResponse {
  success: boolean;
  id: Optional<string>;
  username: Optional<string>;
  address: Optional<string>;
  scope: Optional<string[]>;
  token: Optional<string>;
  require2fa: Optional<string[]>;
  requirePasswordChange: Optional<boolean>;
  message: Optional<string>;
  error: Optional<string>;
}

interface WildDuckPreAuthRequest {
  username: string;
  scope?: string;
  sess?: string;
  ip?: string;
}

interface WildDuckPreAuthResponse {
  success: boolean;
  id: Optional<string>;
  username: Optional<string>;
  address: Optional<string>;
  scope: Optional<string[]>;
  require2fa: Optional<string[]>;
  requirePasswordChange: Optional<boolean>;
  message: Optional<string>;
  nonce: Optional<string>;
}

/**
 * WildDuck User Management Types
 * For user account creation, updates, and management
 */
interface WildDuckUser {
  id: string;
  username: string;
  name: Optional<string>;
  address: Optional<string>;
  language: Optional<string>;
  retention: Optional<number>;
  quota: Optional<{
    allowed: number;
    used: number;
  }>;
  disabled: boolean;
  suspended: boolean;
  tags: Optional<string[]>;
  hasPasswordSet: Optional<boolean>;
  activated: Optional<boolean>;
  created: Optional<string>;
}

interface WildDuckCreateUserRequest {
  username: string;
  password: Optional<string>;
  address: Optional<string>;
  name: Optional<string>;
  quota: Optional<number>;
  language: Optional<string>;
  retention: Optional<number>;
  tags: Optional<string[]>;
}

interface WildDuckUpdateUserRequest {
  name: Optional<string>;
  quota: Optional<number>;
  language: Optional<string>;
  retention: Optional<number>;
  disabled: Optional<boolean>;
  suspended: Optional<boolean>;
  tags: Optional<string[]>;
}

interface WildDuckUserResponse {
  success: boolean;
  id: Optional<string>;
  error: Optional<string>;
}

/**
 * WildDuck Mailbox Types
 * For email folder/mailbox management
 */
interface WildDuckMailbox {
  id: string;
  name: string;
  path: string;
  specialUse: Optional<
    'Inbox' | 'Sent' | 'Trash' | 'Drafts' | 'Junk' | 'Archive'
  >;
  modifyIndex: number;
  subscribed: boolean;
  hidden: boolean;
  total: Optional<number>;
  unseen: Optional<number>;
  size: Optional<number>;
}

interface WildDuckMailboxResponse {
  success: boolean;
  results: WildDuckMailbox[];
  error: Optional<string>;
}

interface WildDuckCreateMailboxRequest {
  path: string;
  hidden: Optional<boolean>;
  retention: Optional<number>;
}

/**
 * WildDuck Message Types
 * For email message handling and operations
 */
interface WildDuckMessageAddress {
  name: Optional<string>;
  address: string;
}

interface WildDuckMessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  hash: Optional<string>;
}

interface WildDuckMessageBase {
  id: string;
  mailbox: string;
  thread: string;
  from: Optional<WildDuckMessageAddress>;
  to: WildDuckMessageAddress[];
  cc: Optional<WildDuckMessageAddress[]>;
  bcc: Optional<WildDuckMessageAddress[]>;
  subject: string;
  date: string;
  intro: string;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  draft: boolean;
  answered: boolean;
  size: number;
  ha: boolean; // has attachments
}

interface WildDuckMessage extends WildDuckMessageBase {
  attachments: boolean;
}

interface WildDuckMessageDetail extends WildDuckMessageBase {
  user: string;
  html: Optional<string>;
  text: Optional<string>;
  headers: Optional<Record<string, string | string[]>>;
  attachments: WildDuckMessageAttachment[];
  references: Optional<string[]>;
  inReplyTo: Optional<string>;
}

interface WildDuckMessagesResponse {
  success: boolean;
  total: number;
  page: number;
  previousCursor: Optional<string>;
  nextCursor: Optional<string>;
  results: WildDuckMessage[];
  error?: string;
}

interface WildDuckMessageResponse {
  success: boolean;
  data: Optional<WildDuckMessageDetail>;
  error: Optional<string>;
}

interface WildDuckSendMessageRequest {
  from: Optional<string>;
  to: WildDuckMessageAddress[];
  cc: Optional<WildDuckMessageAddress[]>;
  bcc: Optional<WildDuckMessageAddress[]>;
  subject: string;
  text: Optional<string>;
  html: Optional<string>;
  attachments: Optional<
    Array<{
      filename: string;
      content: string | Buffer;
      contentType: Optional<string>;
    }>
  >;
  inReplyTo: Optional<string>;
  references: Optional<string[]>;
}

/**
 * WildDuck Address Types
 * For email address management
 */
interface WildDuckAddress {
  id: string;
  address: string;
  name: Optional<string>;
  main: boolean;
  created: Optional<string>;
  metaData: Optional<any>;
  tags: Optional<string[]>;
}

interface WildDuckAddressResponse {
  success: boolean;
  results: Optional<WildDuckAddress[]>;
  error: Optional<string>;
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
 */
const isWildDuckAuthResponse = (obj: any): obj is WildDuckAuthResponse => {
  return obj && typeof obj.success === 'boolean';
};

const isWildDuckMessage = (obj: any): obj is WildDuckMessage => {
  return obj && typeof obj.id === 'string' && typeof obj.subject === 'string';
};

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
  isWildDuckAuthResponse,
  isWildDuckMessage,
  isGraphQLResponse,
  validateObjectId,
  validateEmailAddress,
  validateWalletAddress,
  ApiError,
  AuthenticationError,
  ValidationError,
  type WalletSignature,
  type WalletAuth,
  type WildDuckAuthRequest,
  type WildDuckAuthResponse,
  type WildDuckPreAuthRequest,
  type WildDuckPreAuthResponse,
  type WildDuckUser,
  type WildDuckCreateUserRequest,
  type WildDuckUpdateUserRequest,
  type WildDuckUserResponse,
  type WildDuckMailbox,
  type WildDuckMailboxResponse,
  type WildDuckCreateMailboxRequest,
  type WildDuckMessageAddress,
  type WildDuckMessageAttachment,
  type WildDuckMessageBase,
  type WildDuckMessage,
  type WildDuckMessageDetail,
  type WildDuckMessagesResponse,
  type WildDuckMessageResponse,
  type WildDuckSendMessageRequest,
  type WildDuckAddress,
  type WildDuckAddressResponse,
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
