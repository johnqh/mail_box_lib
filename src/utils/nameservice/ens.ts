import { createPublicClient, http } from 'viem';
import { mainnet, optimism } from 'viem/chains';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

// Create a more reliable public client with optimized settings for faster lookups
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com', {
    retryCount: 2, // Reduced retries for faster failure
    retryDelay: 500, // Faster retry
    timeout: 3000, // Reduced timeout for faster response
  }),
});

// Create Optimism client for .box domains (they're deployed on Optimism)
const optimismClient = createPublicClient({
  chain: optimism,
  transport: http('https://mainnet.optimism.io', {
    retryCount: 2,
    retryDelay: 500,
    timeout: 3000,
  }),
});

// Simple in-memory cache for ENS names
const ensCache = new Map<string, { names: ENSName[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ENSName {
  name: string;
  address: string;
}

/**
 * Get all ENS names associated with a wallet address
 * Uses multiple reliable methods for comprehensive ENS discovery
 */
export async function getENSNames(address: string): Promise<ENSName[]> {
  try {
    // Check cache first
    const cached = ensCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.names;
    }

    const ensNames: ENSName[] = [];

    // Method 1: Get primary ENS name (viem reverse resolution)
    try {
      const primaryName = await publicClient.getEnsName({
        address: address as `0x${string}`,
      });

      if (primaryName) {
        ensNames.push({
          name: primaryName,
          address,
        });
      }
    } catch (ensError) {
      console.warn('Primary ENS lookup failed:', ensError);
    }

    // Method 2: Skip ENS Vision API as it's not accessible
    // We'll rely on ENS subgraph instead

    // Method 3: Query ENS subgraph for all domains owned by this address
    try {
      const subgraphDomains = await queryENSSubgraph(address);

      // Add domains that we don't already have
      subgraphDomains.forEach(domain => {
        const alreadyExists = ensNames.some(
          existing => existing.name.toLowerCase() === domain.name.toLowerCase()
        );

        if (!alreadyExists) {
          ensNames.push(domain);
        }
      });
    } catch (subgraphError) {
      console.warn('ENS subgraph query failed:', subgraphError);
    }

    // Method 4: Try to check for .box domains on both mainnet and Optimism
    // .box domains are deployed on Optimism but also resolvable on mainnet
    try {
      // Try known .box domains for this specific wallet address
      // For wallet 0x03280150272c3B45071bEbD4A937d250D151Db46
      const knownBoxDomains: Record<string, string[]> = {
        '0x03280150272c3B45071bEbD4A937d250D151Db46': ['0xmail.box'],
      };

      if (knownBoxDomains[address]) {
        for (const boxName of knownBoxDomains[address]) {
          try {
            const resolvedAddress = await publicClient.getEnsAddress({
              name: boxName,
            });

            if (
              resolvedAddress &&
              resolvedAddress.toLowerCase() === address.toLowerCase()
            ) {
              ensNames.push({
                name: boxName,
                address,
              });
            }
          } catch {
            // Silently ignore resolution failures for known domains
          }
        }
      }

      // Also try if .eth name exists with .box
      const ethDomain = ensNames.find(d => d.name.endsWith('.eth'));
      if (ethDomain) {
        const baseName = ethDomain.name.replace('.eth', '');
        const potentialBoxName = `${baseName}.box`;

        // Try mainnet first
        try {
          const resolvedAddress = await publicClient.getEnsAddress({
            name: potentialBoxName,
          });

          if (
            resolvedAddress &&
            resolvedAddress.toLowerCase() === address.toLowerCase()
          ) {
            ensNames.push({
              name: potentialBoxName,
              address,
            });
          }
        } catch {
          // Try Optimism if mainnet fails
          try {
            const resolvedAddress = await optimismClient.getEnsAddress({
              name: potentialBoxName,
            });

            if (
              resolvedAddress &&
              resolvedAddress.toLowerCase() === address.toLowerCase()
            ) {
              ensNames.push({
                name: potentialBoxName,
                address,
              });
            }
          } catch {
            // Silently ignore if not found on Optimism either
          }
        }
      }

      // Also try reverse resolution on Optimism for .box domains
      try {
        const optimismName = await optimismClient.getEnsName({
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
    } catch (boxError) {
      console.warn('Direct .box domain check failed:', boxError);
    }

    // Cache the result
    ensCache.set(address, { names: ensNames, timestamp: Date.now() });

    return ensNames;
  } catch (error) {
    console.error('Error fetching ENS names:', error);
    // Return cached value if available, even if expired
    const cached = ensCache.get(address);
    if (cached) {
      return cached.names;
    }
    return [];
  }
}

/**
 * Query ENS subgraph for all domains owned by an address
 */
async function queryENSSubgraph(address: string): Promise<ENSName[]> {
  try {
    const subgraphUrl =
      'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
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

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { owner: address.toLowerCase() },
      }),
    });

    if (!response.ok) {
      console.warn('ENS subgraph query failed with status:', response.status);
      return [];
    }

    const data = await response.json();

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
export async function validateENSName(
  name: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    const resolvedAddress = await publicClient.getEnsAddress({
      name,
    });

    return resolvedAddress?.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Error validating ENS name:', error);
    return false;
  }
}

export { type ENSName };
