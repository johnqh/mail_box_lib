/**
 * @fileoverview MailerContract - Low-level EVM smart contract interactions for the on-chain mailer.
 *
 * Provides viem-based interaction with the mailer contract and USDC token contract.
 * Handles priority/regular email sending with automatic USDC approval,
 * recipient/owner share claiming, fee queries, and balance checks.
 *
 * Revenue model: Priority emails charge a fee split 90/10 (recipient/owner).
 * Regular emails charge only the 10% owner portion.
 *
 * @example
 * ```typescript
 * const mailer = createMailerContract(window.ethereum);
 * const result = await mailer.sendPriority(recipientAddr, 'Subject', 'Body', senderAddr);
 * if (result.success) {
 *   console.log('Sent!', result.transactionHash);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */

import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  Hash,
  parseAbi,
  TransactionReceipt,
} from 'viem';
import { mainnet } from 'viem/chains';
import { AppError } from '../errorHandling';

// ============================================================================
// CONTRACT ERROR TYPES
// ============================================================================

/**
 * Error codes specific to mailer contract operations.
 * These map common blockchain failure modes to descriptive codes
 * that UI layers can use for user-friendly error messages.
 */
const MailerContractErrorCode = {
  /** Wallet client is not initialized (no provider) */
  WALLET_NOT_INITIALIZED: 'WALLET_NOT_INITIALIZED',
  /** USDC balance is insufficient for the operation */
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  /** USDC approval transaction failed */
  APPROVAL_FAILED: 'APPROVAL_FAILED',
  /** Contract call simulation reverted (e.g., insufficient allowance, paused contract) */
  CONTRACT_REVERT: 'CONTRACT_REVERT',
  /** Gas estimation failed */
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  /** Transaction was submitted but reverted on-chain */
  TRANSACTION_REVERTED: 'TRANSACTION_REVERTED',
  /** Network/RPC error (timeout, connection refused) */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** User rejected the transaction in their wallet */
  USER_REJECTED: 'USER_REJECTED',
  /** Generic contract interaction failure */
  CONTRACT_ERROR: 'CONTRACT_ERROR',
} as const;

type MailerContractErrorCodeType =
  (typeof MailerContractErrorCode)[keyof typeof MailerContractErrorCode];

/**
 * Structured error class for mailer contract operations.
 * Extends AppError with a contract-specific error code for UI consumption.
 */
class MailerContractError extends AppError {
  constructor(
    message: string,
    code: MailerContractErrorCodeType,
    details?: any
  ) {
    super(message, code, undefined, details);
    this.name = 'MailerContractError';
  }
}

/**
 * Maps raw viem/wallet errors to structured MailerContractError instances.
 *
 * @param error - The raw error from viem or the wallet provider
 * @param fallbackMessage - Message to use if the error cannot be classified
 * @returns A MailerContractError with an appropriate code and message
 */
