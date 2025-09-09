/**
 * Network layer - Types and interfaces only
 */

// API clients
export * from './clients';

// Re-export network types from DI layer
export type {
  NetworkClient,
  NetworkResponse,
  NetworkRequestOptions,
} from '../di/network';
export { NetworkError } from '../di/network';
