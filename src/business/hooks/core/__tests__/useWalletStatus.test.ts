/**
 * Tests for useWalletStatus React hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useWalletStatus,
  useWalletAddress,
  useWalletConnectionState,
} from '../useWalletStatus';
import {
  disconnectWallet,
  connectWallet,
  verifyWallet,
  clearVerification,
} from '../../../core/wallet/wallet-status-manager';
import { ChainType, ConnectionState } from '@johnqh/types';

describe('useWalletStatus', () => {
  // Reset wallet state before each test
  beforeEach(() => {
    disconnectWallet();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testChainType = ChainType.EVM;
  const testMessage = 'Authenticate with 0xMail';
  const testSignature = '0x1234567890abcdef';

  describe('Initial State', () => {
    it('should start with undefined status', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      expect(result.current.status).toBeUndefined();
      expect(result.current.walletAddress).toBeUndefined();
      expect(result.current.connectionState).toBe(ConnectionState.DISCONNECTED);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isVerified).toBe(false);
    });
  });

  describe('Wallet Connection', () => {
    it('should update when wallet is connected', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      act(() => {
        result.current.connectWallet(testAddress, testChainType);
      });
      
      expect(result.current.status).toEqual({
        walletAddress: testAddress,
        chainType: testChainType,
      });
      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.connectionState).toBe(ConnectionState.CONNECTED);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isVerified).toBe(false);
    });

    it('should update when wallet is verified', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      act(() => {
        result.current.verifyWallet(testAddress, testChainType, testMessage, testSignature);
      });
      
      expect(result.current.status).toEqual({
        walletAddress: testAddress,
        chainType: testChainType,
        message: testMessage,
        signature: testSignature,
      });
      expect(result.current.connectionState).toBe(ConnectionState.VERIFIED);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isVerified).toBe(true);
    });

    it('should update when wallet is disconnected', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      // First connect
      act(() => {
        result.current.connectWallet(testAddress, testChainType);
      });
      expect(result.current.isConnected).toBe(true);
      
      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });
      
      expect(result.current.status).toBeUndefined();
      expect(result.current.walletAddress).toBeUndefined();
      expect(result.current.connectionState).toBe(ConnectionState.DISCONNECTED);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isVerified).toBe(false);
    });
  });

  describe('External State Changes', () => {
    it('should react to external status changes', () => {
      const { result } = renderHook(() => useWalletStatus());

      // External change via direct function
      act(() => {
        connectWallet(testAddress, testChainType);
      });

      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.isConnected).toBe(true);

      // Another external change
      act(() => {
        verifyWallet(testAddress, testChainType, testMessage, testSignature);
      });

      expect(result.current.isVerified).toBe(true);
      expect(result.current.status?.message).toBe(testMessage);
      expect(result.current.status?.signature).toBe(testSignature);
    });
  });

  describe('Hook Actions', () => {
    it('should update wallet address while preserving verification', () => {
      const { result } = renderHook(() => useWalletStatus());
      const newAddress = '0x8ba1f109551bD432803012645Hac136c';
      
      // First verify wallet
      act(() => {
        result.current.verifyWallet(testAddress, testChainType, testMessage, testSignature);
      });
      expect(result.current.isVerified).toBe(true);
      
      // Update address
      act(() => {
        result.current.updateWalletAddress(newAddress, testChainType);
      });
      
      expect(result.current.walletAddress).toBe(newAddress);
      expect(result.current.status?.message).toBe(testMessage);
      expect(result.current.status?.signature).toBe(testSignature);
      expect(result.current.isVerified).toBe(true);
    });

    it('should clear verification while keeping wallet connected', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      // First verify wallet
      act(() => {
        result.current.verifyWallet(testAddress, testChainType, testMessage, testSignature);
      });
      expect(result.current.isVerified).toBe(true);
      
      // Clear verification
      act(() => {
        result.current.clearVerification();
      });
      
      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.status?.message).toBeUndefined();
      expect(result.current.status?.signature).toBeUndefined();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isVerified).toBe(false);
    });
  });

  describe('Function Stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useWalletStatus());
      
      const initialFunctions = {
        connectWallet: result.current.connectWallet,
        verifyWallet: result.current.verifyWallet,
        disconnectWallet: result.current.disconnectWallet,
        updateWalletAddress: result.current.updateWalletAddress,
        clearVerification: result.current.clearVerification,
      };
      
      // Trigger a re-render by connecting wallet
      act(() => {
        result.current.connectWallet(testAddress, testChainType);
      });
      
      rerender();
      
      // Functions should be the same references (memoized)
      expect(result.current.connectWallet).toBe(initialFunctions.connectWallet);
      expect(result.current.verifyWallet).toBe(initialFunctions.verifyWallet);
      expect(result.current.disconnectWallet).toBe(initialFunctions.disconnectWallet);
      expect(result.current.updateWalletAddress).toBe(initialFunctions.updateWalletAddress);
      expect(result.current.clearVerification).toBe(initialFunctions.clearVerification);
    });
  });
});

describe('useWalletAddress', () => {
  beforeEach(() => {
    disconnectWallet();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testChainType = ChainType.EVM;

  it('should start with undefined address', () => {
    const { result } = renderHook(() => useWalletAddress());
    expect(result.current).toBeUndefined();
  });

  it('should update when wallet address changes', () => {
    const { result } = renderHook(() => useWalletAddress());

    act(() => {
      connectWallet(testAddress, testChainType);
    });

    expect(result.current).toBe(testAddress);
  });

  it('should return undefined when wallet is disconnected', () => {
    const { result } = renderHook(() => useWalletAddress());

    // Connect first
    act(() => {
      connectWallet(testAddress, testChainType);
    });
    expect(result.current).toBe(testAddress);

    // Then disconnect
    act(() => {
      disconnectWallet();
    });
    expect(result.current).toBeUndefined();
  });
});

describe('useWalletConnectionState', () => {
  beforeEach(() => {
    disconnectWallet();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testChainType = ChainType.EVM;
  const testMessage = 'Authenticate with 0xMail';
  const testSignature = '0x1234567890abcdef';

  it('should start with disconnected state', () => {
    const { result } = renderHook(() => useWalletConnectionState());
    expect(result.current).toBe(ConnectionState.DISCONNECTED);
  });

  it('should update through all connection states', () => {
    const { result } = renderHook(() => useWalletConnectionState());

    // Connect wallet
    act(() => {
      connectWallet(testAddress, testChainType);
    });
    expect(result.current).toBe(ConnectionState.CONNECTED);

    // Verify wallet
    act(() => {
      verifyWallet(testAddress, testChainType, testMessage, testSignature);
    });
    expect(result.current).toBe(ConnectionState.VERIFIED);

    // Disconnect wallet
    act(() => {
      disconnectWallet();
    });
    expect(result.current).toBe(ConnectionState.DISCONNECTED);
  });

  it('should handle state transitions correctly', () => {
    const { result } = renderHook(() => useWalletConnectionState());

    // Direct verification (skipping connect)
    act(() => {
      verifyWallet(testAddress, testChainType, testMessage, testSignature);
    });
    expect(result.current).toBe(ConnectionState.VERIFIED);

    // Clear verification (back to connected)
    act(() => {
      clearVerification();
    });
    expect(result.current).toBe(ConnectionState.CONNECTED);
  });
});