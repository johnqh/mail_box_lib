/**
 * useAccountMailboxes Hook
 * Manages mailboxes for the selected account
 * Fetches email address and mailboxes from WildDuck when authenticated
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreateMailboxRequest,
  NetworkClient,
  Optional,
  UpdateMailboxRequest,
  WildduckConfig,
  WildduckMailbox,
  WildduckUserAuth,
} from '@sudobility/types';
import {
  useWildduckAddresses,
  useWildduckMailboxes,
} from '@sudobility/wildduck_client';
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
  wildduckUserAuth: Optional<WildduckUserAuth>;
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
    params: UpdateMailboxRequest
  ) => Promise<void>;
  /** Function to delete a mailbox */
  deleteMailbox: (mailboxId: string) => Promise<void>;
}

/**
 * Hook to manage mailboxes for the currently authenticated account
 *
 * Accepts wildduckUserAuth as parameter and:
 * - Fetches email addresses when authenticated
 * - Validates that exactly one address exists ({username}@{emailDomain})
 * - Fetches mailboxes for that address
 * - Caches mailboxes in Zustand store using userId as key
 * - Returns cached mailboxes immediately for better UX
 * - Exposes email address, mailboxes, and wildduckUserAuth
 *
 * @param networkClient - Network client for API calls
 * @param wildduckUserAuth - WildDuck authentication object (from useAccountWildduckAuth, includes username)
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param emailDomain - Email domain to validate against (e.g., "0xmail.box")
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing emailAddress, mailboxes (cached), wildduckUserAuth, isLoading, and error
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const networkClient = useNetworkClient();
 *   const { selectedAccount } = useSelectedAccount(
 *     networkClient,
 *     'https://indexer.example.com',
 *     false
 *   );
 *   const wildduckUserAuth = useAccountWildduckAuth(
 *     networkClient,
 *     selectedAccount?.username,
 *     config,
 *     storage,
 *     false
 *   );
 *
 *   const { emailAddress, mailboxes, isLoading, error } = useAccountMailboxes(
 *     networkClient,
 *     wildduckUserAuth,
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
  networkClient: NetworkClient,
  wildduckUserAuth: Optional<WildduckUserAuth>,
  endpointUrl: string,
  apiToken: string,
  emailDomain: string,
  devMode: boolean = false
): UseAccountMailboxesReturn {
  const [emailAddress, setEmailAddress] = useState<Optional<string>>(null);
  const [error, setError] = useState<Optional<string>>(null);

  // Get Zustand store methods
  const { getMailboxes, setMailboxes } = useMailboxStore();

  // Get cached mailboxes if available
  const cachedMailboxes = wildduckUserAuth
    ? getMailboxes(wildduckUserAuth.userId)
    : undefined;
  const [mailboxes, setLocalMailboxes] = useState<WildduckMailbox[]>(
    cachedMailboxes || []
  );

  const config: WildduckConfig = useMemo(() => {
    return {
      backendUrl: endpointUrl,
      apiToken,
    };
  }, [endpointUrl, apiToken]);

  // Get addresses hook
  const addressesHook = useWildduckAddresses(networkClient, config, devMode);

  // Get mailboxes hook - pass wildduckUserAuth directly (v2.0.0 now takes auth in constructor)
  const mailboxesHook = useWildduckMailboxes(
    networkClient,
    config,
    wildduckUserAuth,
    devMode
  );

  // Track the last fetched userId/username/token combo to prevent duplicate fetches
  const lastFetchedAccountRef = useRef<{
    userId: string;
    username: string;
    token: string;
  } | null>(null);

  // Fetch addresses when wildduckUserAuth becomes available
  useEffect(() => {
    if (!wildduckUserAuth) {
      setEmailAddress(null);
      setError(null);
      return;
    }

    // Skip if we've already fetched for this exact userId and username combination
    if (
      lastFetchedAccountRef.current?.userId === wildduckUserAuth.userId &&
      lastFetchedAccountRef.current?.username ===
        wildduckUserAuth.username.toLowerCase() &&
      lastFetchedAccountRef.current?.token === wildduckUserAuth.accessToken
    ) {
      return;
    }

    // Store the current userId and username for this fetch attempt
    const currentUserId = wildduckUserAuth.userId;
    const currentUsername = wildduckUserAuth.username.toLowerCase();

    (async () => {
      try {
        setError(null);

        // Fetch addresses for the user
        const addresses =
          await addressesHook.getUserAddresses(wildduckUserAuth);

        // Validate that exactly one address exists
        if (!addresses || addresses.length === 0) {
          console.error('No email address found for this account');
          setError('No email address found for this account');
          setEmailAddress(null);
          lastFetchedAccountRef.current = null;
          return;
        }

        if (addresses.length > 1) {
          const errorMsg = `Expected exactly one email address, but found ${addresses.length}`;
          console.error(errorMsg);
          setError(errorMsg);
          setEmailAddress(null);
          lastFetchedAccountRef.current = null;
          return;
        }

        const firstAddress = addresses[0];
        if (!firstAddress) {
          console.error('Failed to retrieve email address');
          setError('Failed to retrieve email address');
          setEmailAddress(null);
          lastFetchedAccountRef.current = null;
          return;
        }

        const address = firstAddress.address;

        // Validate the username part (before '@') matches the account we fetched for
        // Use case-insensitive comparison for wallet addresses
        const [username] = address.split('@');
        if (!username) {
          const errorMsg = `Invalid email address format: ${address}`;
          console.error(errorMsg);
          setError(errorMsg);
          setEmailAddress(null);
          lastFetchedAccountRef.current = null;
          return;
        }
        if (username.toLowerCase() !== currentUsername) {
          const errorMsg = `Expected username ${currentUsername}, but found ${username} in address ${address}`;
          console.error(errorMsg);
          setError(errorMsg);
          setEmailAddress(null);
          lastFetchedAccountRef.current = null;
          return;
        }

        setEmailAddress(address);

        // Mark this account as successfully fetched AFTER validation passes
        lastFetchedAccountRef.current = {
          userId: currentUserId,
          username: currentUsername,
          token: wildduckUserAuth.accessToken,
        };

        // Fetch mailboxes now that we have a valid address
        await mailboxesHook.refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load email data';
        console.error('❌ useAccountMailboxes: Error:', errorMessage);
        setError(errorMessage);
        setEmailAddress(null);
        lastFetchedAccountRef.current = null;
      }
    })();
    // CRITICAL FIX: Only depend on primitive values, not hook objects
    // The addressesHook and mailboxesHook are recreated on every render,
    // but we only want to re-fetch when the userId or username actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wildduckUserAuth?.userId,
    wildduckUserAuth?.accessToken,
    wildduckUserAuth?.username,
    emailDomain,
  ]);

  // Update local state and cache when mailboxes change
  useEffect(() => {
    if (
      wildduckUserAuth &&
      mailboxesHook.mailboxes &&
      mailboxesHook.mailboxes.length > 0
    ) {
      setLocalMailboxes(mailboxesHook.mailboxes);
      setMailboxes(wildduckUserAuth.userId, mailboxesHook.mailboxes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wildduckUserAuth?.userId, mailboxesHook.mailboxes, setMailboxes]);

  const isLoading =
    (!!wildduckUserAuth && !emailAddress && !error) ||
    addressesHook.isLoading ||
    mailboxesHook.isLoading;

  const combinedError = error || addressesHook.error || mailboxesHook.error;

  // Refresh function to manually refetch mailboxes
  const refresh = useCallback(async () => {
    if (!wildduckUserAuth) {
      return;
    }
    // Reset the ref so the useEffect will re-run
    lastFetchedAccountRef.current = null;
    // Trigger a refresh by calling the mailboxes hook's refresh method
    await mailboxesHook.refresh();
  }, [wildduckUserAuth, mailboxesHook]);

  // Create mailbox wrapper function
  const createMailbox = useCallback(
    async (params: CreateMailboxRequest) => {
      if (!wildduckUserAuth) {
        setError('Authentication is required to create mailbox');
        console.error('Cannot create mailbox: Authentication required');
        return;
      }
      await mailboxesHook.createMailbox(wildduckUserAuth, params);
      // Refresh mailboxes after creation
      await refresh();
    },
    [wildduckUserAuth, mailboxesHook, refresh]
  );

  // Update mailbox wrapper function
  const updateMailbox = useCallback(
    async (mailboxId: string, params: UpdateMailboxRequest) => {
      if (!wildduckUserAuth) {
        setError('Authentication is required to update mailbox');
        console.error('Cannot update mailbox: Authentication required');
        return;
      }
      await mailboxesHook.updateMailbox(wildduckUserAuth, mailboxId, params);
      // Refresh mailboxes after update
      await refresh();
    },
    [wildduckUserAuth, mailboxesHook, refresh]
  );

  // Delete mailbox wrapper function
  const deleteMailbox = useCallback(
    async (mailboxId: string) => {
      if (!wildduckUserAuth) {
        setError('Authentication is required to delete mailbox');
        console.error('Cannot delete mailbox: Authentication required');
        return;
      }
      await mailboxesHook.deleteMailbox(wildduckUserAuth, mailboxId);
      // Refresh mailboxes after deletion
      await refresh();
    },
    [wildduckUserAuth, mailboxesHook, refresh]
  );

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when any of the properties actually change
  return useMemo<UseAccountMailboxesReturn>(
    () => ({
      emailAddress,
      mailboxes,
      wildduckUserAuth,
      isLoading,
      error: combinedError,
      refresh,
      createMailbox,
      updateMailbox,
      deleteMailbox,
    }),
    [
      emailAddress,
      mailboxes,
      wildduckUserAuth,
      isLoading,
      combinedError,
      refresh,
      createMailbox,
      updateMailbox,
      deleteMailbox,
    ]
  );
}
