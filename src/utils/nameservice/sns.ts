import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

// Create connection to Solana mainnet
const _connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

interface SNSName {
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
async function querySOLDomains(ownerAddress: string): Promise<string[]> {
  try {
    // Dynamic import to handle environments where @bonfida/spl-name-service might not be available
    const bonfida = await import('@bonfida/spl-name-service');
    const { Connection, PublicKey } = await import('@solana/web3.js');

    // Create connection to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const ownerKey = new PublicKey(ownerAddress);

    const domains: string[] = [];

    try {
      // Method 1: Try reverse lookup for primary domain
      const primaryDomain = await bonfida.reverseLookup(connection, ownerKey);
      if (primaryDomain) {
        domains.push(primaryDomain);
      }
    } catch {
      // Primary domain lookup failed, continue with other methods
    }

    try {
      // Method 2: Get all domains owned by this address
      const allDomains = await bonfida.getAllDomains(connection, ownerKey);
      if (allDomains && allDomains.length > 0) {
        // Convert to strings if they're not already strings
        const domainStrings = allDomains.map((domain: any) =>
          typeof domain === 'string' ? domain : domain.toString()
        );
        domains.push(...domainStrings);
      }
    } catch {
      // All domains lookup failed, continue
    }

    try {
      // Method 3: Try alternative domain discovery methods if available
      const bonfidaAny = bonfida as any;
      const alternativeFunctions = [
        'getDomains',
        'getOwnedDomains',
        'getUserDomains',
      ];

      for (const funcName of alternativeFunctions) {
        if (typeof bonfidaAny[funcName] === 'function') {
          try {
            const result = await bonfidaAny[funcName](connection, ownerKey);
            if (Array.isArray(result)) {
              domains.push(...result);
            }
          } catch {
            // Function failed, try next one
          }
        }
      }
    } catch {
      // Alternative methods failed
    }

    // Remove duplicates and return
    return [...new Set(domains)].filter(
      domain => domain && typeof domain === 'string'
    );
  } catch (importError) {
    console.warn(
      'Bonfida SNS library not available for domain discovery:',
      importError
    );
    return [];
  }
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

export { type SNSName };
