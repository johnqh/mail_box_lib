/**
 * AI Search Service
 * Semantic search and intelligent discovery features for emails
 */

import { SearchResult } from './ai-types';
import { Email } from '../../types/email';

interface AISearchService {
  semanticSearch(query: string, emails: Email[]): Promise<SearchResult[]>;
  suggestSearchQueries(userInput: string): Promise<string[]>;
  findSimilarEmails(email: Email, allEmails: Email[]): Promise<Email[]>;
  categorizeSearchQuery(query: string): Promise<SearchCategory>;
  buildSearchIndex(emails: Email[]): Promise<void>;
  getSearchInsights(searchHistory: SearchQuery[]): Promise<SearchInsights>;
}

interface SearchCategory {
  category:
    | 'sender'
    | 'subject'
    | 'content'
    | 'date'
    | 'web3'
    | 'financial'
    | 'mixed';
  confidence: number;
  extractedTerms: {
    type: 'person' | 'date' | 'amount' | 'address' | 'keyword';
    value: string;
    confidence: number;
  }[];
}

interface SearchQuery {
  query: string;
  timestamp: Date;
  resultsCount: number;
  selectedResult?: number;
}

interface SearchInsights {
  topSearchTerms: { term: string; frequency: number }[];
  searchPatterns: {
    timeOfDay: number[]; // hourly distribution
    commonCategories: { category: string; percentage: number }[];
  };
  suggestions: {
    savedSearches: string[];
    improvements: string[];
  };
}

interface EmailIndex {
  emailId: string;
  tokens: string[];
  entities: string[];
  categories: string[];
  weights: { [key: string]: number };
}

