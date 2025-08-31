// Platform-specific globals
declare const crypto: { randomUUID(): string };
declare const localStorage: Storage;

export interface PointsAction {
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

export interface UserPoints {
  walletAddress: string;
  totalPoints: number;
  actions: PointsAction[];
  lastUpdated: Date;
}

export interface ReferralLink {
  walletAddress: string;
  referralCode: string;
  url: string;
  clicks: number;
  conversions: number;
  pointsEarned: number;
  createdAt: Date;
}

export interface ClaimablePoints {
  id: string;
  walletAddress: string;
  points: number;
  expirationDate: Date;
  claimedAt?: Date;
  claimCode: string;
}

export class PointsService {
  private static instance: PointsService;
  private userPointsCache = new Map<string, UserPoints>();

  public static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService();
    }
    return PointsService.instance;
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
      metadata,
    };

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
    // For now, store in localStorage for demo purposes
    const storageKey = `points_${action.walletAddress}`;
    const existingData = localStorage.getItem(storageKey);

    let userPoints: UserPoints;
    if (existingData) {
      userPoints = JSON.parse(existingData);
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

    localStorage.setItem(storageKey, JSON.stringify(userPoints));
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

    // Load from localStorage (in real implementation, this would be an API call)
    const storageKey = `points_${walletAddress}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const userPoints = JSON.parse(stored);
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
  public generateReferralLink(walletAddress: string): ReferralLink {
    const referralCode = `${walletAddress.slice(0, 8)}_${Date.now()}`;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}?ref=${referralCode}`;

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
    const existing = localStorage.getItem(storageKey);
    const referrals = existing ? JSON.parse(existing) : [];
    referrals.push(referralLink);
    localStorage.setItem(storageKey, JSON.stringify(referrals));

    return referralLink;
  }

  // Track referral click
  public async trackReferralClick(referralCode: string): Promise<void> {
    // In real implementation, this would be sent to backend
  }

  // Process referral conversion (when referred user connects wallet)
  public async processReferralConversion(
    referralCode: string,
    newUserWallet: string
  ): Promise<void> {
    // Extract referrer wallet from referral code
    const referrerWallet = referralCode.split('_')[0];

    // Award points to referrer
    await this.awardPoints(referrerWallet, 'referral', {
      referralCode,
      points: 50, // Bonus points for successful referral
    });
  }

  // Generate claimable points (admin function - would be done by backend)
  public generateClaimablePoints(
    walletAddress: string,
    points: number,
    expirationHours: number = 72
  ): ClaimablePoints {
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
    const existing = localStorage.getItem(storageKey);
    const claimables = existing ? JSON.parse(existing) : [];
    claimables.push(claimablePoints);
    localStorage.setItem(storageKey, JSON.stringify(claimables));

    return claimablePoints;
  }

  // Claim points using claim code
  public async claimPoints(
    walletAddress: string,
    claimCode: string
  ): Promise<boolean> {
    const storageKey = `claimable_${walletAddress}`;
    const existing = localStorage.getItem(storageKey);

    if (!existing) return false;

    const claimables: ClaimablePoints[] = JSON.parse(existing);
    const claimableIndex = claimables.findIndex(
      c =>
        c.claimCode === claimCode &&
        !c.claimedAt &&
        new Date() < new Date(c.expirationDate)
    );

    if (claimableIndex === -1) return false;

    const claimable = claimables[claimableIndex];
    claimable.claimedAt = new Date();

    // Award the points
    await this.awardPoints(walletAddress, 'claim_points', {
      claimCode,
      points: claimable.points,
    });

    // Update storage
    claimables[claimableIndex] = claimable;
    localStorage.setItem(storageKey, JSON.stringify(claimables));

    return true;
  }

  // Get user's claimable points
  public getClaimablePoints(walletAddress: string): ClaimablePoints[] {
    const storageKey = `claimable_${walletAddress}`;
    const existing = localStorage.getItem(storageKey);

    if (!existing) return [];

    const claimables: ClaimablePoints[] = JSON.parse(existing);
    return claimables.filter(
      c => !c.claimedAt && new Date() < new Date(c.expirationDate)
    );
  }

  // Get leaderboard (top point holders)
  public getLeaderboard(
    limit: number = 10
  ): Array<{ walletAddress: string; totalPoints: number }> {
    const leaderboard: Array<{ walletAddress: string; totalPoints: number }> =
      [];

    // In a real implementation, this would come from the backend
    // For now, we'll scan localStorage for all user points
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('points_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const userPoints: UserPoints = JSON.parse(data);
          leaderboard.push({
            walletAddress: userPoints.walletAddress,
            totalPoints: userPoints.totalPoints,
          });
        }
      }
    }

    return leaderboard
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }
}

// Create singleton instance
export const pointsService = PointsService.getInstance();
