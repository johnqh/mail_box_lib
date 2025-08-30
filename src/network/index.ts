/**
 * Network layer - Types and interfaces only
 */

// API clients
export * from './clients';

// Re-export network types from centralized types
export type {
  NetworkClient,
  NetworkResponse,
  NetworkRequestOptions,
} from '../types';
export { NetworkError } from '../types';
