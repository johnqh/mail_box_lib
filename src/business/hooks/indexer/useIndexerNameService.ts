import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { NameResolutionResponse, NameServiceResponse } from '@johnqh/types';
import { IndexerClient } from '../../../network/clients/indexer';
import { STALE_TIMES } from '../../core/query';

/**
 * Hook to get all ENS/SNS names for a wallet address (signature-protected)
 * GET /wallets/:walletAddress/names
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @param walletAddress - Wallet address to query names for
 * @param signature - Wallet signature for authentication
 * @param message - Signed message for authentication
 * @param options - Additional React Query options
 * @returns Query result with names data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useWalletNames(
 *   'https://indexer.0xmail.box',
 *   false,
 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   signature,
 *   message
 * );
 *
 * if (data?.success) {
 *   console.log('Names:', data.data.names); // ['vitalik.eth', 'example.eth']
 * }
 * ```
 */
export const useWalletNames = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<NameServiceResponse>
): UseQueryResult<NameServiceResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'wallet-names', walletAddress],
    queryFn: async (): Promise<NameServiceResponse> => {
      return await client.getWalletNames(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!walletAddress && !!signature && !!message,
    ...options,
  });
};

/**
 * Hook to resolve ENS/SNS name to wallet address (public endpoint)
 * GET /wallets/named/:name
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @param name - ENS/SNS name to resolve
 * @param options - Additional React Query options
 * @returns Query result with wallet data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useResolveNameToAddress(
 *   'https://indexer.0xmail.box',
 *   false,
 *   'vitalik.eth'
 * );
 *
 * if (data?.success) {
 *   console.log('Wallet:', data.data.address);
 *   console.log('Chain:', data.data.chainType);
 * }
 * ```
 */
export const useResolveNameToAddress = (
  endpointUrl: string,
  dev: boolean,
  name: string,
  options?: UseQueryOptions<NameResolutionResponse>
): UseQueryResult<NameResolutionResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'resolve-name', name],
    queryFn: async (): Promise<NameResolutionResponse> => {
      return await client.resolveNameToAddress(name);
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!name,
    ...options,
  });
};
