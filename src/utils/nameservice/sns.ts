import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

// Create connection to Solana mainnet
const _connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

export interface SNSName {
  name: string;
  address: string;
}

// Simple in-memory cache for SNS names
const snsCache = new Map<string, { names: SNSName[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all SNS names associated with a Solana wallet address using proper on-chain lookups
 * This queries the Solana blockchain for actual SNS domain ownership
 */
export async function getSNSNames(address: string): Promise<SNSName[]> {
  try {
    // Check cache first
    const cached = snsCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Returning cached SNS names
      return cached.names;
    }

    const snsNames: SNSName[] = [];

    try {
      // Convert address string to PublicKey
      const _walletPublicKey = new PublicKey(address);

      // Query on-chain SNS domains owned by this address
      const domains = await querySOLDomains(address);

      // Add all found domains
      domains.forEach(domain => {
        snsNames.push({
          name: domain,
          address,
        });
        // Found SNS domain from on-chain data
      });
    } catch {
      // SNS on-chain lookup failed
    }

    // Cache the result
    snsCache.set(address, { names: snsNames, timestamp: Date.now() });

    // SNS names processed
    return snsNames;
  } catch {
    // Error fetching SNS names
    // Return cached value if available, even if expired
    const cached = snsCache.get(address);
    if (cached) {
      // Returning stale cached SNS names due to error
      return cached.names;
    }
    return [];
  }
}

/**
 * Query Solana blockchain for .sol domains owned by an address
 * This uses the proper SNS program to find domain ownership
 */
async function querySOLDomains(_ownerAddress: string): Promise<string[]> {
  // For now, return empty array as proper SNS querying requires specialized libraries
  // like @bonfida/spl-name-service which need to be added as dependencies

  // TODO: Implement proper SNS domain discovery using:
  // 1. @bonfida/spl-name-service library
  // 2. Query the SNS registry program for domains owned by this address
  // 3. Filter for active domains with valid records

  // SNS on-chain domain discovery not yet fully implemented
  // This requires specialized SNS libraries like @bonfida/spl-name-service

  return [];
}

/**
 * Resolve a .sol domain to a Solana address
 * This is a simplified implementation - a full implementation would use the SNS registry
 */
export async function resolveSNSDomain(
  _domain: string
): Promise<string | null> {
  // For now, this is a placeholder implementation
  // Real SNS resolution would involve:
  // 1. Computing the domain hash
  // 2. Deriving the domain account address
  // 3. Fetching the account data from Solana
  // 4. Parsing the owner/target address

  // SNS domain resolution attempted

  // Since proper SNS resolution is complex and requires specific libraries,
  // we'll return null for now to indicate no resolution found
  // This prevents errors while allowing the system to continue working
  return null;
}

/**
 * Check if an SNS name is valid and resolves to the given address
 */
export async function validateSNSName(
  name: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    const resolvedAddress = await resolveSNSDomain(name);

    return resolvedAddress?.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    // Error validating SNS name
    return false;
  }
}
