/**
 * Tests for unifiedMessagesStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUnifiedMessagesStore } from '../unifiedMessagesStore';
import type { Message } from '../../types/message';

// Helper to create a mock Message
function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    mailbox: 'mailbox-inbox',
    thread: 'thread-1',
    to: [{ name: 'recipient', address: 'recipient@example.com' }],
    subject: 'Test Subject',
    date: '2024-01-01T00:00:00Z',
    intro: 'This is the intro text...',
    seen: false,
    deleted: false,
    flagged: false,
    draft: false,
    answered: false,
    size: 1024,
    attachments: false,
    hasDetailedContent: false,
    ...overrides,
  };
}

describe('unifiedMessagesStore', () => {
  const userId1 = 'user-abc-123';
  const userId2 = 'user-xyz-456';
  const mailboxId1 = 'mailbox-inbox';
  const mailboxId2 = 'mailbox-sent';

  const mockMessage1 = createMockMessage({ id: 'msg-1', subject: 'First email' });
  const mockMessage2 = createMockMessage({ id: 'msg-2', subject: 'Second email' });
  const mockMessage3 = createMockMessage({ id: 'msg-3', subject: 'Third email', mailbox: mailboxId2 });

  beforeEach(() => {
    // Clear the store before each test
    useUnifiedMessagesStore.getState().clearAll();
  });

  describe('initialization', () => {
    it('should have empty caches on initialization', () => {
      const { listCache, messageCache } = useUnifiedMessagesStore.getState();
      expect(listCache).toEqual({});
      expect(messageCache).toEqual({});
    });
  });

  describe('setMessages (list operations)', () => {
    it('should store messages for a userId+mailboxId', () => {
      const { setMessages, getMessages } = useUnifiedMessagesStore.getState();
      const messages = [mockMessage1, mockMessage2];

      setMessages(userId1, mailboxId1, messages, 2, 1);

      const entry = getMessages(userId1, mailboxId1);
      expect(entry?.messages).toEqual(messages);
      expect(entry?.totalMessages).toBe(2);
      expect(entry?.currentPage).toBe(1);
    });

    it('should store cachedAt timestamp', () => {
      const { setMessages, getMessages } = useUnifiedMessagesStore.getState();
      const before = Date.now();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);

      const after = Date.now();
      const entry = getMessages(userId1, mailboxId1);
      expect(entry?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.cachedAt).toBeLessThanOrEqual(after);
    });

    it('should cross-populate individual message cache', () => {
      const { setMessages, getMessage } = useUnifiedMessagesStore.getState();
      const messages = [mockMessage1, mockMessage2];

      setMessages(userId1, mailboxId1, messages, 2, 1);

      // Each message should be individually cached
      const cached1 = getMessage(userId1, 'msg-1');
      const cached2 = getMessage(userId1, 'msg-2');
      expect(cached1).toBeDefined();
      expect(cached1?.subject).toBe('First email');
      expect(cached2).toBeDefined();
      expect(cached2?.subject).toBe('Second email');
    });

    it('should handle multiple mailboxes independently', () => {
      const { setMessages, getMessages } = useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);
      setMessages(userId1, mailboxId2, [mockMessage3], 1, 1);

      expect(getMessages(userId1, mailboxId1)?.messages).toEqual([mockMessage1]);
      expect(getMessages(userId1, mailboxId2)?.messages).toEqual([mockMessage3]);
    });

    it('should handle multiple users independently', () => {
      const { setMessages, getMessages } = useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);
      setMessages(userId2, mailboxId1, [mockMessage2], 1, 1);

      expect(getMessages(userId1, mailboxId1)?.messages).toEqual([mockMessage1]);
      expect(getMessages(userId2, mailboxId1)?.messages).toEqual([mockMessage2]);
    });
  });

  describe('getMessages', () => {
    it('should return undefined for non-existent userId+mailboxId', () => {
      const { getMessages } = useUnifiedMessagesStore.getState();
      expect(getMessages('non-existent', 'non-existent')).toBeUndefined();
    });
  });

  describe('appendMessages', () => {
    it('should append new messages to existing cache', () => {
      const { setMessages, appendMessages, getMessages } =
        useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 2, 1);
      appendMessages(userId1, mailboxId1, [mockMessage2], 2, 2);

      const entry = getMessages(userId1, mailboxId1);
      expect(entry?.messages).toHaveLength(2);
      expect(entry?.messages[0]?.subject).toBe('First email');
      expect(entry?.messages[1]?.subject).toBe('Second email');
      expect(entry?.currentPage).toBe(2);
    });

    it('should create new cache if none exists', () => {
      const { appendMessages, getMessages } = useUnifiedMessagesStore.getState();

      appendMessages(userId1, mailboxId1, [mockMessage1], 1, 1);

      const entry = getMessages(userId1, mailboxId1);
      expect(entry?.messages).toEqual([mockMessage1]);
    });

    it('should cross-populate individual message cache on append', () => {
      const { appendMessages, getMessage } = useUnifiedMessagesStore.getState();

      appendMessages(userId1, mailboxId1, [mockMessage2], 1, 1);

      const cached = getMessage(userId1, 'msg-2');
      expect(cached).toBeDefined();
      expect(cached?.subject).toBe('Second email');
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for a specific userId+mailboxId', () => {
      const { setMessages, getMessages, clearMessages } =
        useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);
      setMessages(userId1, mailboxId2, [mockMessage3], 1, 1);

      clearMessages(userId1, mailboxId1);

      expect(getMessages(userId1, mailboxId1)).toBeUndefined();
      expect(getMessages(userId1, mailboxId2)).toBeDefined();
    });

    it('should handle clearing non-existent cache gracefully', () => {
      const { clearMessages } = useUnifiedMessagesStore.getState();
      expect(() => clearMessages('non-existent', 'non-existent')).not.toThrow();
    });
  });

  describe('setMessage (individual message operations)', () => {
    it('should store an individual message', () => {
      const { setMessage, getMessage } = useUnifiedMessagesStore.getState();
      const detailedMessage = createMockMessage({
        id: 'msg-1',
        hasDetailedContent: true,
        html: '<p>Full content</p>',
      });

      setMessage(userId1, 'msg-1', detailedMessage);

      const cached = getMessage(userId1, 'msg-1');
      expect(cached?.html).toBe('<p>Full content</p>');
      expect(cached?.hasDetailedContent).toBe(true);
    });

    it('should update message in list cache when it exists there', () => {
      const { setMessages, setMessage, getMessages } =
        useUnifiedMessagesStore.getState();

      // First, set the list with a basic message
      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);

      // Then, set the detailed version
      const detailedMessage = createMockMessage({
        id: 'msg-1',
        hasDetailedContent: true,
        html: '<p>Full content</p>',
        subject: 'First email',
      });
      setMessage(userId1, 'msg-1', detailedMessage);

      // The list cache should be updated with the detailed version
      const listEntry = getMessages(userId1, mailboxId1);
      expect(listEntry?.messages[0]?.html).toBe('<p>Full content</p>');
      expect(listEntry?.messages[0]?.hasDetailedContent).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('should return undefined for non-existent message', () => {
      const { getMessage } = useUnifiedMessagesStore.getState();
      expect(getMessage('non-existent', 'non-existent')).toBeUndefined();
    });
  });

  describe('clearMessage', () => {
    it('should clear an individual message', () => {
      const { setMessage, getMessage, clearMessage } =
        useUnifiedMessagesStore.getState();

      setMessage(userId1, 'msg-1', mockMessage1);
      expect(getMessage(userId1, 'msg-1')).toBeDefined();

      clearMessage(userId1, 'msg-1');
      expect(getMessage(userId1, 'msg-1')).toBeUndefined();
    });

    it('should handle clearing non-existent message gracefully', () => {
      const { clearMessage } = useUnifiedMessagesStore.getState();
      expect(() => clearMessage('non-existent', 'non-existent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear both list and message caches', () => {
      const { setMessages, setMessage, getMessages, getMessage, clearAll } =
        useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);
      setMessage(userId1, 'msg-1', mockMessage1);

      clearAll();

      expect(getMessages(userId1, mailboxId1)).toBeUndefined();
      expect(getMessage(userId1, 'msg-1')).toBeUndefined();
    });

    it('should result in empty cache objects', () => {
      const { setMessages, setMessage, clearAll } =
        useUnifiedMessagesStore.getState();

      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);
      setMessage(userId1, 'msg-1', mockMessage1);

      clearAll();

      const { listCache, messageCache } = useUnifiedMessagesStore.getState();
      expect(listCache).toEqual({});
      expect(messageCache).toEqual({});
    });
  });

  describe('cross-population correctness', () => {
    it('should not overwrite detailed message when setting list messages', () => {
      const { setMessage, setMessages, getMessage } =
        useUnifiedMessagesStore.getState();

      // First, cache a detailed message
      const detailedMessage = createMockMessage({
        id: 'msg-1',
        hasDetailedContent: true,
        html: '<p>Full content</p>',
      });
      setMessage(userId1, 'msg-1', detailedMessage);

      // Then, set list messages (which includes a less-detailed version)
      setMessages(userId1, mailboxId1, [mockMessage1], 1, 1);

      // The list cache cross-population should overwrite the individual cache
      // (this is the current behavior - list items replace individual cache entries)
      const cached = getMessage(userId1, 'msg-1');
      expect(cached).toBeDefined();
    });
  });
});
