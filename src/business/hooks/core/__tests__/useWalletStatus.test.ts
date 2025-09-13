/**
 * Tests for useWalletStatus React hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useWalletStatus, 
  useWalletAddress, 
  useWalletConnectionState 
} from '../useWalletStatus';
import { walletStatusManager } from '../../../core/wallet/wallet-status-manager';
import { WalletConnectionState } from '../../../../types/wallet-status';

describe('useWalletStatus', () => {
  // Reset manager state before each test
  beforeEach(() => {
    walletStatusManager.reset();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testMessage = 'Authenticate with 0xMail';
  const testSignature = '0x1234567890abcdef';

  describe('Initial State', () => {
    it('should start with undefined status', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      expect(result.current.status).toBeUndefined();
      expect(result.current.walletAddress).toBeUndefined();
      expect(result.current.connectionState).toBe(WalletConnectionState.DISCONNECTED);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isVerified).toBe(false);
    });
  });

  describe('Wallet Connection', () => {
    it('should update when wallet is connected', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      act(() => {
        result.current.connectWallet(testAddress);
      });
      
      expect(result.current.status).toEqual({
        walletAddress: testAddress,
      });
      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.connectionState).toBe(WalletConnectionState.CONNECTED);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isVerified).toBe(false);
    });

    it('should update when wallet is verified', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      act(() => {
        result.current.verifyWallet(testAddress, testMessage, testSignature);
      });
      
      expect(result.current.status).toEqual({
        walletAddress: testAddress,
        message: testMessage,
        signature: testSignature,
      });
      expect(result.current.connectionState).toBe(WalletConnectionState.VERIFIED);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isVerified).toBe(true);
    });

    it('should update when wallet is disconnected', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      // First connect
      act(() => {
        result.current.connectWallet(testAddress);
      });
      expect(result.current.isConnected).toBe(true);
      
      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });
      
      expect(result.current.status).toBeUndefined();
      expect(result.current.walletAddress).toBeUndefined();
      expect(result.current.connectionState).toBe(WalletConnectionState.DISCONNECTED);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isVerified).toBe(false);
    });
  });

  describe('External State Changes', () => {
    it('should react to external status changes', () => {
      const { result } = renderHook(() => useWalletStatus());
      
      // External change via manager
      act(() => {
        walletStatusManager.connectWallet(testAddress);
      });
      
      expect(result.current.walletAddress).toBe(testAddress);
      expect(result.current.isConnected).toBe(true);
      
      // Another external change
      act(() => {
        walletStatusManager.verifyWallet(testAddress, testMessage, testSignature);
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
        result.current.verifyWallet(testAddress, testMessage, testSignature);
      });
      expect(result.current.isVerified).toBe(true);
      
      // Update address
      act(() => {
        result.current.updateWalletAddress(newAddress);
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
        result.current.verifyWallet(testAddress, testMessage, testSignature);
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
        result.current.connectWallet(testAddress);
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
    walletStatusManager.reset();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';

  it('should start with undefined address', () => {
    const { result } = renderHook(() => useWalletAddress());
    expect(result.current).toBeUndefined();
  });

  it('should update when wallet address changes', () => {
    const { result } = renderHook(() => useWalletAddress());
    
    act(() => {
      walletStatusManager.connectWallet(testAddress);
    });
    
    expect(result.current).toBe(testAddress);
  });

  it('should return undefined when wallet is disconnected', () => {
    const { result } = renderHook(() => useWalletAddress());
    
    // Connect first
    act(() => {
      walletStatusManager.connectWallet(testAddress);
    });
    expect(result.current).toBe(testAddress);
    
    // Then disconnect
    act(() => {
      walletStatusManager.disconnectWallet();
    });
    expect(result.current).toBeUndefined();
  });
});

describe('useWalletConnectionState', () => {
  beforeEach(() => {
    walletStatusManager.reset();
  });

  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testMessage = 'Authenticate with 0xMail';
  const testSignature = '0x1234567890abcdef';

  it('should start with disconnected state', () => {
    const { result } = renderHook(() => useWalletConnectionState());
    expect(result.current).toBe(WalletConnectionState.DISCONNECTED);
  });

  it('should update through all connection states', () => {
    const { result } = renderHook(() => useWalletConnectionState());
    
    // Connect wallet
    act(() => {
      walletStatusManager.connectWallet(testAddress);
    });
    expect(result.current).toBe(WalletConnectionState.CONNECTED);
    
    // Verify wallet
    act(() => {
      walletStatusManager.verifyWallet(testAddress, testMessage, testSignature);
    });
    expect(result.current).toBe(WalletConnectionState.VERIFIED);
    
    // Disconnect wallet
    act(() => {
      walletStatusManager.disconnectWallet();
    });
    expect(result.current).toBe(WalletConnectionState.DISCONNECTED);
  });

  it('should handle state transitions correctly', () => {
    const { result } = renderHook(() => useWalletConnectionState());
    
    // Direct verification (skipping connect)
    act(() => {
      walletStatusManager.verifyWallet(testAddress, testMessage, testSignature);
    });
    expect(result.current).toBe(WalletConnectionState.VERIFIED);
    
    // Clear verification (back to connected)
    act(() => {
      walletStatusManager.clearVerification();
    });
    expect(result.current).toBe(WalletConnectionState.CONNECTED);
  });
});