/**
 * Dependency Injection - Platform-specific implementations and providers
 */

// Environment providers
export * from './env';
export * from './env.web'; 
export * from './env.reactnative';

// Re-export environment types from centralized types
export type { EnvProvider, AppConfig, EnvironmentVariables } from '../types/environment';