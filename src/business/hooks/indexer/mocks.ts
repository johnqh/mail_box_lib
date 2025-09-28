/**
 * Mock data helpers for Indexer API responses in development mode (public endpoints only)
 */

import type {
  AddressValidationResponse,
  ChainType,
  LeaderboardResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';

export class IndexerMockData {
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

  // Note: The following methods have been removed as they're for signature-protected endpoints:
  // - getPointsBalance (requires signature verification)
  // - getEmailAccounts (requires signature verification)
  // - getDelegation/getDelegators (requires signature verification)
  // - getNonce (requires signature verification)
  // - getEntitlement (requires signature verification)
}