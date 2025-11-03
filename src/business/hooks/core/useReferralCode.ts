/**
 * useReferralCode Hook
 * High-level hook for managing referral codes
 * Automatically fetches referral code when wallet and auth are available
 */

import { useEffect, useState } from 'react';
import { Optional } from '@sudobility/types';
import { useIndexerReferralCode } from '@sudobility/indexer_client';
import { useWalletStatus } from './useWalletStatus';

export interface UseReferralCodeConfig {
  endpointUrl: string;
  walletAddress: Optional<string>;
  dev?: boolean;
}

export interface UseReferralCodeReturn {
  /** The referral code string */
  referralCode: Optional<string>;
  /** Whether the referral code is being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: Optional<string>;
  /** Manually refetch the referral code */
  refetch: () => Promise<void>;
}

/**
 * Hook to get user's referral code from the indexer
 * Automatically fetches when wallet address and auth are available
 *
 * @param config - Configuration object
 * @returns Referral code state
 *
 * @example
 * ```tsx
 * const { referralCode, isLoading, error } = useReferralCode({
 *   endpointUrl: 'https://indexer.0xmail.box',
 *   walletAddress: '0x123...',
 *   dev: false,
 * });
 *
 * if (referralCode) {
 *   console.log(`https://0xmail.box?referral=${referralCode}`);
 * }
 * ```
 */
export function useReferralCode(
  config: UseReferralCodeConfig
): UseReferralCodeReturn {
  const { endpointUrl, walletAddress, dev = false } = config;
  const { indexerAuth } = useWalletStatus();

  // Use the low-level indexer client hook
  const {
    referralCode: referralCodeData,
    isLoading,
    error,
    fetchReferralCode,
  } = useIndexerReferralCode(endpointUrl, dev);

  // State to track if we've already fetched
  const [hasFetched, setHasFetched] = useState(false);

  // Extract the actual referral code string
  const referralCode = referralCodeData?.data?.referralCode;

  // Auto-fetch when wallet address and auth are available
  useEffect(() => {
    if (!walletAddress || !indexerAuth || hasFetched) {
      return;
    }

    const fetch = async () => {
      try {
        console.log(
          `🎫 [useReferralCode] Fetching referral code for ${walletAddress}`
        );
        await fetchReferralCode(walletAddress, {
          signature: indexerAuth.signature,
          message: indexerAuth.message,
          signer: indexerAuth.signer,
        });
        setHasFetched(true);
      } catch (err) {
        console.error('Failed to fetch referral code:', err);
      }
    };

    fetch();
  }, [walletAddress, indexerAuth, hasFetched, fetchReferralCode]);

  // Manual refetch function
  const refetch = async () => {
    if (!walletAddress || !indexerAuth) {
      throw new Error(
        'Wallet address and auth required to fetch referral code'
      );
    }

    setHasFetched(false);
    await fetchReferralCode(walletAddress, {
      signature: indexerAuth.signature,
      message: indexerAuth.message,
      signer: indexerAuth.signer,
    });
    setHasFetched(true);
  };

  return {
    referralCode,
    isLoading,
    error,
    refetch,
  };
}
