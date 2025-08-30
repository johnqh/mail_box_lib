/**
 * Platform-agnostic email service interface
 * This interface defines the contract for email operations that work across web and React Native
 */

import { Email, EmailAddress } from '../email';
export { EmailAddress };

export interface EmailListOptions {
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
}

export interface EmailService {
  /**
   * Get emails from a specific mailbox
   * @param userId User identifier
   * @param mailboxId Mailbox identifier
   * @param options Pagination and sorting options
   */
  getEmails(
    userId: string,
    mailboxId: string,
    options?: EmailListOptions
  ): Promise<Email[]>;

  /**
   * Get a specific email by ID
   * @param userId User identifier
   * @param emailId Email identifier
   */
  getEmail(userId: string, emailId: string): Promise<Email>;

  /**
   * Update email properties (read, starred, etc.)
   * @param userId User identifier
   * @param emailId Email identifier
   * @param updates Partial email updates
   */
  updateEmail(
    userId: string,
    emailId: string,
    updates: Partial<Email>
  ): Promise<Email>;

  /**
   * Delete email
   * @param userId User identifier
   * @param emailId Email identifier
   */
  deleteEmail(userId: string, emailId: string): Promise<void>;

  /**
   * Send email
   * @param userId User identifier
   * @param email Email to send
   */
  sendEmail(userId: string, email: Partial<Email>): Promise<Email>;

  /**
   * Search emails
   * @param userId User identifier
   * @param query Search query
   * @param options Search options
   */
  searchEmails(
    userId: string,
    query: string,
    options?: EmailListOptions
  ): Promise<Email[]>;
}

export interface MailboxService {
  /**
   * Get all mailboxes for a user
   * @param userId User identifier
   */
  getMailboxes(userId: string): Promise<Mailbox[]>;

  /**
   * Create a new mailbox
   * @param userId User identifier
   * @param name Mailbox name
   * @param options Additional options
   */
  createMailbox(
    userId: string,
    name: string,
    options?: { hidden?: boolean }
  ): Promise<Mailbox>;

  /**
   * Delete a mailbox
   * @param userId User identifier
   * @param mailboxId Mailbox identifier
   */
  deleteMailbox(userId: string, mailboxId: string): Promise<void>;
}

export interface EmailAddressService {
  /**
   * Get all email addresses for a user
   * @param userId User identifier
   */
  getEmailAddresses(userId: string): Promise<EmailAddress[]>;

  /**
   * Add a new email address
   * @param userId User identifier
   * @param address Email address
   * @param options Additional options
   */
  addEmailAddress(
    userId: string,
    address: string,
    options?: { main?: boolean }
  ): Promise<EmailAddress>;

  /**
   * Delete an email address
   * @param userId User identifier
   * @param addressId Address identifier
   */
  deleteEmailAddress(userId: string, addressId: string): Promise<void>;
}

// Types for mailbox and email address
export interface Mailbox {
  id: string;
  name: string;
  path: string;
  specialUse?: string;
  subscribed: boolean;
  hidden: boolean;
  total?: number;
  unseen?: number;
}

// EmailAddress is now imported at the top to consolidate definitions

/**
 * Mock data provider interface for development/testing
 */
export interface MockDataProvider {
  generateEmails(
    mailboxId: string,
    userId: string,
    count?: number
  ): Promise<Email[]>;
  generateEmail(emailId: string): Promise<Email>;
  generateMailboxes(userId: string): Promise<Mailbox[]>;
  generateEmailAddresses(userId: string): Promise<EmailAddress[]>;
}
