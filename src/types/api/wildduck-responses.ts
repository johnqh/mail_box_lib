/**
 * @fileoverview WildDuckAPI Response Types
 * @description TypeScript interfaces for all WildDuck API responses
 * @version 1.6.0+
 *
 * This file provides type safety for all WildDuckAPI network calls,
 * based on the actual API implementations in WildDuck server
 */

// ========================================
// Base Response Types
// ========================================

/**
 * Base response format used by all WildDuck endpoints
 */
export interface BaseWildDuckResponse {
  success: boolean;
}

/**
 * Error response format
 */
export interface WildDuckErrorResponse extends BaseWildDuckResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Quota information
 */
export interface Quota {
  allowed: number; // Allowed quota in bytes
  used: number; // Space used in bytes
}

/**
 * Pagination response structure
 */
export interface PaginationInfo {
  total: number;
  page: number;
  previousCursor: string | false;
  nextCursor: string | false;
}

// ========================================
// Authentication Types
// ========================================

/**
 * Pre-authentication response
 * POST /preauth
 */
export interface PreAuthResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
  username: string;
  address: string;
  scope: string;
}

/**
 * Authentication response (blockchain & password)
 * POST /authenticate
 */
export interface AuthenticationResponse extends BaseWildDuckResponse {
  success: true;
  token?: string;
  id: string;
  username: string;
  address: string;
  scope: string;
}

// ========================================
// User Types
// ========================================

/**
 * WildDuck user data structure
 */
export interface WildDuckUserData {
  id: string;
  username: string;
  name: string;
  tags: string[];
  targets: string[];
  autoreply: boolean;
  encryptMessages: boolean;
  encryptForwarded: boolean;
  quota: Quota;
  metaData?: Record<string, any>;
  internalData?: Record<string, any>;
  hasBlockchainAuth: boolean;
  activated: boolean;
  disabled: boolean;
  suspended: boolean;
}

/**
 * Get users list response
 * GET /users
 */
export interface GetUsersResponse extends BaseWildDuckResponse, PaginationInfo {
  success: true;
  query: string;
  results: WildDuckUserData[];
}

/**
 * Get single user response
 * GET /users/:id
 */
export interface GetUserResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
  username: string;
  name: string;
  address: string;
  language: string;
  retention: number;
  enabled2fa: string[];
  autoreply: boolean;
  encryptMessages: boolean;
  encryptForwarded: boolean;
  pubKey: string;
  keyInfo?: {
    name: string;
    address: string;
    fingerprint: string;
  };
  metaData?: Record<string, any>;
  internalData?: Record<string, any>;
  targets: string[];
  spamLevel: number;
  quota: Quota;
  hasPasswordSet: boolean;
  activated: boolean;
  disabled: boolean;
  suspended: boolean;
  tags: string[];
  disabledScopes: string[];
  hasBlockchainAuth: boolean;
  fromWhitelist: string[];
}

/**
 * Create user response
 * POST /users
 */
export interface CreateUserResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
}

/**
 * Update user response
 * PUT /users/:id
 */
export interface UpdateUserResponse extends BaseWildDuckResponse {
  success: true;
}

/**
 * Delete user response
 * DELETE /users/:id
 */
export interface DeleteUserResponse extends BaseWildDuckResponse {
  success: true;
}

// ========================================
// Mailbox Types
// ========================================

/**
 * Mailbox data structure
 */
export interface MailboxData {
  id: string;
  name: string;
  path: string;
  specialUse?: string;
  modifyIndex: number;
  subscribed: boolean;
  total: number;
  unseen: number;
  size: number;
}

/**
 * Get mailboxes response
 * GET /users/:id/mailboxes
 */
export interface GetMailboxesResponse extends BaseWildDuckResponse {
  success: true;
  results: MailboxData[];
}

/**
 * Get single mailbox response
 * GET /users/:id/mailboxes/:mailbox
 */
