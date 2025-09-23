/**
 * @fileoverview Comprehensive API type definitions for 0xmail.box
 * @description Central location for all API types, interfaces, and response formats
 * This file provides complete type safety for both WildDuck and Indexer APIs
 *
 * Usage:
 * - Import specific types for your components/hooks
 * - All API responses are strongly typed
 * - Includes validation helpers and type guards
 * - Compatible with both REST and GraphQL APIs
 */

import { ChainType } from '@johnqh/types';

// =============================================================================
// INDEXER API TYPES (v2.0.0+)
// =============================================================================

/**
 * Standard API response wrapper for indexer endpoints
 */
interface IndexerApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

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
  walletAddress?: string;
  /** The wallet signature (optional) */
  signature?: WalletSignature;
}

/**
 * Signature-protected API request base interface
 * All signature-protected endpoints extend this
 */
interface SignatureProtectedRequest {
  /** Wallet address (EVM 0x format or Solana Base58) */
  walletAddress: string;
  /** Cryptographic signature proving wallet ownership */
  signature: string;
  /** Message that was signed for verification */
  message: string;
}

/**
 * Note: ChainType is imported from @johnqh/types
 */

/**
 * Email retrieval API request
 * POST /emails
 */
type GetEmailsRequest = SignatureProtectedRequest;

/**
 * Email addresses response
 */
interface GetEmailsResponse {
  walletAddress: string;
  addressType: ChainType;
  emailAddresses: string[];
  detailedAddresses?: {
    email: string;
    source: string;
    verified?: boolean;
  }[];
  totalCount: number;
  hasNameService: boolean;
  verified: boolean;
  timestamp: string;
}

/**
 * Delegation retrieval API request
 * POST /delegated
 */
type GetDelegatedRequest = SignatureProtectedRequest;

/**
 * Delegation response
 */
interface GetDelegatedResponse {
  walletAddress: string;
  addressType: ChainType;
  delegatedTo: string | null;
  chainId: number | null;
  verified: boolean;
  timestamp: string;
}

/**
 * Get addresses delegated TO a wallet - API request
 * POST /api/delegations/to
 */
type GetDelegatedToRequest = SignatureProtectedRequest;

/**
 * Response for addresses that have delegated to a wallet
 */
interface GetDelegatedToResponse {
  walletAddress: string;
  addressType: ChainType;
  delegators: Array<{
    delegatorAddress: string;
    isActive: boolean;
    chainId: number;
  }>;
  totalDelegators: number;
  verified: boolean;
  timestamp: string;
}

/**
 * Validate username format endpoint
 * GET /api/users/:username/validate
 */
interface ValidateAddressResponse {
  isValid: boolean;
  addressType: ChainType;
  normalizedAddress: string;
  formats?: {
    standard: string;
    checksummed?: string;
    compressed?: string;
  };
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Points summary request
 * POST /points/summary
 */
type GetPointsSummaryRequest = SignatureProtectedRequest;

/**
 * Points history request
 * POST /points/history
 */
interface GetPointsHistoryRequest extends SignatureProtectedRequest {
  limit?: number;
  offset?: number;
}

/**
 * Promotional code claim request
 * POST /points/claim-promo
 */
interface ClaimPromoCodeRequest extends SignatureProtectedRequest {
  promoCode: string;
}

/**
 * Referral registration request
 * POST /points/register-referral
 */
interface RegisterReferralRequest extends SignatureProtectedRequest {
  referralCode: string;
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
  scope?: string;
  token?: boolean;
  protocol?: string;
  sess?: string;
  ip?: string;
}

interface WildDuckAuthResponse {
  success: boolean;
  id?: string;
  username?: string;
  address?: string;
  scope?: string[];
  token?: string;
  require2fa?: string[];
  requirePasswordChange?: boolean;
  message?: string;
  error?: string;
}

interface WildDuckPreAuthRequest {
  username: string;
  scope?: string;
  sess?: string;
  ip?: string;
}

interface WildDuckPreAuthResponse {
  success: boolean;
  id?: string;
  username?: string;
  address?: string;
  scope?: string[];
  require2fa?: string[];
  requirePasswordChange?: boolean;
  message?: string;
  nonce?: string;
}

/**
 * WildDuck User Management Types
 * For user account creation, updates, and management
 */
interface WildDuckUser {
  id: string;
  username: string;
  name?: string;
  address?: string;
  language?: string;
  retention?: number;
  quota?: {
    allowed: number;
    used: number;
  };
  disabled: boolean;
  suspended: boolean;
  tags?: string[];
  hasPasswordSet?: boolean;
  activated?: boolean;
  created?: string;
}

interface WildDuckCreateUserRequest {
  username: string;
  password?: string;
  address?: string;
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  tags?: string[];
}

interface WildDuckUpdateUserRequest {
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  disabled?: boolean;
  suspended?: boolean;
  tags?: string[];
}

interface WildDuckUserResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * WildDuck Mailbox Types
 * For email folder/mailbox management
 */
interface WildDuckMailbox {
  id: string;
  name: string;
  path: string;
  specialUse?: 'Inbox' | 'Sent' | 'Trash' | 'Drafts' | 'Junk' | 'Archive';
  modifyIndex: number;
  subscribed: boolean;
  hidden: boolean;
  total?: number;
  unseen?: number;
  size?: number;
}

interface WildDuckMailboxResponse {
  success: boolean;
  results: WildDuckMailbox[];
  error?: string;
}

interface WildDuckCreateMailboxRequest {
  path: string;
  hidden?: boolean;
  retention?: number;
}

/**
 * WildDuck Message Types
 * For email message handling and operations
 */
interface WildDuckMessageAddress {
  name?: string;
  address: string;
}

interface WildDuckMessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  hash?: string;
}

