/**
 * Tests for WalletStatusManager singleton
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  WalletStatusManager,
  walletStatusManager,
  getWalletStatus,
  getWalletAddress,
  isWalletConnected,
  isWalletVerified,
  connectWallet,
  verifyWallet,
  disconnectWallet,
  subscribeToWalletStatus,
  WalletStatusChangeListener
} from '../wallet-status-manager';
import { WalletConnectionState } from '@johnqh/types';

describe('WalletStatusManager', () => {
  // Reset manager state before each test
  beforeEach(() => {
    walletStatusManager.reset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WalletStatusManager.getInstance();
      const instance2 = WalletStatusManager.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(walletStatusManager);
    });
  });

  describe('Initial State', () => {
    it('should start with undefined status', () => {
      expect(getWalletStatus()).toBeUndefined();
      expect(getWalletAddress()).toBeUndefined();
      expect(isWalletConnected()).toBe(false);
      expect(isWalletVerified()).toBe(false);
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.DISCONNECTED);
    });
  });

  describe('Wallet Connection', () => {
    const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';

    it('should connect wallet with address', () => {
      connectWallet(testAddress);
      
      const status = getWalletStatus();
      expect(status).toBeDefined();
      expect(status?.walletAddress).toBe(testAddress);
      expect(status?.message).toBeUndefined();
      expect(status?.signature).toBeUndefined();
      
      expect(getWalletAddress()).toBe(testAddress);
      expect(isWalletConnected()).toBe(true);
      expect(isWalletVerified()).toBe(false);
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.CONNECTED);
    });

    it('should throw error for empty wallet address', () => {
      expect(() => connectWallet('')).toThrow('Wallet address is required');
      expect(() => connectWallet('   ')).toThrow('Wallet address is required');
    });

    it('should trim wallet address', () => {
      const paddedAddress = `  ${testAddress}  `;
      connectWallet(paddedAddress);
      
      expect(getWalletAddress()).toBe(testAddress);
    });
  });

  describe('Wallet Verification', () => {
    const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
    const testMessage = 'Authenticate with 0xMail';
    const testSignature = '0x1234567890abcdef';

    it('should verify wallet with message and signature', () => {
      verifyWallet(testAddress, testMessage, testSignature);
      
      const status = getWalletStatus();
      expect(status).toBeDefined();
      expect(status?.walletAddress).toBe(testAddress);
      expect(status?.message).toBe(testMessage);
      expect(status?.signature).toBe(testSignature);
      
      expect(isWalletConnected()).toBe(true);
      expect(isWalletVerified()).toBe(true);
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.VERIFIED);
    });

    it('should throw error for missing verification data', () => {
      expect(() => verifyWallet('', testMessage, testSignature))
        .toThrow('Wallet address is required');
      expect(() => verifyWallet(testAddress, '', testSignature))
        .toThrow('Message is required for verification');
      expect(() => verifyWallet(testAddress, testMessage, ''))
        .toThrow('Signature is required for verification');
    });

    it('should trim verification data', () => {
      const paddedAddress = `  ${testAddress}  `;
      const paddedMessage = `  ${testMessage}  `;
      const paddedSignature = `  ${testSignature}  `;
      
      verifyWallet(paddedAddress, paddedMessage, paddedSignature);
      
      const status = getWalletStatus();
      expect(status?.walletAddress).toBe(testAddress);
      expect(status?.message).toBe(testMessage);
      expect(status?.signature).toBe(testSignature);
    });
  });

  describe('Wallet Disconnection', () => {
    it('should disconnect wallet and clear status', () => {
      // First connect and verify
      const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
      verifyWallet(testAddress, 'test message', 'test signature');
      expect(isWalletVerified()).toBe(true);
      
      // Then disconnect
      disconnectWallet();
      
      expect(getWalletStatus()).toBeUndefined();
      expect(getWalletAddress()).toBeUndefined();
      expect(isWalletConnected()).toBe(false);
      expect(isWalletVerified()).toBe(false);
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.DISCONNECTED);
    });
  });

  describe('Address Updates', () => {
    const originalAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
    const newAddress = '0x8ba1f109551bD432803012645Hac136c';

    it('should update wallet address while preserving verification', () => {
      // Start with verified wallet
      verifyWallet(originalAddress, 'test message', 'test signature');
      
      // Update address
      walletStatusManager.updateWalletAddress(newAddress);
      
      const status = getWalletStatus();
      expect(status?.walletAddress).toBe(newAddress);
      expect(status?.message).toBe('test message');
      expect(status?.signature).toBe('test signature');
      expect(isWalletVerified()).toBe(true);
    });

    it('should connect wallet if no current status exists', () => {
      expect(getWalletStatus()).toBeUndefined();
      
      walletStatusManager.updateWalletAddress(newAddress);
      
      const status = getWalletStatus();
      expect(status?.walletAddress).toBe(newAddress);
      expect(status?.message).toBeUndefined();
      expect(status?.signature).toBeUndefined();
      expect(isWalletConnected()).toBe(true);
      expect(isWalletVerified()).toBe(false);
    });
  });

  describe('Clear Verification', () => {
    it('should clear verification while keeping wallet connected', () => {
      const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
      
      // Start with verified wallet
      verifyWallet(testAddress, 'test message', 'test signature');
      expect(isWalletVerified()).toBe(true);
      
      // Clear verification
      walletStatusManager.clearVerification();
      
      const status = getWalletStatus();
      expect(status?.walletAddress).toBe(testAddress);
      expect(status?.message).toBeUndefined();
      expect(status?.signature).toBeUndefined();
      expect(isWalletConnected()).toBe(true);
      expect(isWalletVerified()).toBe(false);
    });

    it('should do nothing if no wallet connected', () => {
      expect(getWalletStatus()).toBeUndefined();
      
      walletStatusManager.clearVerification();
      
      expect(getWalletStatus()).toBeUndefined();
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on status changes', () => {
      const mockListener: WalletStatusChangeListener = vi.fn();
      
      const unsubscribe = subscribeToWalletStatus(mockListener);
      
      // Connect wallet
      connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');
      expect(mockListener).toHaveBeenCalledWith(expect.objectContaining({
        walletAddress: '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398'
      }));
      
      // Verify wallet
      verifyWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398', 'message', 'signature');
      expect(mockListener).toHaveBeenCalledWith(expect.objectContaining({
        walletAddress: '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
        message: 'message',
        signature: 'signature'
      }));
      
      // Disconnect wallet
      disconnectWallet();
      expect(mockListener).toHaveBeenCalledWith(undefined);
      
      // Cleanup
      unsubscribe();
      expect(mockListener).toHaveBeenCalledTimes(3);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener: WalletStatusChangeListener = () => {
        throw new Error('Listener error');
      };
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      walletStatusManager.subscribe(errorListener);
      
      // Should not throw
      expect(() => connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398')).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in wallet status listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should manage listener subscriptions correctly', () => {
      const listener1: WalletStatusChangeListener = vi.fn();
      const listener2: WalletStatusChangeListener = vi.fn();
      
      expect(walletStatusManager.getListenerCount()).toBe(0);
      
      const unsubscribe1 = walletStatusManager.subscribe(listener1);
      expect(walletStatusManager.getListenerCount()).toBe(1);
      
      const unsubscribe2 = walletStatusManager.subscribe(listener2);
      expect(walletStatusManager.getListenerCount()).toBe(2);
      
      unsubscribe1();
      expect(walletStatusManager.getListenerCount()).toBe(1);
      
      walletStatusManager.unsubscribe(listener2);
      expect(walletStatusManager.getListenerCount()).toBe(0);
    });

    it('should clear all listeners', () => {
      const listener1: WalletStatusChangeListener = vi.fn();
      const listener2: WalletStatusChangeListener = vi.fn();
      
      walletStatusManager.subscribe(listener1);
      walletStatusManager.subscribe(listener2);
      expect(walletStatusManager.getListenerCount()).toBe(2);
      
      walletStatusManager.clearAllListeners();
      expect(walletStatusManager.getListenerCount()).toBe(0);
    });
  });

  describe('State Transitions', () => {
    const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';

    it('should handle complete workflow: disconnect -> connect -> verify -> disconnect', () => {
      // Initial state
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.DISCONNECTED);
      
      // Connect
      connectWallet(testAddress);
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.CONNECTED);
      
      // Verify
      verifyWallet(testAddress, 'message', 'signature');
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.VERIFIED);
      
      // Disconnect
      disconnectWallet();
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.DISCONNECTED);
    });

    it('should handle direct verification (skip connect step)', () => {
      // Direct verify
      verifyWallet(testAddress, 'message', 'signature');
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.VERIFIED);
      
      // Clear verification (back to connected)
      walletStatusManager.clearVerification();
      expect(walletStatusManager.getConnectionState()).toBe(WalletConnectionState.CONNECTED);
    });
  });
});