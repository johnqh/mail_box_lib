/**
 * Tests for useSelectedAccount hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ChainType, NetworkClient } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import {
  setGlobalState,
  getGlobalState,
  createGlobalState,
} from '../../../../utils/useGlobalState';

// Create global states needed for tests
createGlobalState('walletAccounts', []);
createGlobalState('walletStatus', undefined);
createGlobalState('selectedAccount', undefined);

const mockUseWalletAccounts = vi.fn();
const mockUseWalletStatus = vi.fn();
const mockAuthenticate = vi.fn();

// Mock NetworkClient
const mockNetworkClient: NetworkClient = {
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../useWalletAccounts', () => ({
  useWalletAccounts: (...args: unknown[]) => mockUseWalletAccounts(...args),
}));

vi.mock('../useWalletStatus', () => ({
  useWalletStatus: (...args: unknown[]) => mockUseWalletStatus(...args),
}));

vi.mock('@sudobility/wildduck_client', () => ({
  useWildduckAuth: () => ({
    authenticate: (...args: unknown[]) => mockAuthenticate(...args),
  }),
}));

import { useSelectedAccount } from '../useSelectedAccount';

describe('useSelectedAccount', () => {
  const mockStorage = {} as StorageService;
  const endpointUrl = 'https://wildduck.test';

  beforeEach(() => {
    vi.clearAllMocks();
    setGlobalState('selectedAccount', undefined);
    setGlobalState('walletAccounts', []);
    setGlobalState('walletStatus', undefined);
  });

  it('clears selected account when walletAddress does not match signer', async () => {
    const accountOne = {
      walletAddress: '0x1111111111111111111111111111111111111111',
      chainType: ChainType.EVM,
      username: '0x1111111111111111111111111111111111111111',
      entitled: true,
    };

    // When wallet changes, useWalletAccounts returns empty accounts
    // (this is handled by useWalletAccounts logic when signer doesn't match)
    mockUseWalletAccounts.mockReturnValue({
      accounts: [], // Empty accounts when wallet doesn't match
      indexerAuth: undefined,
      refresh: vi.fn(),
    });

    // Set initial selected account
    setGlobalState('selectedAccount', accountOne);

    renderHook(() =>
      useSelectedAccount(
        mockNetworkClient,
        endpointUrl,
        false
      )
    );

    // useSelectedAccount should clear selection when accounts become empty
    await waitFor(() => {
      expect(getGlobalState('selectedAccount')).toBeUndefined();
    });

    expect(mockAuthenticate).not.toHaveBeenCalled();
  });
});
