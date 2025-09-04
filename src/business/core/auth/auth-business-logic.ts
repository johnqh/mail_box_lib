/**
 * Platform-agnostic authentication business logic
 */

import { AuthStatus, ChainType } from '../enums';
import { EmailAddress } from '../../../types/email';

/**
 * Address type enumeration
 */
export enum AddressType {
  EVMAddress = 'EVMAddress',
  SolanaAddress = 'SolanaAddress',
  ENSName = 'ENSName',
  SNSName = 'SNSName',
  Unknown = 'Unknown',
}

/**
 * Parsed email address structure
 */
export type ParsedEmailAddress = {
  /** The address part (before @) */
  address: string;
  /** The domain part (after @) */
  domain: string;
  /** The detected type of the address */
  type: AddressType;
};

// Extended EmailAddress interface for business logic
interface _ExtendedEmailAddress extends EmailAddress {
  main?: boolean;
}

export interface AuthBusinessLogic {
  /**
   * Generate authentication message
   */
  generateAuthMessage(nonce?: string): string;

  /**
   * Validate wallet address format
   */
  isValidWalletAddress(address: string, chainType: ChainType): boolean;

  /**
   * Check if email address requires subscription
   */
  requiresSubscription(
    emailAddress: EmailAddress,
    hasActiveSubscription: boolean
  ): boolean;

  /**
   * Get authentication status display text
   */
  getAuthStatusText(status: AuthStatus): string;

  /**
   * Check if user can access protected features
   */
  canAccessProtectedFeatures(status: AuthStatus): boolean;

  /**
   * Generate user display name from wallet data
   */
  generateUserDisplayName(
    walletAddress: string,
    emailAddresses: EmailAddress[]
  ): string;

  /**
   * Validate signature format
   */
  isValidSignature(signature: string, chainType: ChainType): boolean;

  /**
   * Check if authentication is expired
   */
  isAuthExpired(createdAt: Date, expirationHours?: number): boolean;

  /**
   * Get chain display name
   */
  getChainDisplayName(chainType: ChainType): string;

  /**
   * Format wallet address for display
   */
  formatWalletAddressForDisplay(address: string): string;
}

export class DefaultAuthBusinessLogic implements AuthBusinessLogic {
  private readonly AUTH_EXPIRATION_HOURS = 24; // 24 hours default

  generateAuthMessage(nonce?: string): string {
    const actualNonce =
      nonce || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `Authenticate with 0xMail\nNonce: ${actualNonce}`;
  }

  isValidWalletAddress(address: string, chainType: ChainType): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Use AddressHelper for consistent validation
    const addressType = AddressHelper.getAddressType(address);

