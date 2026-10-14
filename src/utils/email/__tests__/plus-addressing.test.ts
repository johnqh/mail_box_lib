import { describe, it, expect } from 'vitest';
import {
  parseSubaddress,
  stripSubaddressTag,
  getSubaddressTag,
  hasSubaddressTag,
  buildSubaddress,
  sameBaseAddress,
} from '../plus-addressing';

describe('plus-addressing', () => {
  describe('parseSubaddress', () => {
    it('parses an address with a tag', () => {
      expect(parseSubaddress('john+amazon@signic.email')).toEqual({
        localPart: 'john+amazon',
        baseLocal: 'john',
        tag: 'amazon',
        domain: 'signic.email',
      });
    });

    it('parses an address without a tag', () => {
      expect(parseSubaddress('john@signic.email')).toEqual({
        localPart: 'john',
        baseLocal: 'john',
        tag: null,
        domain: 'signic.email',
      });
    });

    it('keeps only the first + as the separator', () => {
      const parsed = parseSubaddress('a+b+c@signic.email');
      expect(parsed?.baseLocal).toBe('a');
      expect(parsed?.tag).toBe('b+c');
    });

    it('returns null for invalid addresses', () => {
      expect(parseSubaddress('no-at-sign')).toBeNull();
      expect(parseSubaddress('a@b@c')).toBeNull();
      expect(parseSubaddress('+tag@signic.email')).toBeNull();
      expect(parseSubaddress('')).toBeNull();
    });
  });

  describe('stripSubaddressTag', () => {
    it('removes the tag and lowercases the domain', () => {
      expect(stripSubaddressTag('john+amazon@Signic.Email')).toBe(
        'john@signic.email'
      );
    });

    it('is a no-op for untagged addresses', () => {
      expect(stripSubaddressTag('john@signic.email')).toBe('john@signic.email');
    });
  });

  describe('getSubaddressTag / hasSubaddressTag', () => {
    it('returns the tag or null', () => {
      expect(getSubaddressTag('john+ebay@signic.email')).toBe('ebay');
      expect(getSubaddressTag('john@signic.email')).toBeNull();
      expect(hasSubaddressTag('john+ebay@signic.email')).toBe(true);
      expect(hasSubaddressTag('john@signic.email')).toBe(false);
    });
  });

  describe('buildSubaddress', () => {
    it('adds a tag to a base address', () => {
      expect(buildSubaddress('john@signic.email', 'amazon')).toBe(
        'john+amazon@signic.email'
      );
    });

    it('replaces an existing tag', () => {
      expect(buildSubaddress('john+old@signic.email', 'new')).toBe(
        'john+new@signic.email'
      );
    });

    it('strips the tag when given an empty tag', () => {
      expect(buildSubaddress('john+old@signic.email', '')).toBe(
        'john@signic.email'
      );
      expect(buildSubaddress('john+old@signic.email', null)).toBe(
        'john@signic.email'
      );
    });
  });

  describe('sameBaseAddress', () => {
    it('matches addresses with the same base, ignoring tag and case', () => {
      expect(
        sameBaseAddress('john+amazon@signic.email', 'JOHN@Signic.Email')
      ).toBe(true);
      expect(
        sameBaseAddress('john+a@signic.email', 'john+b@signic.email')
      ).toBe(true);
    });

    it('does not match different base local parts or domains', () => {
      expect(
        sameBaseAddress('john@signic.email', 'jane@signic.email')
      ).toBe(false);
      expect(
        sameBaseAddress('john@signic.email', 'john@other.email')
      ).toBe(false);
    });
  });
});
