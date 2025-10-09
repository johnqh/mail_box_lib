/**
 * Unified Message Type
 *
 * This type merges WildduckMessage and WildduckMessageDetail
 * to provide a single message representation that can be used throughout the app.
 *
 * - useMailboxMessages constructs this from WildduckMessage (list view)
 * - useMessage constructs this from WildduckMessageDetail (detail view)
 * - Both hooks share the same Zustand cache using this unified type
 */

import { Optional } from '@johnqh/types';
import {
  WildduckMessage,
  WildduckMessageAddress,
  WildduckMessageAttachment,
  WildduckMessageDetail,
} from '@johnqh/wildduck_client';

/**
 * Unified message type that combines list and detail views
 */
export interface Message {
  // Core fields (always present from both list and detail)
  id: string;
  mailbox: string;
  thread: string;
  from?: WildduckMessageAddress;
  to: WildduckMessageAddress[];
  cc?: WildduckMessageAddress[];
  bcc?: WildduckMessageAddress[];
  subject: string;
  date: string;
  intro: string;
  seen: boolean;
  deleted: boolean;
  flagged: boolean;
  draft: boolean;
  answered: boolean;
  size: number;
  ha: boolean; // Has attachments flag from base type

  // List view field
  attachments: boolean;

  // Fields only present in detail view (optional, filled when detail is loaded)
  user?: Optional<string>;
  html?: Optional<string>;
  text?: Optional<string>;
  headers?: Optional<Record<string, string | string[]>>;
  attachmentsDetail?: Optional<WildduckMessageAttachment[]>; // Renamed to avoid conflict with attachments boolean
  references?: Optional<string[]>;
  inReplyTo?: Optional<string>;

  // Metadata to track which view this message came from
  hasDetailedContent?: boolean;
}

/**
 * Transform WildduckMessage to Message
 */
export function messageFromListItem(item: WildduckMessage): Message {
  const message: Message = {
    id: item.id,
    mailbox: item.mailbox,
    thread: item.thread,
    to: item.to,
    subject: item.subject,
    date: item.date,
    intro: item.intro,
    attachments: item.attachments,
    size: item.size,
    seen: item.seen,
    deleted: item.deleted,
    flagged: item.flagged,
    draft: item.draft,
    answered: item.answered,
    ha: item.ha,
    hasDetailedContent: false,
  };

  // Handle optional fields explicitly
  if (item.from !== undefined) {
    message.from = item.from;
  }
  if (item.cc !== undefined) {
    message.cc = item.cc;
  }
  if (item.bcc !== undefined) {
    message.bcc = item.bcc;
  }

  return message;
}

/**
 * Transform WildduckMessageDetail to Message
 * If an existing message is provided, it will be merged with the detailed data
 */
export function messageFromDetailedResponse(
  response: WildduckMessageDetail,
  existingMessage?: Optional<Message>
): Message {
  const message: Message = {
    // Preserve list view data if available (but will be overwritten by response fields)
    ...(existingMessage || {}),

    // Core fields from detail response
    id: response.id,
    mailbox: response.mailbox,
    thread: response.thread,
    to: response.to,
    subject: response.subject,
    date: response.date,
    intro: response.intro,
    size: response.size,
    seen: response.seen,
    deleted: response.deleted,
    flagged: response.flagged,
    draft: response.draft,
    answered: response.answered,
    ha: response.ha,

    // Keep list view attachments boolean if present, otherwise check if detail has attachments
    attachments:
      existingMessage?.attachments ??
      !!(response.attachments && response.attachments.length > 0),

    // Detail-only fields
    user: response.user,
    attachmentsDetail: response.attachments,

    hasDetailedContent: true,
  };

  // Handle optional fields explicitly
  if (response.from !== undefined) {
    message.from = response.from;
  }
  if (response.cc !== undefined) {
    message.cc = response.cc;
  }
  if (response.bcc !== undefined) {
    message.bcc = response.bcc;
  }
  if (response.html !== undefined) {
    message.html = response.html;
  }
  if (response.text !== undefined) {
    message.text = response.text;
  }
  if (response.headers !== undefined) {
    message.headers = response.headers;
  }
  if (response.references !== undefined) {
    message.references = response.references;
  }
  if (response.inReplyTo !== undefined) {
    message.inReplyTo = response.inReplyTo;
  }

  return message;
}
