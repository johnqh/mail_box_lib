/**
 * Name resolution utility for ENS and SNS domains
 * Handles resolving domain names to wallet addresses
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { isAddress } from 'viem';
import { AddressType, getAddressType, Optional } from '@sudobility/types';

// Create public client for ENS resolution
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com', {
    retryCount: 2,
    retryDelay: 500,
    timeout: 5000,
  }),
});

// Cache for resolved names
const resolverCache = new Map<string, { address: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface NameResolutionResult {
  address: string;
  type: 'ens' | 'sns' | 'address';
  originalInput: string;
}

/**
 * Check if input looks like a domain name
 * Domain names contain a "." and are not wallet addresses
 */
function isDomainName(input: string): boolean {
  if (!input || !input.includes('.')) {
    return false;
  }
  // Check it's not a wallet address
  const addressType = getAddressType(input);
  return addressType === undefined;
}

/**
 * Check if input is already a valid address
 */
function isValidAddress(input: string): boolean {
  try {
    // First check with viem (for EVM addresses)
    if (isAddress(input)) {
      return true;
    }

    // Then check for Solana addresses
    const addressType = getAddressType(input);
    return (
      addressType === AddressType.EVMAddress ||
      addressType === AddressType.SolanaAddress
    );
  } catch {
    return false;
  }
}

/**
 * Resolve ENS name to address
 */
export async function resolveENSName(name: string): Promise<Optional<string>> {
  try {
    // Check cache first
    const cached = resolverCache.get(name.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.address;
    }

    // Resolving ENS name
    const address = await publicClient.getEnsAddress({
      name,
    });

    if (address) {
      // Cache the result
      resolverCache.set(name.toLowerCase(), {
        address,
        timestamp: Date.now(),
      });
      // ENS resolution successful
      return address;
    }

    return null;
  } catch {
    // ENS resolution failed
    return null;
  }
}

/**
 * Resolve SNS name to address
 * Note: This is a placeholder implementation
 */
export async function resolveSNSName(name: string): Promise<Optional<string>> {
  try {
    // Check cache first
    const cached = resolverCache.get(name.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.address;
    }

    // Implement SNS resolution using Bonfida
    try {
      // Dynamic import to handle environments where @bonfida/spl-name-service might not be available
      const bonfida = await import('@bonfida/spl-name-service');
      const { Connection } = await import('@solana/web3.js');

      // Create a connection to Solana mainnet
      const connection = new Connection('https://api.mainnet-beta.solana.com');

      // Resolve the SNS name to an address
      const address = await bonfida.resolve(connection, name);

      if (address) {
        const addressString = address.toBase58();

        // Cache the result
        resolverCache.set(name.toLowerCase(), {
          address: addressString,
          timestamp: Date.now(),
        });

        return addressString;
      }
    } catch (importError) {
      console.warn(
        'Bonfida SNS library not available, falling back to null:',
        importError
      );
    }

    return null;
  } catch {
    // SNS resolution failed
    return null;
  }
}

/**
 * Resolve any name or address to a valid wallet address
 */
export async function resolveNameOrAddress(
  input: string
): Promise<Optional<NameResolutionResult>> {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  // If it's already a valid address, return it
  if (isValidAddress(trimmedInput)) {
    return {
      address: trimmedInput,
      type: 'address',
      originalInput: input,
    };
  }

  // Try domain resolution if it looks like a domain name
  if (isDomainName(trimmedInput)) {
    // Try ENS resolution first (supports .eth, .box, etc.)
    const ensAddress = await resolveENSName(trimmedInput);
    if (ensAddress) {
      return {
        address: ensAddress,
        type: 'ens',
        originalInput: input,
      };
    }

    // Try SNS resolution (supports .sol, etc.)
    const snsAddress = await resolveSNSName(trimmedInput);
    if (snsAddress) {
      return {
        address: snsAddress,
        type: 'sns',
        originalInput: input,
      };
    }
  }

  return null;
}

/**
 * Validate input and provide helpful error messages
 */
function validateNameOrAddressInput(input: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return { isValid: false, error: 'Please enter a delegate address or name' };
  }

  // If it's a valid address, it's good
  if (isValidAddress(trimmedInput)) {
    return { isValid: true };
  }

  // Check if it looks like a domain name
  if (isDomainName(trimmedInput)) {
    return { isValid: true };
  }

  // If it looks like an address but is invalid
  if (trimmedInput.startsWith('0x')) {
    return {
      isValid: false,
      error: 'Invalid wallet address format',
    };
  }

  return {
    isValid: false,
    error: 'Please enter a valid wallet address or domain name',
  };
}

/**
 * Get display text for resolved name
 */
function getDisplayTextForResolution(result: NameResolutionResult): string {
  switch (result.type) {
    case 'ens':
      return `${result.originalInput} → ${result.address.slice(0, 6)}...${result.address.slice(-4)}`;
    case 'sns':
      return `${result.originalInput} → ${result.address.slice(0, 6)}...${result.address.slice(-4)}`;
    case 'address':
      return `${result.address.slice(0, 6)}...${result.address.slice(-4)}`;
    default:
      return result.address;
  }
}

export {
  isDomainName,
  isValidAddress,
  validateNameOrAddressInput,
  getDisplayTextForResolution,
  type NameResolutionResult,
};
