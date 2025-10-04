/**
 * Mock data helpers for Indexer API responses in development mode
 * Includes both public and signature-protected endpoints (excludes IP-restricted endpoints)
 */

import type {
  AddressValidationResponse,
  ChainType,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NonceResponse,
  PointsResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';

export class IndexerMockData {
  static getLeaderboard(count: number = 10): LeaderboardResponse {
    return {
      success: true,
      data: {
        leaderboard: [
          { walletAddress: '0x1234...5678', chainType: 'ethereum' as ChainType, pointsEarned: '5000', lastActivityDate: new Date().toISOString() },
          { walletAddress: '0x2345...6789', chainType: 'ethereum' as ChainType, pointsEarned: '4500', lastActivityDate: new Date().toISOString() },
          { walletAddress: '0x3456...7890', chainType: 'ethereum' as ChainType, pointsEarned: '4000', lastActivityDate: new Date().toISOString() }
        ].slice(0, count),
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getSiteStats(): SiteStatsResponse {
    return {
      success: true,
      data: {
        totalUsers: 150,
        totalPoints: '250000',
        lastUpdated: new Date().toISOString()
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getValidation(username: string): AddressValidationResponse {
    return {
      success: true,
      data: {
        walletAddress: username.toLowerCase(),
        chainType: 'ethereum' as ChainType,
        name: null,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getSigningMessage(walletAddress: string, chainId: number, domain: string): SignInMessageResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'ethereum' as ChainType,
        message: `Sign this message to authenticate with ${domain}`,
        chainId: chainId || undefined,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getWalletAccounts(walletAddress: string): EmailAccountsResponse {
    return {
      success: true,
      data: {
        accounts: [{
          walletAddress,
          chainType: 'ethereum' as ChainType,
          names: [{ name: 'user@0xmail.box', entitled: true }],
        }],
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getDelegatedTo(walletAddress: string): DelegatedToResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'ethereum' as ChainType,
        chainId: null,
        txHash: null,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getDelegatedFrom(_walletAddress: string): DelegatedFromResponse {
    return {
      success: true,
      data: {
        from: [],
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static createNonce(_username: string): NonceResponse {
    return {
      success: true,
      data: {
        nonce: Math.random().toString(36).substring(2, 15),
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getNonce(_username: string): NonceResponse {
    return {
      success: true,
      data: {
        nonce: 'mock-nonce-12345',
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getEntitlement(walletAddress: string): EntitlementResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'ethereum' as ChainType,
        entitlement: {
          type: 'nameservice',
          hasEntitlement: true,
          isActive: true,
          productIdentifier: null,
          store: null,
        },
        message: 'User has premium entitlement',
        verified: true,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getPointsBalance(walletAddress: string): PointsResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'ethereum' as ChainType,
        pointsEarned: '1000',
        lastActivityDate: new Date().toISOString(),
        createdAt: null,
        updatedAt: null,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }
}