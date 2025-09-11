/**
 * React hook for WalletDetector operations
 * Provides utilities for detecting and validating wallet types and addresses
 */

import { useCallback, useState } from 'react';

interface WalletInfo {
  address: string;
  chainType: 'evm' | 'solana';
  isValid: boolean;
}

interface UseWalletDetectorReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Operations
  detectWalletType: (address: string) => Promise<'evm' | 'solana' | 'unknown'>;
  validateAddress: (address: string) => Promise<boolean>;
  getWalletInfo: (address: string) => Promise<WalletInfo | null>;
  isEVMAddress: (address: string) => boolean;
  isSolanaAddress: (address: string) => boolean;

  // Utility
  clearError: () => void;
}

/**
 * Hook for wallet detection and validation operations
 */
export const useWalletDetector = (): UseWalletDetectorReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isEVMAddress = useCallback((address: string): boolean => {
    // Basic EVM address validation (0x + 40 hex characters)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  const isSolanaAddress = useCallback((address: string): boolean => {
    // Basic Solana address validation (base58, typically 32-44 characters)
    return (
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith('0x')
    );
  }, []);

  const detectWalletType = useCallback(
    async (address: string): Promise<'evm' | 'solana' | 'unknown'> => {
      setIsLoading(true);
      setError(null);

      try {
        // Use built-in detection methods since detectChainType might not exist
        if (isEVMAddress(address)) {
          return 'evm';
        } else if (isSolanaAddress(address)) {
          return 'solana';
        } else {
          return 'unknown';
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to detect wallet type';
        setError(errorMessage);
        return 'unknown';
      } finally {
        setIsLoading(false);
      }
    },
    [isEVMAddress, isSolanaAddress]
  );

  const validateAddress = useCallback(
    async (address: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to detect chain type as a validation method
        const chainType = await detectWalletType(address);
        return chainType !== 'unknown';
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to validate address';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [detectWalletType]
  );

  const getWalletInfo = useCallback(
    async (address: string): Promise<WalletInfo | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const chainType = await detectWalletType(address);
        if (chainType === 'unknown') {
          return null;
        }

        return {
          address,
          chainType,
          isValid: true,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get wallet info';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [detectWalletType]
  );

  return {
    isLoading,
    error,
    detectWalletType,
    validateAddress,
    getWalletInfo,
    isEVMAddress,
    isSolanaAddress,
    clearError,
  };
};

export type { UseWalletDetectorReturn, WalletInfo };
