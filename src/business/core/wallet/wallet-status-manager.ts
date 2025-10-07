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
export const connectWallet = (walletAddress: string): void => {
  if (!walletAddress || walletAddress.trim() === '') {
    throw new Error('Wallet address is required');
  }

  const newStatus: WalletStatus = {
    walletAddress: walletAddress.trim(),
  };

  setGlobalState('walletStatus', newStatus);
};

/**
 * Verify wallet with message and signature
 */
export const verifyWallet = (
  walletAddress: string,
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
export const updateWalletAddress = (walletAddress: string): void => {
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
  } else {
    // If no current status, treat as new connection
    connectWallet(walletAddress);
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
    };
    setGlobalState('walletStatus', newStatus);
  }
};
