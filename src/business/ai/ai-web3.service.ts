/**
 * AI Web3 Service
 * Specialized AI features for Web3 and blockchain-related content
 */

import { TransactionAnalysis } from './ai-types';
import { ChainType } from '../../utils/blockchain';

interface AIWeb3Service {
  analyzeTransaction(
    txHash: string,
    chainType: ChainType
  ): Promise<TransactionAnalysis>;
  explainSmartContract(
    contractAddress: string,
    chainType: ChainType
  ): Promise<ContractExplanation>;
  analyzeNFTMetadata(nftData: any): Promise<NFTAnalysis>;
  detectScamIndicators(content: string): Promise<ScamAnalysis>;
  explainDeFiProtocol(protocolName: string): Promise<ProtocolExplanation>;
  analyzeTokenMetrics(
    tokenAddress: string,
    chainType: ChainType
  ): Promise<TokenAnalysis>;
}

interface ContractExplanation {
  name: string;
  type:
    | 'erc20'
    | 'erc721'
    | 'erc1155'
    | 'defi'
    | 'dao'
    | 'multisig'
    | 'unknown';
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  verificationStatus: 'verified' | 'unverified' | 'unknown';
  popularityScore: number; // 0-100
  recentActivity: {
    transactions24h: number;
    uniqueUsers24h: number;
    volume24h?: string;
  };
  warnings?: string[];
}

interface NFTAnalysis {
  collectionName: string;
  floorPrice?: number;
  rarity?: {
    rank: number;
    score: number;
    traits: { trait: string; value: string; rarity: number }[];
  };
  authenticity: {
    isAuthentic: boolean;
    confidence: number;
    verificationMethod: string;
  };
  priceAnalysis?: {
    currentPrice?: number;
    historicalAvg: number;
    priceChange24h: number;
  };
}

interface ScamAnalysis {
  riskScore: number; // 0-100, higher = more risky
  indicators: {
    type:
      | 'phishing'
      | 'fake_token'
      | 'rug_pull'
      | 'honeypot'
      | 'social_engineering';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  recommendations: string[];
  safetyTips: string[];
}

interface ProtocolExplanation {
  name: string;
  category:
    | 'dex'
    | 'lending'
    | 'yield_farming'
    | 'derivatives'
    | 'insurance'
    | 'bridge'
    | 'other';
  description: string;
  tvl?: number; // Total Value Locked
  riskLevel: 'low' | 'medium' | 'high';
  auditStatus: {
    isAudited: boolean;
    auditFirms?: string[];
    lastAuditDate?: Date;
  };
  keyFeatures: string[];
  howItWorks: string;
}

interface TokenAnalysis {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
  liquidityScore: number; // 0-100
  volatilityScore: number; // 0-100
  riskFactors: string[];
  strengths: string[];
  technicalAnalysis?: {
    trend: 'bullish' | 'bearish' | 'sideways';
    support: number;
    resistance: number;
  };
}

class AIWeb3ServiceImpl implements AIWeb3Service {
  private readonly KNOWN_PROTOCOLS = {
    uniswap: { category: 'dex', tvl: 5000000000, riskLevel: 'low' as const },
    aave: { category: 'lending', tvl: 8000000000, riskLevel: 'low' as const },
    compound: {
      category: 'lending',
      tvl: 3000000000,
      riskLevel: 'low' as const,
    },
    maker: { category: 'lending', tvl: 6000000000, riskLevel: 'low' as const },
    curve: { category: 'dex', tvl: 4000000000, riskLevel: 'low' as const },
    yearn: {
      category: 'yield_farming',
      tvl: 500000000,
      riskLevel: 'medium' as const,
    },
  };