interface WildDuckMessageBase {
  id: string;
  mailbox: string;
  thread: string;
  from?: WildDuckMessageAddress;
  to: WildDuckMessageAddress[];
  cc?: WildDuckMessageAddress[];
  bcc?: WildDuckMessageAddress[];
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
  html?: string;
  text?: string;
  headers?: Record<string, string | string[]>;
  attachments: WildDuckMessageAttachment[];
  references?: string[];
  inReplyTo?: string;
}

interface WildDuckMessagesResponse {
  success: boolean;
  total: number;
  page: number;
  previousCursor?: string;
  nextCursor?: string;
  results: WildDuckMessage[];
  error?: string;
}

interface WildDuckMessageResponse {
  success: boolean;
  data?: WildDuckMessageDetail;
  error?: string;
}

interface WildDuckSendMessageRequest {
  from?: string;
  to: WildDuckMessageAddress[];
  cc?: WildDuckMessageAddress[];
  bcc?: WildDuckMessageAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  inReplyTo?: string;
  references?: string[];
}

/**
 * WildDuck Address Types
 * For email address management
 */
interface WildDuckAddress {
  id: string;
  address: string;
  name?: string;
  main: boolean;
  created?: string;
  metaData?: any;
  tags?: string[];
}

interface WildDuckAddressResponse {
  success: boolean;
  results?: WildDuckAddress[];
  error?: string;
}

// =============================================================================
// INDEXER API TYPES (v2.2.0)
// =============================================================================

/**
 * Indexer Mail API Types
 */
interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated' | 'nameservice';
  source?: string;
  isVerified?: boolean;
}

interface IndexerEmailResponse {
  walletAddress: string;
  addressType: string;
  emailAddresses: string[];
  detailedAddresses: IndexerEmailAddress[];
  totalCount: number;
  hasNameService: boolean;
  verified: boolean;
  timestamp: string;
}

interface IndexerSignatureRequest {
  walletAddress: string;
  signature: string;
  message?: string;
}

interface IndexerSignatureVerification {
  walletAddress: string;
  addressType: string;
  isValid: boolean;
  message: string;
  timestamp: string;
}

interface IndexerDelegationResponse {
  walletAddress: string;
  addressType: string;
  hasDelegation: boolean;
  delegatedTo?: string;
  delegationType?: string;
  isActive?: boolean;
  verified: boolean;
  timestamp: string;
}

interface IndexerDelegatedToResponse {
  walletAddress: string;
  addressType: string;
  delegators: Array<{
    delegatorAddress: string;
    delegationType: string;
    isActive: boolean;
    delegationDate: string;
  }>;
  totalDelegators: number;
  timestamp: string;
}

interface IndexerMessageResponse {
  walletAddress: string;
  addressType: string;
  chainId: number;
  domain: string;
  uri: string;
  messages: {
    deterministic?: string;
    simple?: string;
    solana?: string;
  };
  recommended: string;
  instructions: {
    evm?: string;
    solana?: string;
  };
  verification: {
    endpoint: string;
    method: string;
    body: Record<string, any>;
    note: string;
  };
  timestamp: string;
}

interface IndexerNonceResponse {
  walletAddress: string;
  addressType: string;
  nonce: string;
  createdAt?: string;
  updatedAt?: string;
  message: string;
  timestamp: string;
}