function classifyContractError(
  error: unknown,
  fallbackMessage: string
): MailerContractError {
  if (error instanceof MailerContractError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : String(error || fallbackMessage);
  const lowerMessage = message.toLowerCase();

  // User rejected the transaction in their wallet
  if (
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('user denied') ||
    lowerMessage.includes('rejected by user')
  ) {
    return new MailerContractError(
      'Transaction was rejected by the user',
      MailerContractErrorCode.USER_REJECTED,
      error
    );
  }

  // Gas estimation failures
  if (
    lowerMessage.includes('gas') &&
    (lowerMessage.includes('estimate') || lowerMessage.includes('exceeds'))
  ) {
    return new MailerContractError(
      'Gas estimation failed. The transaction may revert or the contract may be paused.',
      MailerContractErrorCode.GAS_ESTIMATION_FAILED,
      error
    );
  }

  // Contract reverts
  if (
    lowerMessage.includes('revert') ||
    lowerMessage.includes('execution reverted')
  ) {
    return new MailerContractError(
      `Contract call reverted: ${message}`,
      MailerContractErrorCode.CONTRACT_REVERT,
      error
    );
  }

  // Insufficient funds / balance
  if (
    lowerMessage.includes('insufficient') ||
    lowerMessage.includes('exceeds balance')
  ) {
    return new MailerContractError(
      'Insufficient USDC balance for this operation',
      MailerContractErrorCode.INSUFFICIENT_BALANCE,
      error
    );
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('fetch')
  ) {
    return new MailerContractError(
      'Network error communicating with the blockchain. Please check your connection and try again.',
      MailerContractErrorCode.NETWORK_ERROR,
      error
    );
  }

  // Fallback: generic contract error
  return new MailerContractError(
    message || fallbackMessage,
    MailerContractErrorCode.CONTRACT_ERROR,
    error
  );
}

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

// Mailer contract configuration
// TODO: Replace with actual contract address when deployed
const MAILER_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Address;

// USDC contract address on mainnet
const USDC_CONTRACT_ADDRESS =
  '0xA0b86a33E6441E7B8b52C9bbc4BC55e3D0b56a3C' as Address;

// Mailer contract ABI based on the new contract structure
const MAILER_ABI = parseAbi([
  // Core functions
  'function sendPriority(address to, string calldata subject, string calldata body) external',
  'function sendPriorityPrepared(address to, string calldata mailId) external',
  'function send(address to, string calldata subject, string calldata body) external',
  'function sendPrepared(address to, string calldata mailId) external',
  'function getFee() external view returns (uint256)',
  'function setFee(uint256 usdcAmount) external',

  // Claiming functions
  'function claimRecipientShare() external',
  'function claimOwnerShare() external',
  'function claimExpiredShares(address recipient) external',
  'function getRecipientClaimable(address recipient) external view returns (uint256 amount, uint256 expiresAt, bool isExpired)',
  'function getOwnerClaimable() external view returns (uint256)',

  // Constants
  'function CLAIM_PERIOD() external view returns (uint256)',
  'function RECIPIENT_SHARE() external view returns (uint256)',
  'function OWNER_SHARE() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function usdcToken() external view returns (address)',

  // Events
  'event MailSent(address indexed from, address indexed to, string subject, string body)',
  'event PreparedMailSent(address indexed from, address indexed to, string indexed mailId)',
  'event FeeUpdated(uint256 oldFee, uint256 newFee)',
  'event SharesRecorded(address indexed recipient, uint256 recipientAmount, uint256 ownerAmount)',
  'event RecipientClaimed(address indexed recipient, uint256 amount)',
  'event OwnerClaimed(uint256 amount)',
  'event ExpiredSharesClaimed(address indexed recipient, uint256 amount)',
]);

// USDC contract ABI for approvals
const USDC_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
]);

/**
 * Result of a mailer contract write operation (send, claim, etc.).
 */
interface MailResult {
  /** Whether the transaction succeeded */
  success: boolean;
  /** Transaction hash (present on success) */
  transactionHash?: Hash;
  /** Full transaction receipt (present on success) */
  receipt?: TransactionReceipt;
  /** Error message (present on failure) */
  error?: string;
  /** Structured error code for programmatic handling (present on failure) */
  errorCode?: MailerContractErrorCodeType;
}

/**
 * Information about claimable revenue for a recipient.
 */
interface ClaimableInfo {
  /** Claimable amount in USDC micro-units (6 decimals) */
  amount: bigint;
  /** Unix timestamp when the claim expires */
  expiresAt: bigint;
  /** Whether the claim period has expired */
  isExpired: boolean;
}

/**
 * Low-level EVM contract interface for the on-chain mailer.
 *
 * Wraps viem public and wallet clients to interact with the mailer smart contract
 * and the USDC token contract. All write operations require a wallet provider.
 *
 * Error handling: Methods that perform write operations return a `MailResult`
 * with structured error codes via `MailerContractError`. Read operations
 * return safe defaults on failure and log errors.
 */
class MailerContract {
  private publicClient;
  private walletClient;

