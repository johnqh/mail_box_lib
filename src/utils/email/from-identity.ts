/**
 * From-identity selection for composing and replying.
 *
 * A user can send from several addresses: their wallet address, any ENS/SNS
 * name they own, and a user-defined (custom) address. This module turns the
 * flat account list into full `username@domain` identities and implements:
 *   - default From for new mail: custom > ENS/SNS > wallet,
 *   - reply From: mirror the exact address the original was delivered to
 *     (including any "+tag"), falling back to a matching recipient, then the
 *     default identity.
 *
 * Pure and dependency-light so the web and React Native apps can share it.
 */

import { ChainType, Optional } from '@sudobility/types';
import { parseSubaddress, sameBaseAddress } from './plus-addressing';

export type FromIdentityKind = 'custom' | 'name' | 'wallet';

/** Minimal account shape needed to derive a From identity (matches WildDuckAccount). */
export interface FromIdentityAccount {
  /** Local part: wallet address, ENS/SNS name, or custom address. */
  username: string;
  walletAddress: string;
  chainType: ChainType;
  /** True when this is the wallet's user-defined (custom) address. */
  isCustom?: boolean;
}

export interface FromIdentity {
  /** Full email address: `username@domain` (domain lowercased). */
  address: string;
  username: string;
  walletAddress: string;
  chainType: ChainType;
  kind: FromIdentityKind;
}

/** Default From priority: custom first, then ENS/SNS names, then wallet. */
const KIND_PRIORITY: Record<FromIdentityKind, number> = {
  custom: 0,
  name: 1,
  wallet: 2,
};

/** Classify an account into a From-identity kind. */
export function classifyIdentityKind(
  account: FromIdentityAccount
): FromIdentityKind {
  if (account.isCustom) return 'custom';
  if (account.username.toLowerCase() === account.walletAddress.toLowerCase()) {
    return 'wallet';
  }
  return 'name';
}

/**
 * Build the list of full From identities from the user's accounts. The local
 * part case is preserved (Solana addresses are case-sensitive); only the domain
 * is lowercased.
 */
export function buildFromIdentities(
  accounts: FromIdentityAccount[],
  emailDomain: string
): FromIdentity[] {
  const domain = (emailDomain || '').trim().toLowerCase();
  return (accounts || []).map(account => ({
    address: `${account.username}@${domain}`,
    username: account.username,
    walletAddress: account.walletAddress,
    chainType: account.chainType,
    kind: classifyIdentityKind(account),
  }));
}

/**
 * Pick the default From identity for a new message: the highest-priority kind
 * (custom > name > wallet), preserving input order within a kind.
 */
export function defaultFromIdentity(
  identities: FromIdentity[]
): Optional<FromIdentity> {
  if (!identities || identities.length === 0) return undefined;
  return identities.reduce((best, current) =>
    KIND_PRIORITY[current.kind] < KIND_PRIORITY[best.kind] ? current : best
  );
}

/** Find the identity whose base address matches the given address (ignoring +tag). */
export function findIdentityForAddress(
  identities: FromIdentity[],
  address: Optional<string>
): Optional<FromIdentity> {
  if (!address) return undefined;
  return identities.find(identity =>
    sameBaseAddress(identity.address, address)
  );
}

export interface ReplyFromOptions {
  /**
   * The exact address the original message was delivered to (from
   * `Message.deliveredTo`); preserved verbatim, including any "+tag".
   */
  deliveredTo?: Optional<string>;
  /**
   * Fallback recipient addresses from the original message (To then Cc), used
   * when `deliveredTo` is unavailable. The first one that matches an owned
   * identity (by base address) is reused verbatim.
   */
  recipientAddresses?: Optional<string[]>;
}

/**
 * Choose the From address for a reply. Mirrors the delivered-to address
 * (keeping any "+tag") when it belongs to the user; otherwise reuses the first
 * matching recipient; otherwise falls back to the default identity.
 */
export function replyFromAddress(
  identities: FromIdentity[],
  options: ReplyFromOptions = {}
): Optional<string> {
  const { deliveredTo, recipientAddresses } = options;

  // 1. Mirror the delivered-to address when it belongs to one of our identities.
  if (deliveredTo && parseSubaddress(deliveredTo)) {
    if (findIdentityForAddress(identities, deliveredTo)) {
      return deliveredTo.trim();
    }
  }

  // 2. Otherwise reuse the first recipient that matches an owned identity.
  if (recipientAddresses) {
    for (const candidate of recipientAddresses) {
      if (candidate && findIdentityForAddress(identities, candidate)) {
        return candidate.trim();
      }
    }
  }

  // 3. Otherwise fall back to the default identity.
  return defaultFromIdentity(identities)?.address;
}