    switch (chainType) {
      case ChainType.EVM:
        return (
          addressType === AddressType.EVMAddress ||
          addressType === AddressType.ENSName
        );

      case ChainType.SOLANA:
        return (
          addressType === AddressType.SolanaAddress ||
          addressType === AddressType.SNSName
        );

      default:
        // Unknown chain type, accept any known address format
        return addressType !== AddressType.Unknown;
    }
  }

  requiresSubscription(
    emailAddress: EmailAddress,
    hasActiveSubscription: boolean
  ): boolean {
    // ENS and SNS domains require subscription
    let isENS = emailAddress.id.startsWith('ens_');
    let isSNS = emailAddress.id.startsWith('sns_');

    // Also check the email address part using AddressHelper
    if (!isENS && !isSNS) {
      const emailParts = emailAddress.email.split('@');
      if (emailParts.length === 2) {
        const addressType = AddressHelper.getAddressType(emailParts[0]);
        isENS = addressType === AddressType.ENSName;
        isSNS = addressType === AddressType.SNSName;
      }
    }

    return (isENS || isSNS) && !hasActiveSubscription;
  }

  getAuthStatusText(status: AuthStatus): string {
    switch (status) {
      case AuthStatus.DISCONNECTED:
        return 'Not connected';
      case AuthStatus.CONNECTED:
        return 'Connected - Please verify';
      case AuthStatus.VERIFIED:
        return 'Authenticated';
      default:
        return 'Unknown status';
    }
  }

  canAccessProtectedFeatures(status: AuthStatus): boolean {
    return status === AuthStatus.VERIFIED;
  }

  generateUserDisplayName(
    walletAddress: string,
    emailAddresses: EmailAddress[]
  ): string {
    // Try to use the first ENS or SNS name
    const namedAddress = emailAddresses.find(
      addr => addr.id.startsWith('ens_') || addr.id.startsWith('sns_')
    );

    if (namedAddress) {
      // Extract name from email (e.g., "vitalik.eth@0xmail.box" -> "vitalik.eth")
      const name = namedAddress.email.split('@')[0];
      return name || this.formatWalletAddressForDisplay(walletAddress);
    }

    return this.formatWalletAddressForDisplay(walletAddress);
  }

  isValidSignature(signature: string, chainType: ChainType): boolean {
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    switch (chainType) {
      case ChainType.EVM:
        // Ethereum signature validation (0x followed by 130 hex characters)
        return /^0x[a-fA-F0-9]{130}$/.test(signature);

      case ChainType.SOLANA:
        // Solana signature validation (base58 encoded, typically 87-88 characters)
        return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature);

      default:
        // Basic validation for unknown chain types
        return signature.length > 50;
    }
  }

  isAuthExpired(createdAt: Date, expirationHours?: number): boolean {
    const hours = expirationHours || this.AUTH_EXPIRATION_HOURS;
    const expirationTime = new Date(
      createdAt.getTime() + hours * 60 * 60 * 1000
    );
    return new Date() > expirationTime;
  }

  getChainDisplayName(chainType: ChainType): string {
    switch (chainType) {
      case ChainType.EVM:
        return 'EVM Chain';
      case ChainType.SOLANA:
        return 'Solana';
      case ChainType.UNKNOWN:
        return 'Unknown Chain';
      default:
        return 'Blockchain';
    }
  }

  formatWalletAddressForDisplay(address: string): string {
    if (!address || address.length < 10) {
      return address;
    }

    // Show first 6 and last 4 characters with ellipsis
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

/**
 * Email address business logic
 */
export interface EmailAddressBusinessLogic {
  /**
   * Generate email addresses for a wallet
   */
  generateEmailAddressesForWallet(
    walletAddress: string,
    chainType: ChainType
  ): EmailAddress[];

  /**
   * Check if email address is primary
   */
  isPrimaryEmailAddress(emailAddress: EmailAddress): boolean;

  /**
   * Sort email addresses in preferred order
   */
  sortEmailAddresses(emailAddresses: EmailAddress[]): EmailAddress[];

  /**
   * Get email type (direct, ENS, SNS)
   */
  getEmailAddressType(
    emailAddress: EmailAddress
  ): 'direct' | 'ens' | 'sns' | 'custom';

  /**
   * Get display name for email address
   */
  getEmailAddressDisplayName(emailAddress: EmailAddress): string;
}

export class DefaultEmailAddressBusinessLogic
  implements EmailAddressBusinessLogic
{
  generateEmailAddressesForWallet(
    walletAddress: string,
    chainType: ChainType
  ): EmailAddress[] {
    const addresses: EmailAddress[] = [
      {
        id: `direct_${walletAddress}`,
        name: this.formatAddressForDisplay(walletAddress),
        email: `${walletAddress}@0xmail.box`,
        isPrimary: true,
        isActive: true,
      },
    ];

    // Add ENS support for EVM chains
    if (chainType === ChainType.EVM) {
      addresses.push({
        id: `ens_${walletAddress}`,
        name: 'ENS Domain',
        email: 'your-domain.eth@0xmail.box',
        isPrimary: false,
        isActive: true,
      });
    }

    // Add SNS support for Solana
    if (chainType === ChainType.SOLANA) {
      addresses.push({
        id: `sns_${walletAddress}`,
        name: 'SNS Domain',
        email: 'your-domain.sol@0xmail.box',
        isPrimary: false,
        isActive: true,
      });
    }

    return addresses;
  }

  isPrimaryEmailAddress(emailAddress: EmailAddress): boolean {
    return emailAddress.isPrimary;
  }

  sortEmailAddresses(emailAddresses: EmailAddress[]): EmailAddress[] {
    return [...emailAddresses].sort((a, b) => {
      // Primary addresses first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      // Then by type priority: direct, ENS, SNS, custom
      const aPriority = this.getAddressPriority(a);
      const bPriority = this.getAddressPriority(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Finally alphabetically
      return a.email.localeCompare(b.email);
    });
  }

  getEmailAddressType(
    emailAddress: EmailAddress
  ): 'direct' | 'ens' | 'sns' | 'custom' {
    if (emailAddress.id.startsWith('ens_')) return 'ens';
    if (emailAddress.id.startsWith('sns_')) return 'sns';
    if (emailAddress.id.startsWith('direct_')) return 'direct';
    return 'custom';
  }

  getEmailAddressDisplayName(emailAddress: EmailAddress): string {
    return emailAddress.name || emailAddress.email.split('@')[0];
  }

  private formatAddressForDisplay(address: string): string {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private getAddressPriority(emailAddress: EmailAddress): number {
    const type = this.getEmailAddressType(emailAddress);
    switch (type) {
      case 'direct':
        return 1;
      case 'ens':
        return 2;
      case 'sns':
        return 3;
      case 'custom':
        return 4;
      default:
        return 5;
    }
  }
}

/**
 * Address Helper class for address type detection and validation
 */
export class AddressHelper {
  /**
   * Determine the address type from an email address prefix (part before @)
   * Case insensitive as email addresses are case insensitive
   */
  static getAddressType(address: string): AddressType {
    if (!address || typeof address !== 'string') {
      return AddressType.Unknown;
    }

    // Convert to lowercase for case-insensitive comparison
    const lowerAddress = address.trim().toLowerCase();

    // Check for ENS names (.eth or .box domains)
    if (this.isENSName(lowerAddress)) {
      return AddressType.ENSName;
    }

    // Check for SNS names (.sol domain)
    if (this.isSNSName(lowerAddress)) {
      return AddressType.SNSName;
    }

    // Check for EVM address (0x followed by 40 hex characters)
    if (this.isEVMAddress(lowerAddress)) {
      return AddressType.EVMAddress;
    }

    // Check for Solana address (base58 encoded, 32-44 characters)
    if (this.isSolanaAddress(lowerAddress)) {
      return AddressType.SolanaAddress;
    }

    return AddressType.Unknown;
  }

  /**
   * Check if address is an EVM address
   */
  private static isEVMAddress(address: string): boolean {
    // EVM addresses are 0x followed by exactly 40 hexadecimal characters
    return /^0x[a-f0-9]{40}$/.test(address);
  }

  /**
   * Check if address is a Solana address
   */
  private static isSolanaAddress(address: string): boolean {
    try {
      // Solana addresses are base58 encoded and typically 32-44 characters
      if (address.length < 32 || address.length > 44) {
        return false;
      }

      // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
      const base58Regex = /^[1-9a-hjkmnp-z]+$/;
      if (!base58Regex.test(address)) {
        return false;
      }

      // Additional validation: try to decode with bs58 if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const bs58 = require('bs58');
        const decoded = bs58.decode(address);
        return decoded.length === 32; // Solana addresses decode to 32 bytes
      } catch {
        // If bs58 is not available, rely on regex validation
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if address is an ENS name (.eth or .box)
   */
  private static isENSName(address: string): boolean {
    // ENS names end with .eth or .box
    if (!address.endsWith('.eth') && !address.endsWith('.box')) {
      return false;
    }

    // Extract the name part (without .eth or .box)
    const nameWithoutTLD = address.endsWith('.eth')
      ? address.slice(0, -4)
      : address.slice(0, -4);

    if (nameWithoutTLD.length === 0) {
      return false;
    }

    // ENS names can have multiple labels separated by dots
    const labels = nameWithoutTLD.split('.');

    // Each label must be valid
    const validLabelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    for (const label of labels) {
      if (label.length === 0 || !validLabelRegex.test(label)) {
        return false;
      }
      // No consecutive hyphens allowed
      if (label.includes('--')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if address is an SNS name (Solana name service)
   * Supports: .sol, .abc, .bonk, .poor, .gm, .dao, .defi, .web3
   */
  private static isSNSName(address: string): boolean {
    // List of supported Solana name extensions
    const snsExtensions = [
      '.sol',
      '.abc',
      '.bonk',
      '.poor',
      '.gm',
      '.dao',
      '.defi',
      '.web3',
    ];

    // Check if address ends with any supported extension
    const matchingExtension = snsExtensions.find(ext => address.endsWith(ext));
    if (!matchingExtension) {
      return false;
    }

    // Extract the name part (without the extension)
    const nameWithoutTLD = address.slice(0, -matchingExtension.length);

    if (nameWithoutTLD.length === 0) {
      return false;
    }

    // SNS names can have multiple labels separated by dots
    const labels = nameWithoutTLD.split('.');

    // Each label must be valid
    const validLabelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    for (const label of labels) {
      if (label.length === 0 || !validLabelRegex.test(label)) {
        return false;
      }
      // No consecutive hyphens allowed
      if (label.includes('--')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all ENS names (both .eth and .box domains) for a given address
   * Uses comprehensive discovery to find all names, not just primary
   */
  static async getENSNames(address: string): Promise<string[]> {
    if (!this.isEVMAddress(address.toLowerCase())) {
      return [];
    }

    try {
      const { createPublicClient, http } = await import('viem');
      const { mainnet } = await import('viem/chains');

      const client = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      const ensNames: string[] = [];

      try {
        // Method 1: Get primary ENS name
        const primaryName = await client.getEnsName({
          address: address as `0x${string}`,
        });

        if (primaryName) {
          ensNames.push(primaryName);
        }
      } catch {
        // No primary name found, continue
      }

      // Method 2: Query ENS subgraph for all names pointing to this address
      // This covers both .eth and .box domains
      try {
        const subgraphQuery = `
          query GetAllNames($address: String!) {
            domains(where: { resolvedAddress: $address }) {
              name
            }
          }
        `;

        const subgraphUrl =
          'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
        const response = await (globalThis as any).fetch(subgraphUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: subgraphQuery,
            variables: { address: address.toLowerCase() },
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.data?.domains) {
            const supportedTlds = ['.eth', '.box'];

            for (const domain of data.data.domains) {
              const domainName = domain.name;

              // Check if it's a supported TLD
              const hasSupportedTld = supportedTlds.some(tld =>
                domainName.endsWith(tld)
              );

              if (hasSupportedTld && !ensNames.includes(domainName)) {
                ensNames.push(domainName);
              }
            }
          }
        }
      } catch {
        // Continue with primary name only if subgraph fails
      }

      return ensNames;
    } catch (error) {
      console.error('Error fetching ENS names:', error);

      if (
        error instanceof Error &&
        error.message?.includes('Cannot resolve module')
      ) {
        console.warn(
          'ENS dependencies not available. Install viem for ENS resolution.'
        );
      }

      return [];
    }
  }

  /**
   * Get all SNS names for a given Solana address
   * Supports all Solana name extensions: .sol, .abc, .bonk, .poor, .gm, .dao, .defi, .web3
   * Uses comprehensive discovery to find all names, not just primary
   */
  static async getSNSNames(address: string): Promise<string[]> {
    if (!this.isSolanaAddress(address.toLowerCase())) {
      return [];
    }

    try {
      // Dynamic imports to avoid issues in environments without these dependencies
      const { Connection, PublicKey } = await import('@solana/web3.js');
      const bonfida = await import('@bonfida/spl-name-service');

      // Create connection to Solana mainnet
      const connection = new Connection(
        process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      );
      const ownerKey = new PublicKey(address);

      const snsNames: string[] = [];

      // Supported SNS TLDs
      const supportedTlds = [
        '.sol',
        '.abc',
        '.bonk',
        '.poor',
        '.gm',
        '.dao',
        '.defi',
        '.web3',
      ];

      try {
        // Method 1: Try reverse lookup for primary domain
        if (bonfida.reverseLookup) {
          const primaryDomain = await bonfida.reverseLookup(
            connection,
            ownerKey
          );
          if (primaryDomain && typeof primaryDomain === 'string') {
            const hasSupportedTld = supportedTlds.some(tld =>
              primaryDomain.endsWith(tld)
            );
            if (hasSupportedTld) {
              snsNames.push(primaryDomain);
            }
          }
        }
      } catch {
        // No primary domain found, continue with comprehensive search
      }

      try {
        // Method 2: Get all domains owned by this address
        // Try different approaches depending on Bonfida v3.x API
        if (bonfida.getAllDomains) {
          const allDomains = await bonfida.getAllDomains(connection, ownerKey);

          // Handle different return types from getAllDomains
          if (Array.isArray(allDomains)) {
            for (const domainInfo of allDomains) {
              let domainName: string | null = null;

              // Handle different possible return formats
              if (typeof domainInfo === 'string') {
                domainName = domainInfo;
              } else if (domainInfo && typeof domainInfo === 'object') {
                // Try common property names for domain info
                domainName =
                  (domainInfo as any).name ||
                  (domainInfo as any).domain ||
                  null;
              }

              if (domainName && typeof domainName === 'string') {
                const hasSupportedTld = supportedTlds.some(tld =>
                  domainName.endsWith(tld)
                );

                if (hasSupportedTld && !snsNames.includes(domainName)) {
                  snsNames.push(domainName);
                }
              }
            }
          }
        }
      } catch (allDomainsError) {
        // If getAllDomains fails, continue with just primary domain
        console.debug(
          'getAllDomains failed, using primary domain only:',
          allDomainsError
        );
      }

      try {
        // Method 3: Try alternative domain discovery methods
        // Some versions of Bonfida SDK might have different function names
        const bonfidaAny = bonfida as any;
        const alternativeFunctions = [
          'getDomains',
          'getOwnedDomains',
          'getUserDomains',
        ];

        for (const funcName of alternativeFunctions) {
          if (
            bonfidaAny[funcName] &&
            typeof bonfidaAny[funcName] === 'function'
          ) {
            try {
              const domains = await bonfidaAny[funcName](connection, ownerKey);
              if (Array.isArray(domains)) {
                for (const domain of domains) {
                  const domainStr =
                    typeof domain === 'string'
                      ? domain
                      : domain?.name || domain?.domain;

                  if (domainStr && typeof domainStr === 'string') {
                    const hasSupportedTld = supportedTlds.some(tld =>
                      domainStr.endsWith(tld)
                    );

                    if (hasSupportedTld && !snsNames.includes(domainStr)) {
                      snsNames.push(domainStr);
                    }
                  }
                }
                break; // Stop after first successful alternative method
              }
            } catch {
              // Continue to next alternative method
            }
          }
        }
      } catch {
        // All alternative methods failed, continue with what we have
      }

      return snsNames;
    } catch (error) {
      console.error('Error fetching SNS names:', error);

      // If dependencies are not available, return empty array to avoid breaking the flow
      if (
        error instanceof Error &&
        error.message?.includes('Cannot resolve module')
      ) {
        console.warn(
          'SNS dependencies not available. Install @solana/web3.js and @bonfida/spl-name-service for SNS resolution.'
        );
      }

      return [];
    }
  }

  /**
   * Get the list of supported SNS extensions
   */
  static getSupportedSNSExtensions(): string[] {
    return ['.sol', '.abc', '.bonk', '.poor', '.gm', '.dao', '.defi', '.web3'];
  }

  /**
   * Get the list of supported ENS extensions
   */
  static getSupportedENSExtensions(): string[] {
    return ['.eth', '.box'];
  }
}

/**
 * Email Address Helper class for parsing and analyzing email addresses
 */
export class EmailAddressHelper {
  /**
   * Parse an email address into its components
   * Returns undefined if the email address is invalid (doesn't contain exactly one @)
   */
  static parse(emailAddress: string): ParsedEmailAddress | undefined {
    if (!emailAddress || typeof emailAddress !== 'string') {
      return undefined;
    }

    // Trim whitespace and validate input
    const trimmedEmail = emailAddress.trim();
    if (trimmedEmail.length === 0) {
      return undefined;
    }

    // Split by @ symbol
    const parts = trimmedEmail.split('@');

    // Must have exactly one @ symbol (resulting in exactly 2 parts)
    if (parts.length !== 2) {
      return undefined;
    }

    const [address, domain] = parts;

    // Both address and domain parts must be non-empty
    if (address.length === 0 || domain.length === 0) {
      return undefined;
    }

    // Determine the address type using AddressHelper
    const type = AddressHelper.getAddressType(address);

    return {
      address,
      domain,
      type,
    };
  }
}
