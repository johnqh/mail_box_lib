/**
 * Dependency Injection - Interfaces and types only
 */

// Environment providers (interface only)
export * from './env';

// Re-export environment types from centralized types
export type { EnvProvider, AppConfig, EnvironmentVariables } from '../types';
