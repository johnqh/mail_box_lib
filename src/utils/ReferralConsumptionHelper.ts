/**
 * Helper for managing referral code storage and consumption
 * Platform-agnostic implementation for referral code tracking
 */

import { Optional } from '@sudobility/types';

const REFERRAL_CODE_KEY = 'pending_referral_code';

/**
 * Platform-agnostic storage interface
 * This should be provided by the consuming application
 */
export interface ReferralStorage {
  getItem(key: string): Optional<string>;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Helper class for referral code consumption
 *
 * Usage:
 * 1. Create an instance with a platform-specific storage implementation
 * 2. Call record() when referral code is in URL
 * 3. Call consume() when authenticating - returns and clears the code
 *
 * @example
 * ```typescript
 * // Create helper with platform storage
 * const referralHelper = new ReferralConsumptionHelper(myStorage);
 *
 * // In routing when ?referral=XXX is detected
 * referralHelper.record('0x123...');
 *
 * // Later, when authenticating
 * const code = referralHelper.consume(); // Returns code and clears it
 * await authenticate({ ...params, referralCode: code });
 * ```
 */
export class ReferralConsumptionHelper {
  private storage: ReferralStorage;

  /**
   * Create a new ReferralConsumptionHelper instance
   * @param storage Platform-specific storage implementation
   */
  constructor(storage: ReferralStorage) {
    this.storage = storage;
  }

  /**
   * Record a referral code to storage
   * @param referralCode The referral code to store
   */
  record(referralCode: string): void {
    if (!referralCode || referralCode.trim() === '') {
      return;
    }

    this.storage.setItem(REFERRAL_CODE_KEY, referralCode);
  }

  /**
   * Consume the referral code - retrieves it and clears it from storage
   * @returns The referral code if one exists, undefined otherwise
   */
  consume(): Optional<string> {
    const code = this.storage.getItem(REFERRAL_CODE_KEY);

    if (code) {
      this.storage.removeItem(REFERRAL_CODE_KEY);
      return code;
    }

    return undefined;
  }

  /**
   * Check if a referral code exists without consuming it
   * @returns True if a referral code is stored
   */
  hasPending(): boolean {
    const code = this.storage.getItem(REFERRAL_CODE_KEY);
    return !!code;
  }
}

/**
 * Create a ReferralConsumptionHelper instance
 * @param storage Platform-specific storage implementation
 * @returns A configured ReferralConsumptionHelper instance
 *
 * @example
 * ```typescript
 * import { createReferralHelper } from '@sudobility/lib';
 *
 * // For web
 * const referralHelper = createReferralHelper(localStorage);
 *
 * // For React Native (using AsyncStorage adapter)
 * const referralHelper = createReferralHelper(myAsyncStorageAdapter);
 * ```
 */
export function createReferralHelper(
  storage: ReferralStorage
): ReferralConsumptionHelper {
  return new ReferralConsumptionHelper(storage);
}
