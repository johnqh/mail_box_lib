/**
 * Helper for managing referral code storage and consumption
 * Simple localStorage-based implementation for referral code tracking
 */

import { Optional } from '@sudobility/types';

const REFERRAL_CODE_KEY = 'pending_referral_code';

/**
 * Platform-agnostic storage interface
 */
interface Storage {
  getItem(key: string): Optional<string>;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Get storage implementation (browser localStorage or custom)
 */
const getStorage = (): Optional<Storage> => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

/**
 * Helper class for referral code consumption
 *
 * Usage:
 * 1. Call record() when referral code is in URL
 * 2. Call consume() when authenticating - returns and clears the code
 *
 * @example
 * ```typescript
 * // In routing when ?referral=XXX is detected
 * ReferralConsumptionHelper.record('0x123...');
 *
 * // Later, when authenticating
 * const code = ReferralConsumptionHelper.consume(); // Returns code and clears it
 * await authenticate({ ...params, referralCode: code });
 * ```
 */
export class ReferralConsumptionHelper {
  /**
   * Record a referral code to localStorage
   * @param referralCode The referral code to store
   */
  static record(referralCode: string): void {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    if (!referralCode || referralCode.trim() === '') {
      return;
    }

    storage.setItem(REFERRAL_CODE_KEY, referralCode);
  }

  /**
   * Consume the referral code - retrieves it and clears it from storage
   * @returns The referral code if one exists, undefined otherwise
   */
  static consume(): Optional<string> {
    const storage = getStorage();
    if (!storage) {
      return undefined;
    }

    const code = storage.getItem(REFERRAL_CODE_KEY);

    if (code) {
      storage.removeItem(REFERRAL_CODE_KEY);
      return code;
    }

    return undefined;
  }

  /**
   * Check if a referral code exists without consuming it
   * @returns True if a referral code is stored
   */
  static hasPending(): boolean {
    const storage = getStorage();
    if (!storage) {
      return false;
    }

    const code = storage.getItem(REFERRAL_CODE_KEY);
    return !!code;
  }
}
