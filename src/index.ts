/**
 * @0xmail/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Types - Centralized type exports (Goal 1)
export * from './types';

// Dependency Injection - Grouped DI definitions (Goal 2)  
export * from './di';

// Infrastructure - Separated networking and storage logic (Goal 3)
export * from './network';
export * from './storage';

// Business Logic - Organized by functionality (Goal 4)
export * from './business';

// Utilities - General utility functions
export * from './utils';

// Main environment exports (commonly used)
export { getEnvProvider, getAppConfig, env } from './di/env';