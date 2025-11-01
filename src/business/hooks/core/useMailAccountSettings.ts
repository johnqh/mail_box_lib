/**
 * useMailAccountSettings Hook
 * Provides the list of available settings sections for an email account
 * Settings availability depends on account type (wallet address vs ENS/SNS name)
 */

import { useMemo } from 'react';
import { Optional } from '@sudobility/types';

/**
 * Setting section definition
 */
export interface SettingSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title for the section */
  title: string;
  /** Icon name or component (optional) */
  icon?: string;
  /** Description of what this section controls (optional) */
  description?: string;
}

/**
 * Return type for useMailAccountSettings hook
 */
export interface UseMailAccountSettingsReturn {
  /** Array of available setting sections */
  sections: SettingSection[];
  /** Whether the account can access claim settings */
  canClaim: boolean;
}

/**
 * Hook to get available settings sections for an email account
 *
 * Returns a list of settings sections that are appropriate for the
 * current account type. Wallet addresses get additional "Claim" section.
 *
 * @param walletAddress - The wallet address to check (optional)
 * @returns Object containing sections array and canClaim flag
 *
 * @example
 * ```tsx
 * function SettingsList() {
 *   const { sections, canClaim } = useMailAccountSettings(walletAddress);
 *
 *   return (
 *     <ul>
 *       {sections.map(section => (
 *         <li key={section.id}>{section.title}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useMailAccountSettings(
  walletAddress: Optional<string>
): UseMailAccountSettingsReturn {
  /**
   * Helper function to check if account is a wallet address
   * Returns true for Ethereum (0x...) or Solana (base58) addresses
   */
  const isWalletAddress = useMemo(() => {
    if (!walletAddress) return false;

    // Check if it's an Ethereum address (0x followed by 40 hex characters)
    if (/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return true;

    // Check if it's a Solana address (base58, 32-44 characters)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) return true;

    return false;
  }, [walletAddress]);

  /**
   * Base settings sections available to all accounts
   */
  const baseSettingsSections: SettingSection[] = useMemo(
    () => [
      {
        id: 'general',
        title: 'General',
        icon: 'cog',
        description: 'Account information and general settings',
      },
      {
        id: 'forwarding',
        title: 'Forwarding',
        icon: 'arrow-right',
        description: 'Forward emails to another address',
      },
      {
        id: 'spam',
        title: 'Spam',
        icon: 'shield',
        description: 'Spam filtering and management',
      },
      {
        id: 'autoreply',
        title: 'Auto-Reply',
        icon: 'reply',
        description: 'Automatic email responses',
      },
      {
        id: 'filters',
        title: 'Filters',
        icon: 'filter',
        description: 'Email filtering rules',
      },
      {
        id: 'integration',
        title: 'Integrations',
        icon: 'plug',
        description: 'Third-party integrations',
      },
      {
        id: 'advanced',
        title: 'Advanced',
        icon: 'adjustments',
        description: 'Advanced account settings',
      },
    ],
    []
  );

  /**
   * All settings sections including conditional ones
   * Adds "Claim" section for wallet addresses
   */
  const sections = useMemo<SettingSection[]>(() => {
    // If it's a wallet address, add the claim section
    if (isWalletAddress) {
      return [
        ...baseSettingsSections,
        {
          id: 'claim',
          title: 'Claim',
          icon: 'currency-dollar',
          description: 'Claim recipient revenue shares',
        },
      ];
    }

    return baseSettingsSections;
  }, [baseSettingsSections, isWalletAddress]);

  return {
    sections,
    canClaim: isWalletAddress,
  };
}
