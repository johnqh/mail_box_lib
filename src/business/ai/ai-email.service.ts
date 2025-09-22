/**
 * AI Email Service
 * Core email intelligence features including categorization, summarization, and entity extraction
 */

import {
  AIProcessingOptions,
  EmailCategory,
  EmailEntities,
  EmailSummary,
  Web3Entity,
} from './ai-types';
import { Email } from '../../types/email';
import { ChainType } from '@johnqh/types';

interface AIEmailService {
  categorizeEmail(
    email: Email,
    options?: AIProcessingOptions
  ): Promise<EmailCategory>;
  summarizeEmail(
    email: Email,
    options?: AIProcessingOptions
  ): Promise<EmailSummary>;
  extractEntities(
    email: Email,
    options?: AIProcessingOptions
  ): Promise<EmailEntities>;
  detectSpam(
    email: Email
  ): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }>;
  analyzeSentiment(
    text: string
  ): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number }>;
  suggestLabels(email: Email): Promise<{ label: string; confidence: number }[]>;
}

class AIEmailServiceImpl implements AIEmailService {
  private readonly WEB3_ADDRESS_REGEX = /\b0x[a-fA-F0-9]{40}\b/g;
  private readonly ENS_REGEX = /\b[a-zA-Z0-9-]+\.eth\b/g;
  private readonly SNS_REGEX = /\b[a-zA-Z0-9-]+\.sol\b/g;
  private readonly TRANSACTION_HASH_REGEX = /\b0x[a-fA-F0-9]{64}\b/g;
  // private readonly _SOLANA_ADDRESS_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

  async categorizeEmail(
    email: Email,
    _options?: AIProcessingOptions
  ): Promise<EmailCategory> {
    try {
      const content = `${email.subject} ${email.body}`.toLowerCase();

      // Web3 content detection
      const hasWeb3Content = this.detectWeb3Content(content);
      if (hasWeb3Content.score > 0.7) {
        return {
          primary: 'web3',
          secondary: hasWeb3Content.categories,
          confidence: hasWeb3Content.score,
          reasoning:
            'Contains Web3-related content such as wallet addresses, transaction hashes, or DeFi protocols',
        };
      }

      // Financial content detection
      const hasFinancialContent = this.detectFinancialContent(content);
      if (hasFinancialContent > 0.6) {
        return {
          primary: 'finance',
          confidence: hasFinancialContent,
          reasoning: 'Contains financial keywords and monetary amounts',
        };
      }

      // Priority detection based on keywords and sender
      const priorityScore = this.calculatePriorityScore(email);
      if (priorityScore > 0.8) {
        return {
          primary: 'priority',
          confidence: priorityScore,
          reasoning:
            'High priority based on sender, keywords, and urgency indicators',
        };
      }

      // Social/personal detection
      const socialScore = this.detectSocialContent(content, email.from);
      if (socialScore > 0.6) {
        return {
          primary: 'social',
          confidence: socialScore,
          reasoning: 'Personal or social communication',
        };
      }

      // Promotional content detection
      const promotionalScore = this.detectPromotionalContent(content);
      if (promotionalScore > 0.7) {
        return {
          primary: 'promotional',
          confidence: promotionalScore,
          reasoning: 'Contains promotional or marketing content',
        };
      }

      // Default to personal with medium confidence
      return {
        primary: 'personal',
        confidence: 0.5,
        reasoning:
          'Default categorization - no strong indicators for other categories',
      };
    } catch {
      // Categorization failed, using default
      return {
        primary: 'personal',
        confidence: 0.3,
        reasoning: 'Categorization failed - using default category',
      };
    }
  }

