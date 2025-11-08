/**
 * useMailboxesAndSettings Hook
 * Extends useAccountMailboxes by adding a special "Settings" item to the mailboxes list
 * This makes settings accessible directly from the mailbox navigation
 */

import { useMemo } from 'react';
import {
  CreateMailboxRequest,
  MailboxSpecialUse,
  Optional,
  WildduckMailbox,
  WildduckUpdateMailboxRequest,
  WildduckUserAuth,
} from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import { useAccountMailboxes } from './useAccountMailboxes';

/**
 * Special mailbox ID for the settings item
 * Using a unique identifier that won't conflict with real mailbox IDs
 */
export const SETTINGS_MAILBOX_ID = '__settings__';

/**
 * Extended mailbox item that includes settings
 */
export interface MailboxOrSettings extends WildduckMailbox {
  isSettings?: boolean;
}

/**
 * Return type for useMailboxesAndSettings hook
 * Extends UseAccountMailboxesReturn with modified mailboxes type
 */
export interface UseMailboxesAndSettingsReturn {
  /** The email address for the selected account */
  emailAddress: Optional<string>;
  /** Array of mailboxes plus a Settings item */
  mailboxes: MailboxOrSettings[];
  /** WildDuck authentication object */
  wildduckAuth: Optional<WildduckUserAuth>;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Function to refresh mailboxes */
  refresh: () => Promise<void>;
  /** Function to create a new mailbox */
  createMailbox: (params: CreateMailboxRequest) => Promise<void>;
  /** Function to update an existing mailbox */
  updateMailbox: (
    mailboxId: string,
    params: WildduckUpdateMailboxRequest
  ) => Promise<void>;
  /** Function to delete a mailbox */
  deleteMailbox: (mailboxId: string) => Promise<void>;
}

/**
 * Hook to manage mailboxes with a Settings item added
 *
 * Wraps useAccountMailboxes and automatically adds a special "Settings" item
 * to the mailboxes list that can be used to access account settings.
 *
 * The Settings item appears as a mailbox with:
 * - Special ID: SETTINGS_MAILBOX_ID
 * - Name: "Settings"
 * - Special Use: MailboxSpecialUse.Settings
 * - isSettings flag: true (for easy identification)
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param emailDomain - Email domain to validate against (e.g., "0xmail.box")
 * @param storage - Storage service for caching
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing mailboxes (with Settings item), emailAddress, and other data
 *
 * @example
 * ```tsx
 * function MyMailboxList() {
 *   const { mailboxes, isLoading } = useMailboxesAndSettings(
 *     'https://wildduck.example.com',
 *     'token',
 *     '0xmail.box',
 *     storage,
 *     false
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <ul>
 *       {mailboxes.map(mailbox => (
 *         <li key={mailbox.id}>
 *           {mailbox.isSettings ? '⚙️ ' : '📁 '}{mailbox.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useMailboxesAndSettings(
  endpointUrl: string,
  apiToken: string,
  emailDomain: string,
  storage: StorageService,
  devMode: boolean = false
): UseMailboxesAndSettingsReturn {
  // Get mailboxes from the base hook
  const mailboxResult = useAccountMailboxes(
    endpointUrl,
    apiToken,
    emailDomain,
    storage,
    devMode
  );

  // Create mailboxes with Settings item appended
  const mailboxesWithSettings = useMemo<MailboxOrSettings[]>(() => {
    const baseMailboxes = mailboxResult.mailboxes;

    // Create the Settings mailbox item
    const settingsMailbox: MailboxOrSettings = {
      id: SETTINGS_MAILBOX_ID,
      name: 'Settings',
      path: 'Settings',
      specialUse: MailboxSpecialUse.Settings,
      modifyIndex: 0,
      subscribed: true,
      hidden: false,
      total: 0,
      unseen: 0,
      isSettings: true,
    };

    // Append Settings item to the end of mailboxes
    return [...baseMailboxes, settingsMailbox];
  }, [mailboxResult.mailboxes]);

  return {
    ...mailboxResult,
    mailboxes: mailboxesWithSettings,
  };
}
