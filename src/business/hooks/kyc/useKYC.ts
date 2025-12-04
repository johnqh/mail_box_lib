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
  type NetworkClient,
  type Optional,
} from '@sudobility/types';

interface SignedData {
  signature: string;
  message: string;
}

/**
 * Configuration for useKYC hook
 */
export interface UseKYCConfig {
  /** Wallet address to check KYC status for */
  walletAddress: string | null;
  /** Chain type (defaults to EVM) */
  chainType?: ChainType;
  /** Auto-fetch status on mount (defaults to true) */
  autoFetch?: boolean;
  /** Signed data for authentication */
  signedData?: SignedData | null;
  /** Network client for making API requests */
  networkClient: NetworkClient;
  /** Base URL for the KYC API */
  apiBaseUrl: string;
}

interface UseKYCReturn {
  status: GetKYCStatusResponse | null;
  loading: boolean;
  error: string | null;
  initiateKYC: (
    level: KYCVerificationLevel
  ) => Promise<Optional<InitiateKYCResponse>>;
  refreshStatus: () => Promise<void>;
}

/**
 * Custom hook for KYC verification operations
 *
 * @param config Configuration options
 * @returns KYC state and operations
 *
 * @example
 * ```tsx
 * const { status, loading, initiateKYC } = useKYC({
 *   walletAddress: account.address,
 *   chainType: ChainType.EVM,
 *   networkClient: myNetworkClient,
 *   apiBaseUrl: 'https://api.example.com',
 * });
 *
 * const handleStart = async () => {
 *   const result = await initiateKYC('basic');
 *   // Use result.sumsubAccessToken to embed Sumsub SDK
 * };
 * ```
 */
export function useKYC(config: UseKYCConfig): UseKYCReturn {
  const {
    walletAddress,
    chainType = ChainType.EVM,
    autoFetch = true,
    signedData,
    networkClient,
    apiBaseUrl,
  } = config;

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
      // Don't set error during auto-fetch, just skip silently
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = createAuthHeaders();

      const response = await networkClient.get<{
        success: boolean;
        data?: GetKYCStatusResponse;
        error?: string;
      }>(`${apiBaseUrl}/kyc/status/${walletAddress}`, headers);

      if (response.status === 404) {
        // No KYC application found - this is okay
        setStatus(null);
        return;
      }

      if (!response.ok) {
        console.error(`Failed to fetch KYC status: ${response.statusText}`);
        setError(`Failed to fetch KYC status: ${response.statusText}`);
        return;
      }

      const data = response.data;

      if (!data) {
        setError('No response data received');
        return;
      }

      if (data.success && data.data) {
        setStatus(data.data);
      } else {
        const errorMsg = data.error || 'Failed to fetch KYC status';
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Error fetching KYC status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, signedData, createAuthHeaders, networkClient, apiBaseUrl]);

  /**
   * Initiate KYC verification for a specific level
   *
   * @param level - KYC verification level (basic, enhanced, accredited)
   * @returns Promise with Sumsub access token and application details
   */
  const initiateKYC = useCallback(
    async (
      level: KYCVerificationLevel
    ): Promise<Optional<InitiateKYCResponse>> => {
      if (!walletAddress) {
        const errorMsg = 'Wallet not connected';
        setError(errorMsg);
        console.error(`Cannot initiate KYC: ${errorMsg}`);
        return undefined;
      }

      if (!signedData) {
        const errorMsg = 'Please sign in with your wallet first';
        setError(errorMsg);
        console.error(`Cannot initiate KYC: ${errorMsg}`);
        return undefined;
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

        const response = await networkClient.post<{
          success: boolean;
          data?: InitiateKYCResponse;
          error?: string;
        }>(`${apiBaseUrl}/kyc/initiate/${walletAddress}`, request, headers);

        if (!response.ok) {
          const errorMessage =
            response.data?.error ||
            `KYC service unavailable (${response.status})`;
          setError(errorMessage);
          console.error(errorMessage);
          return undefined;
        }

        const data = response.data;

        if (!data) {
          setError('No response data received');
          return undefined;
        }

        if (!data.success || !data.data) {
          const errorMsg = data.error || 'Failed to initiate KYC verification';
          setError(errorMsg);
          console.error(errorMsg);
          return undefined;
        }

        // Refresh status after initiation
        await fetchStatus();

        return data.data;
      } catch (err: any) {
        console.error('Error initiating KYC:', err);
        setError(err.message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [
      walletAddress,
      chainType,
      signedData,
      createAuthHeaders,
      fetchStatus,
      networkClient,
      apiBaseUrl,
    ]
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
