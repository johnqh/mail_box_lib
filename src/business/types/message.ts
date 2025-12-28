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

import { Optional } from '@sudobility/types';
import {
  WildduckMessage,
  WildduckMessageAddress,
  WildduckMessageAttachment,
  WildduckMessageDetail,
} from '@sudobility/mail_box_types';

/**
 * Unified message type that combines list and detail views
 */
export interface Message {
  // Core fields (always present from both list and detail)
  id: string; // Converted from number to string for consistency
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

  // List view field
  attachments: boolean;

  // Fields only present in detail view (optional, filled when detail is loaded)
  user?: Optional<string>;
  html?: Optional<string>;
  text?: Optional<string>;
  headers?: Optional<Record<string, string | string[]>>;
  attachmentsDetail?: Optional<WildduckMessageAttachment[]>; // Renamed to avoid conflict with attachments boolean
  references?: Optional<string[]>;
  replyTo?: Optional<WildduckMessageAddress>; // Changed from inReplyTo to match WildduckMessageDetail

  // Metadata to track which view this message came from
  hasDetailedContent?: boolean;
}

/**
 * Transform WildduckMessage to Message
 */
export function messageFromListItem(item: WildduckMessage): Message {
  const message: Message = {
    id: String(item.id), // Convert number to string
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
    hasDetailedContent: false,
  };

  // Handle optional fields explicitly
  if (item.from !== undefined) {
    message.from = item.from;
  }
  if (item.cc !== undefined && item.cc.length > 0) {
    message.cc = item.cc;
  }
  if (item.bcc !== undefined && item.bcc.length > 0) {
    message.bcc = item.bcc;
  }
  if (item.references !== undefined && item.references.length > 0) {
    message.references = item.references;
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
  // Generate intro from text if not available in detail response
  const intro =
    response.intro ||
    existingMessage?.intro ||
    (response.text ? response.text.substring(0, 200) : '');

  const message: Message = {
    // Preserve list view data if available (but will be overwritten by response fields)
    ...(existingMessage || {}),

    // Core fields from detail response
    id: String(response.id), // Convert number to string
    mailbox: response.mailbox,
    thread: response.thread,
    to: response.to,
    subject: response.subject,
    date: response.date,
    intro,
    size: response.size,
    seen: response.seen,
    deleted: response.deleted,
    flagged: response.flagged,
    draft: response.draft,
    answered: response.answered,

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
  if (response.cc !== undefined && response.cc.length > 0) {
    message.cc = response.cc;
  }
  if (response.bcc !== undefined && response.bcc.length > 0) {
    message.bcc = response.bcc;
  }
  if (response.html !== undefined) {
    // Handle html being an array (join into single string) or a string
    message.html = Array.isArray(response.html)
      ? response.html.join('')
      : response.html;
  }
  if (response.text !== undefined) {
    message.text = response.text;
  }
  if (response.headers !== undefined) {
    message.headers = response.headers;
  }
  if (response.references !== undefined && response.references.length > 0) {
    message.references = response.references;
  }
  if (response.replyTo !== undefined) {
    message.replyTo = response.replyTo;
  }

  return message;
}
