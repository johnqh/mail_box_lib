/**
 * Utility to detect wallet capabilities and supported chains
 */

import { ChainType } from '@sudobility/types';

interface WalletCapability {
  name: string;
  supportsEVM: boolean;
  supportsSolana: boolean;
  isMultiChain: boolean;
}

/**
 * Get wallet capabilities based on wallet name/type
 */
function getWalletCapabilities(walletName: string): WalletCapability {
  const name = walletName.toLowerCase();

  // Phantom supports both EVM and Solana
  if (name.includes('phantom')) {
    return {
      name: 'Phantom',
      supportsEVM: true,
      supportsSolana: true,
      isMultiChain: true,
    };
  }

  // Solflare primarily Solana but may support EVM
  if (name.includes('solflare')) {
    return {
      name: 'Solflare',
      supportsEVM: false,
      supportsSolana: true,
      isMultiChain: false,
    };
  }

  // Backpack supports both
  if (name.includes('backpack')) {
    return {
      name: 'Backpack',
      supportsEVM: true,
      supportsSolana: true,
      isMultiChain: true,
    };
  }

  // Torus supports both
  if (name.includes('torus')) {
    return {
      name: 'Torus',
      supportsEVM: true,
      supportsSolana: true,
      isMultiChain: true,
    };
  }

  // Most other wallets are EVM-only
  if (
    name.includes('metamask') ||
    name.includes('walletconnect') ||
    name.includes('coinbase') ||
    name.includes('injected') ||
    name.includes('browser')
  ) {
    return {
      name: walletName,
      supportsEVM: true,
      supportsSolana: false,
      isMultiChain: false,
    };
  }

  // Default to EVM-only for unknown wallets
  return {
    name: walletName,
    supportsEVM: true,
    supportsSolana: false,
    isMultiChain: false,
  };
}

/**
 * Check if a wallet is available for a specific chain
 */
function isWalletAvailable(walletName: string, chainType: ChainType): boolean {
  const capabilities = getWalletCapabilities(walletName);

  if (chainType === ChainType.EVM) {
    return capabilities.supportsEVM;
  } else {
    return capabilities.supportsSolana;
  }
}

/**
 * Check if we need to show chain selection for this wallet
 */
function needsChainSelection(walletName: string): boolean {
  const capabilities = getWalletCapabilities(walletName);
  return capabilities.isMultiChain;
}

export {
  getWalletCapabilities,
  isWalletAvailable,
  needsChainSelection,
  type WalletCapability,
};
