/**
 * Tests for wallet status types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  WalletStatus,
  ConnectionState,
  isWalletConnected,
  isWalletVerified,
  getWalletConnectionState
} from '@sudobility/types';

describe('Wallet Status Types and Utilities', () => {
  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const testMessage = 'Authenticate with 0xMail';
  const testSignature = '0x1234567890abcdef';

  describe('isWalletConnected', () => {
    it('should return false for undefined status', () => {
      expect(isWalletConnected(undefined)).toBe(false);
    });

    it('should return false for empty wallet address', () => {
      const status: WalletStatus = { walletAddress: '' };
      expect(isWalletConnected(status)).toBe(false);
    });

    it('should return true for valid wallet address', () => {
      const status: WalletStatus = { walletAddress: testAddress };
      expect(isWalletConnected(status)).toBe(true);
    });

    it('should return true for verified wallet', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage,
        signature: testSignature
      };
      expect(isWalletConnected(status)).toBe(true);
    });
  });

  describe('isWalletVerified', () => {
    it('should return false for undefined status', () => {
      expect(isWalletVerified(undefined)).toBe(false);
    });

    it('should return false for connected but not verified wallet', () => {
      const status: WalletStatus = { walletAddress: testAddress };
      expect(isWalletVerified(status)).toBe(false);
    });

    it('should return false for wallet with only message', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage
      };
      expect(isWalletVerified(status)).toBe(false);
    });

    it('should return false for wallet with only signature', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        signature: testSignature
      };
      expect(isWalletVerified(status)).toBe(false);
    });

    it('should return false for wallet with empty message', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: '',
        signature: testSignature
      };
      expect(isWalletVerified(status)).toBe(false);
    });

    it('should return false for wallet with empty signature', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage,
        signature: ''
      };
      expect(isWalletVerified(status)).toBe(false);
    });

    it('should return true for fully verified wallet', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage,
        signature: testSignature
      };
      expect(isWalletVerified(status)).toBe(true);
    });
  });

  describe('getWalletConnectionState', () => {
    it('should return DISCONNECTED for undefined status', () => {
      expect(getWalletConnectionState(undefined)).toBe(ConnectionState.DISCONNECTED);
    });

    it('should return DISCONNECTED for empty wallet address', () => {
      const status: WalletStatus = { walletAddress: '' };
      expect(getWalletConnectionState(status)).toBe(ConnectionState.DISCONNECTED);
    });

    it('should return CONNECTED for wallet with address only', () => {
      const status: WalletStatus = { walletAddress: testAddress };
      expect(getWalletConnectionState(status)).toBe(ConnectionState.CONNECTED);
    });

    it('should return CONNECTED for wallet with address and message only', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage
      };
      expect(getWalletConnectionState(status)).toBe(ConnectionState.CONNECTED);
    });

    it('should return CONNECTED for wallet with address and signature only', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        signature: testSignature
      };
      expect(getWalletConnectionState(status)).toBe(ConnectionState.CONNECTED);
    });

    it('should return VERIFIED for fully verified wallet', () => {
      const status: WalletStatus = {
        walletAddress: testAddress,
        message: testMessage,
        signature: testSignature
      };
      expect(getWalletConnectionState(status)).toBe(ConnectionState.VERIFIED);
    });
  });

  describe('ConnectionState enum', () => {
    it('should have correct string values', () => {
      expect(ConnectionState.DISCONNECTED).toBe('disconnected');
      expect(ConnectionState.CONNECTED).toBe('connected');
      expect(ConnectionState.VERIFIED).toBe('verified');
    });
  });

  describe('Type Safety', () => {
    it('should provide correct type narrowing for isWalletConnected', () => {
      const status: WalletStatus | undefined = { walletAddress: testAddress };
      
      if (isWalletConnected(status)) {
        // TypeScript should know that status is WalletStatus here
        expect(status.walletAddress).toBe(testAddress);
        expect(typeof status.walletAddress).toBe('string');
      }
    });

    it('should provide correct type narrowing for isWalletVerified', () => {
      const status: WalletStatus | undefined = {
        walletAddress: testAddress,
        message: testMessage,
        signature: testSignature
      };
      
      if (isWalletVerified(status)) {
        // TypeScript should know that all properties are defined here
        expect(status.walletAddress).toBe(testAddress);
        expect(status.message).toBe(testMessage);
        expect(status.signature).toBe(testSignature);
        expect(typeof status.walletAddress).toBe('string');
        expect(typeof status.message).toBe('string');
        expect(typeof status.signature).toBe('string');
      }
    });
  });
});