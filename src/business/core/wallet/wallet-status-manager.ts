/**
 * Wallet Status Management with Global State
 * Simplified version using createGlobalState - no singleton needed
 */

import {
  ConnectionState,
  getWalletConnectionState as getConnectionStateFromStatus,
  Optional,
  WalletStatus,
} from '@johnqh/types';
import { createGlobalState, getGlobalState, setGlobalState } from '../../../utils/useGlobalState';

/**
 * Callback function type for wallet status change notifications
 * (Kept for backward compatibility but no longer used with global state)
 */
export type WalletStatusChangeListener = (
  status: Optional<WalletStatus>
) => void;

/**
 * Global wallet status state - shared across all components
 */
export const useGlobalWalletStatus = createGlobalState<Optional<WalletStatus>>(
  'walletStatus',
  undefined
);

/**
 * Get current wallet status from global state
 */
export const getWalletStatus = (): Optional<WalletStatus> => {
  return getGlobalState<Optional<WalletStatus>>('walletStatus');
};

/**
 * Get current wallet address (if connected)
 */
export const getWalletAddress = (): Optional<string> => {
  return getWalletStatus()?.walletAddress;
};

/**
 * Get current wallet connection state
 */
export const getWalletConnectionState = (): ConnectionState => {
  return getConnectionStateFromStatus(getWalletStatus());
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = (): boolean => {
  return getWalletConnectionState() !== ConnectionState.DISCONNECTED;
};

/**
 * Check if wallet is verified
 */
export const isWalletVerified = (): boolean => {
  return getWalletConnectionState() === ConnectionState.VERIFIED;
};

/**
 * Connect wallet with address only (not verified yet)
 */
export const connectWallet = (walletAddress: string): void => {
  // Use walletStatusManager to ensure listeners are notified
  walletStatusManager.connectWallet(walletAddress);
};

/**
 * Verify wallet with message and signature
 */
export const verifyWallet = (
  walletAddress: string,
  message: string,
  signature: string
): void => {
  // Use walletStatusManager to ensure listeners are notified
  walletStatusManager.verifyWallet(walletAddress, message, signature);
};

/**
 * Disconnect wallet (set status to undefined)
 */
export const disconnectWallet = (): void => {
  // Use walletStatusManager to ensure listeners are notified
  walletStatusManager.disconnectWallet();
};

/**
 * Update wallet address while preserving verification status
 */
export const updateWalletAddress = (walletAddress: string): void => {
  // Use walletStatusManager to ensure listeners are notified
  walletStatusManager.updateWalletAddress(walletAddress);
};

/**
 * Clear verification data while keeping wallet connected
 */
export const clearVerification = (): void => {
  // Use walletStatusManager to ensure listeners are notified
  walletStatusManager.clearVerification();
};

/**
 * Subscribe to wallet status changes
 * @deprecated With createGlobalState, components automatically re-render when state changes
 * This is kept for backward compatibility - uses walletStatusManager internally
 */
export const subscribeToWalletStatus = (
  listener: WalletStatusChangeListener
): (() => void) => {
  return walletStatusManager.subscribe(listener);
};

/**
 * Deprecated: WalletStatusManager singleton
 * Kept for backward compatibility but functionality moved to global state
 */
export class WalletStatusManager {
  private static instance: WalletStatusManager;
  private listeners: Set<WalletStatusChangeListener> = new Set();

  private constructor() {}

  public static getInstance(): WalletStatusManager {
    if (!WalletStatusManager.instance) {
      WalletStatusManager.instance = new WalletStatusManager();
    }
    return WalletStatusManager.instance;
  }

  public getStatus = getWalletStatus;
  public getConnectionState = getWalletConnectionState;

  public connectWallet = (walletAddress: string) => {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }

    const newStatus: WalletStatus = {
      walletAddress: walletAddress.trim(),
    };

    setGlobalState('walletStatus', newStatus);
    this.notifyListeners();
  };

  public verifyWallet = (walletAddress: string, message: string, signature: string) => {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }
    if (!message || message.trim() === '') {
      throw new Error('Message is required for verification');
    }
    if (!signature || signature.trim() === '') {
      throw new Error('Signature is required for verification');
    }

    const newStatus: WalletStatus = {
      walletAddress: walletAddress.trim(),
      message: message.trim(),
      signature: signature.trim(),
    };

    setGlobalState('walletStatus', newStatus);
    this.notifyListeners();
  };

  public disconnectWallet = () => {
    setGlobalState('walletStatus', undefined);
    this.notifyListeners();
  };

  public updateWalletAddress = (walletAddress: string) => {
    if (!walletAddress || walletAddress.trim() === '') {
      throw new Error('Wallet address is required');
    }

    const currentStatus = getWalletStatus();
    if (currentStatus) {
      const newStatus: WalletStatus = {
        ...currentStatus,
        walletAddress: walletAddress.trim(),
      };
      setGlobalState('walletStatus', newStatus);
      this.notifyListeners();
    } else {
      // If no current status, treat as new connection
      this.connectWallet(walletAddress);
    }
  };

  public clearVerification = () => {
    const currentStatus = getWalletStatus();
    if (currentStatus) {
      const newStatus: WalletStatus = {
        walletAddress: currentStatus.walletAddress,
      };
      setGlobalState('walletStatus', newStatus);
      this.notifyListeners();
    }
  };

  public subscribe = (listener: WalletStatusChangeListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public unsubscribe = (listener: WalletStatusChangeListener) => {
    this.listeners.delete(listener);
  };

  public getListenerCount = () => this.listeners.size;

  public clearAllListeners = () => {
    this.listeners.clear();
  };

  public reset = () => {
    setGlobalState('walletStatus', undefined);
    this.listeners.clear();
  };

  private notifyListeners(): void {
    const status = getWalletStatus();
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
 * Export singleton instance for backward compatibility
 * @deprecated Use direct functions instead
 */
export const walletStatusManager = WalletStatusManager.getInstance();
