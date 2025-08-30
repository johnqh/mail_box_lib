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

// =============================================================================
// WILDDUCK API TYPES
// =============================================================================

/**
 * WildDuck Authentication Types
 * Used for blockchain-based authentication with wallet signatures
 */
export interface WildDuckAuthRequest {
  username: string;
  signature: string;
  nonce: string;
  scope?: string;
  token?: boolean;
  protocol?: string;
  sess?: string;
  ip?: string;
}

export interface WildDuckAuthResponse {
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

export interface WildDuckPreAuthRequest {
  username: string;
  scope?: string;
  sess?: string;
  ip?: string;
}

export interface WildDuckPreAuthResponse {
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
export interface WildDuckUser {
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

export interface WildDuckCreateUserRequest {
  username: string;
  password?: string;
  address?: string;
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  tags?: string[];
}

export interface WildDuckUpdateUserRequest {
  name?: string;
  quota?: number;
  language?: string;
  retention?: number;
  disabled?: boolean;
  suspended?: boolean;
  tags?: string[];
}

export interface WildDuckUserResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * WildDuck Mailbox Types
 * For email folder/mailbox management
 */
export interface WildDuckMailbox {
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

export interface WildDuckMailboxResponse {
  success: boolean;
  results: WildDuckMailbox[];
  error?: string;
}

export interface WildDuckCreateMailboxRequest {
  path: string;
  hidden?: boolean;
  retention?: number;
}

/**
 * WildDuck Message Types
 * For email message handling and operations
 */
export interface WildDuckMessageAddress {
  name?: string;
  address: string;
}

export interface WildDuckMessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  hash?: string;
}

export interface WildDuckMessageBase {
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

export interface WildDuckMessage extends WildDuckMessageBase {
  attachments: boolean;
}

export interface WildDuckMessageDetail extends WildDuckMessageBase {
  user: string;
  html?: string;
  text?: string;
  headers?: Record<string, string | string[]>;
  attachments: WildDuckMessageAttachment[];
  references?: string[];
  inReplyTo?: string;
}

export interface WildDuckMessagesResponse {
  success: boolean;
  total: number;
  page: number;
  previousCursor?: string;
  nextCursor?: string;
  results: WildDuckMessage[];
  error?: string;
}

export interface WildDuckMessageResponse {
  success: boolean;
  data?: WildDuckMessageDetail;
  error?: string;
}

export interface WildDuckSendMessageRequest {
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
export interface WildDuckAddress {
  id: string;
  address: string;
  name?: string;
  main: boolean;
  created?: string;
  metaData?: any;
  tags?: string[];
}

export interface WildDuckAddressResponse {
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
export interface IndexerEmailAddress {
  email: string;
  type: 'primary' | 'domain' | 'delegated' | 'nameservice';
  source?: string;
  isVerified?: boolean;
}

export interface IndexerEmailResponse {
  walletAddress: string;
  addressType: string;
  emailAddresses: string[];
  detailedAddresses: IndexerEmailAddress[];
  totalCount: number;
  hasNameService: boolean;
  verified: boolean;
  timestamp: string;
}

export interface IndexerSignatureRequest {
  walletAddress: string;
  signature: string;
  message?: string;
}

export interface IndexerSignatureVerification {
  walletAddress: string;
  addressType: string;
  isValid: boolean;
  message: string;
  timestamp: string;
}

export interface IndexerDelegationResponse {
  walletAddress: string;
  addressType: string;
  hasDelegation: boolean;
  delegatedTo?: string;
  delegationType?: string;
  isActive?: boolean;
  verified: boolean;
  timestamp: string;
}

export interface IndexerDelegatedToResponse {
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

export interface IndexerMessageResponse {
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

export interface IndexerNonceResponse {
  walletAddress: string;
  addressType: string;
  nonce: string;
  createdAt?: string;
  updatedAt?: string;
  message: string;
  timestamp: string;
}

export interface IndexerEntitlementResponse {
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
export interface IndexerMail {
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

export interface IndexerPreparedMail {
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

export interface IndexerDelegation {
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
export interface IndexerEarnMethod {
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

export interface IndexerHowToEarnResponse {
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
export interface IndexerPublicStatsResponse {
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
export interface IndexerPointsSummary {
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

export interface IndexerPointsSummaryResponse {
  success: boolean;
  data: {
    pointsSummary: IndexerPointsSummary;
  };
}

// Points History Response
export interface IndexerPointsHistoryEntry {
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

export interface IndexerPointsHistoryResponse {
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
export interface IndexerPromoCodeResponse {
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

export interface IndexerPromoValidationResponse {
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
export interface IndexerReferralResponse {
  success: boolean;
  data?: {
    referralCode: string;
    isNewReferral: boolean;
    message: string;
  };
  error?: string;
}

export interface IndexerRefereeLoginResponse {
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
export interface IndexerLeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalPoints: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number | null;
  tier: string;
}

export interface IndexerLeaderboardResponse {
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
export interface IndexerCampaign {
  id: string;
  campaignName: string;
  campaignType: 'promotional_code' | 'referral_bonus' | 'achievement_unlock' | 'seasonal_event';
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

export interface IndexerCampaignsResponse {
  success: boolean;
  data: {
    campaigns: IndexerCampaign[];
    totalActive: number;
  };
}

export interface IndexerCampaignStatsResponse {
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
export interface IndexerWebhookEmailSentRequest {
  senderWallet: string;
  recipientEmails: string[];
  transactionHash?: string;
  chainId?: number;
  blockNumber?: string;
}

export interface IndexerWebhookRecipientLoginRequest {
  recipientWallet: string;
  senderWallets: string[];
}

export interface IndexerWebhookLoginRequest {
  walletAddress: string;
  referralCode?: string;
}

// Admin Types
export interface IndexerAdminCampaignRequest {
  campaignName: string;
  campaignType: string;
  pointsPerClaim: number;
  maxClaimsPerUser: number;
  totalClaimsLimit?: number;
  startTime: number;
  endTime: number;
  description?: string;
  adminWallet: string;
  adminSignature: string;
  adminMessage: string;
}

export interface IndexerAdminAwardPointsRequest {
  targetWallet: string;
  points: number;
  reason: string;
  adminWallet: string;
  adminSignature: string;
  adminMessage: string;
}

export interface IndexerAdminFlagUserRequest {
  targetWallet: string;
  reason: string;
  adminWallet: string;
  adminSignature: string;
  adminMessage: string;
}

export interface IndexerAdminStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalUsers: number;
      totalPointsAwarded: string;
      activeUsers24h: number;
      activeUsers7d: number;
      totalCampaigns: number;
      activeCampaigns: number;
      flaggedUsers: number;
      totalTransactions: number;
    };
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: number;
      metadata?: Record<string, any>;
    }>;
    topUsers: Array<{
      walletAddress: string;
      totalPoints: string;
      rank: number;
    }>;
    systemHealth: {
      status: 'healthy' | 'warning' | 'error';
      lastUpdated: number;
      alerts: string[];
    };
  };
}

export interface IndexerAdminFlaggedUsersResponse {
  success: boolean;
  data: {
    flaggedUsers: Array<{
      walletAddress: string;
      flagReason: string;
      flaggedAt: number;
      flaggedBy?: string;
      totalFlags: number;
      lastActivity: number;
      isActive: boolean;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface IndexerAdminBulkCodesResponse {
  success: boolean;
  data: {
    campaignId: string;
    codesGenerated: number;
    codes: string[];
    message: string;
  };
}

/**
 * Indexer GraphQL Types
 */
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: (string | number)[];
  }>;
}

export interface GraphQLPaginationInput {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface GraphQLWhereInput {
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
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Pagination Types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
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
export type ChainType = 'evm' | 'solana' | 'unknown';

export interface ChainInfo {
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
export interface Email {
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
export interface EmailAddress {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

/**
 * Mailbox Types (Frontend)
 */
export interface Mailbox {
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
export const isWildDuckAuthResponse = (
  obj: any
): obj is WildDuckAuthResponse => {
  return obj && typeof obj.success === 'boolean';
};

export const isWildDuckMessage = (obj: any): obj is WildDuckMessage => {
  return obj && typeof obj.id === 'string' && typeof obj.subject === 'string';
};

export const isIndexerEmailResponse = (
  obj: any
): obj is IndexerEmailResponse => {
  return (
    obj &&
    typeof obj.walletAddress === 'string' &&
    Array.isArray(obj.emailAddresses)
  );
};

export const isGraphQLResponse = (obj: any): obj is GraphQLResponse => {
  return obj && (obj.data !== undefined || obj.errors !== undefined);
};

/**
 * Validation helpers
 */
export const validateObjectId = (id: string): boolean => {
  return /^[a-f0-9]{24}$/i.test(id);
};

export const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateWalletAddress = (
  address: string,
  type: ChainType
): boolean => {
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
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiError {
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
export type ApiInterceptor<T = any> = (data: T) => T | Promise<T>;

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  requestInterceptors?: ApiInterceptor[];
  responseInterceptors?: ApiInterceptor[];
}
