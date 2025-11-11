/**
 * useWalletAccounts Hook
 * Observes wallet status and fetches accounts when wallet is verified
 * Uses global state for React Native compatibility
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { NetworkClient, Optional, WalletData } from '@sudobility/types';
import { useWalletStatus } from './useWalletStatus';
import {
  IndexerUserAuth,
  useIndexerGetWalletAccounts,
} from '@sudobility/indexer_client';
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
 * Return type for useWalletAccounts hook
 */
export interface UseWalletAccountsReturn {
  /** Array of WildDuck accounts */
  accounts: WildDuckAccount[];
  /** Indexer authentication object (passthrough from useWalletStatus) */
  indexerAuth: Optional<IndexerUserAuth>;
  /** Function to refresh wallet accounts */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage wallet accounts based on wallet status
 *
 * @param networkClient - Network client for API calls
 * @param endpointUrl - Indexer API endpoint URL
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing accounts array and indexerAuth
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const networkClient = useNetworkClient();
 *   const { accounts, indexerAuth } = useWalletAccounts(networkClient, 'https://indexer.example.com', false);
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
  networkClient: NetworkClient,
  endpointUrl: string,
  devMode: boolean = false
): UseWalletAccountsReturn {
  const { status, indexerAuth } = useWalletStatus();
  const [rawAccounts] = useGlobalWalletAccounts();

  // Stabilize accounts array reference based on content
  // This prevents infinite loops from array reference changes
  const accountsKey = rawAccounts
    .map(a => `${a.username}:${a.walletAddress}`)
    .join('|');
  const accounts = useMemo(
    () => rawAccounts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawAccounts.length, accountsKey]
  );

  // Stabilize indexerAuth object reference based on content
  const stableIndexerAuth = useMemo(
    () => indexerAuth,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indexerAuth?.message, indexerAuth?.signature, indexerAuth?.signer]
  );

  // useIndexerGetWalletAccounts now requires networkClient and walletAddress and auth upfront
  const walletAddress = status?.walletAddress || '';
  const auth = stableIndexerAuth || { message: '', signature: '', signer: '' };
  const queryResult = useIndexerGetWalletAccounts(
    networkClient,
    endpointUrl,
    devMode,
    walletAddress,
    auth
  );

  // DEBUG: Log render
  console.log('🔍 [useWalletAccounts] RENDER', {
    accountsCount: accounts.length,
    accountsUsernames: accounts.map(a => a.username),
    accountsWallets: accounts.map(a => a.walletAddress),
    statusWalletAddress: status?.walletAddress,
    statusChainType: status?.chainType,
    isVerified: !!(
      status?.walletAddress &&
      status?.message &&
      status?.signature
    ),
    hasQueryData: !!queryResult.data,
  });

  useEffect(() => {
    console.log('🔍 [useWalletAccounts] EFFECT triggered', {
      accountsLength: accounts.length,
      statusWallet: status?.walletAddress,
      hasQueryData: !!queryResult.data,
    });

    // Check if wallet is verified (has message and signature)
    const isVerified =
      status?.walletAddress && status?.message && status?.signature;

    if (!isVerified) {
      console.log('🔍 [useWalletAccounts] ⚠️ Not verified, CLEARING accounts', {
        hadAccounts: accounts.length > 0,
        previousCount: accounts.length,
      });
      // Set accounts to empty array when not verified
      setGlobalState('walletAccounts', []);
      return;
    }

    // TypeScript doesn't know these are non-null due to isVerified check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentWalletAddress = status.walletAddress!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const chainType = status.chainType!;

    // Check if accounts list has accounts from a different wallet
    // If so, clear first before populating with new wallet
    const hasAccountsFromDifferentWallet =
      accounts.length > 0 &&
      accounts[0]?.walletAddress?.toLowerCase() !==
        currentWalletAddress.toLowerCase();

    console.log('🔍 [useWalletAccounts] Wallet check', {
      hasAccountsFromDifferentWallet,
      accountsWallet: accounts[0]?.walletAddress,
      currentWallet: currentWalletAddress,
    });

    if (hasAccountsFromDifferentWallet) {
      console.log(
        '🔍 [useWalletAccounts] ⚠️ Different wallet detected, CLEARING accounts',
        {
          oldWallet: accounts[0]?.walletAddress,
          newWallet: currentWalletAddress,
          previousCount: accounts.length,
        }
      );
      // Clear accounts from old wallet first
      setGlobalState('walletAccounts', []);
      // Return and let the effect re-run with empty accounts
      return;
    }

    // Immediately set accounts to show the wallet address ONLY if we don't have any accounts yet
    // This provides instant feedback while we fetch the full list
    // This will be replaced when the query returns
    if (accounts.length === 0) {
      console.log(
        '🔍 [useWalletAccounts] 📝 Setting initial PLACEHOLDER account',
        {
          walletAddress: currentWalletAddress,
          chainType,
          hasQueryData: !!queryResult.data,
        }
      );
      setGlobalState('walletAccounts', [
        {
          walletAddress: currentWalletAddress,
          chainType,
          username: currentWalletAddress,
          entitled: true,
        },
      ]);
    }

    // Process query result when data is available
    if (queryResult.data && queryResult.data.success && queryResult.data.data) {
      const flattenedAccounts: WildDuckAccount[] = [];

      for (const walletAccount of queryResult.data.data.accounts) {
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

      console.log(
        '🔍 [useWalletAccounts] ✅ Processing query result, SETTING accounts',
        {
          previousCount: accounts.length,
          newCount: flattenedAccounts.length,
          newUsernames: flattenedAccounts.map(a => a.username),
          rawAccountsCount: queryResult.data.data.accounts.length,
        }
      );
      setGlobalState('walletAccounts', flattenedAccounts);
    } else if (queryResult.isError) {
      // Log error and set accounts to empty
      console.error(
        '🔍 [useWalletAccounts] ❌ Error fetching wallet accounts, CLEARING',
        {
          error: queryResult.error,
          previousCount: accounts.length,
        }
      );
      setGlobalState('walletAccounts', []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status?.walletAddress,
    status?.message,
    status?.signature,
    status?.chainType,
    indexerAuth?.signer,
    queryResult.data,
    queryResult.isError,
    queryResult.error,
    // NOTE: Do NOT include accounts.length here as it creates a render loop
    // The effect modifies accounts, which would change accounts.length,
    // which would trigger the effect again, creating an infinite loop
  ]);

  // Refresh function to manually refetch wallet accounts
  // Use a ref to avoid recreating the callback when queryResult changes
  const queryResultRef = useRef(queryResult);
  queryResultRef.current = queryResult;

  const refresh = useCallback(async () => {
    if (queryResultRef.current.refetch) {
      await queryResultRef.current.refetch();
    }
  }, []); // Empty deps - stable reference

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when accounts or indexerAuth actually change
  return useMemo<UseWalletAccountsReturn>(
    () => ({ accounts, indexerAuth: stableIndexerAuth, refresh }),
    [accounts, stableIndexerAuth, refresh]
  );
}
