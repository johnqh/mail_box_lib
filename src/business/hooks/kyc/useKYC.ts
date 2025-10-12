/**
 * useKYC Hook
 *
 * Custom hook for managing KYC verification flow
 * Handles API calls to the indexer for KYC operations
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ChainType,
  type GetKYCStatusResponse,
  type InitiateKYCRequest,
  type InitiateKYCResponse,
  type KYCVerificationLevel,
} from '@sudobility/types';

interface SignedData {
  signature: string;
  message: string;
}

interface UseKYCOptions {
  walletAddress: string | null;
  chainType?: ChainType;
  autoFetch?: boolean;
  signedData?: SignedData | null;
}

interface UseKYCReturn {
  status: GetKYCStatusResponse | null;
  loading: boolean;
  error: string | null;
  initiateKYC: (level: KYCVerificationLevel) => Promise<InitiateKYCResponse>;
  refreshStatus: () => Promise<void>;
}

// Environment variable access - works in both browser and Node.js
const getAPIBaseURL = (): string => {
  // Browser environment with Vite
  if (typeof window !== 'undefined' && (window as any).VITE_INDEXER_API_URL) {
    return (window as any).VITE_INDEXER_API_URL;
  }
  // Process environment variable (Node.js or build time)
  if (
    typeof process !== 'undefined' &&
    process.env &&
    process.env.VITE_INDEXER_API_URL
  ) {
    return process.env.VITE_INDEXER_API_URL;
  }
  // Default fallback
  return 'http://localhost:42069';
};

const API_BASE_URL = getAPIBaseURL();

/**
 * Custom hook for KYC verification operations
 *
 * @param options - Configuration options
 * @returns KYC state and operations
 *
 * @example
 * ```tsx
 * const { status, loading, initiateKYC } = useKYC({
 *   walletAddress: account.address,
 *   chainType: 'evm',
 * });
 *
 * const handleStart = async () => {
 *   const result = await initiateKYC('basic');
 *   // Use result.sumsubAccessToken to embed Sumsub SDK
 * };
 * ```
 */
export function useKYC(options: UseKYCOptions): UseKYCReturn {
  const {
    walletAddress,
    chainType = ChainType.EVM,
    autoFetch = true,
    signedData,
  } = options;

  const [status, setStatus] = useState<GetKYCStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create authentication headers for protected endpoints using existing signed data
   * Follows the same pattern as IndexerClient.createAuthHeaders()
   */
  const createAuthHeaders = useCallback((): Record<string, string> => {
    if (!signedData || !walletAddress) {
      return {
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
      'x-signature': signedData.signature.replace(/[\r\n]/g, ''), // Remove any newlines from signature
      'x-message': encodeURIComponent(signedData.message), // Encode message for HTTP header
    };
  }, [signedData, walletAddress]);

  /**
   * Fetch current KYC status for the wallet
   */
  const fetchStatus = useCallback(async () => {
    if (!walletAddress) {
      setStatus(null);
      return;
    }

    if (!signedData) {
      console.log('KYC status check skipped - wallet not authenticated yet');
      // Don't set error during auto-fetch, just skip silently
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = createAuthHeaders();

      const response = await fetch(
        `${API_BASE_URL}/kyc/status/${walletAddress}`,
        { headers }
      );

      if (response.status === 404) {
        // No KYC application found - this is okay
        setStatus(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch KYC status: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStatus(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch KYC status');
      }
    } catch (err: any) {
      console.error('Error fetching KYC status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, signedData, createAuthHeaders]);

  /**
   * Initiate KYC verification for a specific level
   *
   * @param level - KYC verification level (basic, enhanced, accredited)
   * @returns Promise with Sumsub access token and application details
   */
  const initiateKYC = useCallback(
    async (level: KYCVerificationLevel): Promise<InitiateKYCResponse> => {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      if (!signedData) {
        throw new Error('Please sign in with your wallet first');
      }

      try {
        setLoading(true);
        setError(null);

        const headers = createAuthHeaders();

        const request: InitiateKYCRequest = {
          walletAddress,
          chainType,
          verificationLevel: level,
        };

        const response = await fetch(
          `${API_BASE_URL}/kyc/initiate/${walletAddress}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
          }
        );

        if (!response.ok) {
          // Try to parse JSON error, fallback to text if not JSON
          let errorMessage = 'Failed to initiate KYC verification';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Response is not JSON (e.g., 404 HTML page)
            errorMessage = `KYC service unavailable (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.error || 'Failed to initiate KYC verification');
        }

        // Refresh status after initiation
        await fetchStatus();

        return data.data;
      } catch (err: any) {
        console.error('Error initiating KYC:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainType, signedData, createAuthHeaders, fetchStatus]
  );

  // Auto-fetch status on mount and when wallet changes
  useEffect(() => {
    if (autoFetch) {
      fetchStatus();
    }
  }, [autoFetch, fetchStatus]);

  return {
    status,
    loading,
    error,
    initiateKYC,
    refreshStatus: fetchStatus,
  };
}

export default useKYC;
