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

import { ChainType, Optional } from '@johnqh/types';

// =============================================================================
// INDEXER API TYPES (v2.0.0+)
// =============================================================================

/**
 * Standard API response wrapper for indexer endpoints
 */
interface IndexerApiResponse<T = any> {
  success: boolean;
  data: Optional<T>;
  error: Optional<string>;
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
  walletAddress: Optional<string>;
  /** The wallet signature (optional) */
  signature: Optional<WalletSignature>;
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
  detailedAddresses: Optional<
    {
      email: string;
      source: string;
      verified: Optional<boolean>;
    }[]
  >;
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
  delegatedTo: Optional<string>;
  chainId: Optional<number>;
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
  formats: Optional<{
    standard: string;
    checksummed: Optional<string>;
    compressed: Optional<string>;
  }>;
  message: Optional<string>;
  error: Optional<string>;
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
  limit: Optional<number>;
  offset: Optional<number>;
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

// =============================================================================
// INDEXER API TYPES (v2.2.0)
// =============================================================================

/**
 * Indexer Mail API Types
 */
interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated' | 'nameservice';
  source: Optional<string>;
  isVerified: Optional<boolean>;
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
  delegatedTo: Optional<string>;
  delegationType: Optional<string>;
  isActive: Optional<boolean>;
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
  gasUsed: Optional<string>;
  gasPrice: Optional<string>;
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
  gasUsed: Optional<string>;
  gasPrice: Optional<string>;
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
  lastActivityDate: Optional<number>;
  rank: Optional<number>;
  tier: string;
  nextTierThreshold: Optional<string>;
  recentActivities: Array<{
    id: string;
    activityType: string;
    pointsAmount: string;
    createdAt: number;
    metadata: Optional<Record<string, any>>;
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
  activityReference: Optional<string>;
  description: string;
  createdAt: number;
  metadata: Optional<Record<string, any>>;
  chainId: Optional<number>;
  transactionHash: Optional<string>;
  blockNumber: Optional<string>;
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
  lastActivityDate: Optional<number>;
  tier: string;
}

interface IndexerLeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: IndexerLeaderboardEntry[];
    userRank: Optional<number>;
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
  description: Optional<string>;
  startTime: number;
  endTime: number;
  pointsPerClaim: number;
  maxClaimsPerUser: number;
  totalClaimsLimit: Optional<number>;
  currentClaims: number;
  createdBy: Optional<string>;
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
  timeout: Optional<number>;
  headers: Optional<Record<string, string>>;
  requestInterceptors: Optional<ApiInterceptor[]>;
  responseInterceptors: Optional<ApiInterceptor[]>;
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
