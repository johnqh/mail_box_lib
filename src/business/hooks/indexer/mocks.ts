/**
 * Mock data helpers for Indexer API responses in development mode
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
  static getPointsBalance(walletAddress: string): PointsResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'solana' as ChainType,
        pointsEarned: '1000',
        lastActivityDate: new Date().toISOString(),
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getPointsLeaderboard(count: number): LeaderboardResponse {
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

  static getEmailAccounts(): EmailAccountsResponse {
    return {
      success: true,
      data: {
        accounts: [
          {
            walletAddress: '0x1234...5678',
            chainType: 'ethereum' as ChainType,
            names: ['test.eth', 'secondary.sol'],
          }
        ],
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  // Backward compatibility
  static getEmailAddresses(): EmailAccountsResponse {
    return this.getEmailAccounts();
  }

  static getDelegation(): DelegatedToResponse {
    return {
      success: true,
      data: {
        walletAddress: 'delegated@0xmail.box',
        chainType: 'ethereum' as ChainType,
        chainId: 1,
        txHash: '0x123...',
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getDelegators(): DelegatedFromResponse {
    return {
      success: true,
      data: {
        from: [
          { walletAddress: '0x1234...5678', chainType: 'ethereum' as ChainType },
          { walletAddress: '0x2345...6789', chainType: 'ethereum' as ChainType },
        ],
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  // Signature verification response has been removed from the new types
  // This functionality may be handled differently now

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

  static getNonce(): NonceResponse {
    return {
      success: true,
      data: {
        nonce: Math.floor(Math.random() * 1000000).toString(),
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }

  static getEntitlement(): EntitlementResponse {
    return {
      success: true,
      data: {
        walletAddress: '0x1234...5678',
        chainType: 'ethereum' as ChainType,
        entitlement: {
          type: 'nameservice',
          hasEntitlement: true,
          isActive: true,
          productIdentifier: 'premium',
          expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          store: 'web',
        },
        message: 'Entitlement verified',
        verified: true,
      },
      error: null,
      timestamp: new Date().toISOString()
    };
  }
}