  async summarizeEmail(
    email: Email,
    _options?: AIProcessingOptions
  ): Promise<EmailSummary> {
    try {
      const content = email.body || email.subject;
      const wordCount = content.split(/\s+/).length;
      const estimatedReadTime = Math.max(Math.ceil(wordCount / 200) * 60, 30); // minimum 30 seconds

      // Extract key sentences (simple implementation)
      const sentences = content.split(/[.!?]+/).filter(s => s.length > 20);
      const keyPoints = sentences.slice(0, 3).map(s => s.trim());

      // Basic sentiment analysis
      const sentiment = this.analyzeSentimentBasic(content);

      // Urgency detection
      const urgency = this.detectUrgency(email);

      // Check for action items
      const actionRequired = this.detectActionRequired(content);

      // Generate summary
      let summary = '';
      if (content.length > 200) {
        // Take first sentence and key points
        summary =
          sentences[0]?.trim() +
          (keyPoints.length > 1
            ? ` Key topics: ${keyPoints.slice(1).join(', ')}`
            : '');
      } else {
        summary =
          content.substring(0, 150) + (content.length > 150 ? '...' : '');
      }

      return {
        summary: summary || 'No content to summarize',
        keyPoints,
        sentiment,
        urgency,
        actionRequired,
        estimatedReadTime,
      };
    } catch {
      // Summarization failed, return fallback
      return {
        summary: 'Summary generation failed',
        keyPoints: [],
        sentiment: 'neutral',
        urgency: 'low',
        actionRequired: false,
        estimatedReadTime: 60,
      };
    }
  }

  async extractEntities(
    email: Email,
    _options?: AIProcessingOptions
  ): Promise<EmailEntities> {
    try {
      const content = `${email.subject} ${email.body}`;

      return {
        web3Entities: this.extractWeb3Entities(content),
        dates: this.extractDates(content),
        amounts: this.extractAmounts(content),
        people: this.extractPeople(content, email.from),
        organizations: this.extractOrganizations(content),
        topics: this.extractTopics(content),
      };
    } catch {
      // Entity extraction failed, return empty
      return {
        web3Entities: [],
        dates: [],
        amounts: [],
        people: [],
        organizations: [],
        topics: [],
      };
    }
  }