interface IndexerEntitlementResponse {
  walletAddress: string;
  addressType: string;
  entitlement: {
    type: string;
    hasEntitlement: boolean;
    isActive: boolean;
    productIdentifier?: string;
    expiresDate?: string;
    store?: string;
  };
  message: string;
  error?: string;
  timestamp: string;
}

/**
 * Indexer Blockchain Data Types
 * For GraphQL queries and blockchain data
 */
interface IndexerMail {
  id: string;
  chainId: number;
  contractAddress: string;
  from: string;
  to: string;
  subject: string;
  body?: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  gasUsed?: string;
  gasPrice?: string;
}

interface IndexerPreparedMail {
  id: string;
  chainId: number;
  contractAddress: string;
  from: string;
  to: string;
  mailId: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  gasUsed?: string;
  gasPrice?: string;
}

interface IndexerDelegation {
  id: string;
  chainId: number;
  contractAddress: string;
  delegator: string;
  delegate: string;
  isActive: boolean;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
}

/**
 * Indexer Points System Types (v2.2.0)
 */

// How to Earn Points Response
interface IndexerEarnMethod {
  id: string;
  title: string;
  description: string;
  pointsValue: number | string;
  pointsUnit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'advanced' | 'varies';
  category: 'daily' | 'growth' | 'features' | 'milestones' | 'events';
  tips: string;
}

interface IndexerHowToEarnResponse {
  success: boolean;
  data: {
    title: string;
    description: string;
    earnMethods: IndexerEarnMethod[];
    quickStart: {
      title: string;
      steps: Array<{
        step: number;
        title: string;
        description: string;
        action: string;
      }>;
    };
    totalMethods: number;
    estimatedEarningsPerDay: {
      casual: number;
      regular: number;
      power: number;
    };
  };
}

// Public Stats Response
interface IndexerPublicStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    totalPointsAwarded: string;
    topUsersThisWeek: number;
    activeCampaigns: number;
    totalEmailsSent: number;
    totalReferrals: number;
    averagePointsPerUser: number;
    lastUpdated: string;
  };
}

// Points Summary Response
interface IndexerPointsSummary {
  walletAddress: string;
  totalPoints: string;
  availablePoints: string;
  lifetimeEarned: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number | null;
  rank: number | null;
  tier: string;
  nextTierThreshold: string | null;
  recentActivities: Array<{
    id: string;
    activityType: string;
    pointsAmount: string;
    createdAt: number;
    metadata?: Record<string, any>;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: number;
    pointsAwarded: string;
  }>;
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    referralPointsEarned: string;
    referralCode: string;
  };
}

interface IndexerPointsSummaryResponse {
  success: boolean;
  data: {
    pointsSummary: IndexerPointsSummary;
  };
}

// Points History Response
interface IndexerPointsHistoryEntry {
  id: string;
  walletAddress: string;
  transactionType: 'AWARD' | 'DEDUCT' | 'ADJUST' | 'CLAIM';
  pointsAmount: string;
  activityType: string;
  activityReference?: string;
  description: string;
  createdAt: number;
  metadata?: Record<string, any>;
  chainId?: number;
  transactionHash?: string;
  blockNumber?: string;
}

interface IndexerPointsHistoryResponse {
  success: boolean;
  data: {
    transactions: IndexerPointsHistoryEntry[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      totalAwarded: string;
      totalSpent: string;
      netPoints: string;
    };
  };
}

// Promotional Code Types
interface IndexerPromoCodeResponse {
  success: boolean;
  data?: {
    promoCode: string;
    pointsAwarded: string;
    campaignName: string;
    message: string;
    newTotalPoints: string;
    newRank?: number;
  };
  error?: string;
  message?: string;
}

interface IndexerPromoValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    promoCode: string;
    pointsValue: string;
    campaignName: string;
    expiresAt?: number;
    usageInfo: {
      maxClaimsPerUser: number;
      currentUserClaims: number;
      remainingClaims: number;
    };
  };
  error?: string;
  message?: string;
}

// Referral Types
interface IndexerReferralResponse {
  success: boolean;
  data?: {
    referralCode: string;
    isNewReferral: boolean;
    message: string;
  };
  error?: string;
}

interface IndexerRefereeLoginResponse {
  success: boolean;
  data?: {
    pointsAwarded: string;
    referralBonuses: Array<{
      referrerWallet: string;
      pointsAwarded: string;
      bonusType: string;
    }>;
    message: string;
  };
  error?: string;
}

// Leaderboard Types
interface IndexerLeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalPoints: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number | null;
  tier: string;
}

interface IndexerLeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: IndexerLeaderboardEntry[];
    userRank: number | null;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    lastUpdated: number;
  };
}

