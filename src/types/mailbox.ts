/**
 * Mailbox related types
 */

export interface MailBox {
  id: string;
  name: string;
  icon: string;
  count: number;
  unreadCount: number;
  path?: string;
  specialUse?: string;
  subscribed?: boolean;
  hidden?: boolean;
}

export interface DefaultFolder {
  id: string;
  name: string;
  iconId: string;
  specialUse?: string;
}
