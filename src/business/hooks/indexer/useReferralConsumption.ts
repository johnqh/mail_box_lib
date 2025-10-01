import { useCallback, useEffect, useState } from 'react';
import { Optional } from '@johnqh/types';

// Platform-specific globals
declare const localStorage: Storage;

const REFERRAL_CODE_KEY = 'pending_referral_code';

/**
 * Hook for consuming referral codes from URL
 *
 * Flow:
 * 1. On app load, check URL for ?referral=XXX
 * 2. If found, save to localStorage
 * 3. When user connects wallet and getWalletAccounts is called,
 *    provide the referral code via callback
 * 4. After successful consumption, delete from localStorage
 *
 * @example
 * ```typescript
 * const {
 *   pendingReferralCode,
 *   consumeReferralCode,
 *   clearReferralCode
 * } = useReferralConsumption();
 *
 * // In getWalletAccounts call:
 * const code = consumeReferralCode(); // Returns code and keeps it pending
 * // ... API call with code ...
 * clearReferralCode(); // Clear after successful API call
 * ```
 */
export const useReferralConsumption = () => {
  const [pendingReferralCode, setPendingReferralCode] = useState<Optional<string>>(null);

  /**
   * Check URL and localStorage for pending referral code
   */
  useEffect(() => {
    // Check URL first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const referralParam = params.get('referral');

      if (referralParam) {
        // Save to localStorage
        localStorage.setItem(REFERRAL_CODE_KEY, referralParam);
        setPendingReferralCode(referralParam);

        // Clean URL (remove referral param)
        params.delete('referral');
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        // Check localStorage
        const stored = localStorage.getItem(REFERRAL_CODE_KEY);
        if (stored) {
          setPendingReferralCode(stored);
        }
      }
    }
  }, []);

  /**
   * Get the referral code for consumption (doesn't delete it)
   * Should be called when making getWalletAccounts API call
   */
  const consumeReferralCode = useCallback((): Optional<string> => {
    return pendingReferralCode;
  }, [pendingReferralCode]);

  /**
   * Clear the referral code after successful consumption
   * Should be called after getWalletAccounts succeeds
   */
  const clearReferralCode = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFERRAL_CODE_KEY);
    }
    setPendingReferralCode(null);
  }, []);

  /**
   * Manually set a referral code (for testing or special cases)
   */
  const setReferralCode = useCallback((code: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFERRAL_CODE_KEY, code);
    }
    setPendingReferralCode(code);
  }, []);

  return {
    pendingReferralCode,
    hasPendingCode: !!pendingReferralCode,
    consumeReferralCode,
    clearReferralCode,
    setReferralCode,
  };
};
