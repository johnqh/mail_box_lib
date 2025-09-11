/**
 * Network layer - Types and interfaces only
 */

// API clients
export * from './clients';

// Re-export network types from @johnqh/di
export type {
  NetworkClient,
  NetworkResponse,
  NetworkRequestOptions,
} from '@johnqh/di';
export { NetworkError } from '@johnqh/di';
