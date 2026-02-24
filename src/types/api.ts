/**
 * @fileoverview Comprehensive API type definitions for blockchain email applications
 * @description Central location for all API types, interfaces, and response formats
 * This file provides complete type safety for WildDuck API
 *
 * Usage:
 * - Import specific types for your components/hooks
 * - All API responses are strongly typed
 * - Includes validation helpers and type guards
 * - Compatible with both REST and GraphQL APIs
 */

import { ChainType, Optional } from '@sudobility/types';

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
 * Chain and Address Types
 */

interface ChainInfo {
  chainId: number;
  name: string;
  type: ChainType;
  rpcUrl: Optional<string>;
  explorerUrl: Optional<string>;
}

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

import {
  isWildduckAuthResponse as isWDAuthResponse,
  isWildduckMessage as isWDMessage,
} from '@sudobility/mail_box_types';

/**
 * Type guards for runtime type checking
 * Local wrappers around @sudobility/types functions
 */
export const isWildduckAuthResponse = (obj: any): boolean => {
  return isWDAuthResponse(obj);
};

export const isWildduckMessage = (obj: any): boolean => {
  return isWDMessage(obj);
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
 * Error types for API operations.
 *
 * These classes form a unified error hierarchy rooted at `AppError`:
 * - `ApiError` extends `AppError` for all API-related errors
 * - `AuthenticationError` extends `ApiError` for 401 errors
 * - `ValidationError` extends `ApiError` for 400 validation errors
 *
 * This hierarchy allows consumers to use `isAppError()` from `errorHandling.ts`
 * to catch all structured errors, or `instanceof ApiError` for API-specific ones.
 */
import { AppError } from '../utils/errorHandling';

class ApiError extends AppError {
  /** Raw response data from the failed request, if available */
  response?: any;

  /**
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param response - Raw response data for debugging
   */
  constructor(message: string, statusCode?: number, response?: any) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
    this.response = response;
  }
}

/**
 * Error thrown when an API request fails due to authentication issues (HTTP 401).
 */
class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_ERROR';
  }
}

/**
 * Error thrown when an API request fails due to validation issues (HTTP 400).
 */
class ValidationError extends ApiError {
  /** The specific field that failed validation, if applicable */
  field?: string | undefined;

  constructor(message: string = 'Validation failed', field?: string) {
    super(message, 400);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.field = field;
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
  // Local types and utilities
  isGraphQLResponse,
  validateObjectId,
  validateEmailAddress,
  validateWalletAddress,
  ApiError,
  AuthenticationError,
  ValidationError,
  type GraphQLResponse,
  type GraphQLPaginationInput,
  type GraphQLWhereInput,
  type ApiResponse,
  type ChainInfo,
  type ApiClientConfig,
  type ChainType,
  type ApiInterceptor,
};
