/**
 * Integration test for useMailApp wallet selection behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailApp } from '../useMailApp';
import {
  verifyWallet,
  disconnectWallet,
} from '../useWalletStatus';
import { ChainType } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';

const ADDRESS_ONE = '0x1111111111111111111111111111111111111111';
const ADDRESS_TWO = '0x2222222222222222222222222222222222222222';
const TEST_MESSAGE = 'Authenticate with 0xMail';
const SIGNATURE_ONE = 'signature-one';
const SIGNATURE_TWO = 'signature-two';

const walletAccountsByAddress = {
  [ADDRESS_ONE]: [
    {
      walletAddress: ADDRESS_ONE,
      chainType: ChainType.EVM,
      names: [],
    },
  ],
  [ADDRESS_TWO]: [
    {
      walletAddress: ADDRESS_TWO,
      chainType: ChainType.EVM,
      names: [],
    },
  ],
};

vi.mock('@sudobility/wildduck_client', () => ({
  useWildduckAuth: vi.fn(() => ({
    authenticate: vi.fn(),
  })),
}));

vi.mock('@sudobility/indexer_client', () => {
  const createResponse = (walletAddress: string) => ({
    data: {
      success: true,
      data: {
        accounts: walletAccountsByAddress[walletAddress] ?? [],
      },
    },
    isError: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  const responseCache = new Map<string, ReturnType<typeof createResponse>>();
  const baseResponse = {
    data: null,
    isError: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  return {
    useIndexerGetWalletAccounts: vi.fn(
      (_endpointUrl: string, _devMode: boolean, walletAddress: string) => {
        if (!walletAddress) {
          return baseResponse;
        }

        if (!responseCache.has(walletAddress)) {
          responseCache.set(walletAddress, createResponse(walletAddress));
        }

        return responseCache.get(walletAddress);
      }
    ),
  };
});

describe('useMailApp wallet selection flow', () => {
  const wildduckConfig = { backendUrl: 'https://wildduck.test', apiToken: '' };
  const indexerUrl = 'https://indexer.test';
  const mockStorage = {} as StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    disconnectWallet();
  });

  it('clears selected account when wallet disconnects and selects the new wallet', async () => {
    const { result } = renderHook(() =>
      useMailApp(indexerUrl, wildduckConfig, mockStorage, false)
    );

    // Step 1 & 2: Verify wallet with ADDRESS_ONE and ensure it becomes the selected account
    act(() => {
      verifyWallet(ADDRESS_ONE, ChainType.EVM, TEST_MESSAGE, SIGNATURE_ONE);
    });

    await waitFor(() => {
      expect(result.current.selectedAccount?.walletAddress).toBe(ADDRESS_ONE);
      expect(result.current.selectedAccount?.username).toBe(ADDRESS_ONE);
    });

    // Step 3 & 4: Disconnect wallet and ensure selected account is cleared
    act(() => {
      disconnectWallet();
    });

    await waitFor(() => {
      expect(result.current.selectedAccount).toBeUndefined();
    });

    // Step 5 & 6: Verify second wallet and ensure it becomes the new selection
    act(() => {
      verifyWallet(ADDRESS_TWO, ChainType.EVM, TEST_MESSAGE, SIGNATURE_TWO);
    });

  await waitFor(() => {
    expect(result.current.selectedAccount?.walletAddress).toBe(ADDRESS_TWO);
    expect(result.current.selectedAccount?.username).toBe(ADDRESS_TWO);
  });
  });
});
