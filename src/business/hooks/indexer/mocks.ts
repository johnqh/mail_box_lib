/**
 * Mock data helpers for Indexer API responses in development mode
 */

import type {
  ChainType,
  DelegationResponse,
  DelegatorsResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NonceResponse,
  PointsResponse,
  SignatureVerificationResponse,
  SimpleMessageResponse,
  SiteStatsResponse,
  SolanaSetupResponse,
  SolanaStatusResponse,
  SolanaTestTransactionResponse,
  ValidationResponse,
} from '@johnqh/types';

export class IndexerMockData {
  static getPointsBalance(walletAddress: string): PointsResponse {
    return {
      success: true,
      data: {
        walletAddress,
        chainType: 'solana' as ChainType,
        data: {
          walletAddress,
          pointsEarned: '1000',
          lastActivityDate: new Date().toISOString()
        },
        verified: true
      },
      timestamp: new Date().toISOString()
    } as PointsResponse;
  }

  static getPointsLeaderboard(count: number): LeaderboardResponse {
    return {
      success: true,
      data: {
        leaderboard: [
          { walletAddress: '0x1234...5678', pointsEarned: '5000', lastActivityDate: new Date().toISOString() },
          { walletAddress: '0x2345...6789', pointsEarned: '4500', lastActivityDate: new Date().toISOString() },
          { walletAddress: '0x3456...7890', pointsEarned: '4000', lastActivityDate: new Date().toISOString() }
        ].slice(0, count),
        count: Math.min(3, count)
      },
      timestamp: new Date().toISOString()
    } as LeaderboardResponse;
  }

  static getSiteStats(): SiteStatsResponse {
    return {
      success: true,
      data: {
        totalUsers: 150,
        totalPoints: '250000',
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    } as SiteStatsResponse;
  }

  static getSolanaStatus(): SolanaStatusResponse {
    return {
      success: true,
      data: {
        status: 'connected',
        cluster: 'mainnet-beta',
        version: '1.16.0'
      },
      timestamp: Date.now()
    } as unknown as SolanaStatusResponse;
  }

  static getSolanaSetup(): SolanaSetupResponse {
    return {
      success: true,
      data: {
        webhookUrl: 'https://mock-webhook.example.com',
        isSetup: true
      },
      timestamp: Date.now()
    } as unknown as SolanaSetupResponse;
  }

  static getSolanaTestTransaction(): SolanaTestTransactionResponse {
    return {
      success: true,
      data: {
        transactionId: 'mock-tx-id-12345',
        status: 'confirmed',
        blockHash: 'mock-block-hash',
        slot: 123456
      },
      timestamp: Date.now()
    } as unknown as SolanaTestTransactionResponse;
  }

  static getValidation(username: string): ValidationResponse {
    return {
      success: true,
      isValid: true,
      address: username,
      addressType: 'EVM' as any,
      normalizedAddress: username.toLowerCase(),
      timestamp: new Date().toISOString()
    } as ValidationResponse;
  }

  static getEmailAccounts(): EmailAccountsResponse {
    return {
      success: true,
      data: {
        walletAddress: '0x1234...5678',
        chainType: 'evm' as ChainType,
        requestedWallet: '0x1234...5678',
        walletAccounts: [
          {
            walletAddress: '0x1234...5678',
            chainType: 'evm' as ChainType,
            isPrimary: true,
            primaryAccount: '0x1234...5678',
            domainAccounts: [
              { account: 'test', type: 'ens', domain: 'test.eth', verified: true },
              { account: 'secondary', type: 'sns', domain: 'secondary.sol', verified: false }
            ],
            totalAccounts: 3
          }
        ],
        totalWallets: 1,
        totalAccounts: 3,
        verified: true
      },
      timestamp: new Date().toISOString()
    } as EmailAccountsResponse;
  }

  // Backward compatibility
  static getEmailAddresses(): EmailAccountsResponse {
    return this.getEmailAccounts();
  }

  static getDelegation(): DelegationResponse {
    return {
      success: true,
      data: {
        delegatedAddress: 'delegated@0xmail.box',
        isDelegated: true
      },
      timestamp: new Date().toISOString()
    } as unknown as DelegationResponse;
  }

  static getDelegators(): DelegatorsResponse {
    return {
      success: true,
      data: {
        delegators: ['0x1234...5678', '0x2345...6789'],
        count: 2
      },
      timestamp: new Date().toISOString()
    } as unknown as DelegatorsResponse;
  }

  static getSignatureVerification(username: string, signature: string, message: string): SignatureVerificationResponse {
    return {
      success: true,
      data: {
        isValid: true,
        walletAddress: username,
        signature,
        message
      },
      timestamp: new Date().toISOString()
    } as unknown as SignatureVerificationResponse;
  }

  static getSigningMessage(walletAddress: string, chainId: number, domain: string): SimpleMessageResponse {
    return {
      success: true,
      message: `Sign this message to authenticate with ${domain}`,
      walletAddress,
      chainType: 'EVM' as any,
      chainId,
      timestamp: new Date().toISOString()
    } as SimpleMessageResponse;
  }

  static getNonce(): NonceResponse {
    return {
      success: true,
      data: {
        nonce: Math.floor(Math.random() * 1000000).toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      },
      timestamp: new Date().toISOString()
    } as unknown as NonceResponse;
  }

  static getEntitlement(): EntitlementResponse {
    return {
      success: true,
      data: {
        hasEntitlement: true,
        entitlementType: 'premium',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      timestamp: new Date().toISOString()
    } as unknown as EntitlementResponse;
  }
}