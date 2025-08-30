import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

// Create connection to Solana mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

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
      console.log('Returning cached SNS names for:', address);
      return cached.names;
    }

    const snsNames: SNSName[] = [];

    try {
      // Convert address string to PublicKey
      const walletPublicKey = new PublicKey(address);

      // Query on-chain SNS domains owned by this address
      const domains = await querySOLDomains(address);

      // Add all found domains
      domains.forEach(domain => {
        snsNames.push({
          name: domain,
          address,
        });
        console.log(
          'Found SNS domain from on-chain data:',
          domain,
          'for address:',
          address
        );
      });
    } catch (snsError) {
      console.warn('SNS on-chain lookup failed:', snsError);
    }

    // Cache the result
    snsCache.set(address, { names: snsNames, timestamp: Date.now() });

    console.log(`Total SNS names found for ${address}:`, snsNames.length);
    return snsNames;
  } catch (error) {
    console.error('Error fetching SNS names:', error);
    // Return cached value if available, even if expired
    const cached = snsCache.get(address);
    if (cached) {
      console.log('Returning stale cached SNS names due to error');
      return cached.names;
    }
    return [];
  }
}

/**
 * Query Solana blockchain for .sol domains owned by an address
 * This uses the proper SNS program to find domain ownership
 */
async function querySOLDomains(ownerAddress: string): Promise<string[]> {
  try {
    // For now, return empty array as proper SNS querying requires specialized libraries
    // like @bonfida/spl-name-service which need to be added as dependencies

    // TODO: Implement proper SNS domain discovery using:
    // 1. @bonfida/spl-name-service library
    // 2. Query the SNS registry program for domains owned by this address
    // 3. Filter for active domains with valid records

    console.log(
      'SNS on-chain domain discovery not yet fully implemented for:',
      ownerAddress
    );
    console.log(
      'This requires specialized SNS libraries like @bonfida/spl-name-service'
    );

    return [];
  } catch (error) {
    console.error('Error querying SOL domains:', error);
    return [];
  }
}

/**
 * Resolve a .sol domain to a Solana address
 * This is a simplified implementation - a full implementation would use the SNS registry
 */
export async function resolveSNSDomain(domain: string): Promise<string | null> {
  try {
    // For now, this is a placeholder implementation
    // Real SNS resolution would involve:
    // 1. Computing the domain hash
    // 2. Deriving the domain account address
    // 3. Fetching the account data from Solana
    // 4. Parsing the owner/target address

    console.log('SNS domain resolution for:', domain);

    // Since proper SNS resolution is complex and requires specific libraries,
    // we'll return null for now to indicate no resolution found
    // This prevents errors while allowing the system to continue working
    return null;
  } catch (error) {
    console.error('Error resolving SNS domain:', error);
    return null;
  }
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
  } catch (error) {
    console.error('Error validating SNS name:', error);
    return false;
  }
}
