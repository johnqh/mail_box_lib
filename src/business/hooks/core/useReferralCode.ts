/**
 * useReferralCode Hook
 * Observes selected account and fetches referral code from indexer
 * Uses global state for React Native compatibility
 */

import { useEffect, useMemo } from 'react';
import { Optional } from '@sudobility/types';
import { useSelectedAccount } from './useSelectedAccount';
import { useIndexerReferralCode } from '@sudobility/indexer_client';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';

/**
 * Global referral code state - shared across all components
 */
export const useGlobalReferralCode = createGlobalState<Optional<string>>(
  'referralCode',
  null
);

/**
 * Return type for useReferralCode hook
 */
export interface UseReferralCodeReturn {
  /** The referral code for the selected account */
  referralCode: Optional<string>;
  /** Whether the referral code is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Hook to manage referral code for the currently selected account
 *
 * Observes selectedAccount from useSelectedAccount and:
 * - Fetches referral code from indexer when account is selected
 * - Caches referral code in global state
 * - Uses memoization to prevent unnecessary updates
 * - Returns null when no account is selected
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing referralCode, isLoading, and error
 *
 * @example
 * ```tsx
 * function ReferralDisplay() {
 *   const { referralCode, isLoading, error } = useReferralCode(
 *     'https://indexer.example.com',
 *     false
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!referralCode) return <div>No referral code</div>;
 *
 *   return (
 *     <div>
 *       <h2>Your Referral Code</h2>
 *       <code>{referralCode}</code>
 *     </div>
 *   );
 * }
 * ```
 */
export function useReferralCode(
  endpointUrl: string,
  devMode: boolean = false
): UseReferralCodeReturn {
  const { selectedAccount } = useSelectedAccount(endpointUrl, '', devMode);
  const [referralCode] = useGlobalReferralCode();

  // Fetch referral code using the indexer hook
  const indexerHook = useIndexerReferralCode(endpointUrl, devMode);

  useEffect(() => {
    // Clear referral code if no account is selected
    if (!selectedAccount) {
      setGlobalState('referralCode', null);
      return;
    }

    // Process referral code from hook when available
    // ReferralCodeResponse has a specific structure - extract the referral code string
    const response = indexerHook.referralCode;
    const code = response
      ? typeof response === 'string'
        ? response
        : String(response)
      : null;

    // Only update if the referral code has actually changed
    if (code !== referralCode) {
      setGlobalState('referralCode', code);
    }

    // Log error if any
    if (indexerHook.error) {
      console.error('Error fetching referral code:', indexerHook.error);
    }
  }, [
    selectedAccount,
    indexerHook.referralCode,
    indexerHook.error,
    referralCode,
  ]);

  const isLoading = indexerHook.isLoading;
  const error = indexerHook.error;

  // Memoize the referral code to prevent unnecessary updates
  const memoizedReferralCode = useMemo(() => referralCode, [referralCode]);

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when referralCode, isLoading, or error actually change
  return useMemo<UseReferralCodeReturn>(
    () => ({
      referralCode: memoizedReferralCode,
      isLoading,
      error,
    }),
    [memoizedReferralCode, isLoading, error]
  );
}
