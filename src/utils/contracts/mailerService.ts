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

interface MailResult {
  success: boolean;
  transactionHash?: Hash;
  receipt?: TransactionReceipt;
  error?: string;
}

interface ClaimableInfo {
  amount: bigint;
  expiresAt: bigint;
  isExpired: boolean;
}

class MailerContract {
  private publicClient;
  private walletClient;

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
   * Send a priority email (recipients get 90% share)
   */
  async sendPriority(
    to: Address,
    subject: string,
    body: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send priority email',
      };
    }
  }

  /**
   * Send a priority email using a prepared template
   */
  async sendPriorityPrepared(
    to: Address,
    mailId: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send priority prepared email',
      };
    }
  }

  /**
   * Send a regular email (only 10% fee to owner)
   */
  async send(
    to: Address,
    subject: string,
    body: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send a regular email using a prepared template
   */
  async sendPrepared(
    to: Address,
    mailId: string,
    account: Address
  ): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send prepared email',
      };
    }
  }

  /**
   * Claim recipient's share from priority emails
   */
  async claimRecipientShare(account: Address): Promise<MailResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to claim recipient share',
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
   * Ensure USDC approval for the contract
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
          throw new Error('Wallet client not initialized');
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
      console.error('Error ensuring USDC approval:', error);
      throw new Error('Failed to approve USDC spending');
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
  type MailResult,
  type ClaimableInfo,
};
