/**
 * Platform-agnostic business logic layer
 *
 * This module exports all business logic operations that can be used across
 * web and React Native platforms. These modules contain no platform-specific
 * dependencies and focus purely on business rules and data transformations.
 */

// Core enums and types
export * from './enums';

// Analytics operations
export * from './analytics';

// Email operations
export * from './email/email-operations';

// Indexer service
export * from './indexer';

// Mailbox operations
export * from './mailbox/mailbox-operations';

// Folder operations
export * from './folder/folder-operations';

// Navigation and UI state
export * from './navigation/navigation-state';

// Authentication business logic
export * from './auth/auth-business-logic';

// Dependency injection container
export * from './container';

/**
 * Factory function to create all business logic operations with default implementations
 */
export async function createBusinessLogicServices() {
  return {
    emailOps: new (
      await import('./email/email-operations')
    ).DefaultEmailOperations(),
    mailboxOps: new (
      await import('./mailbox/mailbox-operations')
    ).DefaultMailboxOperations(),
    navigationOps: new (
      await import('./navigation/navigation-state')
    ).DefaultNavigationOperations(),
    authOps: new (
      await import('./auth/auth-business-logic')
    ).DefaultAuthBusinessLogic(),
    emailAddressOps: new (
      await import('./auth/auth-business-logic')
    ).DefaultEmailAddressBusinessLogic(),
  };
}

/**
 * Sync version of factory function for immediate use
 */
export function createBusinessLogicServicesSync() {
  const { DefaultEmailOperations } = require('./email/email-operations');
  const { DefaultMailboxOperations } = require('./mailbox/mailbox-operations');
  const {
    DefaultNavigationOperations,
  } = require('./navigation/navigation-state');
  const {
    DefaultAuthBusinessLogic,
    DefaultEmailAddressBusinessLogic,
  } = require('./auth/auth-business-logic');

  return {
    emailOps: new DefaultEmailOperations(),
    mailboxOps: new DefaultMailboxOperations(),
    navigationOps: new DefaultNavigationOperations(),
    authOps: new DefaultAuthBusinessLogic(),
    emailAddressOps: new DefaultEmailAddressBusinessLogic(),
  };
}

/**
 * Usage examples for React Native:
 *
 * ```typescript
 * // In your React Native app
 * import {
 *   DefaultEmailOperations,
 *   DefaultMailboxOperations,
 *   NavigationStateManager
 * } from '@0xmail/lib';
 *
 * const emailOps = new DefaultEmailOperations();
 * const mailboxOps = new DefaultMailboxOperations();
 * const navManager = new NavigationStateManager();
 *
 * // Use in your components
 * const formattedDate = emailOps.formatEmailDate(email.date);
 * const folderIcon = mailboxOps.getMailboxIconId(folder.id);
 * ```
 *
 * The business logic is completely separated from UI frameworks,
 * so it can be used with React Native, React, Vue, or any other framework.
 */
