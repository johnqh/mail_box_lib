/**
 * @fileoverview TanStack Query hooks for Name Service resolution (ENS and SNS).
 *
 * Provides reactive, cached name resolution between wallet addresses and domain names:
 * - `useENSFromWallet` - Reverse resolve Ethereum address to ENS name
 * - `useWalletFromENS` - Forward resolve ENS domain to wallet address
 * - `useSNSFromWallet` - Reverse resolve Solana address to SNS name
 * - `useWalletFromSNS` - Forward resolve SNS domain to wallet address
 * - `useNameServiceResolution` - Auto-detecting unified resolver (ENS or SNS)
 *
 * All hooks use TanStack Query with `STALE_TIMES.NAME_SERVICE_RESOLUTION`
 * for automatic caching, deduplication, and background refetching.
 */

import { Optional } from '@sudobility/types';

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { STALE_TIMES } from '../../core/query';
import { getENSNames } from '../../../utils/nameservice/ens';
import { getSNSNames, resolveSNSDomain } from '../../../utils/nameservice/sns';
import { resolveENSName } from '../../../utils/nameservice/nameResolution';

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
 * Reverse resolves an Ethereum wallet address to its primary ENS name.
 *
 * Only enabled when the input is a valid Ethereum address (starts with `0x`).
 * Returns the primary ENS name or null if none is set.
 *
 * @param walletAddress - The Ethereum address to resolve
 * @param options - Additional TanStack Query options
 * @returns UseQueryResult containing ENSResolutionResponse with ensName
 *
 * @example
 * ```typescript
 * const { data } = useENSFromWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');
 * if (data?.success && data.ensName) {
 *   console.log(`ENS name: ${data.ensName}`);
 * }
 * ```
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
 * Forward resolves an ENS domain name to its associated Ethereum wallet address.
 *
 * Only enabled when the input contains a dot (e.g., `vitalik.eth`, `example.box`).
 *
 * @param ensName - The ENS domain name to resolve
 * @param options - Additional TanStack Query options
 * @returns UseQueryResult containing WalletResolutionResponse with walletAddress
 *
 * @example
 * ```typescript
 * const { data } = useWalletFromENS('vitalik.eth');
 * if (data?.success && data.walletAddress) {
 *   console.log(`Wallet: ${data.walletAddress}`);
 * }
 * ```
 */
const useWalletFromENS = (
  ensName: string,
  options?: UseQueryOptions<WalletResolutionResponse>
): UseQueryResult<WalletResolutionResponse> => {
  return useQuery({
    queryKey: ['nameservice', 'ens', 'from-name', ensName],
    queryFn: async (): Promise<WalletResolutionResponse> => {
      try {
        // Resolve ENS name to wallet address using viem
        const walletAddress = await resolveENSName(ensName);
        return {
          nameService: 'ens',
          domain: ensName,
          walletAddress: walletAddress || null,
          success: !!walletAddress,
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
    // Enable for any domain name (contains a dot)
    enabled: !!ensName && ensName.includes('.'),
    ...options,
  });
};

/**
 * Reverse resolves a Solana wallet address to its primary SNS (Bonfida) name.
 *
 * Only enabled when the input is a non-Ethereum address (does not start with `0x`).
 *
 * @param walletAddress - The Solana address to resolve
 * @param options - Additional TanStack Query options
 * @returns UseQueryResult containing SNSResolutionResponse with snsName
 *
 * @example
 * ```typescript
 * const { data } = useSNSFromWallet('Crf8hzfthWGbGbLTVCiqRqV5MVnbpHB1L9KQMd6gsinb');
 * if (data?.success && data.snsName) {
 *   console.log(`SNS name: ${data.snsName}`);
 * }
 * ```
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
 * Forward resolves an SNS (Bonfida) domain name to its associated Solana wallet address.
 *
 * Only enabled when the input contains a dot (e.g., `bonfida.sol`).
 *
 * @param snsName - The SNS domain name to resolve
 * @param options - Additional TanStack Query options
 * @returns UseQueryResult containing WalletResolutionResponse with walletAddress
 *
 * @example
 * ```typescript
 * const { data } = useWalletFromSNS('bonfida.sol');
 * if (data?.success && data.walletAddress) {
 *   console.log(`Wallet: ${data.walletAddress}`);
 * }
 * ```
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
    // Enable for any domain name (contains a dot)
    enabled: !!snsName && snsName.includes('.'),
    ...options,
  });
};

/**
 * Auto-detecting unified name service resolver.
 *
 * Determines the appropriate resolution strategy based on the input:
 * - Ethereum address (starts with `0x`) -> ENS reverse resolution
 * - Solana address (base58, no `0x` prefix) -> SNS reverse resolution
 * - Domain name (contains `.`) -> SNS forward resolution, then ENS fallback
 *
 * @param input - A wallet address or domain name to resolve
 * @param options - Additional TanStack Query options
 * @returns UseQueryResult containing either ENSResolutionResponse or SNSResolutionResponse
 *
 * @example
 * ```typescript
 * const { data } = useNameServiceResolution(userInput);
 * if (data?.success) {
 *   // data contains either ensName or snsName depending on input type
 * }
 * ```
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
      } else if (input.includes('.')) {
        // Input is a domain name - try SNS first, then ENS
        // SNS resolution is implemented, ENS->wallet is not yet
        try {
          const walletAddress = await resolveSNSDomain(input);
          if (walletAddress) {
            return {
              address: walletAddress,
              snsName: input,
              success: true,
            };
          }
        } catch {
          // SNS resolution failed, continue to fallback
        }

        // ENS->wallet resolution is not implemented yet
        // Return the domain name with success: false
        return {
          address: '',
          ensName: input,
          success: false,
        };
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