export interface GetMailboxResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
  name: string;
  path: string;
  specialUse?: string;
  modifyIndex: number;
  subscribed: boolean;
  total: number;
  unseen: number;
  size: number;
  retention: number;
}

/**
 * Create mailbox response
 * POST /users/:id/mailboxes
 */
export interface CreateMailboxResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
}

/**
 * Update mailbox response
 * PUT /users/:id/mailboxes/:mailbox
 */
export interface UpdateMailboxResponse extends BaseWildDuckResponse {
  success: true;
}

/**
 * Delete mailbox response
 * DELETE /users/:id/mailboxes/:mailbox
 */
export interface DeleteMailboxResponse extends BaseWildDuckResponse {
  success: true;
}

// ========================================
// Message Types
// ========================================

/**
 * Message address information
 */
export interface MessageAddress {
  name: string;
  address: string;
}

/**
 * Message attachment information
 */
export interface MessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  related: boolean;
  sizeKb: number;
}

/**
 * Message envelope information
 */
export interface MessageEnvelope {
  date: string;
  subject: string;
  from: MessageAddress[];
  to?: MessageAddress[];
  cc?: MessageAddress[];
  bcc?: MessageAddress[];
  messageId: string;
  inReplyTo?: string;
}

/**
 * Message data structure (list view)
 */
export interface MessageData {
  id: string;
  mailbox: string;
  thread: string;
  envelope: MessageEnvelope;
  date: string;
  idate: string;
  size: number;
  intro: string;
  attachments: boolean;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  draft: boolean;
  answered: boolean;
  forwarded: boolean;
  references: string[];
  bimi?: {
    domain: string;
    selector: string;
    indicator: string;
  };
}

/**
 * Message detail structure (single message view)
 */
export interface MessageDetailData {
  id: string;
  mailbox: string;
  thread: string;
  envelope: MessageEnvelope;
  date: string;
  idate: string;
  size: number;
  intro: string;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  draft: boolean;
  answered: boolean;
  forwarded: boolean;
  references: string[];
  bimi?: {
    domain: string;
    selector: string;
    indicator: string;
  };
  source: string;
  html: string[];
  text: string;
  attachments: MessageAttachment[];
  encrypted: boolean;
  verificationResults?: {
    spf: string;
    dkim: string;
    dmarc: string;
  };
}

/**
 * Get messages response
 * GET /users/:id/mailboxes/:mailbox/messages
 */
export interface GetMessagesResponse
  extends BaseWildDuckResponse,
    PaginationInfo {
  success: true;
  results: MessageData[];
}

/**
 * Get single message response
 * GET /users/:id/mailboxes/:mailbox/messages/:message
 * GET /users/:id/messages/:message
 */
export interface GetMessageResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
  mailbox: string;
  user: string;
  envelope: MessageEnvelope;
  thread: string;
  date: string;
  idate: string;
  size: number;
  subject: string;
  from: MessageAddress;
  replyTo: MessageAddress[];
  to: MessageAddress[];
  cc: MessageAddress[];
  bcc: MessageAddress[];
  messageId: string;
  inReplyTo: string;
  flags: string[];
  labels: string[];
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  draft: boolean;
  html: string[];
  text: string;
  attachments: MessageAttachment[];
  encrypted: boolean;
  verificationResults?: {
    spf: string;
    dkim: string;
    dmarc: string;
  };
  bimi?: {
    domain: string;
    selector: string;
    indicator: string;
  };
  contentType: {
    value: string;
    params: Record<string, string>;
  };
  transferEncoding: string;
  bodyStructure?: any;
  source?: string;
}

/**
 * Update message response
 * PUT /users/:id/mailboxes/:mailbox/messages/:message
 */
export interface UpdateMessageResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
  mailbox: string;
  modseq: number;
}

/**
 * Delete message response
 * DELETE /users/:id/mailboxes/:mailbox/messages/:message
 */
