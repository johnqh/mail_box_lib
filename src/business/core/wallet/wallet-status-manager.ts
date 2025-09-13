/**
 * Singleton Wallet Status Manager
 * Manages global wallet connection and verification state across the application
 */

import {
  getWalletConnectionState,
  WalletConnectionState,
  WalletStatus,
} from '../../../types/wallet-status';

/**
 * Callback function type for wallet status change notifications
 */
export type WalletStatusChangeListener = (
  status: WalletStatus | undefined
) => void;

/**
 * WalletStatusManager - Singleton class for managing wallet status
 *
 * This class maintains a single source of truth for wallet connection state:
 * - undefined: No wallet connected
 * - WalletStatus with walletAddress only: Wallet connected but not verified
 * - WalletStatus with walletAddress, message, signature: Wallet verified
 */
class WalletStatusManager {
  private static instance: WalletStatusManager;
  private _status: WalletStatus | undefined = undefined;
  private listeners: Set<WalletStatusChangeListener> = new Set();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): WalletStatusManager {
    if (!WalletStatusManager.instance) {
      WalletStatusManager.instance = new WalletStatusManager();
    }
    return WalletStatusManager.instance;
  }

  /**
   * Get current wallet status
   */
  public getStatus(): WalletStatus | undefined {
    return this._status;
  }

  /**
   * Get current wallet connection state
   */
  public getConnectionState(): WalletConnectionState {
    return getWalletConnectionState(this._status);
  }

  /**
   * Connect wallet with address only (not verified yet)
   */
  public connectWallet(walletAddress: string): void {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }

    this._status = {
      walletAddress: walletAddress.trim(),
    };

    this.notifyListeners();
  }

  /**
   * Verify wallet with message and signature
   */
  public verifyWallet(
    walletAddress: string,
    message: string,
    signature: string
  ): void {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }
    if (!message || message.trim() === '') {
      throw new Error('Message is required for verification');
    }
    if (!signature || signature.trim() === '') {
      throw new Error('Signature is required for verification');
    }

    this._status = {
      walletAddress: walletAddress.trim(),
      message: message.trim(),
      signature: signature.trim(),
    };

    this.notifyListeners();
  }

  /**
   * Disconnect wallet (set status to undefined)
   */
  public disconnectWallet(): void {
    this._status = undefined;
    this.notifyListeners();
  }

  /**
   * Update wallet address while preserving verification status
   */
  public updateWalletAddress(walletAddress: string): void {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }

    if (this._status) {
      this._status = {
        ...this._status,
        walletAddress: walletAddress.trim(),
      };
      this.notifyListeners();
    } else {
      // If no current status, treat as new connection
      this.connectWallet(walletAddress);
    }
  }

  /**
   * Clear verification data while keeping wallet connected
   */
  public clearVerification(): void {
    if (this._status) {
      this._status = {
        walletAddress: this._status.walletAddress,
      };
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to wallet status changes
   */
  public subscribe(listener: WalletStatusChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from wallet status changes
   */
  public unsubscribe(listener: WalletStatusChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Get number of active listeners (for debugging)
   */
  public getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all listeners (useful for testing)
   */
  public clearAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Reset the manager (useful for testing)
   */
  public reset(): void {
    this._status = undefined;
    this.listeners.clear();
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    const status = this._status;
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in wallet status listener:', error);
      }
    });
  }
}

/**
 * Export singleton instance
 */
export const walletStatusManager = WalletStatusManager.getInstance();

/**
 * Convenience functions for common operations
 */

/**
 * Get current wallet status
 */
export const getWalletStatus = (): WalletStatus | undefined => {
  return walletStatusManager.getStatus();
};

/**
 * Get current wallet address (if connected)
 */
export const getWalletAddress = (): string | undefined => {
  return walletStatusManager.getStatus()?.walletAddress;
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = (): boolean => {
  return (
    walletStatusManager.getConnectionState() !==
    WalletConnectionState.DISCONNECTED
  );
};

/**
 * Check if wallet is verified
 */
export const isWalletVerified = (): boolean => {
  return (
    walletStatusManager.getConnectionState() === WalletConnectionState.VERIFIED
  );
};

/**
 * Connect wallet
 */
export const connectWallet = (walletAddress: string): void => {
  walletStatusManager.connectWallet(walletAddress);
};

/**
 * Verify wallet
 */
export const verifyWallet = (
  walletAddress: string,
  message: string,
  signature: string
): void => {
  walletStatusManager.verifyWallet(walletAddress, message, signature);
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = (): void => {
  walletStatusManager.disconnectWallet();
};

/**
 * Subscribe to wallet status changes
 */
export const subscribeToWalletStatus = (
  listener: WalletStatusChangeListener
): (() => void) => {
  return walletStatusManager.subscribe(listener);
};

export { WalletStatusManager };