  async detectSpam(
    email: Email
  ): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }> {
    const reasons: string[] = [];
    let spamScore = 0;

    // Check subject line
    const subject = email.subject.toLowerCase();
    const spamKeywords = [
      'urgent',
      'winner',
      'congratulations',
      'free',
      'limited time',
      'act now',
      '!!!',
    ];
    const subjectSpamCount = spamKeywords.filter(keyword =>
      subject.includes(keyword)
    ).length;
    if (subjectSpamCount > 0) {
      spamScore += subjectSpamCount * 0.2;
      reasons.push(`Spam keywords in subject: ${subjectSpamCount}`);
    }

    // Check for excessive punctuation
    const excessivePunctuation = (subject.match(/[!]{2,}/g) || []).length > 0;
    if (excessivePunctuation) {
      spamScore += 0.3;
      reasons.push('Excessive punctuation in subject');
    }

    // Web3-specific spam detection
    const hasMultipleAddresses =
      (email.body.match(this.WEB3_ADDRESS_REGEX) || []).length > 3;
    if (hasMultipleAddresses) {
      spamScore += 0.4;
      reasons.push('Multiple wallet addresses (possible scam)');
    }

    const confidence = Math.min(spamScore, 1);
    return {
      isSpam: confidence > 0.5,
      confidence,
      reasons,
    };
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    const sentiment = this.analyzeSentimentBasic(text);
    return {
      sentiment,
      score:
        sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? 0.3 : 0.5,
    };
  }

  async suggestLabels(
    email: Email
  ): Promise<{ label: string; confidence: number }[]> {
    const suggestions: { label: string; confidence: number }[] = [];
    const content = `${email.subject} ${email.body}`.toLowerCase();

    // Web3 labels
    if (
      content.includes('defi') ||
      content.includes('swap') ||
      content.includes('liquidity')
    ) {
      suggestions.push({ label: 'DeFi', confidence: 0.8 });
    }
    if (
      content.includes('nft') ||
      content.includes('opensea') ||
      content.includes('mint')
    ) {
      suggestions.push({ label: 'NFT', confidence: 0.8 });
    }
    if (
      content.includes('dao') ||
      content.includes('governance') ||
      content.includes('proposal')
    ) {
      suggestions.push({ label: 'DAO', confidence: 0.7 });
    }

    // Financial labels
    if (
      content.includes('invoice') ||
      content.includes('payment') ||
      content.includes('bill')
    ) {
      suggestions.push({ label: 'Invoice', confidence: 0.9 });
    }

    // Action labels
    if (this.detectActionRequired(content)) {
      suggestions.push({ label: 'Action Required', confidence: 0.8 });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // Private helper methods
  private detectWeb3Content(content: string): {
    score: number;
    categories: string[];
  } {
    let score = 0;
    const categories: string[] = [];

    // Check for wallet addresses
    if (this.WEB3_ADDRESS_REGEX.test(content)) {
      score += 0.3;
      categories.push('wallet');
    }

    // Check for ENS/SNS domains
    if (this.ENS_REGEX.test(content) || this.SNS_REGEX.test(content)) {
      score += 0.2;
      categories.push('domains');
    }

    // Check for transaction hashes
    if (this.TRANSACTION_HASH_REGEX.test(content)) {
      score += 0.3;
      categories.push('transactions');
    }

    // Check for Web3 keywords
    const web3Keywords = [
      'defi',
      'nft',
      'dao',
      'blockchain',
      'ethereum',
      'solana',
      'metamask',
      'opensea',
      'uniswap',
    ];
    const matchedKeywords = web3Keywords.filter(keyword =>
      content.includes(keyword)
    );
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 0.1;
      categories.push('protocol');
    }

    return { score: Math.min(score, 1), categories };
  }

  private detectFinancialContent(content: string): number {
    let score = 0;
    const financialKeywords = [
      'payment',
      'invoice',
      'transaction',
      'money',
      'USD',
      'ETH',
      'BTC',
      '$',
      '€',
      '£',
    ];
    const matchedKeywords = financialKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    score = matchedKeywords.length * 0.15;

    // Check for currency amounts
    const currencyRegex = /[$€£¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?/g;
    if (currencyRegex.test(content)) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  private calculatePriorityScore(email: Email): number {
    let score = 0;

    // Check subject for priority keywords
    const priorityKeywords = [
      'urgent',
      'asap',
      'important',
      'critical',
      'deadline',
      'emergency',
    ];
    const subject = email.subject.toLowerCase();
    const matchedKeywords = priorityKeywords.filter(keyword =>
      subject.includes(keyword)
    );
    score += matchedKeywords.length * 0.2;

    // Check for known important senders (simplified)
    if (
      email.from.includes('@ethereum.org') ||
      email.from.includes('security') ||
      email.from.includes('admin')
    ) {
      score += 0.3;
    }

    // Check for deadline mentions
    if (
      email.body.toLowerCase().includes('deadline') ||
      email.body.toLowerCase().includes('due date')
    ) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private detectSocialContent(content: string, from: string): number {
    let score = 0;
    const socialKeywords = [
      'hello',
      'hi',
      'thanks',
      'thank you',
      'how are you',
      'hope you',
      'personal',
      'family',
    ];
    const matchedKeywords = socialKeywords.filter(keyword =>
      content.includes(keyword)
    );
    score = matchedKeywords.length * 0.1;

    // Check if from personal email domains
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    if (personalDomains.some(domain => from.includes(domain))) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  private detectPromotionalContent(content: string): number {
    let score = 0;
    const promoKeywords = [
      'sale',
      'discount',
      'offer',
      'deal',
      'promotion',
      'limited time',
      'subscribe',
      'unsubscribe',
    ];
    const matchedKeywords = promoKeywords.filter(keyword =>
      content.includes(keyword)
    );
    score = matchedKeywords.length * 0.15;

    // Check for marketing phrases
    if (
      content.includes('click here') ||
      content.includes('call to action') ||
      content.includes('learn more')
    ) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private analyzeSentimentBasic(
    text: string
  ): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'thank',
      'pleased',
      'happy',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'problem',
      'issue',
      'error',
      'failed',
      'wrong',
      'disappointed',
    ];

    const positiveCount = positiveWords.filter(word =>
      text.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word =>
      text.toLowerCase().includes(word)
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectUrgency(email: Email): 'low' | 'medium' | 'high' | 'urgent' {
    const content = `${email.subject} ${email.body}`.toLowerCase();
    const urgentKeywords = [
      'urgent',
      'asap',
      'immediately',
      'emergency',
      'critical',
    ];
    const highKeywords = [
      'important',
      'priority',
      'deadline',
      'time sensitive',
    ];

    if (urgentKeywords.some(keyword => content.includes(keyword)))
      return 'urgent';
    if (highKeywords.some(keyword => content.includes(keyword))) return 'high';
    if (content.includes('soon') || content.includes('quickly'))
      return 'medium';
    return 'low';
  }

  private detectActionRequired(content: string): boolean {
    const actionKeywords = [
      'please',
      'action required',
      'respond',
      'reply',
      'confirm',
      'approve',
      'review',
      'sign',
      'complete',
    ];
    return actionKeywords.some(keyword =>
      content.toLowerCase().includes(keyword)
    );
  }

  private extractWeb3Entities(content: string): Web3Entity[] {
    const entities: Web3Entity[] = [];

    // Extract Ethereum addresses
    const ethAddresses = content.match(this.WEB3_ADDRESS_REGEX);
    if (ethAddresses) {
      ethAddresses.forEach(address => {
        entities.push({
          type: 'wallet_address',
          value: address,
          chainType: ChainType.EVM,
          confidence: 0.9,
        });
      });
    }

    // Extract ENS names
    const ensNames = content.match(this.ENS_REGEX);
    if (ensNames) {
      ensNames.forEach(name => {
        entities.push({
          type: 'ens_name',
          value: name,
          chainType: ChainType.EVM,
          confidence: 0.95,
        });
      });
    }

    // Extract transaction hashes
    const txHashes = content.match(this.TRANSACTION_HASH_REGEX);
    if (txHashes) {
      txHashes.forEach(hash => {
        entities.push({
          type: 'transaction_hash',
          value: hash,
          confidence: 0.9,
        });
      });
    }

    return entities;
  }

  private extractDates(content: string): Date[] {
    const dates: Date[] = [];
    const dateRegex =
      /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
    const dateMatches = content.match(dateRegex);

    if (dateMatches) {
      dateMatches.forEach(dateStr => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      });
    }

    return dates;
  }

  private extractAmounts(
    content: string
  ): { value: number; currency: string; context?: string }[] {
    const amounts: { value: number; currency: string; context?: string }[] = [];

    // USD amounts
    const usdRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    let match;
    while ((match = usdRegex.exec(content)) !== null) {
      if (match[1]) {
        amounts.push({
          value: parseFloat(match[1].replace(/,/g, '')),
          currency: 'USD',
        });
      }
    }

    // ETH amounts
    const ethRegex = /(\d+(?:\.\d+)?)\s*ETH/gi;
    while ((match = ethRegex.exec(content)) !== null) {
      if (match[1]) {
        amounts.push({
          value: parseFloat(match[1]),
          currency: 'ETH',
        });
      }
    }

    return amounts;
  }

  private extractPeople(
    _content: string,
    fromEmail: string
  ): { name: string; email?: string; role?: string }[] {
    const people: { name: string; email?: string; role?: string }[] = [];

    // Extract email from sender
    const fromName = (fromEmail.split('@')[0] || 'Unknown').replace(
      /[._]/g,
      ' '
    );
    people.push({
      name: fromName,
      email: fromEmail,
      role: 'sender',
    });

    return people;
  }

  private extractOrganizations(content: string): string[] {
    const organizations: string[] = [];
    const orgKeywords = [
      'company',
      'corporation',
      'inc',
      'llc',
      'foundation',
      'protocol',
      'exchange',
    ];

    // Simple organization detection based on capitalized words near keywords
    orgKeywords.forEach(keyword => {
      const regex = new RegExp(`([A-Z][a-zA-Z]+\\s+){0,2}${keyword}`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        organizations.push(...matches.map(match => match.trim()));
      }
    });

    return Array.from(new Set(organizations)); // Remove duplicates
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const web3Topics = [
      'DeFi',
      'NFT',
      'DAO',
      'Staking',
      'Trading',
      'Governance',
      'Yield Farming',
    ];
    const generalTopics = [
      'Meeting',
      'Project',
      'Update',
      'Invoice',
      'Proposal',
      'Agreement',
    ];

    [...web3Topics, ...generalTopics].forEach(topic => {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        topics.push(topic);
      }
    });

    return topics;
  }
}

const aiEmailService = new AIEmailServiceImpl();

export { aiEmailService, type AIEmailService };
