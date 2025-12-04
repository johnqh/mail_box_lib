import type { PersistenceService } from '../../types/services/persistence.interface';

// Platform-specific globals
declare const crypto: { randomUUID(): string };

interface PointsAction {
  id: string;
  walletAddress: string;
  action:
    | 'send_email'
    | 'first_time_recipient'
    | 'delegate_privilege'
    | 'receive_delegation'
    | 'send_privileged_email'
    | 'referral'
    | 'claim_points';
  points: number;
  timestamp: Date;
  metadata?: {
    recipient?: string;
    emailId?: string;
    delegationId?: string;
    referralCode?: string;
    claimCode?: string;
    isFirstTimeRecipient?: boolean;
    points?: number; // For variable point amounts
  };
}

interface UserPoints {
  walletAddress: string;
  totalPoints: number;
  actions: PointsAction[];
  lastUpdated: Date;
}

interface ReferralLink {
  walletAddress: string;
  referralCode: string;
  url: string;
  clicks: number;
  conversions: number;
  pointsEarned: number;
  createdAt: Date;
}

interface ClaimablePoints {
  id: string;
  walletAddress: string;
  points: number;
  expirationDate: Date;
  claimedAt?: Date;
  claimCode: string;
}

/**
 * Configuration for PointsService
 */
interface PointsServiceConfig {
  /**
   * Persistence service for storing points data
   * Must be provided by the consuming application
   */
  storage: PersistenceService;
  /**
   * Base URL for generating referral links
   * e.g., 'https://app.example.com'
   */
  baseUrl: string;
}

class PointsService {
  private userPointsCache = new Map<string, UserPoints>();
  private storage: PersistenceService;
  private baseUrl: string;

  /**
   * Create a new PointsService instance
   * @param config Configuration with storage service and base URL
   */
  constructor(config: PointsServiceConfig) {
    this.storage = config.storage;
    this.baseUrl = config.baseUrl;
  }

  // Award points for different actions
  public async awardPoints(
    walletAddress: string,
    action: PointsAction['action'],
    metadata?: PointsAction['metadata']
  ): Promise<void> {
    const points = this.getPointsForAction(action, metadata);

    const pointsAction: PointsAction = {
      id: crypto.randomUUID(),
      walletAddress,
      action,
      points,
      timestamp: new Date(),
    };

    // Only add metadata if it exists
    if (metadata) {
      pointsAction.metadata = metadata;
    }

    // In a real implementation, this would be sent to the backend
    await this.recordPointsAction(pointsAction);

    // Update local cache
    this.updateUserPointsCache(walletAddress, pointsAction);
  }

  // Get points value for different actions
  private getPointsForAction(
    action: PointsAction['action'],
    metadata?: PointsAction['metadata']
  ): number {
    switch (action) {
      case 'send_email':
        return 5;
      case 'first_time_recipient':
        return 25;
      case 'delegate_privilege':
        return 100;
      case 'receive_delegation':
        return 50;
      case 'send_privileged_email':
        return 15;
      case 'referral':
        // Variable points based on referred user activity
        return metadata?.points || 10;
      case 'claim_points':
        // Points from claim emails
        return metadata?.points || 0;
      default:
        return 0;
    }
  }

  // Record points action (would be sent to backend in real implementation)
  private async recordPointsAction(action: PointsAction): Promise<void> {
    const storageKey = `points_${action.walletAddress}`;
    const result = await this.storage.retrieve<UserPoints>(storageKey);

    let userPoints: UserPoints;
    if (result.data) {
      userPoints = result.data;
      userPoints.actions.push(action);
      userPoints.totalPoints += action.points;
      userPoints.lastUpdated = new Date();
    } else {
      userPoints = {
        walletAddress: action.walletAddress,
        totalPoints: action.points,
        actions: [action],
        lastUpdated: new Date(),
      };
    }

    await this.storage.store(storageKey, userPoints);
  }

  // Update local cache
  private updateUserPointsCache(
    walletAddress: string,
    action: PointsAction
  ): void {
    const cached = this.userPointsCache.get(walletAddress);

    if (cached) {
      cached.actions.push(action);
      cached.totalPoints += action.points;
      cached.lastUpdated = new Date();
    } else {
      this.userPointsCache.set(walletAddress, {
        walletAddress,
        totalPoints: action.points,
        actions: [action],
        lastUpdated: new Date(),
      });
    }
  }

