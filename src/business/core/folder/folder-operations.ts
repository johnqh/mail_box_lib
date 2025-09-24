/**
 * Business logic for email folder operations
 */

import {
  EmailFolder,
  EmailFolderUtils,
  MailboxType,
  Optional,
} from '@johnqh/types';

interface FolderInfo {
  name: EmailFolder;
  displayName: string;
  isStandard: boolean;
  isCustom: boolean;
  count: number;
  unreadCount: number;
}

interface FolderOperations {
  createCustomFolder(name: string): Promise<FolderInfo>;
  deleteCustomFolder(name: string): Promise<boolean>;
  renameCustomFolder(oldName: string, newName: string): Promise<boolean>;
  getAllFolders(): Promise<FolderInfo[]>;
  getFolderInfo(folder: EmailFolder): Promise<Optional<FolderInfo>>;
  validateFolderName(name: string): { isValid: boolean; error?: string };
  getStandardFolders(): FolderInfo[];
  getCustomFolders(): Promise<FolderInfo[]>;
}

class DefaultFolderOperations implements FolderOperations {
  async createCustomFolder(name: string): Promise<FolderInfo> {
    const validation = this.validateFolderName(name);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // In a real implementation, this would call the email service
    // For now, return a mock folder info
    return {
      name,
      displayName: EmailFolderUtils.displayName(name),
      isStandard: false,
      isCustom: true,
      count: 0,
      unreadCount: 0,
    };
  }

  async deleteCustomFolder(name: string): Promise<boolean> {
    if (EmailFolderUtils.isStandardFolder(name)) {
      throw new Error('Cannot delete standard folders');
    }

    // In a real implementation, this would call the email service
    return true;
  }

  async renameCustomFolder(oldName: string, newName: string): Promise<boolean> {
    if (EmailFolderUtils.isStandardFolder(oldName)) {
      throw new Error('Cannot rename standard folders');
    }

    const validation = this.validateFolderName(newName);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // In a real implementation, this would call the email service
    return true;
  }

  async getAllFolders(): Promise<FolderInfo[]> {
    const standardFolders = this.getStandardFolders();
    const customFolders = await this.getCustomFolders();
    return [...standardFolders, ...customFolders];
  }

  async getFolderInfo(folder: EmailFolder): Promise<Optional<FolderInfo>> {
    // In a real implementation, this would query the email service
    return {
      name: folder,
      displayName: EmailFolderUtils.displayName(folder),
      isStandard: EmailFolderUtils.isStandardFolder(folder),
      isCustom: EmailFolderUtils.isCustomFolder(folder),
      count: 0,
      unreadCount: 0,
    };
  }

  validateFolderName(name: string): { isValid: boolean; error?: string } {
    // Check if name is empty
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Folder name cannot be empty' };
    }

    // Check if name is too long
    if (name.length > 50) {
      return {
        isValid: false,
        error: 'Folder name cannot be longer than 50 characters',
      };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return {
        isValid: false,
        error: 'Folder name contains invalid characters',
      };
    }

    // Check if it conflicts with standard folder names
    if (EmailFolderUtils.isStandardFolder(name.toLowerCase())) {
      return { isValid: false, error: 'Cannot use reserved folder names' };
    }

    return { isValid: true };
  }

  getStandardFolders(): FolderInfo[] {
    return EmailFolderUtils.getStandardFolders().map(folder => ({
      name: folder,
      displayName: EmailFolderUtils.displayName(folder),
      isStandard: true,
      isCustom: false,
      count: 0, // In real implementation, get from email service
      unreadCount: 0,
    }));
  }

  async getCustomFolders(): Promise<FolderInfo[]> {
    // In a real implementation, this would query the email service for custom folders
    // For now, return empty array
    return [];
  }

  /**
   * Get folder hierarchy if folders support nesting (like IMAP)
   */
  async getFolderHierarchy(): Promise<FolderInfo[]> {
    // This would support nested folders like "Projects/Work/Important"
    // For now, return flat list
    return this.getAllFolders();
  }

  /**
   * Check if a folder can be deleted
   */
  canDeleteFolder(folder: EmailFolder): boolean {
    return EmailFolderUtils.isCustomFolder(folder);
  }

  /**
   * Check if a folder can be renamed
   */
  canRenameFolder(folder: EmailFolder): boolean {
    return EmailFolderUtils.isCustomFolder(folder);
  }

  /**
   * Get default folder for new emails
   */
  getDefaultFolder(): MailboxType {
    return MailboxType.INBOX;
  }

  /**
   * Get folder for sent emails
   */
  getSentFolder(): MailboxType {
    return MailboxType.SENT;
  }

  /**
   * Get folder for drafts
   */
  getDraftsFolder(): MailboxType {
    return MailboxType.DRAFTS;
  }

  /**
   * Get folder for spam/junk
   */
  getSpamFolder(): MailboxType {
    return MailboxType.SPAM;
  }

  /**
   * Get folder for trash/deleted items
   */
  getTrashFolder(): MailboxType {
    return MailboxType.TRASH;
  }
}

export { DefaultFolderOperations, type FolderInfo, type FolderOperations };
