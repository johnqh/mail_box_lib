/**
 * Platform-agnostic authentication business logic
 */

import {
  AddressType,
  AuthStatus,
  ChainType,
  getAddressType,
  Optional,
} from '@sudobility/types';
import { EmailAddress } from '../../../types/email';

/**
 * Parsed email address structure
 */
type ParsedEmailAddress = {
  /** The address part (before @) */
  address: string;
  /** The domain part (after @) */
  domain: string;
  /** The detected type of the address, or undefined if not recognized */
  type: Optional<AddressType>;
};

// Extended EmailAddress interface for business logic
// interface _ExtendedEmailAddress extends EmailAddress {
//   main?: boolean;
// }

interface AuthBusinessLogic {
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

  /**
   * Check if wallet is connected
   */
  isWalletConnected(status: AuthStatus): boolean;
}

class DefaultAuthBusinessLogic implements AuthBusinessLogic {
  private readonly AUTH_EXPIRATION_HOURS = 24; // 24 hours default

  generateAuthMessage(nonce?: string): string {
    const actualNonce =
      nonce || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `Sign in to authenticate\nNonce: ${actualNonce}`;
  }

  isValidWalletAddress(address: string, chainType: ChainType): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    const addressType = getAddressType(address);

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
        return addressType !== undefined;
    }
  }

  requiresSubscription(
    emailAddress: EmailAddress,
    hasActiveSubscription: boolean
  ): boolean {
    // ENS and SNS domains require subscription
    let isENS = emailAddress.id.startsWith('ens_');
    let isSNS = emailAddress.id.startsWith('sns_');

    // Also check the email address part
    if (!isENS && !isSNS) {
      const emailParts = emailAddress.address.split('@');
      if (emailParts.length === 2) {
        const addressType = getAddressType(emailParts[0] || '');
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
      // Extract name from email (e.g., "vitalik.eth@example.com" -> "vitalik.eth")
      const name = namedAddress.address.split('@')[0];
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
        // EVM signature validation (0x followed by 130 hex characters)
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
      default:
        return 'Unknown Chain';
    }
  }

  formatWalletAddressForDisplay(address: string): string {
    if (!address || address.length < 10) {
      return address;
    }

    // Show first 6 and last 4 characters with ellipsis
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  isWalletConnected(status: AuthStatus): boolean {
    return status === AuthStatus.CONNECTED || status === AuthStatus.VERIFIED;
  }
}

/**
 * Email address business logic
 */
interface EmailAddressBusinessLogic {
  /**
   * Generate email addresses for a wallet
   */
  generateEmailAddressesForWallet(
    walletAddress: string,
    chainType: ChainType,
    emailDomain: string
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

  /**
   * Parse email address string
   */
  parseEmailAddress(email: string): Optional<ParsedEmailAddress>;
}

class DefaultEmailAddressBusinessLogic implements EmailAddressBusinessLogic {
  generateEmailAddressesForWallet(
    walletAddress: string,
    chainType: ChainType,
    emailDomain: string
  ): EmailAddress[] {
    const addresses: EmailAddress[] = [
      {
        id: `direct_${walletAddress}`,
        address: `${walletAddress}@${emailDomain}`,
        verified: true,
        primary: true,
        createdAt: new Date(),
      },
    ];

    // Add ENS support for EVM chains
    if (chainType === ChainType.EVM) {
      addresses.push({
        id: `ens_${walletAddress}`,
        address: `your-domain.eth@${emailDomain}`,
        verified: false,
        primary: false,
        createdAt: new Date(),
      });
    }

    // Add SNS support for Solana
    if (chainType === ChainType.SOLANA) {
      addresses.push({
        id: `sns_${walletAddress}`,
        address: `your-domain.sol@${emailDomain}`,
        verified: false,
        primary: false,
        createdAt: new Date(),
      });
    }

    return addresses;
  }

  isPrimaryEmailAddress(emailAddress: EmailAddress): boolean {
    return emailAddress.primary === true;
  }

  sortEmailAddresses(emailAddresses: EmailAddress[]): EmailAddress[] {
    return [...emailAddresses].sort((a, b) => {
      // Primary addresses first
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;

      // Then by type priority: direct, ENS, SNS, custom
      const aPriority = this.getAddressPriority(a);
      const bPriority = this.getAddressPriority(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Finally alphabetically
      return a.address.localeCompare(b.address);
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
    return emailAddress.address.split('@')[0] || emailAddress.address;
  }

  parseEmailAddress(email: string): Optional<ParsedEmailAddress> {
    return EmailAddressHelper.parse(email);
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
 * Email Address Helper class for parsing and analyzing email addresses
 */
class EmailAddressHelper {
  /**
   * Parse an email address into its components
   * Returns undefined if the email address is invalid (doesn't contain exactly one @)
   */
  static parse(emailAddress: string): Optional<ParsedEmailAddress> {
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
    if (!address || !domain || address.length === 0 || domain.length === 0) {
      return undefined;
    }

    // Determine the address type
    const type = getAddressType(address);

    return {
      address,
      domain,
      type,
    };
  }
}

export {
  DefaultAuthBusinessLogic,
  DefaultEmailAddressBusinessLogic,
  EmailAddressHelper,
  type AuthBusinessLogic,
  type EmailAddressBusinessLogic,
  type ParsedEmailAddress,
};
