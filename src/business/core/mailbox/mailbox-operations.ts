/**
 * Platform-agnostic mailbox business logic operations
 */

import { MailBox } from '../../../types/mailbox';

interface MailboxOperations {
  /**
   * Get default folder configuration
   */
  getDefaultFolders(): DefaultFolder[];

  /**
   * Get icon identifier for mailbox
   */
  getMailboxIconId(boxId: string): string;

  /**
   * Get display name for mailbox
   */
  getMailboxDisplayName(mailbox: MailBox): string;

  /**
   * Check if mailbox is a system folder
   */
  isSystemFolder(boxId: string): boolean;

  /**
   * Sort mailboxes in standard order
   */
  sortMailboxes(mailboxes: MailBox[]): MailBox[];

  /**
   * Filter mailboxes by criteria
   */
  filterMailboxes(
    mailboxes: MailBox[],
    filters: {
      includeHidden?: boolean;
      includeSystemOnly?: boolean;
    }
  ): MailBox[];

  /**
   * Get folder type from mailbox
   */
  getFolderType(
    mailbox: MailBox
  ): 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
}

interface DefaultFolder {
  id: string;
  name: string;
  iconId: string;
  count: number;
  isSystem: boolean;
  order: number;
}

class DefaultMailboxOperations implements MailboxOperations {
  private readonly SYSTEM_FOLDERS = new Set([
    'inbox',
    'sent',
    'drafts',
    'trash',
    'spam',
    'archive',
    'starred',
    'snoozed',
  ]);

  private readonly FOLDER_ORDER = {
    inbox: 1,
    starred: 2,
    snoozed: 3,
    sent: 4,
    drafts: 5,
    archive: 6,
    spam: 7,
    trash: 8,
  };

  getDefaultFolders(): DefaultFolder[] {
    return [
      {
        id: 'inbox',
        name: 'Inbox',
        iconId: 'inbox',
        count: 0,
        isSystem: true,
        order: 1,
      },
      {
        id: 'starred',
        name: 'Starred',
        iconId: 'star',
        count: 0,
        isSystem: true,
        order: 2,
      },
      {
        id: 'snoozed',
        name: 'Snoozed',
        iconId: 'clock',
        count: 0,
        isSystem: true,
        order: 3,
      },
      {
        id: 'sent',
        name: 'Sent',
        iconId: 'paper-airplane',
        count: 0,
        isSystem: true,
        order: 4,
      },
      {
        id: 'drafts',
        name: 'Drafts',
        iconId: 'document',
        count: 0,
        isSystem: true,
        order: 5,
      },
      {
        id: 'spam',
        name: 'Spam',
        iconId: 'exclamation-triangle',
        count: 0,
        isSystem: true,
        order: 6,
      },
      {
        id: 'trash',
        name: 'Trash',
        iconId: 'trash',
        count: 0,
        isSystem: true,
        order: 7,
      },
    ];
  }

  getMailboxIconId(boxId: string): string {
    switch (boxId.toLowerCase()) {
      case 'inbox':
        return 'inbox';
      case 'starred':
        return 'star';
      case 'snoozed':
        return 'clock';
      case 'sent':
        return 'paper-airplane';
      case 'drafts':
        return 'document';
      case 'spam':
      case 'junk':
        return 'exclamation-triangle';
      case 'trash':
      case 'deleted':
        return 'trash';
      case 'archive':
      case 'archived':
        return 'archive-box';
      default:
        return 'inbox';
    }
  }

  getMailboxDisplayName(mailbox: MailBox): string {
    // Use the provided name, or generate from path
    if (mailbox.name) {
      return mailbox.name;
    }

    // Extract name from path (e.g., "INBOX.Sent" -> "Sent")
    const pathParts = (mailbox.path || '').split('.');
    const lastName = pathParts[pathParts.length - 1];

    // Capitalize first letter
    return lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  }

  isSystemFolder(boxId: string): boolean {
    return this.SYSTEM_FOLDERS.has(boxId.toLowerCase());
  }

  sortMailboxes(mailboxes: MailBox[]): MailBox[] {
    return [...mailboxes].sort((a, b) => {
      const aOrder =
        this.FOLDER_ORDER[a.id as keyof typeof this.FOLDER_ORDER] || 999;
      const bOrder =
        this.FOLDER_ORDER[b.id as keyof typeof this.FOLDER_ORDER] || 999;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // If same order (or both custom), sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  filterMailboxes(
    mailboxes: MailBox[],
    filters: {
      includeHidden?: boolean;
      includeSystemOnly?: boolean;
    } = {}
  ): MailBox[] {
    return mailboxes.filter(mailbox => {
      if (!filters.includeHidden && mailbox.hidden) {
        return false;
      }

      if (filters.includeSystemOnly && !this.isSystemFolder(mailbox.id)) {
        return false;
      }

      return true;
    });
  }

  getFolderType(
    mailbox: MailBox
  ): 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom' {
    const id = mailbox.id.toLowerCase();
    const path = (mailbox.path || '').toLowerCase();

    if (id.includes('inbox') || path.includes('inbox')) {
      return 'inbox';
    }
    if (id.includes('sent') || path.includes('sent')) {
      return 'sent';
    }
    if (id.includes('draft') || path.includes('draft')) {
      return 'drafts';
    }
    if (
      id.includes('trash') ||
      id.includes('deleted') ||
      path.includes('trash')
    ) {
      return 'trash';
    }
    if (id.includes('spam') || id.includes('junk') || path.includes('spam')) {
      return 'spam';
    }
    if (id.includes('archive') || path.includes('archive')) {
      return 'archive';
    }

    return 'custom';
  }
}

export { DefaultMailboxOperations, type MailboxOperations, type DefaultFolder };
