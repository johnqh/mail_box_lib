/**
 * Utility helper class for WildDuck Message operations
 * These functions are for data modification operations (POST/PUT/DELETE)
 */

import { AppConfig as _AppConfig } from '../../types';

// Platform-specific global
declare const fetch: typeof globalThis.fetch;

export interface UploadMessageParams {
  raw?: string;
  from?: string;
  to?: string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename?: string;
    contentType?: string;
    content?: string;
    encoding?: string;
  }>;
  draft?: boolean;
  unseen?: boolean;
  flagged?: boolean;
  date?: string;
}

// Import from business hooks to avoid conflicts
import type { UpdateMessageParams } from '../../business/hooks/wildduck/useWildduckMessages';
export type { UpdateMessageParams } from '../../business/hooks/wildduck/useWildduckMessages';

export interface ForwardMessageParams {
  to: string[];
  subject?: string;
  text?: string;
  html?: string;
}

export interface SubmitMessageParams {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  html?: string;
}

export interface SearchApplyParams {
  query?: string;
  action: 'move' | 'delete' | 'flag' | 'unflag' | 'seen' | 'unseen';
  moveTo?: string;
}

const getWildDuckBaseUrl = (): string => {
  return 'https://0xmail.box';
};

/**
 * WildDuck Message Helper Class
 * Contains methods for message operations that modify data
 */
export class WildDuckMessageHelper {
  /**
   * Upload a message to a mailbox
   */
  static async uploadMessage(
    userId: string,
    mailboxId: string,
    params: UploadMessageParams
  ): Promise<{ success: boolean; id: string }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Update message information
   */
  static async updateMessage(
    userId: string,
    mailboxId: string,
    messageId: string,
    params: UpdateMessageParams
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Update multiple messages in a mailbox
   */
  static async updateMessages(
    userId: string,
    mailboxId: string,
    params: UpdateMessageParams & { message?: string[] }
  ): Promise<{ success: boolean; updated: number }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Delete a message
   */
  static async deleteMessage(
    userId: string,
    mailboxId: string,
    messageId: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Delete multiple messages
   */
  static async deleteMessages(
    userId: string,
    mailboxId: string,
    messageIds: string[]
  ): Promise<{ success: boolean; deleted: number }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Forward a message
   */
  static async forwardMessage(
    userId: string,
    mailboxId: string,
    messageId: string,
    params: ForwardMessageParams
  ): Promise<{ success: boolean; id: string }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/forward`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Submit a message (reply or send)
   */
  static async submitMessage(
    userId: string,
    mailboxId: string,
    messageId: string,
    params: SubmitMessageParams
  ): Promise<{ success: boolean; id: string }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/mailboxes/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Apply search and perform action on matching messages
   */
  static async searchAndApply(
    userId: string,
    params: SearchApplyParams
  ): Promise<{ success: boolean; modified: number }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Delete outbound message from queue
   */
  static async deleteOutboundMessage(
    userId: string,
    queueId: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/outbound/${encodeURIComponent(queueId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Restore archived messages
   */
  static async restoreMessages(
    userId: string,
    messageIds: string[]
  ): Promise<{ success: boolean; restored: number }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/archived/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageIds }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Restore a single archived message
   */
  static async restoreMessage(
    userId: string,
    messageId: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${getWildDuckBaseUrl()}/users/${encodeURIComponent(userId)}/archived/messages/${encodeURIComponent(messageId)}/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }
}
