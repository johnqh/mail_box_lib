import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultEmailOperations, EmailOperations } from '../email-operations';
import { PersistenceService, AnalyticsService } from '../../../../di';

describe('DefaultEmailOperations', () => {
  let emailOps: DefaultEmailOperations;
  let mockPersistence: PersistenceService;
  let mockAnalytics: AnalyticsService;

  beforeEach(() => {
    mockPersistence = {
      save: vi.fn(),
      load: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    } as any;

    mockAnalytics = {
      track: vi.fn(),
      identify: vi.fn(),
      page: vi.fn(),
    } as any;

    emailOps = new DefaultEmailOperations(mockPersistence, mockAnalytics);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance successfully', () => {
      expect(emailOps).toBeDefined();
      expect(emailOps).toBeInstanceOf(DefaultEmailOperations);
    });
  });

  describe('email processing', () => {
    it('should process email data successfully', async () => {
      const mockEmailData = {
        id: 'test-email-id',
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Email',
        body: 'Test email body',
      };

      mockPersistence.save = vi.fn().mockResolvedValue(true);

      const result = await emailOps.processEmailData(mockEmailData);
      
      expect(result).toBeDefined();
      expect(mockPersistence.save).toHaveBeenCalled();
      expect(mockAnalytics.track).toHaveBeenCalledWith('email_processed', expect.any(Object));
    });

    it('should handle email processing errors', async () => {
      const invalidEmailData = {
        id: '',
        from: '',
        to: [],
        subject: '',
        body: '',
      };

      mockPersistence.save = vi.fn().mockRejectedValue(new Error('Save failed'));

      await expect(emailOps.processEmailData(invalidEmailData))
        .rejects.toThrow();
      
      expect(mockAnalytics.track).toHaveBeenCalledWith('email_processing_error', expect.any(Object));
    });
  });

  describe('email validation', () => {
    it('should validate email structure correctly', () => {
      const validEmail = {
        id: 'valid-id',
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Valid Subject',
        body: 'Valid body content',
      };

      const isValid = emailOps.validateEmailData(validEmail);
      expect(isValid).toBe(true);
    });

    it('should reject invalid email structure', () => {
      const invalidEmail = {
        id: '',
        from: 'invalid-email',
        to: [],
        subject: '',
        body: '',
      };

      const isValid = emailOps.validateEmailData(invalidEmail);
      expect(isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined inputs', async () => {
      await expect(emailOps.processEmailData(null as any))
        .rejects.toThrow();
      
      await expect(emailOps.processEmailData(undefined as any))
        .rejects.toThrow();
    });

    it('should validate required dependencies', () => {
      expect(() => new DefaultEmailOperations(null as any, mockAnalytics))
        .toThrow();
      
      expect(() => new DefaultEmailOperations(mockPersistence, null as any))
        .toThrow();
    });
  });
});