class AISearchServiceImpl implements AISearchService {
  private searchIndex: Map<string, EmailIndex> = new Map();
  private readonly STOP_WORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'will',
    'with',
    'you',
    'your',
    'have',
    'had',
    'this',
  ]);

  async semanticSearch(
    query: string,
    emails: Email[]
  ): Promise<SearchResult[]> {
    try {
      if (!query.trim()) return [];

      // Build index if not exists
      if (this.searchIndex.size === 0) {
        await this.buildSearchIndex(emails);
      }

      const searchTokens = this.tokenizeQuery(query);
      const results: SearchResult[] = [];

      for (const email of emails) {
        const relevance = this.calculateRelevance(email, searchTokens, query);
        if (relevance > 0.1) {
          // Minimum relevance threshold
          const highlights = this.generateHighlights(email, searchTokens);
          const summary = this.generateSearchSummary(email, query);

          results.push({
            email,
            relevance,
            matchedFields: this.getMatchedFields(email, searchTokens),
            summary,
            highlights,
          });
        }
      }

      // Sort by relevance and return top results
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, 50); // Limit to top 50 results
    } catch {
      // Search failed, return empty results
      return [];
    }
  }

  async suggestSearchQueries(userInput: string): Promise<string[]> {
    const suggestions: string[] = [];
    const input = userInput.toLowerCase().trim();

    // Web3-specific suggestions
    if (
      input.includes('eth') ||
      input.includes('bitcoin') ||
      input.includes('crypto')
    ) {
      suggestions.push(
        'transactions from last month',
        'DeFi protocol emails',
        'NFT marketplace notifications',
        'wallet security alerts'
      );
    }

    // Date-related suggestions
    if (
      input.includes('today') ||
      input.includes('yesterday') ||
      input.includes('week')
    ) {
      suggestions.push(
        'emails from today',
        "last week's important emails",
        'monthly newsletters',
        'deadline reminders this week'
      );
    }

    // Person-related suggestions
    if (input.includes('@') || input.includes('from')) {
      suggestions.push(
        'emails from specific person',
        'conversations with team members',
        'client communications',
        'support ticket responses'
      );
    }

    // Action-related suggestions
    if (
      input.includes('action') ||
      input.includes('todo') ||
      input.includes('urgent')
    ) {
      suggestions.push(
        'emails requiring action',
        'urgent messages',
        'pending approvals',
        'follow-up needed'
      );
    }

    // Financial suggestions
    if (
      input.includes('payment') ||
      input.includes('invoice') ||
      input.includes('money')
    ) {
      suggestions.push(
        'payment confirmations',
        'invoice notifications',
        'transaction receipts',
        'financial statements'
      );
    }

    // General smart suggestions based on common patterns
    if (suggestions.length === 0) {
      suggestions.push(
        'unread important emails',
        'emails with attachments',
        'starred conversations',
        'recent project updates'
      );
    }

    return suggestions.slice(0, 8); // Return top 8 suggestions
  }

  async findSimilarEmails(email: Email, allEmails: Email[]): Promise<Email[]> {
    const similarities: { email: Email; score: number }[] = [];
    const sourceTokens = this.tokenizeText(`${email.subject} ${email.body}`);

    for (const otherEmail of allEmails) {
      if (otherEmail.id === email.id) continue;

      const targetTokens = this.tokenizeText(
        `${otherEmail.subject} ${otherEmail.body}`
      );
      const similarity = this.calculateSimilarity(sourceTokens, targetTokens);

      if (similarity > 0.3) {
        // Minimum similarity threshold
        similarities.push({ email: otherEmail, score: similarity });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.email);
  }

  async categorizeSearchQuery(query: string): Promise<SearchCategory> {
    const extractedTerms: SearchCategory['extractedTerms'] = [];
    let category: SearchCategory['category'] = 'mixed';
    let confidence = 0.5;

    // Check for email addresses or sender patterns
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    const emailMatches = query.match(emailPattern);
    if (emailMatches) {
      extractedTerms.push(
        ...emailMatches.map(email => ({
          type: 'person' as const,
          value: email,
          confidence: 0.9,
        }))
      );
      category = 'sender';
      confidence = 0.8;
    }

    // Check for Web3 addresses
    const web3AddressPattern = /0x[a-fA-F0-9]{40}/g;
    const addressMatches = query.match(web3AddressPattern);
    if (addressMatches) {
      extractedTerms.push(
        ...addressMatches.map(addr => ({
          type: 'address' as const,
          value: addr,
          confidence: 0.95,
        }))
      );
      category = 'web3';
      confidence = 0.9;
    }

    // Check for date patterns
    const datePatterns = [
      /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g,
      /\b(today|yesterday|tomorrow)\b/gi,
      /\b(last|next)\s+(week|month|year)\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        extractedTerms.push(
          ...matches.map(date => ({
            type: 'date' as const,
            value: date,
            confidence: 0.8,
          }))
        );
        if (category === 'mixed') {
          category = 'date';
          confidence = 0.7;
        }
      }
    }

    // Check for financial amounts
    const amountPattern =
      /[$€£¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+\s*(ETH|BTC|USD|EUR)/gi;
    const amountMatches = query.match(amountPattern);
    if (amountMatches) {
      extractedTerms.push(
        ...amountMatches.map(amount => ({
          type: 'amount' as const,
          value: amount,
          confidence: 0.85,
        }))
      );
      category = 'financial';
      confidence = 0.8;
    }

    // Extract general keywords
    const keywords = this.tokenizeQuery(query);
    keywords.forEach(keyword => {
      if (keyword.length > 3 && !this.STOP_WORDS.has(keyword)) {
        extractedTerms.push({
          type: 'keyword',
          value: keyword,
          confidence: 0.6,
        });
      }
    });

    return {
      category,
      confidence,
      extractedTerms,
    };
  }

  async buildSearchIndex(emails: Email[]): Promise<void> {
    this.searchIndex.clear();

    for (const email of emails) {
      const tokens = this.tokenizeText(
        `${email.subject} ${email.body} ${email.from}`
      );
      const entities = this.extractSearchEntities(email);
      const categories = this.categorizeEmailForSearch(email);

      // Calculate weights for different fields
      const weights: { [key: string]: number } = {};
      this.tokenizeText(email.subject).forEach(token => {
        weights[token] = (weights[token] || 0) + 2; // Subject gets higher weight
      });
      this.tokenizeText(email.body).forEach(token => {
        weights[token] = (weights[token] || 0) + 1;
      });
      this.tokenizeText(email.from).forEach(token => {
        weights[token] = (weights[token] || 0) + 1.5; // Sender gets high weight
      });

      const index: EmailIndex = {
        emailId: email.id,
        tokens,
        entities,
        categories,
        weights,
      };

      this.searchIndex.set(email.id, index);
    }
  }

  async getSearchInsights(
    searchHistory: SearchQuery[]
  ): Promise<SearchInsights> {
    const termFrequency: { [key: string]: number } = {};
    const timeDistribution = new Array(24).fill(0);
    const categoryCount: { [key: string]: number } = {};

    for (const query of searchHistory) {
      // Count terms
      const terms = this.tokenizeQuery(query.query);
      terms.forEach(term => {
        termFrequency[term] = (termFrequency[term] || 0) + 1;
      });

      // Count time patterns
      const hour = query.timestamp.getHours();
      timeDistribution[hour]++;

      // Categorize queries
      const category = await this.categorizeSearchQuery(query.query);
      categoryCount[category.category] =
        (categoryCount[category.category] || 0) + 1;
    }

    // Generate top terms
    const topSearchTerms = Object.entries(termFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, frequency]) => ({ term, frequency }));

    // Generate category percentages
    const totalQueries = searchHistory.length;
    const commonCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        percentage: Math.round((count / totalQueries) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Generate suggestions
    const savedSearches = this.generateSavedSearchSuggestions(topSearchTerms);
    const improvements = this.generateSearchImprovements(searchHistory);

    return {
      topSearchTerms,
      searchPatterns: {
        timeOfDay: timeDistribution,
        commonCategories,
      },
      suggestions: {
        savedSearches,
        improvements,
      },
    };
  }

  // Private helper methods
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s@.-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.STOP_WORDS.has(token));
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s@.-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private calculateRelevance(
    email: Email,
    searchTokens: string[],
    originalQuery: string
  ): number {
    const index = this.searchIndex.get(email.id);
    if (!index) return 0;

    let relevanceScore = 0;
    let _matchCount = 0;

    for (const token of searchTokens) {
      if (index.tokens.includes(token)) {
        _matchCount++;
        relevanceScore += index.weights[token] || 1;
      }

      // Partial matches
      const partialMatches = index.tokens.filter(
        indexToken => indexToken.includes(token) || token.includes(indexToken)
      );
      if (partialMatches.length > 0) {
        relevanceScore += 0.5;
      }
    }

    // Bonus for exact phrase matches
    const fullText = `${email.subject} ${email.body}`.toLowerCase();
    if (fullText.includes(originalQuery.toLowerCase())) {
      relevanceScore *= 1.5;
    }

    // Bonus for recent emails
    const emailAge = Date.now() - email.date.getTime();
    const daysSince = emailAge / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, (30 - daysSince) / 30) * 0.2;
    relevanceScore += recencyBonus;

    // Normalize by total token count
    const maxPossibleScore = searchTokens.length * 2 + 1;
    return Math.min(relevanceScore / maxPossibleScore, 1);
  }

  private generateHighlights(
    email: Email,
    searchTokens: string[]
  ): SearchResult['highlights'] {
    const highlights: SearchResult['highlights'] = [];

    // Highlight in subject
    const subjectHighlight = this.createHighlight(email.subject, searchTokens);
    if (subjectHighlight) {
      highlights.push({ field: 'subject', snippet: subjectHighlight });
    }

    // Highlight in body (first relevant snippet)
    const bodyHighlight = this.createHighlight(email.body, searchTokens, 200);
    if (bodyHighlight) {
      highlights.push({ field: 'body', snippet: bodyHighlight });
    }

    // Highlight sender if relevant
    const senderHighlight = this.createHighlight(email.from, searchTokens);
    if (senderHighlight && senderHighlight !== email.from) {
      highlights.push({ field: 'from', snippet: senderHighlight });
    }

    return highlights;
  }

  private createHighlight(
    text: string,
    searchTokens: string[],
    maxLength: number = 100
  ): string {
    let highlightedText = text;
    let hasHighlight = false;

    for (const token of searchTokens) {
      const regex = new RegExp(`(${token})`, 'gi');
      if (regex.test(highlightedText)) {
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        hasHighlight = true;
      }
    }

    if (!hasHighlight) return '';

    // Truncate if necessary and ensure highlight is visible
    if (highlightedText.length > maxLength) {
      const markIndex = highlightedText.indexOf('<mark>');
      if (markIndex > -1) {
        const start = Math.max(0, markIndex - maxLength / 3);
        const end = start + maxLength;
        highlightedText =
          (start > 0 ? '...' : '') +
          highlightedText.substring(start, end) +
          (end < text.length ? '...' : '');
      } else {
        highlightedText = `${highlightedText.substring(0, maxLength)}...`;
      }
    }

    return highlightedText;
  }

  private getMatchedFields(email: Email, searchTokens: string[]): string[] {
    const matchedFields: string[] = [];

    if (
      searchTokens.some(token => email.subject.toLowerCase().includes(token))
    ) {
      matchedFields.push('subject');
    }
    if (searchTokens.some(token => email.body.toLowerCase().includes(token))) {
      matchedFields.push('body');
    }
    if (searchTokens.some(token => email.from.toLowerCase().includes(token))) {
      matchedFields.push('from');
    }

    return matchedFields;
  }

  private generateSearchSummary(email: Email, query: string): string {
    const relevantSentence = this.findMostRelevantSentence(email.body, query);
    if (relevantSentence) {
      return relevantSentence.length > 150
        ? `${relevantSentence.substring(0, 150)}...`
        : relevantSentence;
    }

    return email.body.length > 150
      ? `${email.body.substring(0, 150)}...`
      : email.body;
  }

  private findMostRelevantSentence(text: string, query: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.length > 10);
    const queryTokens = this.tokenizeQuery(query);

    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.tokenizeText(sentence);
      const matchCount = queryTokens.filter(token =>
        sentenceTokens.some(sToken => sToken.includes(token))
      ).length;

      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestSentence = sentence.trim();
      }
    }

    return bestSentence;
  }

  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  private extractSearchEntities(email: Email): string[] {
    const entities: string[] = [];
    const content = `${email.subject} ${email.body}`;

    // Extract Web3 addresses
    const addresses = content.match(/0x[a-fA-F0-9]{40}/g);
    if (addresses) entities.push(...addresses);

    // Extract ENS names
    const ensNames = content.match(/[\w-]+\.eth/g);
    if (ensNames) entities.push(...ensNames);

    // Extract email addresses
    const emailAddresses = content.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emailAddresses) entities.push(...emailAddresses);

    return entities;
  }

  private categorizeEmailForSearch(email: Email): string[] {
    const categories: string[] = [];
    const content = `${email.subject} ${email.body}`.toLowerCase();

    if (content.includes('transaction') || content.includes('payment')) {
      categories.push('financial');
    }
    if (content.includes('nft') || content.includes('defi')) {
      categories.push('web3');
    }
    if (email.important) {
      categories.push('important');
    }
    if (email.starred) {
      categories.push('starred');
    }

    return categories;
  }

  private generateSavedSearchSuggestions(
    topTerms: { term: string; frequency: number }[]
  ): string[] {
    const suggestions: string[] = [];

    // Create combinations of frequent terms
    if (topTerms.length >= 2 && topTerms[0] && topTerms[1]) {
      suggestions.push(`${topTerms[0].term} AND ${topTerms[1].term}`);
    }

    // Add common search patterns
    suggestions.push(
      'unread emails from this week',
      'important emails with attachments',
      'web3 transactions last month'
    );

    return suggestions.slice(0, 5);
  }

  private generateSearchImprovements(searchHistory: SearchQuery[]): string[] {
    const improvements: string[] = [];

    if (searchHistory.some(q => q.resultsCount === 0)) {
      improvements.push('Try using broader search terms or check spelling');
    }

    if (searchHistory.some(q => q.resultsCount > 100)) {
      improvements.push('Use more specific search terms to narrow results');
    }

    improvements.push(
      'Use quotes for exact phrase matches',
      'Try searching by sender, date range, or keywords',
      'Use filters to narrow down results by category'
    );

    return improvements;
  }
}

const aiSearchService = new AISearchServiceImpl();

export {
  aiSearchService,
  type AISearchService,
  type SearchCategory,
  type SearchQuery,
  type SearchInsights,
  type EmailIndex,
};
