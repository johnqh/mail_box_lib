/**
 * Name resolution utility for ENS and SNS domains
 * Handles resolving .eth, .box, .sol domains to wallet addresses
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { isAddress } from 'viem';
import {
  AddressHelper,
  AddressType,
} from '../../business/core/auth/auth-business-logic';

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

export interface NameResolutionResult {
  address: string;
  type: 'ens' | 'sns' | 'address';
  originalInput: string;
}

/**
 * Check if input looks like an ENS name
 */
export function isENSName(input: string): boolean {
  return AddressHelper.getAddressType(input) === AddressType.ENSName;
}

/**
 * Check if input looks like an SNS name
 */
export function isSNSName(input: string): boolean {
  return AddressHelper.getAddressType(input) === AddressType.SNSName;
}

/**
 * Check if input is already a valid address
 */
export function isValidAddress(input: string): boolean {
  try {
    // First check with viem (for EVM addresses)
    if (isAddress(input)) {
      return true;
    }

    // Then check with AddressHelper for Solana addresses
    const addressType = AddressHelper.getAddressType(input);
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
export async function resolveENSName(name: string): Promise<string | null> {
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
export async function resolveSNSName(name: string): Promise<string | null> {
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
): Promise<NameResolutionResult | null> {
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

  // Try ENS resolution
  if (isENSName(trimmedInput)) {
    const address = await resolveENSName(trimmedInput);
    if (address) {
      return {
        address,
        type: 'ens',
        originalInput: input,
      };
    }
  }

  // Try SNS resolution
  if (isSNSName(trimmedInput)) {
    const address = await resolveSNSName(trimmedInput);
    if (address) {
      return {
        address,
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
export function validateNameOrAddressInput(input: string): {
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

  // Check if it looks like an ENS name
  if (isENSName(trimmedInput)) {
    return { isValid: true };
  }

  // Check if it looks like an SNS name
  if (isSNSName(trimmedInput)) {
    return { isValid: true };
  }

  // Check if it might be an incomplete domain
  if (trimmedInput.includes('.')) {
    return {
      isValid: false,
      error:
        'Unsupported domain. Use .eth, .box (ENS) or .sol (SNS) domains, or a wallet address',
    };
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
    error:
      'Please enter a valid wallet address, ENS name (.eth/.box), or SNS name (.sol)',
  };
}

/**
 * Get display text for resolved name
 */
export function getDisplayTextForResolution(
  result: NameResolutionResult
): string {
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
