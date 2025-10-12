import { Optional } from '@sudobility/types';
/**
 * TanStack Query hooks for Name Service resolution (ENS/SNS)
 *
 * These hooks replace custom caching logic with TanStack Query's optimized caching.
 */

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { STALE_TIMES } from '../../core/query';
import { getENSNames } from '../../../utils/nameservice/ens';
import { getSNSNames, resolveSNSDomain } from '../../../utils/nameservice/sns';

// Types for name service resolution
interface ENSResolutionResponse {
  address: string;
  ensName: Optional<string>;
  success: boolean;
}

interface SNSResolutionResponse {
  address: string;
  snsName: Optional<string>;
  success: boolean;
}

interface WalletResolutionResponse {
  nameService: 'ens' | 'sns';
  domain: string;
  walletAddress: Optional<string>;
  success: boolean;
}

/**
 * Hook to resolve ENS name from wallet address
 */
const useENSFromWallet = (
  walletAddress: string,
  options?: UseQueryOptions<ENSResolutionResponse>
): UseQueryResult<ENSResolutionResponse> => {
  return useQuery({
    queryKey: ['nameservice', 'ens', 'from-wallet', walletAddress],
    queryFn: async (): Promise<ENSResolutionResponse> => {
      try {
        const ensNames = await getENSNames(walletAddress);
        const primaryENS =
          ensNames.length > 0 && ensNames[0] ? ensNames[0].name : null;
        return {
          address: walletAddress,
          ensName: primaryENS,
          success: true,
        };
      } catch {
        return {
          address: walletAddress,
          ensName: null,
          success: false,
        };
      }
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!walletAddress && walletAddress.startsWith('0x'),
    ...options,
  });
};

/**
 * Hook to resolve wallet address from ENS name
 */
const useWalletFromENS = (
  ensName: string,
  options?: UseQueryOptions<WalletResolutionResponse>
): UseQueryResult<WalletResolutionResponse> => {
  return useQuery({
    queryKey: ['nameservice', 'ens', 'from-name', ensName],
    queryFn: async (): Promise<WalletResolutionResponse> => {
      try {
        // For now, this would need a different implementation
        // The current ENS utils don't have a direct ENS->wallet resolver
        return {
          nameService: 'ens',
          domain: ensName,
          walletAddress: null,
          success: false,
        };
      } catch {
        return {
          nameService: 'ens',
          domain: ensName,
          walletAddress: null,
          success: false,
        };
      }
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!ensName && ensName.endsWith('.eth'),
    ...options,
  });
};

/**
 * Hook to resolve SNS name from wallet address
 */
const useSNSFromWallet = (
  walletAddress: string,
  options?: UseQueryOptions<SNSResolutionResponse>
): UseQueryResult<SNSResolutionResponse> => {
  return useQuery({
    queryKey: ['nameservice', 'sns', 'from-wallet', walletAddress],
    queryFn: async (): Promise<SNSResolutionResponse> => {
      try {
        const snsNames = await getSNSNames(walletAddress);
        const primarySNS =
          snsNames.length > 0 && snsNames[0] ? snsNames[0].name : null;
        return {
          address: walletAddress,
          snsName: primarySNS,
          success: true,
        };
      } catch {
        return {
          address: walletAddress,
          snsName: null,
          success: false,
        };
      }
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!walletAddress && !walletAddress.startsWith('0x'),
    ...options,
  });
};

/**
 * Hook to resolve wallet address from SNS name
 */
const useWalletFromSNS = (
  snsName: string,
  options?: UseQueryOptions<WalletResolutionResponse>
): UseQueryResult<WalletResolutionResponse> => {
  return useQuery({
    queryKey: ['nameservice', 'sns', 'from-name', snsName],
    queryFn: async (): Promise<WalletResolutionResponse> => {
      try {
        const walletAddress = await resolveSNSDomain(snsName);
        return {
          nameService: 'sns',
          domain: snsName,
          walletAddress,
          success: !!walletAddress,
        };
      } catch {
        return {
          nameService: 'sns',
          domain: snsName,
          walletAddress: null,
          success: false,
        };
      }
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!snsName && snsName.endsWith('.sol'),
    ...options,
  });
};

/**
 * Generic hook to resolve name service (auto-detects ENS or SNS)
 */
const useNameServiceResolution = (
  input: string,
  options?: UseQueryOptions<ENSResolutionResponse | SNSResolutionResponse>
): UseQueryResult<ENSResolutionResponse | SNSResolutionResponse> => {
  const isWalletAddress = input.length > 20;
  const isENSAddress = isWalletAddress && input.startsWith('0x');
  const isSolanaAddress = isWalletAddress && !input.startsWith('0x');

  return useQuery({
    queryKey: ['nameservice', 'auto-resolve', input],
    queryFn: async (): Promise<
      ENSResolutionResponse | SNSResolutionResponse
    > => {
      if (isENSAddress) {
        // Resolve ENS from Ethereum address
        try {
          const ensNames = await getENSNames(input);
          const primaryENS =
            ensNames.length > 0 && ensNames[0] ? ensNames[0].name : null;
          return {
            address: input,
            ensName: primaryENS,
            success: true,
          };
        } catch {
          return {
            address: input,
            ensName: null,
            success: false,
          };
        }
      } else if (isSolanaAddress) {
        // Resolve SNS from Solana address
        try {
          const snsNames = await getSNSNames(input);
          const primarySNS =
            snsNames.length > 0 && snsNames[0] ? snsNames[0].name : null;
          return {
            address: input,
            snsName: primarySNS,
            success: true,
          };
        } catch {
          return {
            address: input,
            snsName: null,
            success: false,
          };
        }
      } else {
        // Input is a domain name
        if (input.endsWith('.eth')) {
          // For now, ENS->wallet resolution is not implemented
          return {
            address: '',
            ensName: input,
            success: false,
          };
        } else if (input.endsWith('.sol')) {
          // Resolve wallet from SNS
          try {
            const walletAddress = await resolveSNSDomain(input);
            return {
              address: walletAddress || '',
              snsName: input,
              success: !!walletAddress,
            };
          } catch {
            return {
              address: '',
              snsName: input,
              success: false,
            };
          }
        }
      }

      // Fallback for unrecognized format
      return {
        address: '',
        ensName: null,
        success: false,
      } as ENSResolutionResponse;
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!input,
    ...options,
  });
};

export {
  useENSFromWallet,
  useWalletFromENS,
  useSNSFromWallet,
  useWalletFromSNS,
  useNameServiceResolution,
  type ENSResolutionResponse,
  type SNSResolutionResponse,
  type WalletResolutionResponse,
};
