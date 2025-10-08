/**
 * Email transformation utilities
 * Transforms wallet account data into email address formats for UI consumption
 */

import { ChainType, NameServiceAccount } from '@johnqh/types';
import { WildDuckAccount } from '../../business/hooks/core/useWalletAccounts';

export interface WalletAccount {
  walletAddress: string;
  chainType: ChainType;
  names: NameServiceAccount[];
}

export interface EmailAddress {
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
  primaryEmail: EmailAddress;
  domainEmails: EmailAddress[];
}

/**
 * Transform WalletAccount[] to WalletEmailGroup[] for email selection UI
 * Separates primary wallet addresses from domain names (ENS/SNS)
 */
export function transformWalletAccountsToEmailGroups(
  walletAccounts: WalletAccount[]
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
      domainEmails: walletAccount.names.map(
        (nameServiceAccount: NameServiceAccount) => {
          const domainName = nameServiceAccount.name;
          const isSNS = domainName.endsWith('.sol');
          const isENS = domainName.endsWith('.eth');

          return {
            address: domainName,
            name: domainName,
            type: isSNS
              ? ('sns' as const)
              : isENS
                ? ('ens' as const)
                : ('primary' as const),
            walletAddress: walletAccount.walletAddress,
            addressType: isSNS ? 'solana' : 'evm',
            entitled: nameServiceAccount.entitled, // Use entitled from API
          };
        }
      ),
    };
  });
}

/**
 * Transform WildDuckAccount[] to WalletAccount[] for email selection UI
 * Groups accounts by wallet address and collects names
 */
export function transformWildDuckAccountsToWalletAccounts(
  wildDuckAccounts: WildDuckAccount[]
): WalletAccount[] {
  if (!wildDuckAccounts || wildDuckAccounts.length === 0) return [];

  // Group accounts by walletAddress
  const walletMap = new Map<string, WalletAccount>();

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
export function flattenEmailGroups(groups: WalletEmailGroup[]): EmailAddress[] {
  const allEmails: EmailAddress[] = [];

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
