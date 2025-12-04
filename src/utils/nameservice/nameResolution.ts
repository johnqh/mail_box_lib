/**
 * Name resolution utility for ENS and SNS domains
 * Handles resolving domain names to wallet addresses
 */

import { isAddress } from 'viem';
import { AddressType, getAddressType, Optional } from '@sudobility/types';
import { ENSService, type ENSServiceConfig } from './ens';

/**
 * Configuration for name resolution service
 */
export interface NameResolutionConfig {
  /** Configuration for ENS resolution */
  ens: ENSServiceConfig;
  /** Solana RPC URL (for SNS resolution) */
  solanaRpcUrl?: string;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
}

interface NameResolutionResult {
  address: string;
  type: 'ens' | 'sns' | 'address';
  originalInput: string;
}

/**
 * Name Resolution Service for ENS and SNS domains
 * Platform-agnostic implementation that requires explicit configuration
 */
export class NameResolutionService {
  private ensService: ENSService;
  private solanaRpcUrl: Optional<string>;
  private cacheDuration: number;
  private resolverCache = new Map<
    string,
    { address: string; timestamp: number }
  >();

  /**
   * Create a new name resolution service instance
   * @param config Service configuration
   */
  constructor(config: NameResolutionConfig) {
    this.ensService = new ENSService(config.ens);
    this.solanaRpcUrl = config.solanaRpcUrl;
    this.cacheDuration = config.cacheDuration || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Check if input looks like a domain name
   * Domain names contain a "." and are not wallet addresses
   */
  isDomainName(input: string): boolean {
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
  isValidAddress(input: string): boolean {
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
  async resolveENSName(name: string): Promise<Optional<string>> {
    // Check cache first
    const cached = this.resolverCache.get(name.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.address;
    }

    const address = await this.ensService.resolveENSName(name);

    if (address) {
      // Cache the result
      this.resolverCache.set(name.toLowerCase(), {
        address,
        timestamp: Date.now(),
      });
    }

    return address;
  }

  /**
   * Resolve SNS name to address
   * Note: Requires @bonfida/spl-name-service and @solana/web3.js
   */
  async resolveSNSName(name: string): Promise<Optional<string>> {
    try {
      // Check cache first
      const cached = this.resolverCache.get(name.toLowerCase());
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.address;
      }

      if (!this.solanaRpcUrl) {
        console.warn('Solana RPC URL not configured for SNS resolution');
        return null;
      }

      // Implement SNS resolution using Bonfida
      try {
        // Dynamic import to handle environments where @bonfida/spl-name-service might not be available
        const bonfida = await import('@bonfida/spl-name-service');
        const { Connection } = await import('@solana/web3.js');

        // Create a connection to Solana
        const connection = new Connection(this.solanaRpcUrl);

        // Resolve the SNS name to an address
        const address = await bonfida.resolve(connection, name);

        if (address) {
          const addressString = address.toBase58();

          // Cache the result
          this.resolverCache.set(name.toLowerCase(), {
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
  async resolveNameOrAddress(
    input: string
  ): Promise<Optional<NameResolutionResult>> {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return null;
    }

    // If it's already a valid address, return it
    if (this.isValidAddress(trimmedInput)) {
      return {
        address: trimmedInput,
        type: 'address',
        originalInput: input,
      };
    }

    // Try domain resolution if it looks like a domain name
    if (this.isDomainName(trimmedInput)) {
      // Try ENS resolution first (supports .eth, .box, etc.)
      const ensAddress = await this.resolveENSName(trimmedInput);
      if (ensAddress) {
        return {
          address: ensAddress,
          type: 'ens',
          originalInput: input,
        };
      }

      // Try SNS resolution (supports .sol, etc.)
      const snsAddress = await this.resolveSNSName(trimmedInput);
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
  validateNameOrAddressInput(input: string): {
    isValid: boolean;
    error?: string;
  } {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return {
        isValid: false,
        error: 'Please enter a delegate address or name',
      };
    }

    // If it's a valid address, it's good
    if (this.isValidAddress(trimmedInput)) {
      return { isValid: true };
    }

    // Check if it looks like a domain name
    if (this.isDomainName(trimmedInput)) {
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
  getDisplayTextForResolution(result: NameResolutionResult): string {
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

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.resolverCache.clear();
    this.ensService.clearCache();
  }
}

/**
 * Create a name resolution service instance
 * @param config Service configuration
 * @returns A configured name resolution service instance
 *
 * @example
 * ```typescript
 * import { createNameResolutionService } from '@sudobility/lib';
 *
 * const nameService = createNameResolutionService({
 *   ens: {
 *     mainnetRpcUrl: 'https://eth.llamarpc.com',
 *   },
 *   solanaRpcUrl: 'https://api.mainnet-beta.solana.com',
 * });
 *
 * const result = await nameService.resolveNameOrAddress('vitalik.eth');
 * ```
 */
export function createNameResolutionService(
  config: NameResolutionConfig
): NameResolutionService {
  return new NameResolutionService(config);
}

// Legacy exports for backwards compatibility
let defaultService: Optional<NameResolutionService> = null;

/**
 * Set the default name resolution service (for backwards compatibility)
 * @deprecated Create and use NameResolutionService instances directly
 */
export function setDefaultNameResolutionService(
  service: NameResolutionService
): void {
  defaultService = service;
}

/**
 * Check if input looks like a domain name (legacy)
 * @deprecated Use NameResolutionService.isDomainName() instead
 */
export function isDomainName(input: string): boolean {
  if (!input || !input.includes('.')) {
    return false;
  }
  const addressType = getAddressType(input);
  return addressType === undefined;
}

/**
 * Check if input is already a valid address (legacy)
 * @deprecated Use NameResolutionService.isValidAddress() instead
 */
export function isValidAddress(input: string): boolean {
  try {
    if (isAddress(input)) {
      return true;
    }
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
 * Resolve ENS name to address (legacy)
 * @deprecated Use NameResolutionService.resolveENSName() instead
 */
export async function resolveENSName(name: string): Promise<Optional<string>> {
  if (!defaultService) {
    console.warn(
      'No default name resolution service configured. Call setDefaultNameResolutionService() first.'
    );
    return null;
  }
  return defaultService.resolveENSName(name);
}

/**
 * Resolve SNS name to address (legacy)
 * @deprecated Use NameResolutionService.resolveSNSName() instead
 */
export async function resolveSNSName(name: string): Promise<Optional<string>> {
  if (!defaultService) {
    console.warn(
      'No default name resolution service configured. Call setDefaultNameResolutionService() first.'
    );
    return null;
  }
  return defaultService.resolveSNSName(name);
}

/**
 * Resolve any name or address to a valid wallet address (legacy)
 * @deprecated Use NameResolutionService.resolveNameOrAddress() instead
 */
export async function resolveNameOrAddress(
  input: string
): Promise<Optional<NameResolutionResult>> {
  if (!defaultService) {
    console.warn(
      'No default name resolution service configured. Call setDefaultNameResolutionService() first.'
    );
    return null;
  }
  return defaultService.resolveNameOrAddress(input);
}

/**
 * Validate input and provide helpful error messages (legacy)
 * @deprecated Use NameResolutionService.validateNameOrAddressInput() instead
 */
export function validateNameOrAddressInput(input: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return { isValid: false, error: 'Please enter a delegate address or name' };
  }

  if (isValidAddress(trimmedInput)) {
    return { isValid: true };
  }

  if (isDomainName(trimmedInput)) {
    return { isValid: true };
  }

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
 * Get display text for resolved name (legacy)
 * @deprecated Use NameResolutionService.getDisplayTextForResolution() instead
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

export { type NameResolutionResult };