// Campaign Types
interface IndexerCampaign {
  id: string;
  campaignName: string;
  campaignType:
    | 'promotional_code'
    | 'referral_bonus'
    | 'achievement_unlock'
    | 'seasonal_event';
  isActive: boolean;
  description?: string;
  startTime: number;
  endTime: number;
  pointsPerClaim: number;
  maxClaimsPerUser: number;
  totalClaimsLimit?: number;
  currentClaims: number;
  createdBy?: string;
  createdAt: number;
}

interface IndexerCampaignsResponse {
  success: boolean;
  data: {
    campaigns: IndexerCampaign[];
    totalActive: number;
  };
}

interface IndexerCampaignStatsResponse {
  success: boolean;
  data: {
    campaign: IndexerCampaign;
    stats: {
      totalClaims: number;
      uniqueClaimers: number;
      totalPointsDistributed: string;
      topClaimers: Array<{
        walletAddress: string;
        claimCount: number;
        totalPointsClaimed: string;
      }>;
      dailyBreakdown: Array<{
        date: string;
        claims: number;
        pointsDistributed: string;
      }>;
    };
  };
}

// Webhook Types
interface IndexerWebhookEmailSentRequest {
  senderWallet: string;
  recipientEmails: string[];
  transactionHash?: string;
  chainId?: number;
  blockNumber?: string;
}

interface IndexerWebhookRecipientLoginRequest {
  recipientWallet: string;
  senderWallets: string[];
}

interface IndexerWebhookLoginRequest {
  walletAddress: string;
  referralCode?: string;
}

/**
 * Indexer GraphQL Types
 */
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: (string | number)[];
  }>;
}

interface GraphQLPaginationInput {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface GraphQLWhereInput {
  id?: string;
  id_in?: string[];
  chainId?: number;
  chainId_in?: number[];
  from?: string;
  from_in?: string[];
  to?: string;
  to_in?: string[];
  timestamp_gte?: string;
  timestamp_lte?: string;
  blockNumber_gte?: string;
  blockNumber_lte?: string;
  isActive?: boolean;
}

// =============================================================================
// SHARED TYPES AND UTILITIES
// =============================================================================

/**
 * Common API Response Pattern
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Pagination Types
 */
interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
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
  rpcUrl?: string;
  explorerUrl?: string;
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
  attachments?: string[];
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
  icon?: string;
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

const isIndexerEmailResponse = (obj: any): obj is IndexerEmailResponse => {
  return (
    obj &&
    typeof obj.walletAddress === 'string' &&
    Array.isArray(obj.emailAddresses)
  );
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
  timeout?: number;
  headers?: Record<string, string>;
  requestInterceptors?: ApiInterceptor[];
  responseInterceptors?: ApiInterceptor[];
}

export {
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
  type IndexerApiResponse,
  type WalletSignature,
  type WalletAuth,
  type SignatureProtectedRequest,
  type GetEmailsResponse,
  type GetDelegatedResponse,
  type GetDelegatedToResponse,
  type ValidateAddressResponse,
  type GetPointsHistoryRequest,
  type ClaimPromoCodeRequest,
  type RegisterReferralRequest,
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
  type IndexerEmailAddress,
  type IndexerEmailResponse,
  type IndexerSignatureRequest,
  type IndexerSignatureVerification,
  type IndexerDelegationResponse,
  type IndexerDelegatedToResponse,
  type IndexerMessageResponse,
  type IndexerNonceResponse,
  type IndexerEntitlementResponse,
  type IndexerMail,
  type IndexerPreparedMail,
  type IndexerDelegation,
  type IndexerEarnMethod,
  type IndexerHowToEarnResponse,
  type IndexerPublicStatsResponse,
  type IndexerPointsSummary,
  type IndexerPointsSummaryResponse,
  type IndexerPointsHistoryEntry,
  type IndexerPointsHistoryResponse,
  type IndexerPromoCodeResponse,
  type IndexerPromoValidationResponse,
  type IndexerReferralResponse,
  type IndexerRefereeLoginResponse,
  type IndexerLeaderboardEntry,
  type IndexerLeaderboardResponse,
  type IndexerCampaign,
  type IndexerCampaignsResponse,
  type IndexerCampaignStatsResponse,
  type IndexerWebhookEmailSentRequest,
  type IndexerWebhookRecipientLoginRequest,
  type IndexerWebhookLoginRequest,
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
  type GetEmailsRequest,
  type GetDelegatedRequest,
  type GetDelegatedToRequest,
  type GetPointsSummaryRequest,
  type ChainType,
  type ApiInterceptor,
};
