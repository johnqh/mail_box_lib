import { isAddress as isEvmAddress } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { ChainType } from '../../business/core/enums';

// Re-export ChainType for backward compatibility
export { ChainType };

/**
 * Detect whether an address is an EVM address, Solana address, or unknown
 */
export function detectAddressType(address: string): ChainType {
  if (!address) return ChainType.UNKNOWN;

  // Check if it's an EVM address (starts with 0x and is 42 characters)
  if (address.startsWith('0x') && address.length === 42) {
    if (isEvmAddress(address)) {
      return ChainType.EVM;
    }
  }

  // Check if it's a Solana address (base58 encoded, 32-44 characters)
  try {
    new PublicKey(address);
    // If we can create a PublicKey without error, it's a valid Solana address
    if (address.length >= 32 && address.length <= 44) {
      return ChainType.SOLANA;
    }
  } catch {
    // Not a valid Solana address
  }

  return ChainType.UNKNOWN;
}

/**
 * Check if an address is a valid Solana address
 */
export function isSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an address is a valid EVM address
 */
export function isValidEvmAddress(address: string): boolean {
  return isEvmAddress(address);
}
