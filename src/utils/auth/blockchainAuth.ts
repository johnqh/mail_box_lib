/**
 * Blockchain Authentication Utilities
 * Compatible with WildDuck's blockchain authentication system
 */

import { ChainType } from './addressDetection';

export interface SigninMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string | number;
  nonce: string;
  issuedAt: string;
}

/**
 * Create a Sign-in with Ethereum (SIWE) message compatible with WildDuck
 */
export const createSIWEMessage = (
  domain: string,
  address: string,
  nonce: string,
  issuedAt: Date = new Date()
): string => {
  const uri = `https://${domain}`;
  const version = '1';
  const chainId = 1; // Ethereum mainnet

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to ${domain}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt.toISOString()}`;
};

/**
 * Create a Sign-in with Solana message compatible with WildDuck
 */
export const createSolanaSignMessage = (
  domain: string,
  address: string,
  nonce: string,
  issuedAt: Date = new Date()
): string => {
  return `${domain} wants you to sign in with your Solana account:
${address}

Sign in to ${domain}

Nonce: ${nonce}
Issued At: ${issuedAt.toISOString()}`;
};

/**
 * Generate a random nonce for signature messages (compatible with WildDuck)
 */
export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Create WildDuck-compatible authentication message
 * @deprecated WildDuck now accepts any valid signature from the wallet address
 * This function is kept for backward compatibility
 */
export const createWildDuckAuthMessage = (
  nonce: string
): string => {
  return `Sign in to WildDuck\nNonce: ${nonce}`;
};

/**
 * Create authentication message based on chain type
 * WildDuck now verifies signatures against the nonce directly
 */
export const createAuthMessage = (
  chainType: ChainType,
  address: string,
  domain: string = '0xmail.box',
  nonce?: string,
  issuedAt?: Date
): { message: string; nonce: string } => {
  const authNonce = nonce || generateNonce();
  
  // For WildDuck compatibility, sign the nonce directly
  if (domain === '0xmail.box' || domain.includes('wildduck')) {
    return {
      message: authNonce, // Sign the nonce directly
      nonce: authNonce
    };
  }
  
  // For other domains, use standard SIWE/Solana messages
  const authIssuedAt = issuedAt || new Date();
  let message: string;
  
  if (chainType === 'solana') {
    message = createSolanaSignMessage(domain, address, authNonce, authIssuedAt);
  } else {
    // Default to SIWE for EVM chains
    message = createSIWEMessage(domain, address, authNonce, authIssuedAt);
  }
  
  return {
    message,
    nonce: authNonce
  };
};

/**
 * Convert signature format for WildDuck compatibility
 * - EVM signatures: Convert to Base64 (per AUTHENTICATION.md lines 88-90)
 * - Solana signatures: Keep as base58 (per AUTHENTICATION.md lines 91-92, 369)
 */
export const formatSignatureForWildDuck = (
  signature: string | Uint8Array,
  chainType: ChainType
): string => {
  if (!signature) {
    throw new Error('Signature is null or undefined');
  }

  if (chainType === 'solana') {
    // For Solana, keep signature in base58 format (NOT base64)
    if (signature instanceof Uint8Array) {
      // Validate signature length for Solana (should be 64 bytes)
      if (signature.length !== 64) {
        throw new Error(`Invalid Solana signature length: expected 64, got ${signature.length}`);
      }
      // Convert Uint8Array to base58 (not base64)
      const bs58 = require('bs58');
      return bs58.encode(signature);
    }
    // If it's already a string, validate and return as base58
    const stringSig = signature as string;
    if (stringSig.length === 0) {
      throw new Error('Empty Solana signature string');
    }
    // Assume it's already base58 encoded, return as-is
    return stringSig;
  } else {
    // For EVM chains, convert signature to Base64
    if (signature instanceof Uint8Array) {
      // Validate signature length for EVM (should be 65 bytes)
      if (signature.length !== 65) {
        console.warn(`Unexpected EVM signature length: expected 65, got ${signature.length}`);
      }
      // Convert Uint8Array to Base64
      return Buffer.from(signature).toString('base64');
    }
    
    // Convert hex string to Base64
    const hexSig = signature as string;
    if (hexSig.length === 0) {
      throw new Error('Empty EVM signature string');
    }
    
    // Clean hex format (remove 0x prefix if present)
    const cleanHex = hexSig.startsWith('0x') ? hexSig.slice(2) : hexSig;
    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
      throw new Error('Invalid hex signature format');
    }
    
    // Convert hex to bytes then to Base64
    const signatureBytes = Buffer.from(cleanHex, 'hex');
    return signatureBytes.toString('base64');
  }
};

/**
 * Validate blockchain username format (compatible with WildDuck validators)
 */
export const isValidBlockchainUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  const cleanUsername = username.trim().toLowerCase();
  
  // EVM address
  if (isEVMAddress(cleanUsername)) {
    return true;
  }
  
  // Base64 encoded EVM address
  if (isBase64EVMAddress(cleanUsername)) {
    return true;
  }
  
  // Solana address
  if (isSolanaAddress(cleanUsername)) {
    return true;
  }
  
  // ENS name
  if (isENSName(cleanUsername)) {
    return true;
  }
  
  // SNS name
  if (isSNSName(cleanUsername)) {
    return true;
  }
  
  return false;
};

// Helper functions (matching WildDuck's validation logic)
const isEVMAddress = (address: string): boolean => {
  try {
    // Basic hex address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const isBase64EVMAddress = (encoded: string): boolean => {
  try {
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(encoded)) {
      return false;
    }
    const decoded = Buffer.from(encoded, 'base64').toString('hex');
    if (decoded.length !== 40) {
      return false;
    }
    const address = '0x' + decoded;
    return isEVMAddress(address);
  } catch {
    return false;
  }
};

const isSolanaAddress = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) {
      return false;
    }
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) {
      return false;
    }
    // Basic length validation for base58 decoded
    const bs58 = require('bs58');
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

const isENSName = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  if (!lowerName.endsWith('.eth') && !lowerName.endsWith('.box')) {
    return false;
  }
  const withoutTLD = lowerName.endsWith('.eth') 
    ? lowerName.slice(0, -4) 
    : lowerName.slice(0, -4);
  if (withoutTLD.length === 0) {
    return false;
  }
  const labels = withoutTLD.split('.');
  const validLabelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  for (const label of labels) {
    if (label.length === 0 || !validLabelRegex.test(label)) {
      return false;
    }
    if (label.includes('--')) {
      return false;
    }
  }
  return true;
};

const isSNSName = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  if (!lowerName.endsWith('.sol')) {
    return false;
  }
  const withoutTLD = lowerName.slice(0, -4);
  if (withoutTLD.length === 0) {
    return false;
  }
  const labels = withoutTLD.split('.');
  const validLabelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  for (const label of labels) {
    if (label.length === 0 || !validLabelRegex.test(label)) {
      return false;
    }
    if (label.includes('--')) {
      return false;
    }
  }
  return true;
};