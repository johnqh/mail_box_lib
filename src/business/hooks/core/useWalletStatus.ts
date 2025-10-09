/**
 * React hook for wallet status management
 * Provides reactive access to the global wallet status
 * Now uses createGlobalState for React Native compatibility
 */

import { useCallback, useMemo } from 'react';
import {
  ChainType,
  isWalletConnected as checkWalletConnected,
  isWalletVerified as checkWalletVerified,
  ConnectionState,
  getWalletConnectionState as getConnectionStateFromStatus,
  Optional,
  WalletStatus,
} from '@johnqh/types';
import { IndexerUserAuth } from '@johnqh/indexer_client';
import {
  createGlobalState,
  getGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';

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
export const connectWallet = (
  walletAddress: string,
  chainType: ChainType
): void => {
  if (!walletAddress || walletAddress.trim() === '') {
    throw new Error('Wallet address is required');
  }

  const newStatus: WalletStatus = {
    walletAddress: walletAddress.trim(),
    chainType,
  };

  setGlobalState('walletStatus', newStatus);
};

/**
 * Verify wallet with message and signature
 */
export const verifyWallet = (
  walletAddress: string,
  chainType: ChainType,
  message: string,
  signature: string
): void => {
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
    chainType,
    message: message.trim(),
    signature: signature.trim(),
  };

  setGlobalState('walletStatus', newStatus);
};

/**
 * Disconnect wallet (set status to undefined)
 */
export const disconnectWallet = (): void => {
  setGlobalState('walletStatus', undefined);
};

/**
 * Update wallet address while preserving verification status
 */
export const updateWalletAddress = (
  walletAddress: string,
  chainType: ChainType
): void => {
  if (!walletAddress || walletAddress.trim() === '') {
    throw new Error('Wallet address is required');
  }

  const currentStatus = getWalletStatus();
  if (currentStatus) {
    const newStatus: WalletStatus = {
      ...currentStatus,
      walletAddress: walletAddress.trim(),
      chainType,
    };
    setGlobalState('walletStatus', newStatus);
  } else {
    // If no current status, treat as new connection
    connectWallet(walletAddress, chainType);
  }
};

/**
 * Clear verification data while keeping wallet connected
 */
export const clearVerification = (): void => {
  const currentStatus = getWalletStatus();
  if (currentStatus) {
    const newStatus: WalletStatus = {
      walletAddress: currentStatus.walletAddress,
      chainType: currentStatus.chainType,
    };
    setGlobalState('walletStatus', newStatus);
  }
};

/**
 * Hook return type for wallet status management
 */
export interface UseWalletStatusReturn {
  /** Current wallet status (undefined if not connected) */
  status: Optional<WalletStatus>;
  /** Current wallet address (undefined if not connected) */
  walletAddress: Optional<string>;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether wallet is verified */
  isVerified: boolean;
  /** Indexer authentication object (undefined if not verified) */
  indexerAuth: Optional<IndexerUserAuth>;
  /** Connect wallet with address */
  connectWallet: (walletAddress: string, chainType: ChainType) => void;
  /** Verify wallet with message and signature */
  verifyWallet: (
    walletAddress: string,
    chainType: ChainType,
    message: string,
    signature: string
  ) => void;
  /** Disconnect wallet */
  disconnectWallet: () => void;
  /** Update wallet address while preserving verification status */
  updateWalletAddress: (walletAddress: string, chainType: ChainType) => void;
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
 *     connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398', ChainType.EVM);
 *   };
 *
 *   const handleVerify = () => {
 *     verifyWallet(
 *       '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
 *       ChainType.EVM,
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
  // Use shared global state
  const [status] = useGlobalWalletStatus();

  // Memoized action functions
  const connectWalletCallback = useCallback(
    (walletAddress: string, chainType: ChainType) => {
      connectWallet(walletAddress, chainType);
    },
    []
  );

  const verifyWalletCallback = useCallback(
    (
      walletAddress: string,
      chainType: ChainType,
      message: string,
      signature: string
    ) => {
      verifyWallet(walletAddress, chainType, message, signature);
    },
    []
  );

  const disconnectWalletCallback = useCallback(() => {
    disconnectWallet();
  }, []);

  const updateWalletAddressCallback = useCallback(
    (walletAddress: string, chainType: ChainType) => {
      updateWalletAddress(walletAddress, chainType);
    },
    []
  );

  const clearVerificationCallback = useCallback(() => {
    clearVerification();
  }, []);

  // Derived values
  const connectionState = getWalletConnectionState();
  const isConnected = checkWalletConnected(status);
  const isVerified = checkWalletVerified(status);

  // Create indexerAuth object when wallet is verified
  const indexerAuth = useMemo<Optional<IndexerUserAuth>>(() => {
    if (!status?.message || !status?.signature || !status?.chainType) {
      return undefined;
    }

    let signature: string;

    // Only base64 encode for EVM chains
    // For Solana, use the signature as-is
    if (status.chainType === ChainType.EVM) {
      // Convert signature string to byte array, then to base64
      // The signature is hex string, need to convert to bytes then base64
      const signatureBytes = new Uint8Array(
        status.signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      // Cross-platform base64 encoding
      if (typeof Buffer !== 'undefined') {
        // Node.js/React Native environment
        signature = Buffer.from(signatureBytes).toString('base64');
      } else {
        // Browser environment
        // eslint-disable-next-line no-undef
        signature = btoa(String.fromCharCode(...Array.from(signatureBytes)));
      }
    } else {
      // Solana - use signature as-is
      signature = status.signature;
    }

    return {
      message: status.message,
      signature,
    };
  }, [status?.message, status?.signature, status?.chainType]);

  const result: UseWalletStatusReturn = {
    status,
    walletAddress: status?.walletAddress,
    connectionState,
    isConnected,
    isVerified,
    indexerAuth,
    connectWallet: connectWalletCallback,
    verifyWallet: verifyWalletCallback,
    disconnectWallet: disconnectWalletCallback,
    updateWalletAddress: updateWalletAddressCallback,
    clearVerification: clearVerificationCallback,
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
export const useWalletAddress = (): Optional<string> => {
  const [status] = useGlobalWalletStatus();
  return status?.walletAddress;
};

/**
 * Hook for just the connection state (lightweight alternative)
 *
 * @returns Current wallet connection state
 */
export const useWalletConnectionState = (): ConnectionState => {
  useGlobalWalletStatus(); // Subscribe to changes
  return getWalletConnectionState();
};
