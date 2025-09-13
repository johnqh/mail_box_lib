/**
 * Name Service hooks for ENS and SNS resolution
 */

// TanStack Query hooks
export {
  useENSFromWallet,
  useWalletFromENS,
  useSNSFromWallet,
  useWalletFromSNS,
  useNameServiceResolution,
  type ENSResolutionResponse,
  type SNSResolutionResponse,
  type WalletResolutionResponse,
} from './useNameServiceQueries';
