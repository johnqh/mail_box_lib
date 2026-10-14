import { describe, it, expect } from 'vitest';
import { ChainType } from '@sudobility/types';
import {
  buildFromIdentities,
  classifyIdentityKind,
  defaultFromIdentity,
  findIdentityForAddress,
  replyFromAddress,
  type FromIdentityAccount,
} from '../from-identity';

const WALLET = '0x1111111111111111111111111111111111111111';

const accounts: FromIdentityAccount[] = [
  { username: WALLET, walletAddress: WALLET, chainType: ChainType.EVM },
  { username: 'vitalik.eth', walletAddress: WALLET, chainType: ChainType.EVM },
  {
    username: 'john',
    walletAddress: WALLET,
    chainType: ChainType.EVM,
    isCustom: true,
  },
];

describe('from-identity', () => {
  describe('classifyIdentityKind', () => {
    it('classifies wallet, name, and custom accounts', () => {
      expect(classifyIdentityKind(accounts[0])).toBe('wallet');
      expect(classifyIdentityKind(accounts[1])).toBe('name');
      expect(classifyIdentityKind(accounts[2])).toBe('custom');
    });
  });

  describe('buildFromIdentities', () => {
    it('builds full addresses and lowercases only the domain', () => {
      const identities = buildFromIdentities(accounts, 'Signic.Email');
      expect(identities.map(i => i.address)).toEqual([
        `${WALLET}@signic.email`,
        'vitalik.eth@signic.email',
        'john@signic.email',
      ]);
    });
  });

  describe('defaultFromIdentity', () => {
    it('prefers custom > name > wallet', () => {
      const identities = buildFromIdentities(accounts, 'signic.email');
      expect(defaultFromIdentity(identities)?.address).toBe(
        'john@signic.email'
      );
    });

    it('falls back to name then wallet', () => {
      const noCustom = buildFromIdentities(
        accounts.slice(0, 2),
        'signic.email'
      );
      expect(defaultFromIdentity(noCustom)?.address).toBe(
        'vitalik.eth@signic.email'
      );
      const walletOnly = buildFromIdentities([accounts[0]], 'signic.email');
      expect(defaultFromIdentity(walletOnly)?.address).toBe(
        `${WALLET}@signic.email`
      );
    });
  });

  describe('findIdentityForAddress', () => {
    it('matches ignoring +tag', () => {
      const identities = buildFromIdentities(accounts, 'signic.email');
      expect(
        findIdentityForAddress(identities, 'john+amazon@signic.email')?.username
      ).toBe('john');
    });
  });

  describe('replyFromAddress', () => {
    it('mirrors the delivered-to address including the tag', () => {
      const identities = buildFromIdentities(accounts, 'signic.email');
      expect(
        replyFromAddress(identities, {
          deliveredTo: 'john+amazon@signic.email',
        })
      ).toBe('john+amazon@signic.email');
    });

    it('falls back to a matching recipient', () => {
      const identities = buildFromIdentities(accounts, 'signic.email');
      expect(
        replyFromAddress(identities, {
          recipientAddresses: [
            'someone@else.com',
            'vitalik.eth+news@signic.email',
          ],
        })
      ).toBe('vitalik.eth+news@signic.email');
    });

    it('falls back to the default identity when nothing matches', () => {
      const identities = buildFromIdentities(accounts, 'signic.email');
      expect(
        replyFromAddress(identities, { deliveredTo: 'stranger@elsewhere.com' })
      ).toBe('john@signic.email');
    });
  });
});