  /**
   * @param provider - An EIP-1193 compatible provider (e.g., `window.ethereum`).
   *   If not provided, falls back to `window.ethereum` in browser environments.
   */
  constructor(provider?: any) {
    // Create public client for reading
    const ethProvider =
      provider ||
      (typeof window !== 'undefined' ? (window as any).ethereum : null);
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: custom(ethProvider),
    });

    // Create wallet client for writing (if provider is available)
    if (ethProvider) {
      this.walletClient = createWalletClient({
        chain: mainnet,
        transport: custom(ethProvider),
      });
    }
  }

  /**
   * Send a priority email (recipients get 90% share).
   *
   * Automatically checks and approves USDC allowance before sending.
   * The full fee is charged for priority emails, with 90% going to the recipient.
   *
   * @param to - Recipient wallet address
   * @param subject - Email subject line
   * @param body - Email body content
   * @param account - Sender's wallet address
   * @returns MailResult with transaction details on success, or structured error on failure
   */
  async sendPriority(
    to: Address,
    subject: string,
    body: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new MailerContractError(
          'Wallet client not initialized. Please connect your wallet.',
          MailerContractErrorCode.WALLET_NOT_INITIALIZED
        );
      }

      const fee = await this.getFee();

      // Check and approve USDC if needed
      await this._ensureUSDCApproval(account, fee);

      const { request } = await this.publicClient.simulateContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'sendPriority',
        args: [to, subject, body],
        account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: unknown) {
      const classified = classifyContractError(
        error,
        'Failed to send priority email'
      );
      return {
        success: false,
        error: classified.message,
        errorCode: classified.code as MailerContractErrorCodeType,
      };
    }
  }

  /**
   * Send a priority email using a prepared template.
   *
   * @param to - Recipient wallet address
   * @param mailId - ID of the prepared email template
   * @param account - Sender's wallet address
   * @returns MailResult with transaction details on success, or structured error on failure
   */
  async sendPriorityPrepared(
    to: Address,
    mailId: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new MailerContractError(
          'Wallet client not initialized. Please connect your wallet.',
          MailerContractErrorCode.WALLET_NOT_INITIALIZED
        );
      }

      const fee = await this.getFee();
      await this._ensureUSDCApproval(account, fee);

      const { request } = await this.publicClient.simulateContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'sendPriorityPrepared',
        args: [to, mailId],
        account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: unknown) {
      const classified = classifyContractError(
        error,
        'Failed to send priority prepared email'
      );
      return {
        success: false,
        error: classified.message,
        errorCode: classified.code as MailerContractErrorCodeType,
      };
    }
  }

  /**
   * Send a regular email (only 10% fee to owner, no recipient share).
   *
   * @param to - Recipient wallet address
   * @param subject - Email subject line
   * @param body - Email body content
   * @param account - Sender's wallet address
   * @returns MailResult with transaction details on success, or structured error on failure
   */
  async send(
    to: Address,
    subject: string,
    body: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new MailerContractError(
          'Wallet client not initialized. Please connect your wallet.',
          MailerContractErrorCode.WALLET_NOT_INITIALIZED
        );
      }

      const fullFee = await this.getFee();
      const ownerFee = (fullFee * BigInt(10)) / BigInt(100); // 10% of full fee

      await this._ensureUSDCApproval(account, ownerFee);

      const { request } = await this.publicClient.simulateContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'send',
        args: [to, subject, body],
        account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: unknown) {
      const classified = classifyContractError(error, 'Failed to send email');
      return {
        success: false,
        error: classified.message,
        errorCode: classified.code as MailerContractErrorCodeType,
      };
    }
  }

  /**
   * Send a regular email using a prepared template.
   *
   * @param to - Recipient wallet address
   * @param mailId - ID of the prepared email template
   * @param account - Sender's wallet address
   * @returns MailResult with transaction details on success, or structured error on failure
   */
  async sendPrepared(
    to: Address,
    mailId: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new MailerContractError(
          'Wallet client not initialized. Please connect your wallet.',
          MailerContractErrorCode.WALLET_NOT_INITIALIZED
        );
      }

      const fullFee = await this.getFee();
      const ownerFee = (fullFee * BigInt(10)) / BigInt(100);

      await this._ensureUSDCApproval(account, ownerFee);

      const { request } = await this.publicClient.simulateContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'sendPrepared',
        args: [to, mailId],
        account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: unknown) {
      const classified = classifyContractError(
        error,
        'Failed to send prepared email'
      );
      return {
        success: false,
        error: classified.message,
        errorCode: classified.code as MailerContractErrorCodeType,
      };
    }
  }

  /**
   * Claim recipient's share from priority emails.
   *
   * @param account - Recipient's wallet address
   * @returns MailResult with transaction details on success, or structured error on failure
   */
  async claimRecipientShare(account: Address): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new MailerContractError(
          'Wallet client not initialized. Please connect your wallet.',
          MailerContractErrorCode.WALLET_NOT_INITIALIZED
        );
      }

      const { request } = await this.publicClient.simulateContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'claimRecipientShare',
        account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: unknown) {
      const classified = classifyContractError(
        error,
        'Failed to claim recipient share'
      );
      return {
        success: false,
        error: classified.message,
        errorCode: classified.code as MailerContractErrorCodeType,
      };
    }
  }

  /**
   * Get current fee in USDC (6 decimals)
   */
  async getFee(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'getFee',
      });

      return result as bigint;
    } catch (error) {
      console.error('Error getting fee:', error);
      return BigInt(100000); // Default 0.1 USDC
    }
  }

  /**
   * Get claimable amount for a recipient
   */
  async getRecipientClaimable(recipient: Address): Promise<ClaimableInfo> {
    try {
      const result = await this.publicClient.readContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'getRecipientClaimable',
        args: [recipient],
      });

      const [amount, expiresAt, isExpired] = result as [
        bigint,
        bigint,
        boolean,
      ];
      return { amount, expiresAt, isExpired };
    } catch (error) {
      console.error('Error getting claimable amount:', error);
      return { amount: BigInt(0), expiresAt: BigInt(0), isExpired: false };
    }
  }

  /**
   * Get owner's claimable amount
   */
  async getOwnerClaimable(): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: MAILER_CONTRACT_ADDRESS,
        abi: MAILER_ABI,
        functionName: 'getOwnerClaimable',
      });

      return result as bigint;
    } catch (error) {
      console.error('Error getting owner claimable:', error);
      return BigInt(0);
    }
  }

  /**
   * Check USDC balance of an account
   */
  async getUSDCBalance(account: Address): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [account],
      });

      return result as bigint;
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Ensure the mailer contract has sufficient USDC allowance.
   * If the current allowance is less than `amount`, requests approval for 10x the amount
   * to reduce future approval transactions.
   *
   * @param account - The wallet address that owns the USDC
   * @param amount - The minimum allowance required (in USDC micro-units)
   * @throws MailerContractError if the approval fails
   */
  private async _ensureUSDCApproval(
    account: Address,
    amount: bigint
  ): Promise<void> {
    try {
      // Check current allowance
      const allowance = (await this.publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [account, MAILER_CONTRACT_ADDRESS],
      })) as bigint;

      // If allowance is insufficient, request approval
      if (allowance < amount) {
        if (!this.walletClient) {
          throw new MailerContractError(
            'Wallet client not initialized. Please connect your wallet.',
            MailerContractErrorCode.WALLET_NOT_INITIALIZED
          );
        }

        const { request } = await this.publicClient.simulateContract({
          address: USDC_CONTRACT_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [MAILER_CONTRACT_ADDRESS, amount * BigInt(10)], // Approve 10x for future transactions
          account,
        });

        const hash = await this.walletClient.writeContract(request);
        await this.publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });
      }
    } catch (error) {
      if (error instanceof MailerContractError) {
        throw error;
      }
      console.error('Error ensuring USDC approval:', error);
      throw new MailerContractError(
        'Failed to approve USDC spending. Please ensure you have sufficient USDC balance and try again.',
        MailerContractErrorCode.APPROVAL_FAILED,
        error
      );
    }
  }
}

// Export a singleton instance
let mailerInstance: MailerContract | null = null;

const getMailerContract = (provider?: any): MailerContract => {
  if (!mailerInstance || provider) {
    mailerInstance = new MailerContract(provider);
  }
  return mailerInstance;
};

// Helper function to create contract instance with wallet provider
const createMailerContract = (provider: any): MailerContract => {
  return new MailerContract(provider);
};

export {
  MAILER_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  MAILER_ABI,
  USDC_ABI,
  getMailerContract,
  createMailerContract,
  MailerContract,
  MailerContractError,
  MailerContractErrorCode,
  classifyContractError,
  type MailResult,
  type ClaimableInfo,
  type MailerContractErrorCodeType,
};
