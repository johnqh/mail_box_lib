/**
 * @fileoverview IndexerClient API Response Types
 * @description TypeScript interfaces for all mail_box_indexer API responses
 * @version 2.2.0
 *
 * This file provides type safety for all IndexerClient network calls,
 * based on the actual API implementations in mail_box_indexer v2.2.0
 */

// ========================================
// Base Response Types
// ========================================

/**
 * Base response format used by all protected endpoints
 */
export interface BaseVerificationResponse {
  walletAddress: string;
  addressType: 'evm' | 'solana';
  verified: true;
  timestamp: string;
}

/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// ========================================
// Address Validation Types
// ========================================

/**
 * Address validation response
 * GET /api/addresses/:address/validate
 */
export interface AddressValidationResponse {
  isValid: boolean;
  originalAddress: string;
  addressType: string;
  normalizedAddress: string;
  formats: {
    [key: string]: any;
  };
  message?: string;
  error?: string;
  timestamp: string;
}

// ========================================
// Email Address Types
// ========================================

/**
 * Email address data structure
 */
export interface EmailAddressData {
  address: string;
  name: string;
  walletAddress: string;
  addressType: 'evm' | 'solana';
}

/**
 * Email addresses response
 * GET /api/addresses/:walletAddress
 */
export interface EmailAddressesResponse extends BaseVerificationResponse {
  addresses: EmailAddressData[];
  totalCount: number;
}

// ========================================
// Delegation Types
// ========================================

/**
 * Delegation information
 */
export interface DelegationData {
  delegatedTo: string | null;
  chainId: number | null;
}

/**
 * Delegation response
 * GET /api/addresses/:walletAddress/delegated
 */
export interface DelegationResponse
  extends BaseVerificationResponse,
    DelegationData {
  // Additional delegation-specific fields if needed
}

/**
 * Delegated-to information
 */
export interface DelegatedToData {
  delegators: Array<{
    walletAddress: string;
    chainId: number;
  }>;
}

/**
 * Delegated-to response
 * GET /api/addresses/:walletAddress/delegated/to
 */
export interface DelegatedToResponse
  extends BaseVerificationResponse,
    DelegatedToData {
  // Additional delegated-to specific fields if needed
}

// ========================================
// Message Generation Types
// ========================================

/**
 * Message generation response
 * GET /api/addresses/:walletAddress/message/:chainId/:domain/:url
 */
export interface MessageGenerationResponse {
  walletAddress: string;
  addressType: 'evm' | 'solana';
  chainId: number;
  domain: string;
  uri: string;
  messages: {
    deterministic?: string;
    simple: string;
    solana?: string;
    info: {
      domain: string;
      uri: string;
      chainId: number;
      date?: string;
    };
  };
  recommended: string;
  instructions: {
    evm: string;
    solana: string;
  };
  verification: {
    endpoint: string;
    method: string;
    body: {
      walletAddress: string;
      signature: string;
      message: string;
    };
    note: string;
  };
  regeneration: {
    note: string;
    endpoint: string;
  };
  timestamp: string;
}

// ========================================
// Nonce Types
// ========================================

/**
 * Nonce data structure
 */
export interface NonceData {
  nonce: string;
  createdAt?: string;
  updatedAt?: string;
  message: string;
}

/**
 * Nonce response
 * GET/POST /api/addresses/:walletAddress/nonce
 */
export interface NonceResponse extends BaseVerificationResponse, NonceData {}

// ========================================
// Signature Verification Types
// ========================================

/**
 * Signature verification response
 * POST /api/addresses/:address/verify
 */
export interface SignatureVerificationResponse
  extends BaseVerificationResponse {
  isValid: true;
  message: string;
}

// ========================================
// Entitlement Types
// ========================================

/**
 * Entitlement data structure
 */
export interface EntitlementData {
  type: string;
  hasEntitlement: boolean;
  isActive: boolean;
  productIdentifier?: string;
  expiresDate?: string;
  store?: string;
}

/**
 * Entitlement response
 * GET /api/addresses/:walletAddress/entitlements/
 */
export interface EntitlementResponse extends BaseVerificationResponse {
  entitlement: EntitlementData;
  message: string;
  error?: string | null;
}

// ========================================
// Points System Types
// ========================================

/**
 * User points data
 */
export interface UserPointsData {
  walletAddress: string;
  pointsEarned: string; // BigInt as string
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User points response
 * GET /api/addresses/:walletAddress/points
 */
export interface UserPointsResponse extends BaseVerificationResponse {
  data: UserPointsData;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  walletAddress: string;
  pointsEarned: string; // BigInt as string
  rank?: number;
}

/**
 * Points leaderboard response data
 */
export interface PointsLeaderboardData {
  leaderboard: LeaderboardEntry[];
  count: number;
}

/**
 * Points leaderboard response
 * GET /api/points/leaderboard/:count
 */
export type PointsLeaderboardResponse = SuccessResponse<PointsLeaderboardData>;

/**
 * Site statistics data
 */
export interface SiteStatsData {
  totalPoints: string; // BigInt as string
  totalUsers: number;
  lastUpdated: string;
  createdAt: string;
}

/**
 * Site statistics response
 * GET /api/points/site-stats
 */
export type SiteStatsResponse = SuccessResponse<SiteStatsData>;

// ========================================
// Solana API Types
// ========================================

/**
 * Solana indexer status
 */
export interface SolanaIndexerStatus {
  chainId: number;
  initialized: boolean;
  networkName: string;
}

/**
 * Solana status response
 * GET /api/solana/status
 */
export interface SolanaStatusResponse {
  solanaIndexers: SolanaIndexerStatus[];
  totalIndexers: number;
  configured: boolean;
}

/**
 * Webhook setup result
 */
export interface WebhookSetupResult {
  chainId: string;
  status: 'success' | 'error';
  error?: string;
}

/**
 * Solana webhooks setup response
 * POST /api/solana/setup-webhooks
 */
export interface SolanaWebhooksResponse {
  success: boolean;
  results: WebhookSetupResult[];
}

/**
 * Test transaction response
 * POST /api/solana/test-transaction
 */
export interface TestTransactionResponse {
  success: boolean;
  message: string;
}

// ========================================
// Union Types for API Methods
// ========================================

/**
 * All possible API response types for type-safe error handling
 */
export type IndexerApiResponse =
  | AddressValidationResponse
  | EmailAddressesResponse
  | DelegationResponse
  | DelegatedToResponse
  | MessageGenerationResponse
  | NonceResponse
  | SignatureVerificationResponse
  | EntitlementResponse
  | UserPointsResponse
  | PointsLeaderboardResponse
  | SiteStatsResponse
  | SolanaStatusResponse
  | SolanaWebhooksResponse
  | TestTransactionResponse;

/**
 * Error types that can be returned by the API
 */
export type ApiError = ErrorResponse | { error: string };
