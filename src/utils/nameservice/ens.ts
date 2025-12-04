import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, optimism } from 'viem/chains';
import type { Optional } from '@sudobility/types';

/**
 * Configuration for ENS service
 */
export interface ENSServiceConfig {
  /** Ethereum mainnet RPC URL */
  mainnetRpcUrl: string;
  /** Optimism RPC URL (for .box domains) */
  optimismRpcUrl?: string;
  /** ENS subgraph URL (optional) */
  ensSubgraphUrl?: string;
  /** HTTP client for making fetch requests (optional, uses global fetch if not provided) */
  httpClient?: {
    post<T>(url: string, body: unknown): Promise<T>;
  };
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
}

interface ENSName {
  name: string;
  address: string;
}

/**
 * ENS Service for resolving and looking up ENS names
 * Platform-agnostic implementation that requires explicit configuration
 */
export class ENSService {
  private publicClient: PublicClient;
  // Using 'any' for optimism client due to viem chain type differences
  private optimismClient: any;
  private ensSubgraphUrl: string;
  private httpClient: {
    post<T>(url: string, body: unknown): Promise<T>;
  } | null;
  private cacheDuration: number;
  private ensCache = new Map<string, { names: ENSName[]; timestamp: number }>();

  /**
   * Create a new ENS service instance
   * @param config Service configuration
   */
  constructor(config: ENSServiceConfig) {
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(config.mainnetRpcUrl, {
        retryCount: 2,
        retryDelay: 500,
        timeout: 3000,
      }),
    });

    this.optimismClient = config.optimismRpcUrl
      ? createPublicClient({
          chain: optimism,
          transport: http(config.optimismRpcUrl, {
            retryCount: 2,
            retryDelay: 500,
            timeout: 3000,
          }),
        })
      : null;

    this.ensSubgraphUrl =
      config.ensSubgraphUrl ||
      'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
    this.httpClient = config.httpClient || null;
    this.cacheDuration = config.cacheDuration || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get all ENS names associated with a wallet address
   * Uses multiple reliable methods for comprehensive ENS discovery
   */
  async getENSNames(address: string): Promise<ENSName[]> {
    try {
      // Check cache first
      const cached = this.ensCache.get(address);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.names;
      }

      const ensNames: ENSName[] = [];

      // Method 1: Get primary ENS name (viem reverse resolution)
      try {
        const primaryName = await this.publicClient.getEnsName({
          address: address as `0x${string}`,
        });

        if (primaryName) {
          ensNames.push({
            name: primaryName,
            address,
          });
        }
      } catch {
        // Ignore errors
      }

      // Method 2: Query ENS subgraph for all domains owned by this address
      try {
        const subgraphDomains = await this.queryENSSubgraph(address);

        // Add domains that we don't already have
        subgraphDomains.forEach(domain => {
          const alreadyExists = ensNames.some(
            existing =>
              existing.name.toLowerCase() === domain.name.toLowerCase()
          );

          if (!alreadyExists) {
            ensNames.push(domain);
          }
        });
      } catch {
        // Ignore errors
      }

      // Method 3: Try to check for .box domains on both mainnet and Optimism
      if (this.optimismClient) {
        try {
          // Try reverse resolution on Optimism for .box domains
          const optimismName = await this.optimismClient.getEnsName({
            address: address as `0x${string}`,
          });

          if (optimismName && optimismName.endsWith('.box')) {
            const alreadyExists = ensNames.some(
              existing =>
                existing.name.toLowerCase() === optimismName.toLowerCase()
            );

            if (!alreadyExists) {
              ensNames.push({
                name: optimismName,
                address,
              });
            }
          }
        } catch {
          // Silently ignore Optimism reverse resolution failures
        }
      }

      // Cache the result
      this.ensCache.set(address, { names: ensNames, timestamp: Date.now() });

      return ensNames;
    } catch (error) {
      console.error('Error fetching ENS names:', error);
      // Return cached value if available, even if expired
      const cached = this.ensCache.get(address);
      if (cached) {
        return cached.names;
      }
      return [];
    }
  }

  /**
   * Query ENS subgraph for all domains owned by an address
   */
  private async queryENSSubgraph(address: string): Promise<ENSName[]> {
    try {
      const query = `
        query GetAllDomains($owner: String!) {
          domains(where: { owner: $owner }, first: 1000) {
            name
            labelName
            labelhash
            parent {
              name
            }
          }
          registrations(where: { registrant: $owner }, first: 1000) {
            domain {
              name
              labelName
              parent {
                name
              }
            }
          }
        }
      `;

      const body = {
        query,
        variables: { owner: address.toLowerCase() },
      };

      let data: any;

      if (this.httpClient) {
        data = await this.httpClient.post(this.ensSubgraphUrl, body);
      } else {
        // Fallback to global fetch if available
        if (typeof fetch === 'undefined') {
          console.warn(
            'No HTTP client provided and global fetch not available'
          );
          return [];
        }

        const response = await fetch(this.ensSubgraphUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          return [];
        }

        data = await response.json();
      }

      const domains: ENSName[] = [];
      const seen = new Set<string>();

      // Process domains
      if (data.data?.domains) {
        data.data.domains.forEach((domain: any) => {
          // Filter out reverse records (they end with .addr.reverse)
          if (
            domain.name &&
            !domain.name.endsWith('.addr.reverse') &&
            !seen.has(domain.name)
          ) {
            domains.push({ name: domain.name, address });
            seen.add(domain.name);
          }
        });
      }

      // Process registrations
      if (data.data?.registrations) {
        data.data.registrations.forEach((reg: any) => {
          // Filter out reverse records from registrations too
          if (
            reg.domain?.name &&
            !reg.domain.name.endsWith('.addr.reverse') &&
            !seen.has(reg.domain.name)
          ) {
            domains.push({ name: reg.domain.name, address });
            seen.add(reg.domain.name);
          }
        });
      }

      return domains;
    } catch (error) {
      console.error('ENS subgraph query failed:', error);
      return [];
    }
  }

  /**
   * Check if an ENS name is valid and resolves to the given address
   */
  async validateENSName(
    name: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      const resolvedAddress = await this.publicClient.getEnsAddress({
        name,
      });

      return resolvedAddress?.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Error validating ENS name:', error);
      return false;
    }
  }

  /**
   * Resolve an ENS name to an address
   */
  async resolveENSName(name: string): Promise<Optional<string>> {
    try {
      const address = await this.publicClient.getEnsAddress({
        name,
      });
      return address || null;
    } catch {
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.ensCache.clear();
  }
}

