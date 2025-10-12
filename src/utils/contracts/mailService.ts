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
import { logger } from '@sudobility/types';

// MailService contract configuration for delegation (separate from Mailer)
// TODO: Replace with actual contract address when deployed
const MAIL_SERVICE_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Address;

// MailService contract ABI
// This is a placeholder ABI based on common delegation patterns
// TODO: Replace with actual ABI from the deployed contract
const MAIL_SERVICE_ABI = parseAbi([
  'function delegateTo(address delegate) external returns (bool)',
  'function revokeDelegation(address delegate) external returns (bool)',
  'function getDelegates(address owner) external view returns (address[])',
  'function isDelegated(address owner, address delegate) external view returns (bool)',
  'event DelegationCreated(address indexed owner, address indexed delegate, uint256 timestamp)',
  'event DelegationRevoked(address indexed owner, address indexed delegate, uint256 timestamp)',
]);

interface DelegationResult {
  success: boolean;
  transactionHash?: Hash;
  receipt?: TransactionReceipt;
  error?: string;
}

class MailServiceContract {
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
   * Delegate email handling to another address
   * @param delegateAddress - Address to delegate to
   * @param account - Current user's wallet address
   * @returns Promise with delegation result
   */
  async delegateTo(
    delegateAddress: Address,
    account: Address
  ): Promise<DelegationResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
      }

      // Validate addresses
      if (!delegateAddress || !account) {
        throw new Error('Invalid addresses provided');
      }

      if (delegateAddress.toLowerCase() === account.toLowerCase()) {
        throw new Error('Cannot delegate to yourself');
      }

      logger.info('Delegating email handling', 'MailService', {
        from: account,
        to: delegateAddress,
        contract: MAIL_SERVICE_CONTRACT_ADDRESS,
      });

      // Check if already delegated
      const isAlreadyDelegated = await this.isDelegated(
        account,
        delegateAddress
      );
      if (isAlreadyDelegated) {
        throw new Error('Email handling is already delegated to this address');
      }

      // Prepare transaction
      const { request } = await this.publicClient.simulateContract({
        address: MAIL_SERVICE_CONTRACT_ADDRESS,
        abi: MAIL_SERVICE_ABI,
        functionName: 'delegateTo',
        args: [delegateAddress],
        account,
      });

      // Execute transaction
      const hash = await this.walletClient.writeContract(request);
      logger.info('Delegation transaction sent', 'MailService', { hash });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      logger.info('Delegation transaction confirmed', 'MailService', {
        receipt,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: any) {
      logger.error('Delegation failed', 'MailService', error);

      let errorMessage = 'Failed to delegate email handling';

      // Parse specific error messages
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (error.message?.includes('already delegated')) {
        errorMessage = error.message;
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Revoke delegation from an address
   * @param delegateAddress - Address to revoke delegation from
   * @param account - Current user's wallet address
   * @returns Promise with revocation result
   */
  async revokeDelegation(
    delegateAddress: Address,
    account: Address
  ): Promise<DelegationResult> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
      }

      logger.info('Revoking delegation', 'MailService', {
        from: account,
        delegate: delegateAddress,
        contract: MAIL_SERVICE_CONTRACT_ADDRESS,
      });

      // Check if delegation exists
      const isDelegated = await this.isDelegated(account, delegateAddress);
      if (!isDelegated) {
        throw new Error('No delegation exists for this address');
      }

      // Prepare transaction
      const { request } = await this.publicClient.simulateContract({
        address: MAIL_SERVICE_CONTRACT_ADDRESS,
        abi: MAIL_SERVICE_ABI,
        functionName: 'revokeDelegation',
        args: [delegateAddress],
        account,
      });

      // Execute transaction
      const hash = await this.walletClient.writeContract(request);
      logger.info('Revocation transaction sent', 'MailService', { hash });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      logger.info('Revocation transaction confirmed', 'MailService', {
        receipt,
      });

      return {
        success: true,
        transactionHash: hash,
        receipt,
      };
    } catch (error: any) {
      logger.error('Revocation failed', 'MailService', error);

      let errorMessage = 'Failed to revoke delegation';

      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if delegation exists between two addresses
   * @param owner - Owner address
   * @param delegate - Delegate address
   * @returns Promise<boolean>
   */
  async isDelegated(owner: Address, delegate: Address): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: MAIL_SERVICE_CONTRACT_ADDRESS,
        abi: MAIL_SERVICE_ABI,
        functionName: 'isDelegated',
        args: [owner, delegate],
      });

      return result as boolean;
    } catch (error) {
      logger.error('Error checking delegation status', 'MailService', error);
      return false;
    }
  }

  /**
   * Get all delegates for an owner address
   * @param owner - Owner address
   * @returns Promise<Address[]>
   */
  async getDelegates(owner: Address): Promise<Address[]> {
    try {
      const result = await this.publicClient.readContract({
        address: MAIL_SERVICE_CONTRACT_ADDRESS,
        abi: MAIL_SERVICE_ABI,
        functionName: 'getDelegates',
        args: [owner],
      });

      return result as Address[];
    } catch (error) {
      logger.error('Error fetching delegates', 'MailService', error);
      return [];
    }
  }
}

// Export a singleton instance
let mailServiceInstance: MailServiceContract | null = null;

const getMailServiceContract = (provider?: any): MailServiceContract => {
  if (!mailServiceInstance || provider) {
    mailServiceInstance = new MailServiceContract(provider);
  }
  return mailServiceInstance;
};

// Helper function to create contract instance with wallet provider
const createMailServiceContract = (provider: any): MailServiceContract => {
  return new MailServiceContract(provider);
};

// Re-export Mailer contract functionality
export {
  getMailerContract,
  createMailerContract,
  MailerContract,
  type MailResult,
  type ClaimableInfo,
  MAILER_CONTRACT_ADDRESS,
  MAILER_ABI,
  USDC_CONTRACT_ADDRESS,
  USDC_ABI,
} from './mailerService';

export {
  MAIL_SERVICE_CONTRACT_ADDRESS,
  MAIL_SERVICE_ABI,
  getMailServiceContract,
  createMailServiceContract,
  MailServiceContract,
  type DelegationResult,
};
