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
 * Translation function type
 */
export type TranslationFunction = (
  key: string,
  defaultValue?: string
) => string;

/**
 * Hook to get available settings sections for an email account
 *
 * Returns a list of settings sections that are appropriate for the
 * current account type. Wallet addresses get additional "Points" and "Claim" sections.
 *
 * @param walletAddress - The wallet address to check (optional)
 * @param t - Optional translation function for localizing section titles
 * @returns Object containing sections array and canClaim flag
 *
 * @example
 * ```tsx
 * function SettingsList() {
 *   const { t } = useTranslation('accountSettings');
 *   const { sections, canClaim } = useMailAccountSettings(walletAddress, t);
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
  walletAddress: Optional<string>,
  t?: TranslationFunction
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
        title: t ? t('sections.general', 'General') : 'General',
        icon: 'cog',
        description: t
          ? t('general.description', 'Account information and general settings')
          : 'Account information and general settings',
      },
      {
        id: 'forwarding',
        title: t ? t('sections.forwarding', 'Forwarding') : 'Forwarding',
        icon: 'arrow-right',
        description: t
          ? t('forwarding.description', 'Forward emails to another address')
          : 'Forward emails to another address',
      },
      {
        id: 'spam',
        title: t ? t('sections.spam', 'Spam') : 'Spam',
        icon: 'shield',
        description: t
          ? t('spam.description', 'Spam filtering and management')
          : 'Spam filtering and management',
      },
      {
        id: 'autoreply',
        title: t ? t('sections.autoreply', 'Auto-Reply') : 'Auto-Reply',
        icon: 'reply',
        description: t
          ? t('autoreply.description', 'Automatic email responses')
          : 'Automatic email responses',
      },
      {
        id: 'filters',
        title: t ? t('sections.filters', 'Filters') : 'Filters',
        icon: 'filter',
        description: t
          ? t('filters.description', 'Email filtering rules')
          : 'Email filtering rules',
      },
      {
        id: 'integration',
        title: t ? t('sections.integrations', 'Integration') : 'Integration',
        icon: 'plug',
        description: t
          ? t('integration.description', 'Third-party integrations')
          : 'Third-party integrations',
      },
      {
        id: 'advanced',
        title: t ? t('sections.advanced', 'Advanced') : 'Advanced',
        icon: 'adjustments',
        description: t
          ? t('advanced.description', 'Advanced account settings')
          : 'Advanced account settings',
      },
    ],
    [t]
  );

  /**
   * All settings sections including conditional ones
   * Adds "Points" and "Claim" sections for wallet addresses
   */
  const sections = useMemo<SettingSection[]>(() => {
    // If it's a wallet address, add the points and claim sections
    if (isWalletAddress) {
      return [
        ...baseSettingsSections,
        {
          id: 'points',
          title: t ? t('sections.points', 'Points') : 'Points',
          icon: 'star',
          description: t
            ? t('points.description', 'View and manage your points')
            : 'View and manage your points',
        },
        {
          id: 'claim',
          title: t ? t('sections.claim', 'Claim') : 'Claim',
          icon: 'currency-dollar',
          description: t
            ? t('claim.description', 'Claim recipient revenue shares')
            : 'Claim recipient revenue shares',
        },
      ];
    }

    return baseSettingsSections;
  }, [baseSettingsSections, isWalletAddress, t]);

  return {
    sections,
    canClaim: isWalletAddress,
  };
}
