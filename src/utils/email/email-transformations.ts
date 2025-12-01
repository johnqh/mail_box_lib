/**
 * Email transformation utilities
 * Transforms wallet account data into email address formats for UI consumption
 */

import { ChainType, IndexerNameServiceAccount } from '@sudobility/types';
import { WildDuckAccount } from '../../business/hooks/core/useWalletAccounts';

// Local transformation type for email utilities
export interface TransformationWalletAccount {
  walletAddress: string;
  chainType: ChainType;
  names: IndexerNameServiceAccount[];
}

export interface TransformationEmailAddress {
  address: string;
  name: string;
  type: 'primary' | 'ens' | 'sns';
  walletAddress: string;
  addressType: 'evm' | 'solana';
  entitled?: boolean;
}

export interface WalletEmailGroup {
  walletAddress: string;
  addressType: 'evm' | 'solana';
  primaryEmail: TransformationEmailAddress;
  domainEmails: TransformationEmailAddress[];
}

/**
 * Transform TransformationWalletAccount[] to WalletEmailGroup[] for email selection UI
 * Separates primary wallet addresses from domain names (ENS/SNS)
 */
export function transformWalletAccountsToEmailGroups(
  walletAccounts: TransformationWalletAccount[]
): WalletEmailGroup[] {
  if (!walletAccounts || walletAccounts.length === 0) return [];

  return walletAccounts.map(walletAccount => {
    const addressType =
      walletAccount.chainType === ChainType.SOLANA ? 'solana' : 'evm';

    return {
      walletAddress: walletAccount.walletAddress,
      addressType,
      // Primary email is always the wallet address itself (always entitled)
      primaryEmail: {
        address: walletAccount.walletAddress,
        name: `${walletAccount.walletAddress.slice(0, 8)}...`,
        type: 'primary' as const,
        walletAddress: walletAccount.walletAddress,
        addressType,
        entitled: true, // Wallet addresses are always entitled
      },
      // Domain names (ENS/SNS) with their entitled status from the API
      // Type is determined by parent wallet's chain type
      domainEmails: walletAccount.names.map(
        (nameServiceAccount: IndexerNameServiceAccount) => ({
          address: nameServiceAccount.name,
          name: nameServiceAccount.name,
          type: addressType === 'solana' ? ('sns' as const) : ('ens' as const),
          walletAddress: walletAccount.walletAddress,
          addressType,
          entitled: nameServiceAccount.entitled,
        })
      ),
    };
  });
}

/**
 * Transform WildDuckAccount[] to TransformationWalletAccount[] for email selection UI
 * Groups accounts by wallet address and collects names
 */
export function transformWildDuckAccountsToWalletAccounts(
  wildDuckAccounts: WildDuckAccount[]
): TransformationWalletAccount[] {
  if (!wildDuckAccounts || wildDuckAccounts.length === 0) return [];

  // Group accounts by walletAddress
  const walletMap = new Map<string, TransformationWalletAccount>();

  for (const account of wildDuckAccounts) {
    const { walletAddress, chainType, username, entitled } = account;

    if (!walletMap.has(walletAddress)) {
      // Create new wallet account entry
      walletMap.set(walletAddress, {
        walletAddress,
        chainType,
        names: [],
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const walletAccount = walletMap.get(walletAddress)!;

    // If username is different from walletAddress, it's a name service account
    if (username !== walletAddress) {
      walletAccount.names.push({
        name: username,
        entitled,
      });
    }
  }

  return Array.from(walletMap.values());
}

/**
 * Flatten WalletEmailGroup[] to a flat array of all email addresses
 * Useful for searching or displaying all addresses in a single list
 */
export function flattenEmailGroups(
  groups: WalletEmailGroup[]
): TransformationEmailAddress[] {
  const allEmails: TransformationEmailAddress[] = [];

  groups.forEach(group => {
    allEmails.push(group.primaryEmail);
    allEmails.push(...group.domainEmails);
  });

  return allEmails;
}

/**
 * Convert ChainType enum to string literal for component compatibility
 */
export function chainTypeToString(
  chainType: ChainType | string | undefined
): 'evm' | 'solana' | 'unknown' {
  if (!chainType) return 'unknown';
  const chainTypeStr =
    typeof chainType === 'string' ? chainType : String(chainType);

  switch (chainTypeStr.toLowerCase()) {
    case 'evm':
    case 'ethereum':
      return 'evm';
    case 'solana':
      return 'solana';
    default:
      return 'unknown';
  }
}