export interface DeleteMessageResponse extends BaseWildDuckResponse {
  success: true;
}

/**
 * Send message response
 * POST /users/:id/submit
 */
export interface SendMessageResponse extends BaseWildDuckResponse {
  success: true;
  message: {
    id: string;
    mailbox: string;
    queueId: string;
  };
}

// ========================================
// Address Types
// ========================================

/**
 * Address data structure
 */
export interface AddressData {
  id: string;
  name: string;
  address: string;
  main: boolean;
  created: string;
}

/**
 * Get addresses response
 * GET /users/:id/addresses
 */
export interface GetAddressesResponse extends BaseWildDuckResponse {
  success: true;
  results: AddressData[];
}

/**
 * Create address response
 * POST /users/:id/addresses
 */
export interface CreateAddressResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
}

/**
 * Update address response
 * PUT /users/:id/addresses/:address
 */
export interface UpdateAddressResponse extends BaseWildDuckResponse {
  success: true;
}

/**
 * Delete address response
 * DELETE /users/:id/addresses/:address
 */
export interface DeleteAddressResponse extends BaseWildDuckResponse {
  success: true;
}

// ========================================
// Filter Types
// ========================================

/**
 * Filter condition structure
 */
export interface FilterCondition {
  key: string;
  value: string;
  type: 'text' | 'regex';
  case?: boolean;
}

/**
 * Filter action structure
 */
export interface FilterAction {
  type: 'move' | 'reject' | 'forward' | 'reply' | 'delete';
  value?: string;
  message?: string;
}

/**
 * Filter data structure
 */
export interface FilterData {
  id: string;
  name: string;
  query: FilterCondition[];
  action: FilterAction;
  disabled: boolean;
  created: string;
}

/**
 * Get filters response
 * GET /users/:id/filters
 */
export interface GetFiltersResponse extends BaseWildDuckResponse {
  success: true;
  results: FilterData[];
}

/**
 * Create filter response
 * POST /users/:id/filters
 */
export interface CreateFilterResponse extends BaseWildDuckResponse {
  success: true;
  id: string;
}

// ========================================
// Autoreply Types
// ========================================

/**
 * Autoreply data structure
 */
export interface AutoreplyData {
  status: boolean;
  name: string;
  subject: string;
  text: string;
  html: string;
  start: string;
  end: string;
}

/**
 * Get autoreply response
 * GET /users/:id/autoreply
 */
export interface GetAutoreplyResponse extends BaseWildDuckResponse {
  success: true;
  status: boolean;
  name?: string;
  subject?: string;
  text?: string;
  html?: string;
  start?: string;
  end?: string;
}

/**
 * Update autoreply response
 * PUT /users/:id/autoreply
 */
export interface UpdateAutoreplyResponse extends BaseWildDuckResponse {
  success: true;
}

// ========================================
// Union Types for API Methods
// ========================================

/**
 * All possible WildDuck API response types for type-safe error handling
 */
export type WildDuckApiResponse =
  | PreAuthResponse
  | AuthenticationResponse
  | GetUsersResponse
  | GetUserResponse
  | CreateUserResponse
  | UpdateUserResponse
  | DeleteUserResponse
  | GetMailboxesResponse
  | GetMailboxResponse
  | CreateMailboxResponse
  | UpdateMailboxResponse
  | DeleteMailboxResponse
  | GetMessagesResponse
  | GetMessageResponse
  | UpdateMessageResponse
  | DeleteMessageResponse
  | SendMessageResponse
  | GetAddressesResponse
  | CreateAddressResponse
  | UpdateAddressResponse
  | DeleteAddressResponse
  | GetFiltersResponse
  | CreateFilterResponse
  | GetAutoreplyResponse
  | UpdateAutoreplyResponse;

/**
 * Error types that can be returned by the API
 */
export type WildDuckApiError = WildDuckErrorResponse | { error: string };
