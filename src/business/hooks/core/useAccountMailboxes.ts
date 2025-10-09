/**
 * useAccountMailboxes Hook
 * Manages mailboxes for the selected account
 * Fetches email address and mailboxes from WildDuck when authenticated
 */

import { useEffect, useState } from 'react';
import { Optional } from '@johnqh/types';
import {
  useWildduckAddresses,
  useWildduckMailboxes,
  WildduckConfig,
  WildduckMailbox,
  WildduckUserAuth,
} from '@johnqh/wildduck_client';
import { useSelectedAccount } from './useSelectedAccount';
import { useMailboxStore } from '../../stores/mailboxStore';

/**
 * Return type for useAccountMailboxes hook
 */
export interface UseAccountMailboxesReturn {
  /** The email address for the selected account */
  emailAddress: Optional<string>;
  /** Array of mailboxes for the account */
  mailboxes: WildduckMailbox[];
  /** WildDuck authentication object (passthrough from useSelectedAccount) */
  wildduckAuth: Optional<WildduckUserAuth>;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Hook to manage mailboxes for the currently selected account
 *
 * Observes wildduckAuth from useSelectedAccount and:
 * - Fetches email addresses when authenticated
 * - Validates that exactly one address exists ({username}@{emailDomain})
 * - Fetches mailboxes for that address
 * - Caches mailboxes in Zustand store using userId as key
 * - Returns cached mailboxes immediately for better UX
 * - Exposes email address, mailboxes, and wildduckAuth
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param emailDomain - Email domain to validate against (e.g., "0xmail.box")
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing emailAddress, mailboxes (cached), wildduckAuth, isLoading, and error
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { emailAddress, mailboxes, wildduckAuth, isLoading, error } = useAccountMailboxes(
 *     'https://wildduck.example.com',
 *     'your-api-token',
 *     '0xmail.box',
 *     false
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!emailAddress) return <div>No email address</div>;
 *
 *   return (
 *     <div>
 *       <h2>{emailAddress}</h2>
 *       <ul>
 *         {mailboxes.map(mailbox => (
 *           <li key={mailbox.id}>{mailbox.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccountMailboxes(
  endpointUrl: string,
  apiToken: string,
  emailDomain: string,
  devMode: boolean = false
): UseAccountMailboxesReturn {
  const { selectedAccount, wildduckAuth } = useSelectedAccount(
    endpointUrl,
    apiToken,
    devMode
  );

  const [emailAddress, setEmailAddress] = useState<Optional<string>>(null);
  const [error, setError] = useState<Optional<string>>(null);

  // Get Zustand store methods
  const { getMailboxes, setMailboxes } = useMailboxStore();

  // Get cached mailboxes if available
  const cachedMailboxes = wildduckAuth
    ? getMailboxes(wildduckAuth.userId)
    : undefined;
  const [mailboxes, setLocalMailboxes] = useState<WildduckMailbox[]>(
    cachedMailboxes || []
  );

  const config: WildduckConfig = {
    backendUrl: endpointUrl,
    apiToken,
  };

  // Get addresses hook
  const addressesHook = useWildduckAddresses(config, devMode);

  // Get mailboxes hook - we'll pass the auth response derived from wildduckAuth
  const authResponse = wildduckAuth
    ? {
        success: true,
        id: wildduckAuth.userId,
        token: wildduckAuth.accessToken,
      }
    : null;

  const mailboxesHook = useWildduckMailboxes(config, authResponse, devMode);

  // Fetch addresses when wildduckAuth becomes available
  useEffect(() => {
    if (!wildduckAuth || !selectedAccount) {
      setEmailAddress(null);
      setError(null);
      return;
    }

    (async () => {
      try {
        setError(null);

        // Fetch addresses for the user
        const addresses = await addressesHook.getUserAddresses(
          wildduckAuth.userId
        );

        // Validate that exactly one address exists
        if (!addresses || addresses.length === 0) {
          throw new Error('No email address found for this account');
        }

        if (addresses.length > 1) {
          throw new Error(
            `Expected exactly one email address, but found ${addresses.length}`
          );
        }

        const firstAddress = addresses[0];
        if (!firstAddress) {
          throw new Error('Failed to retrieve email address');
        }

        const address = firstAddress.address;

        // Validate the address format: {username}@{emailDomain}
        const expectedAddress = `${selectedAccount.username}@${emailDomain}`;
        if (address !== expectedAddress) {
          throw new Error(
            `Expected email address ${expectedAddress}, but found ${address}`
          );
        }

        setEmailAddress(address);

        // Fetch mailboxes now that we have a valid address
        await mailboxesHook.refresh(wildduckAuth.userId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load email data';
        setError(errorMessage);
        setEmailAddress(null);
      }
    })();
  }, [
    wildduckAuth,
    selectedAccount,
    emailDomain,
    addressesHook,
    mailboxesHook,
  ]);

  // Update local state and cache when mailboxes change
  useEffect(() => {
    if (
      wildduckAuth &&
      mailboxesHook.mailboxes &&
      mailboxesHook.mailboxes.length > 0
    ) {
      setLocalMailboxes(mailboxesHook.mailboxes);
      setMailboxes(wildduckAuth.userId, mailboxesHook.mailboxes);
    }
  }, [wildduckAuth, mailboxesHook.mailboxes, setMailboxes]);

  const isLoading =
    (!!wildduckAuth && !emailAddress && !error) ||
    addressesHook.isLoading ||
    mailboxesHook.isLoading;

  return {
    emailAddress,
    mailboxes,
    wildduckAuth,
    isLoading,
    error: error || addressesHook.error || mailboxesHook.error,
  };
}
