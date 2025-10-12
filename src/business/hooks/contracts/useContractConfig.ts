/**
 * React hook for managing contract configurations
 * Provides utilities for setting up chain configs for UnifiedMailBoxClient
 */

import { useCallback, useState } from 'react';
import type {
  ChainConfig,
  EVMConfig,
  SolanaConfig,
} from '@sudobility/contracts';
import { ChainType } from '@sudobility/types';

interface UseContractConfigReturn {
  // Current configurations
  config: ChainConfig | null;
  evmConfig: EVMConfig | null;
  solanaConfig: SolanaConfig | null;

  // Configuration builders
  setEVMConfig: (config: EVMConfig) => void;
  setSolanaConfig: (config: SolanaConfig) => void;
  setFullConfig: (config: ChainConfig) => void;

  // Preset configurations
  getMainnetEVMConfig: (
    contractAddresses?: Partial<EVMConfig['contracts']>
  ) => EVMConfig;
  getDevnetSolanaConfig: (
    programAddresses?: Partial<SolanaConfig['programs']>
  ) => SolanaConfig;

  // Utilities
  isConfigValid: () => boolean;
  getActiveChains: () => ChainType[];
  clearConfig: () => void;
}

/**
 * Hook for managing contract configurations for different chains
 */
export const useContractConfig = (): UseContractConfigReturn => {
  const [config, setConfig] = useState<ChainConfig | null>(null);

  const setEVMConfig = useCallback((evmConfig: EVMConfig) => {
    setConfig((prev: ChainConfig | null) => ({
      ...prev,
      evm: evmConfig,
    }));
  }, []);

  const setSolanaConfig = useCallback((solanaConfig: SolanaConfig) => {
    setConfig((prev: ChainConfig | null) => ({
      ...prev,
      solana: solanaConfig,
    }));
  }, []);

  const setFullConfig = useCallback((newConfig: ChainConfig) => {
    setConfig(newConfig);
  }, []);

  const getMainnetEVMConfig = useCallback(
    (contractAddresses?: Partial<EVMConfig['contracts']>): EVMConfig => {
      return {
        rpc: 'https://ethereum-rpc.publicnode.com',
        chainId: 1,
        contracts: {
          mailer:
            contractAddresses?.mailer ||
            '0x0000000000000000000000000000000000000000',
          usdc:
            contractAddresses?.usdc ||
            '0xA0b86a33E6441c41A0B7F98fF6C99EDf6dE4E1D1', // Mainnet USDC
        },
      };
    },
    []
  );

  const getDevnetSolanaConfig = useCallback(
    (programAddresses?: Partial<SolanaConfig['programs']>): SolanaConfig => {
      return {
        rpc: 'https://api.devnet.solana.com',
        usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
        programs: {
          mailer:
            programAddresses?.mailer || '11111111111111111111111111111111',
        },
      };
    },
    []
  );

  const isConfigValid = useCallback((): boolean => {
    if (!config) return false;

    // Check if at least one chain is configured
    const hasEVM = !!(
      config.evm &&
      config.evm.rpc &&
      config.evm.chainId &&
      config.evm.contracts &&
      config.evm.contracts.mailer &&
      config.evm.contracts.usdc
    );

    const hasSolana = !!(
      config.solana &&
      config.solana.rpc &&
      config.solana.usdcMint &&
      config.solana.programs &&
      config.solana.programs.mailer
    );

    return hasEVM || hasSolana;
  }, [config]);

  const getActiveChains = useCallback((): ChainType[] => {
    const chains: ChainType[] = [];

    if (config?.evm) {
      chains.push(ChainType.EVM);
    }

    if (config?.solana) {
      chains.push(ChainType.SOLANA);
    }

    return chains;
  }, [config]);

  const clearConfig = useCallback(() => {
    setConfig(null);
  }, []);

  return {
    config,
    evmConfig: config?.evm || null,
    solanaConfig: config?.solana || null,
    setEVMConfig,
    setSolanaConfig,
    setFullConfig,
    getMainnetEVMConfig,
    getDevnetSolanaConfig,
    isConfigValid,
    getActiveChains,
    clearConfig,
  };
};

export type { UseContractConfigReturn };