/**
 * Create an ENS service instance
 * @param config Service configuration
 * @returns A configured ENS service instance
 *
 * @example
 * ```typescript
 * import { createENSService } from '@sudobility/lib';
 *
 * const ensService = createENSService({
 *   mainnetRpcUrl: 'https://eth.llamarpc.com',
 *   optimismRpcUrl: 'https://mainnet.optimism.io',
 * });
 *
 * const names = await ensService.getENSNames('0x1234...');
 * ```
 */
export function createENSService(config: ENSServiceConfig): ENSService {
  return new ENSService(config);
}

// Legacy exports for backwards compatibility (these will be deprecated)
// Note: These require a default service to be created first via createENSService
let defaultService: Optional<ENSService> = null;

/**
 * Set the default ENS service (for backwards compatibility)
 * @deprecated Create and use ENSService instances directly
 */
export function setDefaultENSService(service: ENSService): void {
  defaultService = service;
}

/**
 * Get all ENS names associated with a wallet address (legacy)
 * @deprecated Use ENSService.getENSNames() instead
 */
export async function getENSNames(address: string): Promise<ENSName[]> {
  if (!defaultService) {
    console.warn(
      'No default ENS service configured. Call setDefaultENSService() first or create an ENSService instance.'
    );
    return [];
  }
  return defaultService.getENSNames(address);
}

/**
 * Check if an ENS name is valid and resolves to the given address (legacy)
 * @deprecated Use ENSService.validateENSName() instead
 */
export async function validateENSName(
  name: string,
  expectedAddress: string
): Promise<boolean> {
  if (!defaultService) {
    console.warn(
      'No default ENS service configured. Call setDefaultENSService() first or create an ENSService instance.'
    );
    return false;
  }
  return defaultService.validateENSName(name, expectedAddress);
}

export { type ENSName };
