/**
 * @0xmail/lib - Shared utilities and common functions for 0xmail.box projects
 */

// Environment utilities
export * from './env.interface';
export * from './env';
export * from './env.web';
export * from './env.reactnative';

// Main environment exports (commonly used)
export { getEnvProvider, getAppConfig, env } from './env';

// Utils exports - platform-agnostic utilities
export * from './utils';

// Hooks exports - platform-agnostic React hooks
export * from './hooks';