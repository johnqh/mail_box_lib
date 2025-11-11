/**
 * React hook for managing user's selected chain with persistence
 * Persists chain selection across sessions using local storage
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ChainInfo, RpcHelpers } from '@sudobility/configs';
import { Chain, Optional } from '@sudobility/types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'selected-chain-choice';

export interface UseSelectedChainParams {
  /** Current chain ID from wallet connection (only used for initial selection) */
  chainId?: number;
  /** Whether to include test networks */
  isDev: boolean;
}

// Extended ChainInfo with Chain enum value
export interface ChainInfoWithEnum extends ChainInfo {
  chain: Chain;
}

export interface UseSelectedChainReturn {
  /** List of available chains based on isDev setting (augmented with Chain enum) */
  chains: ChainInfoWithEnum[];
  /** Currently selected chain */
  selectedChain: Chain;
  /** Function to update selected chain (only accepts chains from the chains list) */
  setSelectedChain: (chain: Chain) => void;
}

/**
 * Hook for managing user's selected chain with persistence across sessions
 *
 * The chain selection follows this priority:
 * 1. Previously selected chain from local storage
 * 2. Chain matching the provided chainId (on first use only)
 * 3. First non-testnet chain from available chains
 * 4. First chain from available chains
 *
 * @param params - Configuration parameters
 * @returns Object containing chains list, selected chain, and setter function
 *
 * @example
 * ```typescript
 * const { chains, selectedChain, setSelectedChain } = useSelectedChain({
 *   chainId: connectedWallet?.chainId,
 *   isDev: false
 * });
 *
 * // Display chain selector
 * <select value={selectedChain} onChange={(e) => setSelectedChain(e.target.value as Chain)}>
 *   {chains.map(c => (
 *     <option key={c.chain} value={c.chain}>{c.name}</option>
 *   ))}
 * </select>
 * ```
 */
export function useSelectedChain({
  chainId,
  isDev,
}: UseSelectedChainParams): UseSelectedChainReturn {
  // Get list of visible chains with Chain enum
  const chains = useMemo<ChainInfoWithEnum[]>(() => {
    const visibleChains = RpcHelpers.getVisibleChains(undefined, isDev);
    // getVisibleChains already returns objects with chain property
    return visibleChains as ChainInfoWithEnum[];
  }, [isDev]);

  // Track if this is the first render (for chainId initialization)
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Helper to find a chain in the chains list (assumes targetChain is valid)
  const findChainInList = useCallback(
    (targetChain: Chain): Optional<Chain> => {
      const found = chains.find(c => c.chain === targetChain);
      return found?.chain ?? null;
    },
    [chains]
  );

  // Helper to find chain by chainId (assumes targetChainId is valid)
  const findChainByChainId = useCallback(
    (targetChainId: number): Optional<Chain> => {
      const found = chains.find(c => c.chainId === targetChainId);
      return found?.chain ?? null;
    },
    [chains]
  );

  // Helper to get default chain (non-testnet first, then first available)
  const getDefaultChain = useCallback((): Chain => {
    // Try to find first non-testnet chain
    const nonTestnetChain = chains.find(c => !c.isTestNet);
    if (nonTestnetChain) {
      return nonTestnetChain.chain;
    }

    // Fall back to first available chain (even if testnet)
    const firstChain = chains[0];
    if (firstChain) {
      return firstChain.chain;
    }

    // Final fallback if no chains available - this should never happen
    const fallback = isDev ? Chain.ETH_SEPOLIA : Chain.ETH_MAINNET;
    console.warn(
      `No valid chains available, falling back to ${fallback}. This indicates a configuration issue.`
    );
    return fallback;
  }, [chains, isDev]);

  // Use local storage to persist selection
  const [storedChain, setStoredChain] = useLocalStorage<Optional<Chain>>(
    STORAGE_KEY,
    null
  );

  // Determine the selected chain
  const selectedChain = useMemo<Chain>(() => {
    // Priority 1: Use stored chain if it exists in current chains list
    if (storedChain) {
      const validStoredChain = findChainInList(storedChain);
      if (validStoredChain) {
        return validStoredChain;
      }
    }

    // Priority 2: On first render only, try to match chainId from wallet
    if (isFirstRender && chainId) {
      const chainFromId = findChainByChainId(chainId);
      if (chainFromId) {
        return chainFromId;
      }
    }

    // Priority 3 & 4: Use default chain logic
    return getDefaultChain();
  }, [
    storedChain,
    findChainInList,
    isFirstRender,
    chainId,
    findChainByChainId,
    getDefaultChain,
  ]);

  // Persist selected chain on first render
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      // If chain was selected from chainId or default, persist it
      if (!storedChain) {
        setStoredChain(selectedChain);
      }
    }
    // Only respond to first render flag changes, not selectedChain changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstRender, storedChain, setStoredChain]);

  // Function to update selected chain (with validation)
  const setSelectedChain = useCallback(
    (newChain: Chain) => {
      // Only allow setting chains that exist in the current chains list
      const isValidChain = chains.some(c => c.chain === newChain);
      if (!isValidChain) {
        const availableChains = chains.map(c => c.chain).join(', ');
        console.error(
          `Invalid chain selection: ${newChain}. Must be one of: ${availableChains}`
        );
        return;
      }

      setStoredChain(newChain);
    },
    [chains, setStoredChain]
  );

  return {
    chains,
    selectedChain,
    setSelectedChain,
  };
}
