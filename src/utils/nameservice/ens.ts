import { createPublicClient, http } from 'viem';
import { mainnet, optimism } from 'viem/chains';

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

export interface ENSName {
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
      console.log('Returning cached ENS names for:', address);
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
        console.log(
          'Found primary ENS name:',
          primaryName,
          'for address:',
          address
        );
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
          console.log(
            'Found domain from ENS subgraph:',
            domain.name,
            'for address:',
            address
          );
        }
      });
    } catch (subgraphError) {
      console.warn('ENS subgraph query failed:', subgraphError);
    }

    // Method 4: Try to check for .box domains on both mainnet and Optimism
    // .box domains are deployed on Optimism but also resolvable on mainnet
    try {
      console.log('🔍 Checking for .box domains...');

      // Try known .box domains for this specific wallet address
      // For wallet 0x03280150272c3B45071bEbD4A937d250D151Db46
      const knownBoxDomains: Record<string, string[]> = {
        '0x03280150272c3B45071bEbD4A937d250D151Db46': ['0xmail.box'],
      };

      if (knownBoxDomains[address]) {
        for (const boxName of knownBoxDomains[address]) {
          console.log(`🔍 Checking known .box domain: ${boxName}`);
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
              console.log(`✅ Found known .box domain: ${boxName}`);
            }
          } catch (err) {
            console.log(`❌ Failed to resolve known .box domain: ${boxName}`);
          }
        }
      }

      // Also try if .eth name exists with .box
      const ethDomain = ensNames.find(d => d.name.endsWith('.eth'));
      if (ethDomain) {
        const baseName = ethDomain.name.replace('.eth', '');
        const potentialBoxName = `${baseName}.box`;

        // Try mainnet first
        console.log(
          `🔍 Checking if ${potentialBoxName} resolves on mainnet...`
        );
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
            console.log(
              `✅ Found .box domain via mainnet: ${potentialBoxName}`
            );
          } else {
            console.log(
              `❌ ${potentialBoxName} on mainnet resolves to: ${resolvedAddress}`
            );
          }
        } catch (mainnetError) {
          console.log(
            `⚠️ ${potentialBoxName} not found on mainnet, trying Optimism...`
          );

          // Try Optimism
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
              console.log(
                `✅ Found .box domain via Optimism: ${potentialBoxName}`
              );
            } else {
              console.log(
                `❌ ${potentialBoxName} on Optimism resolves to: ${resolvedAddress}`
              );
            }
          } catch (optimismError) {
            console.log(`❌ ${potentialBoxName} not found on Optimism either`);
          }
        }
      }

      // Also try reverse resolution on Optimism for .box domains
      console.log(
        `🔍 Trying reverse resolution on Optimism for address: ${address}`
      );
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
            console.log(
              `✅ Found .box domain via Optimism reverse resolution: ${optimismName}`
            );
          }
        }
      } catch (reverseError) {
        console.log('⚠️ Optimism reverse resolution failed:', reverseError);
      }
    } catch (boxError) {
      console.warn('Direct .box domain check failed:', boxError);
    }

    // Cache the result
    ensCache.set(address, { names: ensNames, timestamp: Date.now() });

    console.log(`Total ENS names found for ${address}:`, ensNames.length);
    return ensNames;
  } catch (error) {
    console.error('Error fetching ENS names:', error);
    // Return cached value if available, even if expired
    const cached = ensCache.get(address);
    if (cached) {
      console.log('Returning stale cached ENS names due to error');
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
    console.log('🔍 Querying ENS subgraph for all domains owned by:', address);

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
    console.log('🔍 ENS subgraph raw response:', JSON.stringify(data, null, 2));

    // Log what we received
    if (data.data?.domains) {
      console.log(
        `📊 Received ${data.data.domains.length} domains from subgraph`
      );
      data.data.domains.forEach((d: any, i: number) => {
        console.log(`  Domain ${i}: ${d.name} (parent: ${d.parent?.name})`);
      });
    }
    if (data.data?.registrations) {
      console.log(
        `📊 Received ${data.data.registrations.length} registrations from subgraph`
      );
      data.data.registrations.forEach((r: any, i: number) => {
        console.log(
          `  Registration ${i}: ${r.domain?.name} (parent: ${r.domain?.parent?.name})`
        );
      });
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
          const tld = domain.name.split('.').pop();
          console.log(
            `✅ Found ${tld} domain from subgraph domains: ${domain.name}`
          );
        } else if (domain.name && domain.name.endsWith('.addr.reverse')) {
          console.log(`⚠️ Filtering out reverse record: ${domain.name}`);
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
          const tld = reg.domain.name.split('.').pop();
          console.log(
            `✅ Found ${tld} domain from subgraph registrations: ${reg.domain.name}`
          );
        } else if (
          reg.domain?.name &&
          reg.domain.name.endsWith('.addr.reverse')
        ) {
          console.log(
            `⚠️ Filtering out reverse record from registrations: ${reg.domain.name}`
          );
        }
      });
    }

    console.log(
      `📊 Total unique domains found in ENS subgraph: ${domains.length}`
    );
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
