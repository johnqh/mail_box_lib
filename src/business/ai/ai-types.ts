/**
 * Core AI types and interfaces for 0xmail.box
 * Defines the contract for AI services and data structures
 */

import { Email } from '../../types/email';
import { ChainType } from '@johnqh/types';

interface EmailCategory {
  primary:
    | 'priority'
    | 'promotional'
    | 'social'
    | 'web3'
    | 'finance'
    | 'personal'
    | 'spam';
  secondary?: string[];
  confidence: number; // 0-1
  reasoning?: string;
}

interface EmailSummary {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  estimatedReadTime: number; // seconds
}

interface Web3Entity {
  type:
    | 'wallet_address'
    | 'contract_address'
    | 'transaction_hash'
    | 'ens_name'
    | 'sns_name'
    | 'token_symbol'
    | 'nft_collection';
  value: string;
  chainType?: ChainType;
  confidence: number;
  context?: string;
}

interface EmailEntities {
  web3Entities: Web3Entity[];
  dates: Date[];
  amounts: {
    value: number;
    currency: string;
    context?: string;
  }[];
  people: {
    name: string;
    email?: string;
    role?: string;
  }[];
  organizations: string[];
  topics: string[];
}

interface TransactionAnalysis {
  txHash: string;
  chainType: ChainType;
  type:
    | 'send'
    | 'receive'
    | 'swap'
    | 'mint'
    | 'stake'
    | 'defi'
    | 'nft'
    | 'contract_interaction';
  summary: string;
  details: {
    from?: string;
    to?: string;
    amount?: string;
    token?: string;
    gasUsed?: string;
    status: 'success' | 'failed' | 'pending';
  };
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

interface SmartReply {
  text: string;
  tone: 'professional' | 'casual' | 'formal';
  confidence: number;
  context: string;
}

interface SearchResult {
  email: Email;
  relevance: number;
  matchedFields: string[];
  summary: string;
  highlights: {
    field: string;
    snippet: string;
  }[];
}

interface AIInsight {
  type: 'suggestion' | 'warning' | 'information' | 'action_required';
  title: string;
  description: string;
  confidence: number;
  actionLabel?: string;
  actionCallback?: () => void;
}

interface UserBehaviorPattern {
  emailCheckingTimes: number[]; // hours of day
  responseTimePatterns: {
    sender: string;
    avgResponseTime: number; // minutes
  }[];
  categoryPreferences: {
    category: string;
    readRate: number;
    responseRate: number;
  }[];
  searchPatterns: {
    query: string;
    frequency: number;
    timestamp: Date;
  }[];
}

interface AIProcessingOptions {
  enableCategorization?: boolean;
  enableSummarization?: boolean;
  enableEntityExtraction?: boolean;
  enableSentimentAnalysis?: boolean;
  enableWeb3Analysis?: boolean;
  privacyMode?: boolean; // When true, process locally only
  maxProcessingTime?: number; // milliseconds
}

export {
  type EmailCategory,
  type EmailSummary,
  type Web3Entity,
  type EmailEntities,
  type TransactionAnalysis,
  type SmartReply,
  type SearchResult,
  type AIInsight,
  type UserBehaviorPattern,
  type AIProcessingOptions,
};
