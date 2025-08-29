/**
 * Network layer - Platform-agnostic networking implementations
 */

// Web implementation
export * from './network.web';

// React Native implementation  
export * from './network.reactnative';

// Re-export network types from centralized types
export type { NetworkClient, NetworkResponse, NetworkRequestOptions } from '../types/network';
export { NetworkError } from '../types/network';