import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IndexerClient } from '../indexer';
import type { AppConfig } from '../../../types/environment';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('IndexerClient', () => {
  let client: IndexerClient;
  let mockConfig: AppConfig;
  const mockEndpointUrl = 'https://test-indexer.example.com';

  beforeEach(() => {
    mockConfig = {
      indexerBackendUrl: mockEndpointUrl,
      devMode: false,
    } as AppConfig;
    
    client = new IndexerClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance with config successfully', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(IndexerClient);
    });

    it('should create instance with endpoint URL', () => {
      const testClient = new IndexerClient(mockEndpointUrl, true);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(IndexerClient);
    });

    it('should handle missing config gracefully', () => {
      const configWithoutUrl = {} as AppConfig;
      const testClient = new IndexerClient(configWithoutUrl);
      expect(testClient).toBeDefined();
    });
  });

  describe('validateAddress', () => {
    it('should validate address successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {
          isValid: true,
          address: '0x123...',
          addressType: 'evm',
          normalizedAddress: '0x123...',
          timestamp: new Date().toISOString(),
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.validateUsername('0x123...');
      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/0x123.../validate'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid address format' }),
      });

      await expect(client.validateUsername('invalid-address'))
        .rejects.toThrow('Failed to validate username');
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('getEmailAddresses', () => {
    it('should get email addresses with authentication', async () => {
      const mockResponse = {
        ok: true,
        data: {
          requestedWallet: '0x123...',
          addressType: 'evm',
          walletEmails: [
            {
              walletAddress: '0x123...',
              addressType: 'evm',
              isPrimary: true,
              primaryEmail: '0x123...@0xmail.box',
              domainEmails: [],
              totalEmails: 1,
            },
          ],
          totalWallets: 1,
          totalEmails: 1,
          verified: true,
          timestamp: new Date().toISOString(),
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getEmailAddresses(
        '0x123...',
        'signature',
        'message'
      );
      
      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/wallets/0x123...'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-signature': 'signature',
            'x-message': 'message',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.validateUsername('0x123...'))
        .rejects.toThrow('Indexer API request failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutClient = new IndexerClient(mockEndpointUrl, false, 1);
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      await expect(timeoutClient.validateUsername('0x123...'))
        .rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty wallet address', async () => {
      await expect(client.getEmailAddresses('', 'sig', 'msg'))
        .rejects.toThrow();
    });

    it('should handle missing signature parameters', async () => {
      await expect(client.getEmailAddresses('0x123...', '', ''))
        .rejects.toThrow();
    });
  });
});