  private readonly SCAM_INDICATORS = [
    {
      pattern: /guaranteed.*profit/i,
      type: 'social_engineering' as const,
      severity: 'high' as const,
    },
    {
      pattern: /send.*eth.*receive.*more/i,
      type: 'phishing' as const,
      severity: 'critical' as const,
    },
    {
      pattern: /urgent.*action.*required/i,
      type: 'phishing' as const,
      severity: 'medium' as const,
    },
    {
      pattern: /congratulations.*winner/i,
      type: 'phishing' as const,
      severity: 'high' as const,
    },
    {
      pattern: /private.*key/i,
      type: 'phishing' as const,
      severity: 'critical' as const,
    },
    {
      pattern: /seed.*phrase/i,
      type: 'phishing' as const,
      severity: 'critical' as const,
    },
    {
      pattern: /verify.*wallet/i,
      type: 'phishing' as const,
      severity: 'high' as const,
    },
    {
      pattern: /too.*good.*true/i,
      type: 'social_engineering' as const,
      severity: 'medium' as const,
    },
  ];

  async analyzeTransaction(
    txHash: string,
    chainType: ChainType
  ): Promise<TransactionAnalysis> {
    try {
      // In a real implementation, this would call blockchain APIs
      // For now, we'll provide a mock analysis based on the hash pattern

      const analysis = this.generateMockTransactionAnalysis(txHash, chainType);
      return analysis;
    } catch (error) {
      throw new Error(
        `Failed to analyze transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async explainSmartContract(
    contractAddress: string,
    chainType: ChainType
  ): Promise<ContractExplanation> {
    try {
      // Mock implementation - in reality, this would query contract databases and APIs
      const explanation = this.generateMockContractExplanation(
        contractAddress,
        chainType
      );
      return explanation;
    } catch (error) {
      throw new Error(
        `Failed to explain contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async analyzeNFTMetadata(nftData: any): Promise<NFTAnalysis> {
    try {
      return {
        collectionName: nftData.collection || 'Unknown Collection',
        floorPrice: nftData.floorPrice || 0.1,
        rarity: nftData.rarity
          ? {
              rank: nftData.rarity.rank || Math.floor(Math.random() * 10000),
              score: nftData.rarity.score || Math.random() * 100,
              traits: nftData.rarity.traits || [],
            }
          : undefined,
        authenticity: {
          isAuthentic: true, // Mock - would check against known collections
          confidence: 0.95,
          verificationMethod: 'Collection metadata verification',
        },
        priceAnalysis: {
          currentPrice: nftData.price || 0.5,
          historicalAvg: 0.3,
          priceChange24h: Math.random() * 20 - 10, // -10 to +10%
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze NFT: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async detectScamIndicators(content: string): Promise<ScamAnalysis> {
    const indicators: ScamAnalysis['indicators'] = [];
    let riskScore = 0;

    // Check for scam patterns
    this.SCAM_INDICATORS.forEach(({ pattern, type, severity }) => {
      if (pattern.test(content)) {
        indicators.push({
          type,
          description: `Detected ${type.replace('_', ' ')} pattern: ${pattern.source}`,
          severity,
        });

        // Add to risk score based on severity
        const severityScore = {
          low: 10,
          medium: 25,
          high: 50,
          critical: 75,
        };
        riskScore += severityScore[severity];
      }
    });

    // Additional Web3-specific checks
    const hasMultipleAddresses =
      (content.match(/0x[a-fA-F0-9]{40}/g) || []).length > 3;
    if (hasMultipleAddresses) {
      indicators.push({
        type: 'phishing',
        description:
          'Multiple wallet addresses detected - possible address confusion scam',
        severity: 'medium',
      });
      riskScore += 20;
    }

    // Check for urgency + money combination
    const hasUrgency = /urgent|asap|immediately|limited time/i.test(content);
    const hasMoney = /\$|ETH|BTC|send.*money|payment/i.test(content);
    if (hasUrgency && hasMoney) {
      indicators.push({
        type: 'social_engineering',
        description:
          'Urgency combined with financial request - common scam tactic',
        severity: 'high',
      });
      riskScore += 30;
    }

    riskScore = Math.min(riskScore, 100);

    const recommendations = this.generateScamRecommendations(
      riskScore,
      indicators
    );
    const safetyTips = this.getWeb3SafetyTips();

    return {
      riskScore,
      indicators,
      recommendations,
      safetyTips,
    };
  }

  async explainDeFiProtocol(
    protocolName: string
  ): Promise<ProtocolExplanation> {
    const normalizedName = protocolName.toLowerCase();
    const knownProtocol =
      this.KNOWN_PROTOCOLS[normalizedName as keyof typeof this.KNOWN_PROTOCOLS];

    if (knownProtocol) {
      return this.generateKnownProtocolExplanation(protocolName, knownProtocol);
    }

    // For unknown protocols, provide generic explanation
    return {
      name: protocolName,
      category: 'other',
      description: `${protocolName} is a DeFi protocol. Limited information available.`,
      riskLevel: 'high', // Unknown protocols are higher risk
      auditStatus: {
        isAudited: false,
      },
      keyFeatures: ['Decentralized Finance', 'Blockchain-based'],
      howItWorks:
        'This protocol operates on blockchain technology to provide decentralized financial services. Please research thoroughly before interacting.',
    };
  }

  async analyzeTokenMetrics(
    _tokenAddress: string,
    _chainType: ChainType
  ): Promise<TokenAnalysis> {
    // Mock implementation - would integrate with price APIs
    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      price: Math.random() * 100,
      priceChange24h: (Math.random() - 0.5) * 20,
      liquidityScore: Math.floor(Math.random() * 100),
      volatilityScore: Math.floor(Math.random() * 100),
      riskFactors: [
        'New token with limited history',
        'Low liquidity',
        'Unverified contract',
      ],
      strengths: ['Active development', 'Growing community'],
      technicalAnalysis: {
        trend: ['bullish', 'bearish', 'sideways'][
          Math.floor(Math.random() * 3)
        ] as any,
        support: Math.random() * 50,
        resistance: Math.random() * 150 + 50,
      },
    };
  }

  // Private helper methods
  private generateMockTransactionAnalysis(
    txHash: string,
    chainType: ChainType
  ): TransactionAnalysis {
    // Simple mock based on hash characteristics
    const types: TransactionAnalysis['type'][] = [
      'send',
      'receive',
      'swap',
      'mint',
      'stake',
      'defi',
      'nft',
    ];
    const type = types[txHash.charCodeAt(2) % types.length];

    return {
      txHash,
      chainType,
      type,
      summary: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction on ${chainType}`,
      details: {
        from: `0x${'a'.repeat(40)}`,
        to: `0x${'b'.repeat(40)}`,
        amount: (Math.random() * 10).toFixed(4),
        token: chainType === 'evm' ? 'ETH' : 'SOL',
        gasUsed: Math.floor(Math.random() * 100000).toString(),
        status: 'success',
      },
      riskLevel: 'low',
      explanation: `This appears to be a ${type} transaction. The transaction completed successfully with normal gas usage.`,
    };
  }

  private generateMockContractExplanation(
    contractAddress: string,
    chainType: ChainType
  ): ContractExplanation {
    const types: ContractExplanation['type'][] = [
      'erc20',
      'erc721',
      'defi',
      'dao',
      'multisig',
    ];
    const type = types[contractAddress.charCodeAt(2) % types.length];

    return {
      name: `Contract ${contractAddress.slice(0, 8)}...`,
      type,
      description: `This is a ${type} contract on ${chainType}. It handles ${type === 'erc20' ? 'token transfers' : type === 'erc721' ? 'NFT operations' : 'smart contract interactions'}.`,
      riskLevel: 'medium',
      verificationStatus: Math.random() > 0.5 ? 'verified' : 'unverified',
      popularityScore: Math.floor(Math.random() * 100),
      recentActivity: {
        transactions24h: Math.floor(Math.random() * 1000),
        uniqueUsers24h: Math.floor(Math.random() * 500),
        volume24h: (Math.random() * 1000000).toFixed(2),
      },
    };
  }

  private generateScamRecommendations(
    riskScore: number,
    indicators: ScamAnalysis['indicators']
  ): string[] {
    const recommendations = [];

    if (riskScore > 70) {
      recommendations.push(
        '⚠️ HIGH RISK: Do not interact with this content or send any funds'
      );
      recommendations.push('Block the sender and report as spam');
    } else if (riskScore > 40) {
      recommendations.push(
        '🔍 Verify sender identity through official channels'
      );
      recommendations.push('Do not click any links or download attachments');
    } else if (riskScore > 20) {
      recommendations.push(
        'Exercise caution and verify any requests independently'
      );
    }

    if (indicators.some(i => i.type === 'phishing')) {
      recommendations.push(
        'Never share private keys, seed phrases, or wallet passwords'
      );
    }

    if (indicators.some(i => i.type === 'social_engineering')) {
      recommendations.push(
        'Be skeptical of urgent requests or "too good to be true" offers'
      );
    }

    recommendations.push(
      'When in doubt, consult with the Web3 community or security experts'
    );

    return recommendations;
  }

  private getWeb3SafetyTips(): string[] {
    return [
      '🔐 Never share your private keys or seed phrases with anyone',
      '🔗 Always verify URLs and use official websites',
      '💰 Be wary of unsolicited investment opportunities',
      '📧 Verify sender identity through official channels',
      '🎯 Double-check wallet addresses before sending funds',
      '🛡️ Use hardware wallets for large amounts',
      '📱 Enable 2FA on all crypto-related accounts',
      '🔍 Research projects thoroughly before investing',
      '⏰ Take time to think - scammers create artificial urgency',
      '👥 Consult with trusted community members when unsure',
    ];
  }

  private generateKnownProtocolExplanation(
    protocolName: string,
    protocolData: any
  ): ProtocolExplanation {
    const explanations = {
      uniswap: {
        description:
          'Uniswap is a decentralized exchange (DEX) protocol that allows users to swap ERC-20 tokens directly from their wallets.',
        keyFeatures: [
          'Automated Market Maker (AMM)',
          'Liquidity Pools',
          'Governance Token (UNI)',
          'Flash Swaps',
        ],
        howItWorks:
          'Users can swap tokens using liquidity pools maintained by other users. Liquidity providers earn fees from trades.',
      },
      aave: {
        description:
          'Aave is a decentralized lending protocol where users can lend and borrow cryptocurrencies.',
        keyFeatures: [
          'Flash Loans',
          'Interest Rate Switching',
          'Collateral Management',
          'Governance Token (AAVE)',
        ],
        howItWorks:
          'Users deposit crypto to earn interest or borrow against their collateral. Interest rates adjust based on supply and demand.',
      },
    };

    const protocolExplanation = explanations[
      protocolName.toLowerCase() as keyof typeof explanations
    ] || {
      description: `${protocolName} is a DeFi protocol.`,
      keyFeatures: ['Decentralized Finance'],
      howItWorks: 'This protocol provides decentralized financial services.',
    };

    return {
      name: protocolName,
      category: protocolData.category,
      description: protocolExplanation.description,
      tvl: protocolData.tvl,
      riskLevel: protocolData.riskLevel,
      auditStatus: {
        isAudited: true, // Assume known protocols are audited
        auditFirms: ['ConsenSys Diligence', 'OpenZeppelin'],
        lastAuditDate: new Date('2024-01-01'),
      },
      keyFeatures: protocolExplanation.keyFeatures,
      howItWorks: protocolExplanation.howItWorks,
    };
  }
}

const aiWeb3Service = new AIWeb3ServiceImpl();

export {
  aiWeb3Service,
  type AIWeb3Service,
  type ContractExplanation,
  type NFTAnalysis,
  type ScamAnalysis,
  type ProtocolExplanation,
  type TokenAnalysis,
};
