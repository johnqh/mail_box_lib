/**
 * Network layer - Platform-agnostic networking implementations
 */

// Web implementation
export * from './network.web';

// React Native implementation  
export * from './network.reactnative';

// API clients
export * from './clients';

// Re-export network types from centralized types
export type { NetworkClient, NetworkResponse, NetworkRequestOptions } from "../types";
export { NetworkError } from "../types";