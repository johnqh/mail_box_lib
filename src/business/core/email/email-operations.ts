/**
 * Platform-agnostic email business logic operations
 * Contains all email-related business rules and operations that can be used across web and React Native
 */

import { Email } from '../../../types/email';

// Extended Email interface for business logic
interface ExtendedEmail extends Email {
  cc?: string | string[];
}

export interface EmailOperations {
  /**
   * Format email date for display
   */
  formatEmailDate(date: Date): string;

  /**
   * Format short date for email list display
   */
  formatShortDate(date: Date): string;

  /**
   * Truncate text with ellipsis
   */
  truncateText(text: string, maxLength: number): string;

  /**
   * Check if email is unread
   */
  isUnread(email: Email): boolean;

  /**
   * Check if email is starred
   */
  isStarred(email: Email): boolean;

  /**
   * Check if email is important
   */
  isImportant(email: Email): boolean;

  /**
   * Get email display name (from/to based on folder)
   */
  getEmailDisplayName(email: Email, folderType: string): string;

  /**
   * Create reply email data
   */
  createReplyData(email: Email): {
    to: string;
    subject: string;
    body: string;
    type: 'reply';
  };

  /**
   * Create reply all email data
   */
  createReplyAllData(email: Email): {
    to: string;
    cc: string;
    subject: string;
    body: string;
    type: 'replyAll';
  };

  /**
   * Create forward email data
   */
  createForwardData(email: Email): {
    to: string;
    subject: string;
    body: string;
    type: 'forward';
  };

  /**
   * Validate email address format
   */
  isValidEmailAddress(email: string): boolean;

  /**
   * Extract email addresses from string
   */
  extractEmailAddresses(text: string): string[];

  /**
   * Sort emails by criteria
   */
  sortEmails(
    emails: Email[],
    criteria: 'date' | 'subject' | 'from',
    order: 'asc' | 'desc'
  ): Email[];

  /**
   * Filter emails by criteria
   */
  filterEmails(
    emails: Email[],
    filters: {
      unread?: boolean;
      starred?: boolean;
      important?: boolean;
      hasAttachments?: boolean;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Email[];

  /**
   * Search emails by query
   */
  searchEmails(emails: Email[], query: string): Email[];
}

export class DefaultEmailOperations implements EmailOperations {
  formatEmailDate(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatShortDate(date: Date): string {
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  isUnread(email: Email): boolean {
    return !email.read;
  }

  isStarred(email: Email): boolean {
    return email.starred || false;
  }

  isImportant(email: Email): boolean {
    return email.important || false;
  }

  getEmailDisplayName(email: Email, folderType: string): string {
    return folderType === 'sent' ? `To: ${email.to}` : email.from;
  }

  createReplyData(email: Email) {
    return {
      type: 'reply' as const,
      to: email.from,
      subject: email.subject.startsWith('Re:')
        ? email.subject
        : `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
    };
  }

  createReplyAllData(email: Email) {
    const extendedEmail = email as ExtendedEmail;
    return {
      type: 'replyAll' as const,
      to: email.from,
      cc: Array.isArray(extendedEmail.cc)
        ? extendedEmail.cc.join(', ')
        : extendedEmail.cc || '',
      subject: email.subject.startsWith('Re:')
        ? email.subject
        : `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
    };
  }

  createForwardData(email: Email) {
    return {
      type: 'forward' as const,
      to: '',
      subject: email.subject.startsWith('Fwd:')
        ? email.subject
        : `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nTo: ${email.to}\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
    };
  }

  isValidEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  extractEmailAddresses(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  sortEmails(
    emails: Email[],
    criteria: 'date' | 'subject' | 'from',
    order: 'asc' | 'desc'
  ): Email[] {
    const sortedEmails = [...emails];
    const multiplier = order === 'asc' ? 1 : -1;

    sortedEmails.sort((a, b) => {
      switch (criteria) {
        case 'date':
          return (a.date.getTime() - b.date.getTime()) * multiplier;
        case 'subject':
          return a.subject.localeCompare(b.subject) * multiplier;
        case 'from':
          return a.from.localeCompare(b.from) * multiplier;
        default:
          return 0;
      }
    });

    return sortedEmails;
  }

  filterEmails(
    emails: Email[],
    filters: {
      unread?: boolean;
      starred?: boolean;
      important?: boolean;
      hasAttachments?: boolean;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Email[] {
    return emails.filter(email => {
      if (
        filters.unread !== undefined &&
        this.isUnread(email) !== filters.unread
      ) {
        return false;
      }
      if (
        filters.starred !== undefined &&
        this.isStarred(email) !== filters.starred
      ) {
        return false;
      }
      if (
        filters.important !== undefined &&
        this.isImportant(email) !== filters.important
      ) {
        return false;
      }
      if (
        filters.hasAttachments !== undefined &&
        !!email.attachments?.length !== filters.hasAttachments
      ) {
        return false;
      }
      if (filters.fromDate && email.date < filters.fromDate) {
        return false;
      }
      if (filters.toDate && email.date > filters.toDate) {
        return false;
      }
      return true;
    });
  }

  searchEmails(emails: Email[], query: string): Email[] {
    const lowerQuery = query.toLowerCase();
    return emails.filter(
      email =>
        email.subject.toLowerCase().includes(lowerQuery) ||
        email.from.toLowerCase().includes(lowerQuery) ||
        email.body.toLowerCase().includes(lowerQuery) ||
        (typeof email.to === 'string'
          ? email.to.toLowerCase().includes(lowerQuery)
          : false)
    );
  }
}
