/**
 * React hook for wallet status management
 * Provides reactive access to the global wallet status singleton
 */

import { useCallback, useEffect, useState } from 'react';
import {
  isWalletConnected as checkWalletConnected,
  isWalletVerified as checkWalletVerified,
  WalletConnectionState,
  WalletStatus,
} from '@johnqh/types';
import {
  connectWallet as connectWalletAction,
  disconnectWallet as disconnectWalletAction,
  getWalletAddress,
  getWalletStatus,
  verifyWallet as verifyWalletAction,
  WalletStatusChangeListener,
  walletStatusManager,
} from '../../core/wallet/wallet-status-manager';

/**
 * Hook return type for wallet status management
 */
export interface UseWalletStatusReturn {
  /** Current wallet status (undefined if not connected) */
  status: WalletStatus | undefined;
  /** Current wallet address (undefined if not connected) */
  walletAddress?: string;
  /** Current connection state */
  connectionState: WalletConnectionState;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether wallet is verified */
  isVerified: boolean;
  /** Connect wallet with address */
  connectWallet: (walletAddress: string) => void;
  /** Verify wallet with message and signature */
  verifyWallet: (
    walletAddress: string,
    message: string,
    signature: string
  ) => void;
  /** Disconnect wallet */
  disconnectWallet: () => void;
  /** Update wallet address while preserving verification status */
  updateWalletAddress: (walletAddress: string) => void;
  /** Clear verification data while keeping wallet connected */
  clearVerification: () => void;
}

/**
 * React hook for wallet status management
 *
 * This hook provides reactive access to the global wallet status singleton.
 * It automatically subscribes to status changes and updates the component
 * when the wallet state changes.
 *
 * @returns UseWalletStatusReturn object with current status and actions
 *
 * @example
 * ```typescript
 * function WalletComponent() {
 *   const {
 *     status,
 *     isConnected,
 *     isVerified,
 *     connectWallet,
 *     verifyWallet,
 *     disconnectWallet
 *   } = useWalletStatus();
 *
 *   const handleConnect = () => {
 *     connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');
 *   };
 *
 *   const handleVerify = () => {
 *     verifyWallet(
 *       '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
 *       'Authenticate with 0xMail',
 *       'signature_here'
 *     );
 *   };
 *
 *   if (!isConnected) {
 *     return <button onClick={handleConnect}>Connect Wallet</button>;
 *   }
 *
 *   if (!isVerified) {
 *     return <button onClick={handleVerify}>Verify Wallet</button>;
 *   }
 *
 *   return <div>Wallet verified: {status?.walletAddress}</div>;
 * }
 * ```
 */
export const useWalletStatus = (): UseWalletStatusReturn => {
  // Initialize state with current status
  const [status, setStatus] = useState<WalletStatus | undefined>(() =>
    getWalletStatus()
  );

  // Subscribe to status changes
  useEffect(() => {
    const listener: WalletStatusChangeListener = newStatus => {
      setStatus(newStatus);
    };

    const unsubscribe = walletStatusManager.subscribe(listener);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Memoized action functions
  const connectWallet = useCallback((walletAddress: string) => {
    connectWalletAction(walletAddress);
  }, []);

  const verifyWallet = useCallback(
    (walletAddress: string, message: string, signature: string) => {
      verifyWalletAction(walletAddress, message, signature);
    },
    []
  );

  const disconnectWallet = useCallback(() => {
    disconnectWalletAction();
  }, []);

  const updateWalletAddress = useCallback((walletAddress: string) => {
    walletStatusManager.updateWalletAddress(walletAddress);
  }, []);

  const clearVerification = useCallback(() => {
    walletStatusManager.clearVerification();
  }, []);

  // Derived values
  const connectionState = walletStatusManager.getConnectionState();
  const isConnected = checkWalletConnected(status);
  const isVerified = checkWalletVerified(status);

  const result: UseWalletStatusReturn = {
    status,
    connectionState,
    isConnected,
    isVerified,
    connectWallet,
    verifyWallet,
    disconnectWallet,
    updateWalletAddress,
    clearVerification,
  };

  // Add walletAddress only if it exists
  if (status?.walletAddress) {
    result.walletAddress = status.walletAddress;
  }

  return result;
};

/**
 * Hook for just the wallet address (lightweight alternative)
 *
 * @returns Current wallet address or undefined
 */
export const useWalletAddress = (): string | undefined => {
  const [address, setAddress] = useState<string | undefined>(() =>
    getWalletAddress()
  );

  useEffect(() => {
    const listener: WalletStatusChangeListener = status => {
      setAddress(status?.walletAddress);
    };

    const unsubscribe = walletStatusManager.subscribe(listener);
    return unsubscribe;
  }, []);

  return address;
};

/**
 * Hook for just the connection state (lightweight alternative)
 *
 * @returns Current wallet connection state
 */
export const useWalletConnectionState = (): WalletConnectionState => {
  const [connectionState, setConnectionState] = useState<WalletConnectionState>(
    () => walletStatusManager.getConnectionState()
  );

  useEffect(() => {
    const listener: WalletStatusChangeListener = () => {
      setConnectionState(walletStatusManager.getConnectionState());
    };

    const unsubscribe = walletStatusManager.subscribe(listener);
    return unsubscribe;
  }, []);

  return connectionState;
};
