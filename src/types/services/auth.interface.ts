/**
 * Platform-agnostic authentication service interface
 * This interface defines the contract for authentication operations that work across web and React Native
 */

import { ChainType, AuthStatus } from "../../business/core/enums";
import { EmailAddress } from "../email";

export interface WalletUserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  walletAddress: string;
  chainType: ChainType;
  emailAddresses: EmailAddress[];
  signedMessage?: string;
  signature?: string;
  createdAt: Date;
}

/**
 * Platform-agnostic authentication service interface
 */
export interface AuthService {
  /**
   * Connect to wallet
   * @returns Promise<boolean> indicating success
   */
  connectWallet(): Promise<boolean>;

  /**
   * Disconnect from wallet
   */
  disconnect(): Promise<void>;

  /**
   * Sign a message with the connected wallet
   * @param message Message to sign
   * @returns Promise<string> with the signature
   */
  signMessage(message: string): Promise<string>;

  /**
   * Get current wallet address
   * @returns Current wallet address or null if not connected
   */
  getWalletAddress(): string | null;

  /**
   * Get current chain type
   * @returns Current chain type
   */
  getChainType(): ChainType;

  /**
   * Get connection status
   * @returns Boolean indicating if wallet is connected
   */
  isConnected(): boolean;

  /**
   * Get authentication status
   * @returns Current authentication status
   */
  getAuthStatus(): AuthStatus;

  /**
   * Listen for wallet connection changes
   * @param callback Function to call when connection status changes
   */
  onConnectionChange(callback: (address: string | null, chainType: ChainType) => void): void;

  /**
   * Remove connection change listener
   * @param callback Function to remove from listeners
   */
  offConnectionChange(callback: (address: string | null, chainType: ChainType) => void): void;
}

/**
 * Platform-agnostic storage service for user data
 */
export interface AuthStorageService {
  /**
   * Store user data for a wallet address
   * @param walletAddress Wallet address
   * @param userData User data to store
   */
  storeUserData(walletAddress: string, userData: WalletUserData): Promise<void>;

  /**
   * Get user data for a wallet address
   * @param walletAddress Wallet address
   * @returns User data or null if not found
   */
  getUserData(walletAddress: string): Promise<WalletUserData | null>;

  /**
   * Remove user data for a wallet address
   * @param walletAddress Wallet address
   */
  removeUserData(walletAddress: string): Promise<void>;

  /**
   * Check if user data exists for a wallet address
   * @param walletAddress Wallet address
   * @returns Boolean indicating if user data exists
   */
  hasUserData(walletAddress: string): Promise<boolean>;
}

/**
 * Platform-agnostic email address service for authentication
 */
export interface AuthEmailAddressService {
  /**
   * Generate email addresses for a wallet address
   * @param walletAddress Wallet address
   * @param chainType Chain type
   * @returns Promise<EmailAddress[]> with generated email addresses
   */
  generateEmailAddresses(walletAddress: string, chainType: ChainType): Promise<EmailAddress[]>;

  /**
   * Refresh email addresses for a wallet address
   * @param walletAddress Wallet address
   * @param chainType Chain type
   * @returns Promise<EmailAddress[]> with refreshed email addresses
   */
  refreshEmailAddresses(walletAddress: string, chainType: ChainType): Promise<EmailAddress[]>;
}

/**
 * Combined authentication manager interface
 */
export interface AuthManager {
  /**
   * Current user data
   */
  userData: WalletUserData | null;

  /**
   * Current authentication status
   */
  authStatus: AuthStatus;

  /**
   * Current wallet address
   */
  walletAddress: string | null;

  /**
   * Current chain type
   */
  chainType: ChainType;

  /**
   * Whether wallet is connected
   */
  isConnected: boolean;

  /**
   * Whether user is authenticated (verified)
   */
  isAuthenticated: boolean;

  /**
   * Connect wallet
   */
  connectWallet(): Promise<boolean>;

  /**
   * Sign message and authenticate
   */
  signMessage(): Promise<boolean>;

  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;

  /**
   * Refresh email addresses
   */
  refreshEmailAddresses(): Promise<void>;

  /**
   * Listen for authentication state changes
   */
  onAuthStateChange(callback: (authManager: AuthManager) => void): void;

  /**
   * Remove authentication state change listener
   */
  offAuthStateChange(callback: (authManager: AuthManager) => void): void;
}