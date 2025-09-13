import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultAuthBusinessLogic, DefaultEmailAddressBusinessLogic, AddressHelper } from '../auth-business-logic';
import { WalletUserData } from '../../../../types/email';
import { ChainType, AuthStatus } from '../../enums';

describe('DefaultAuthBusinessLogic', () => {
  let authLogic: DefaultAuthBusinessLogic;
  let emailLogic: DefaultEmailAddressBusinessLogic;

  beforeEach(() => {
    authLogic = new DefaultAuthBusinessLogic();
    emailLogic = new DefaultEmailAddressBusinessLogic();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instances successfully', () => {
      expect(authLogic).toBeDefined();
      expect(authLogic).toBeInstanceOf(DefaultAuthBusinessLogic);
      expect(emailLogic).toBeDefined();
      expect(emailLogic).toBeInstanceOf(DefaultEmailAddressBusinessLogic);
    });
  });

  describe('authentication business logic', () => {
    it('should validate wallet connection', () => {
      const status = AuthStatus.CONNECTED;
      const isValid = authLogic.isWalletConnected(status);
      expect(isValid).toBe(true);
    });

    it('should reject invalid wallet data', () => {
      const status = AuthStatus.DISCONNECTED;
      const isValid = authLogic.isWalletConnected(status);
      expect(isValid).toBe(false);
    });
  });

  describe('email address business logic', () => {
    it('should parse email addresses correctly', () => {
      const email = 'test@example.com';
      const parsed = emailLogic.parseEmailAddress(email);
      
      expect(parsed.address).toBe('test');
      expect(parsed.domain).toBe('example.com');
      expect(parsed.type).toBeDefined();
    });

    it('should handle invalid email addresses', () => {
      const invalidEmail = 'not-an-email';
      const result = emailLogic.parseEmailAddress(invalidEmail);
      expect(result).toBeUndefined();
    });
  });

  describe('AddressHelper utility', () => {
    it('should detect address types correctly', () => {
      const ethAddress = '0x742d35Cc6634C0532925a3b8D94B94748e23d9C4';
      const type = AddressHelper.getAddressType(ethAddress);
      
      expect(type).toBeDefined();
    });

    it('should handle unknown address formats', () => {
      const unknownAddress = 'unknown-format';
      const type = AddressHelper.getAddressType(unknownAddress);
      
      expect(type).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty/null inputs', () => {
      expect(() => AddressHelper.getAddressType('')).not.toThrow();
      const result = emailLogic.parseEmailAddress('');
      expect(result).toBeUndefined();
    });

    it('should validate input parameters', () => {
      const nullWallet = null as any;
      const isValid = authLogic.isWalletConnected(nullWallet);
      expect(isValid).toBe(false);
    });
  });
});