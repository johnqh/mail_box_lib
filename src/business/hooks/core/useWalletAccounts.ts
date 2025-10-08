/**
 * useWalletAccounts Hook
 * Observes wallet status and fetches accounts when wallet is verified
 * Uses global state for React Native compatibility
 */

import { useEffect, useRef } from 'react';
import { Optional, WalletData } from '@johnqh/types';
import { useWalletStatus } from './useWalletStatus';
import { useIndexerMail } from '../indexer/useIndexerMail';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';

/**
 * WildDuck account with username and entitlement status
 * Extends WalletData to include chainType and walletAddress for compatibility
 */
export interface WildDuckAccount extends WalletData {
  username: string;
  entitled: boolean;
}

/**
 * Global wallet accounts state - shared across all components
 */
export const useGlobalWalletAccounts = createGlobalState<WildDuckAccount[]>(
  'walletAccounts',
  []
);

/**
 * Hook to manage wallet accounts based on wallet status
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param devMode - Whether to use mock data on errors
 * @returns Array of WildDuck accounts
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const accounts = useWalletAccounts('https://indexer.example.com', false);
 *
 *   return (
 *     <ul>
 *       {accounts.map(account => (
 *         <li key={account.username}>
 *           {account.username} {account.entitled ? '✓' : '✗'}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useWalletAccounts(
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
): WildDuckAccount[] {
  const { status } = useWalletStatus();
  const [accounts] = useGlobalWalletAccounts();
  const abortControllerRef = useRef<Optional<AbortController>>(undefined);
  const { getWalletAccounts } = useIndexerMail(endpointUrl, dev, devMode);

  useEffect(() => {
    // Cancel any outstanding request when effect cleanup runs
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }

    // Check if wallet is verified (has message and signature)
    const isVerified =
      status?.walletAddress && status?.message && status?.signature;

    if (!isVerified) {
      // Set accounts to empty array when not verified
      setGlobalState('walletAccounts', []);
      return;
    }

    // TypeScript doesn't know these are non-null due to isVerified check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const walletAddress = status.walletAddress!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const chainType = status.chainType!;

    // Immediately set accounts to show the wallet address if accounts are empty
    // This provides instant feedback while we fetch the full list
    if (accounts.length === 0) {
      setGlobalState('walletAccounts', [
        {
          walletAddress,
          chainType,
          username: walletAddress,
          entitled: true,
        },
      ]);
    }

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Fetch wallet accounts
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const signature = status.signature!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const message = status.message!;

        const response = await getWalletAccounts(
          walletAddress,
          signature,
          message,
          undefined // referralCode
        );

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Flatten the response data
        if (response && response.success && response.data) {
          const flattenedAccounts: WildDuckAccount[] = [];

          for (const walletAccount of response.data.accounts) {
            // Add wallet account (always entitled)
            // walletAddress -> username, entitled -> true
            flattenedAccounts.push({
              walletAddress: walletAccount.walletAddress,
              chainType: walletAccount.chainType,
              username: walletAccount.walletAddress,
              entitled: true,
            });

            // Add name accounts with their entitlement status from parent wallet
            // parent wallet's walletAddress -> walletAddress
            // parent wallet's chainType -> chainType
            // name -> username
            // entitled -> entitled
            if (walletAccount.names) {
              for (const nameAccount of walletAccount.names) {
                flattenedAccounts.push({
                  walletAddress: walletAccount.walletAddress,
                  chainType: walletAccount.chainType,
                  username: nameAccount.name,
                  entitled: nameAccount.entitled,
                });
              }
            }
          }

          setGlobalState('walletAccounts', flattenedAccounts);
        } else {
          setGlobalState('walletAccounts', []);
        }
      } catch (error) {
        // Check if error was due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Log other errors and set accounts to empty
        console.error('Error fetching wallet accounts:', error);
        setGlobalState('walletAccounts', []);
      } finally {
        // Clear abort controller reference if it's still the current one
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = undefined;
        }
      }
    })();
  }, [status, getWalletAccounts]);

  return accounts;
}
