// Application constants
// For UI-related constants (gradients, spacing, etc.), see:
// - ./gradients.ts - Gradient utilities and color schemes
// - ./ui-constants.ts - Layout, typography, and component patterns

// API Configuration
const API_BASE_URL = 'https://0xmail.box';
const API_TIMEOUT = 30000; // 30 seconds
const API_RETRY_ATTEMPTS = 3;
const API_RETRY_DELAY = 1000; // 1 second

// Authentication
const AUTH_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  VERIFIED: 'verified',
} as const;

// Chain Types
const CHAIN_TYPE = {
  EVM: 'evm',
  SOLANA: 'solana',
  UNKNOWN: 'unknown',
} as const;

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  EMAIL_CACHE: 'emailCache',
  WALLET_ADDRESS: 'walletAddress',
  CHAIN_TYPE: 'chainType',
} as const;

// Email Configuration
const EMAIL_CONFIG = {
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_RECIPIENTS: 100,
  ITEMS_PER_PAGE: 50,
  REFRESH_INTERVAL: 60000, // 1 minute
  NOTIFICATION_COOLDOWN: 300000, // 5 minutes
} as const;

// Subscription Tiers
const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Time Formats
const TIME_FORMAT = {
  SHORT_DATE: 'MMM d',
  FULL_DATE: 'MMM d, yyyy',
  DATE_TIME: 'MMM d, yyyy h:mm a',
  RELATIVE: 'relative',
} as const;

// Error Messages
const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_ADDRESS: 'Please enter a valid address',
  NETWORK_ERROR: 'Network error. Please try again.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please sign in again.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this operation',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
} as const;

// Success Messages
const SUCCESS_MESSAGES = {
  EMAIL_SENT: 'Email sent successfully',
  EMAIL_DELETED: 'Email deleted successfully',
  PREFERENCES_SAVED: 'Preferences saved successfully',
  WALLET_CONNECTED: 'Wallet connected successfully',
  AUTHENTICATION_SUCCESS: 'Authentication successful',
  DELEGATION_SUCCESS: 'Delegation successful',
  SUBSCRIPTION_ACTIVATED: 'Subscription activated successfully',
} as const;

// Routes
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONNECT: '/connect',
  MAIL: '/mail',
  COMPOSE: '/mail/compose',
  PREFERENCES: '/preferences',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  DOCUMENTATION: '/document',
  WEB3_USERS: '/web3-users',
  WEB3_PROJECTS: '/web3-projects',
} as const;

// External Links
const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/0xmailbox',
  TWITTER: 'https://twitter.com/0xmailbox',
  DISCORD: 'https://discord.gg/0xmailbox',
  DOCUMENTATION: 'https://docs.0xmail.box',
  SUPPORT_EMAIL: 'support@sudobility.com',
  CONTACT_EMAIL: 'info@sudobility.com',
} as const;

// Wallet Names
const WALLET_NAMES = {
  METAMASK: 'MetaMask',
  WALLETCONNECT: 'WalletConnect',
  COINBASE: 'Coinbase Wallet',
  PHANTOM: 'Phantom',
  SAFE: 'Safe',
  ARGENT: 'Argent',
  RAINBOW: 'Rainbow',
  TRUST: 'Trust Wallet',
  LEDGER: 'Ledger',
  TREZOR: 'Trezor',
} as const;

// Network IDs
const NETWORK_IDS = {
  ETHEREUM_MAINNET: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  SOLANA_MAINNET: 'mainnet-beta',
  SOLANA_DEVNET: 'devnet',
} as const;

// Animation Durations
const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Z-Index Layers
const Z_INDEX = {
  DROPDOWN: 10,
  OVERLAY: 20,
  MODAL: 30,
  POPOVER: 40,
  TOOLTIP: 50,
  TOAST: 60,
} as const;

// Note: Formatting utilities moved to ./formatters.ts

export {
  API_BASE_URL,
  API_TIMEOUT,
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY,
  AUTH_STATUS,
  CHAIN_TYPE,
  STORAGE_KEYS,
  EMAIL_CONFIG,
  SUBSCRIPTION_TIERS,
  TIME_FORMAT,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  EXTERNAL_LINKS,
  WALLET_NAMES,
  NETWORK_IDS,
  ANIMATION,
  Z_INDEX,
};
