/**
 * Mail Service utilities
 *
 * This file re-exports Mailer contract functionality from mailerService.
 * For delegation functionality, use MailerClient from @sudobility/contracts/evm directly.
 */

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