  // Get user's points
  public async getUserPoints(walletAddress: string): Promise<UserPoints> {
    // Check cache first
    const cached = this.userPointsCache.get(walletAddress);
    if (cached) {
      return cached;
    }

    // Load from storage (in real implementation, this would be an API call)
    const storageKey = `points_${walletAddress}`;
    const result = await this.storage.retrieve<UserPoints>(storageKey);

    if (result.data) {
      const userPoints = result.data;
      // Convert string dates back to Date objects
      userPoints.lastUpdated = new Date(userPoints.lastUpdated);
      userPoints.actions = userPoints.actions.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp),
      }));

      this.userPointsCache.set(walletAddress, userPoints);
      return userPoints;
    }

    // Return default if no data found
    const defaultPoints: UserPoints = {
      walletAddress,
      totalPoints: 0,
      actions: [],
      lastUpdated: new Date(),
    };

    this.userPointsCache.set(walletAddress, defaultPoints);
    return defaultPoints;
  }

  // Generate referral link
  public async generateReferralLink(
    walletAddress: string
  ): Promise<ReferralLink> {
    const referralCode = `${walletAddress.slice(0, 8)}_${Date.now()}`;
    const url = `${this.baseUrl}?ref=${referralCode}`;

    const referralLink: ReferralLink = {
      walletAddress,
      referralCode,
      url,
      clicks: 0,
      conversions: 0,
      pointsEarned: 0,
      createdAt: new Date(),
    };

    // Store referral link (in real implementation, this would be sent to backend)
    const storageKey = `referrals_${walletAddress}`;
    const result = await this.storage.retrieve<ReferralLink[]>(storageKey);
    const referrals = result.data || [];
    referrals.push(referralLink);
    await this.storage.store(storageKey, referrals);

    return referralLink;
  }

  // Track referral click
  public async trackReferralClick(_referralCode: string): Promise<void> {
    // In real implementation, this would be sent to backend
  }

  // Process referral conversion (when referred user connects wallet)
  public async processReferralConversion(
    _referralCode: string,
    _newUserWallet: string
  ): Promise<void> {
    // Extract referrer wallet from referral code
    const referrerWallet = _referralCode.split('_')[0];
    if (!referrerWallet) {
      throw new Error('Invalid referral code format');
    }

    // Award points to referrer
    await this.awardPoints(referrerWallet, 'referral', {
      referralCode: _referralCode,
      points: 50, // Bonus points for successful referral
    });
  }

  // Generate claimable points (admin function - would be done by backend)
  public async generateClaimablePoints(
    walletAddress: string,
    points: number,
    expirationHours: number = 72
  ): Promise<ClaimablePoints> {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expirationHours);

    const claimablePoints: ClaimablePoints = {
      id: crypto.randomUUID(),
      walletAddress,
      points,
      expirationDate,
      claimCode: `CLAIM_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };

    // Store claimable points
    const storageKey = `claimable_${walletAddress}`;
    const result = await this.storage.retrieve<ClaimablePoints[]>(storageKey);
    const claimables = result.data || [];
    claimables.push(claimablePoints);
    await this.storage.store(storageKey, claimables);

    return claimablePoints;
  }

  // Claim points using claim code
  public async claimPoints(
    walletAddress: string,
    claimCode: string
  ): Promise<boolean> {
    const storageKey = `claimable_${walletAddress}`;
    const result = await this.storage.retrieve<ClaimablePoints[]>(storageKey);

    if (!result.data) return false;

    const claimables: ClaimablePoints[] = result.data;
    const claimableIndex = claimables.findIndex(
      c =>
        c.claimCode === claimCode &&
        !c.claimedAt &&
        new Date() < new Date(c.expirationDate)
    );

    if (claimableIndex === -1) return false;

    const claimable = claimables[claimableIndex];
    if (!claimable) return false;

    claimable.claimedAt = new Date();

    // Award the points
    await this.awardPoints(walletAddress, 'claim_points', {
      claimCode,
      points: claimable.points,
    });

    // Update storage
    claimables.splice(claimableIndex, 1, claimable);
    await this.storage.store(storageKey, claimables);

    return true;
  }

  // Get user's claimable points
  public async getClaimablePoints(
    walletAddress: string
  ): Promise<ClaimablePoints[]> {
    const storageKey = `claimable_${walletAddress}`;
    const result = await this.storage.retrieve<ClaimablePoints[]>(storageKey);

    if (!result.data) return [];

    const claimables: ClaimablePoints[] = result.data;
    return claimables.filter(
      c => !c.claimedAt && new Date() < new Date(c.expirationDate)
    );
  }

  // Get leaderboard (top point holders)
  public async getLeaderboard(
    limit: number = 10
  ): Promise<Array<{ walletAddress: string; totalPoints: number }>> {
    const leaderboard: Array<{ walletAddress: string; totalPoints: number }> =
      [];

    // In a real implementation, this would come from the backend
    // For now, we'll scan storage for all user points
    const allKeys = await this.storage.keys();
    for (const key of allKeys) {
      if (key.startsWith('points_')) {
        const result = await this.storage.retrieve<UserPoints>(key);
        if (result.data) {
          leaderboard.push({
            walletAddress: result.data.walletAddress,
            totalPoints: result.data.totalPoints,
          });
        }
      }
    }

    return leaderboard
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }
}

/**
 * Create a PointsService instance
 * @param config Configuration with storage service and base URL
 * @returns A configured PointsService instance
 *
 * @example
 * ```typescript
 * import { createPointsService } from '@sudobility/lib';
 *
 * const pointsService = createPointsService({
 *   storage: myStorageService, // Platform-specific storage
 *   baseUrl: 'https://app.example.com',
 * });
 * ```
 */
function createPointsService(config: PointsServiceConfig): PointsService {
  return new PointsService(config);
}

export {
  createPointsService,
  PointsService,
  type PointsServiceConfig,
  type PointsAction,
  type UserPoints,
  type ReferralLink,
  type ClaimablePoints,
};
