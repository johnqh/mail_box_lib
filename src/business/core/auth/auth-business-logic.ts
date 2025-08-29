/**
 * Platform-agnostic authentication business logic
 */

import { ChainType } from '../../utils/addressDetection';
import { EmailAddress } from '../../types';
import { AuthStatus } from '../../services/auth.interface';

// Extended EmailAddress interface for business logic
interface ExtendedEmailAddress extends EmailAddress {
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
  requiresSubscription(emailAddress: EmailAddress, hasActiveSubscription: boolean): boolean;

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
  generateUserDisplayName(walletAddress: string, emailAddresses: EmailAddress[]): string;

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
    const actualNonce = nonce || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `Authenticate with 0xMail\nNonce: ${actualNonce}`;
  }

  isValidWalletAddress(address: string, chainType: ChainType): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    switch (chainType) {
      case 'evm':
        // EVM address validation (0x followed by 40 hex characters)
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      
      case 'solana':
        // Solana address validation (base58 encoded, 32-44 characters)
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      
      default:
        // Unknown chain type, basic validation
        return address.length > 10 && address.length < 100;
    }
  }

  requiresSubscription(emailAddress: EmailAddress, hasActiveSubscription: boolean): boolean {
    // ENS and SNS domains require subscription
    const isENS = emailAddress.id.startsWith('ens_') || emailAddress.email.endsWith('.eth@0xmail.box');
    const isSNS = emailAddress.id.startsWith('sns_') || emailAddress.email.endsWith('.sol@0xmail.box');
    
    return (isENS || isSNS) && !hasActiveSubscription;
  }

  getAuthStatusText(status: AuthStatus): string {
    switch (status) {
      case 'disconnected':
        return 'Not connected';
      case 'connected':
        return 'Connected - Please verify';
      case 'verified':
        return 'Authenticated';
      default:
        return 'Unknown status';
    }
  }

  canAccessProtectedFeatures(status: AuthStatus): boolean {
    return status === 'verified';
  }

  generateUserDisplayName(walletAddress: string, emailAddresses: EmailAddress[]): string {
    // Try to use the first ENS or SNS name
    const namedAddress = emailAddresses.find(addr => 
      addr.id.startsWith('ens_') || addr.id.startsWith('sns_')
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
      case 'evm':
        // Ethereum signature validation (0x followed by 130 hex characters)
        return /^0x[a-fA-F0-9]{130}$/.test(signature);
      
      case 'solana':
        // Solana signature validation (base58 encoded, typically 87-88 characters)
        return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature);
      
      default:
        // Basic validation for unknown chain types
        return signature.length > 50;
    }
  }

  isAuthExpired(createdAt: Date, expirationHours?: number): boolean {
    const hours = expirationHours || this.AUTH_EXPIRATION_HOURS;
    const expirationTime = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
    return new Date() > expirationTime;
  }

  getChainDisplayName(chainType: ChainType): string {
    switch (chainType) {
      case 'evm':
        return 'EVM Chain';
      case 'solana':
        return 'Solana';
      case 'unknown':
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
  generateEmailAddressesForWallet(walletAddress: string, chainType: ChainType): EmailAddress[];

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
  getEmailAddressType(emailAddress: EmailAddress): 'direct' | 'ens' | 'sns' | 'custom';

  /**
   * Get display name for email address
   */
  getEmailAddressDisplayName(emailAddress: EmailAddress): string;
}

export class DefaultEmailAddressBusinessLogic implements EmailAddressBusinessLogic {
  generateEmailAddressesForWallet(walletAddress: string, chainType: ChainType): EmailAddress[] {
    const addresses: EmailAddress[] = [
      {
        id: `direct_${walletAddress}`,
        name: this.formatAddressForDisplay(walletAddress),
        email: `${walletAddress}@0xmail.box`,
        isPrimary: true,
        isActive: true
      }
    ];

    // Add ENS support for EVM chains
    if (chainType === 'evm') {
      addresses.push({
        id: `ens_${walletAddress}`,
        name: 'ENS Domain',
        email: 'your-domain.eth@0xmail.box',
        isPrimary: false,
        isActive: true
      });
    }

    // Add SNS support for Solana
    if (chainType === 'solana') {
      addresses.push({
        id: `sns_${walletAddress}`,
        name: 'SNS Domain',
        email: 'your-domain.sol@0xmail.box',
        isPrimary: false,
        isActive: true
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

  getEmailAddressType(emailAddress: EmailAddress): 'direct' | 'ens' | 'sns' | 'custom' {
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
      case 'direct': return 1;
      case 'ens': return 2;
      case 'sns': return 3;
      case 'custom': return 4;
      default: return 5;
    }
  }
}