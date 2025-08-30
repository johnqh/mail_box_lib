import { useCallback, useEffect, useState } from 'react';
import { emailToUserId } from '../../../network/clients/wildduck';
import { WildDuckMailbox } from '../../../types/api';
import {
  MailboxService,
  Mailbox as ServiceMailbox,
} from '../../../types/services';
// Services will be injected through options or dependency injection

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

interface UseMailBoxesReturn {
  mailBoxes: MailBox[];
  loading: boolean;
  error: string | null;
  refreshMailBoxes: () => Promise<void>;
}

interface UseMailBoxesOptions {
  mailboxService?: MailboxService;
  mockMailboxService?: MailboxService;
  getMailboxes?: (userId: string, options: any) => Promise<any[]>;
}

// Helper function to get icon for mailbox based on special use or name
const getMailboxIcon = (mailbox: ServiceMailbox | WildDuckMailbox): string => {
  if (mailbox.specialUse) {
    switch (mailbox.specialUse) {
      case 'Inbox':
        return '📥';
      case 'Sent':
        return '📤';
      case 'Drafts':
        return '📝';
      case 'Trash':
        return '🗑️';
      case 'Junk':
        return '🚫';
      case 'Archive':
        return '📦';
      default:
        return '📁';
    }
  }

  const nameLower = mailbox.name.toLowerCase();
  if (nameLower.includes('inbox')) return '📥';
  if (nameLower.includes('sent')) return '📤';
  if (nameLower.includes('draft')) return '📝';
  if (nameLower.includes('trash') || nameLower.includes('deleted')) return '🗑️';
  if (nameLower.includes('spam') || nameLower.includes('junk')) return '🚫';
  if (nameLower.includes('star')) return '⭐';
  if (nameLower.includes('archive')) return '📦';

  return '📁';
};

// Convert service mailbox or WildDuck mailbox to our MailBox interface
const convertServiceMailbox = (
  serviceMailbox: ServiceMailbox | WildDuckMailbox
): MailBox => ({
  id: serviceMailbox.id,
  name: serviceMailbox.name,
  icon: getMailboxIcon(serviceMailbox),
  count: serviceMailbox.total || 0,
  unreadCount: serviceMailbox.unseen || 0,
  path: serviceMailbox.path,
  specialUse: serviceMailbox.specialUse,
  subscribed: serviceMailbox.subscribed,
  hidden: serviceMailbox.hidden,
});

export const useMailBoxes = (
  emailAddressId: string,
  emailAddresses: Array<{ id: string; email: string }> = [],
  userId?: string, // Direct WildDuck user ID from authentication
  options: UseMailBoxesOptions = {}
): UseMailBoxesReturn => {
  const [mailBoxes, setMailBoxes] = useState<MailBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provided services (must be injected by caller)
  const mailboxService = options.mailboxService;
  const mockMailboxService = options.mockMailboxService;
  const getMailboxes = options.getMailboxes;

  const fetchMailBoxes = useCallback(
    async (emailId: string) => {
      if (!emailId) {
        setMailBoxes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use direct user ID if provided, otherwise derive from email
        let wildDuckUserId: string;

        if (userId) {
          // Use the provided WildDuck user ID directly
          wildDuckUserId = userId;
          console.log('Using provided WildDuck user ID:', wildDuckUserId);
        } else {
          // Fallback: derive from email address (legacy behavior)
          const selectedEmail = emailAddresses.find(
            addr => addr.id === emailId
          );
          if (!selectedEmail) {
            throw new Error(`Email address not found for ID: ${emailId}`);
          }
          wildDuckUserId = emailToUserId(selectedEmail.email);
          console.log(
            'Derived user ID from email:',
            selectedEmail.email,
            '→',
            wildDuckUserId
          );
        }

        // Use WildDuck mailboxes function if provided
        if (!getMailboxes) {
          throw new Error('getMailboxes function not provided');
        }

        const wildDuckMailboxes = await getMailboxes(wildDuckUserId, {
          specialUse: true,
          counters: true,
          sizes: true,
        });

        const convertedMailboxes = wildDuckMailboxes
          .filter(mailbox => !mailbox.hidden) // Filter out hidden mailboxes by default
          .map(convertServiceMailbox)
          .sort((a, b) => {
            // Sort by special use first, then by name
            if (a.specialUse && !b.specialUse) return -1;
            if (!a.specialUse && b.specialUse) return 1;
            return a.name.localeCompare(b.name);
          });

        console.log(
          'Successfully fetched mailboxes:',
          convertedMailboxes.length
        );
        setMailBoxes(convertedMailboxes);
        setError(null);
      } catch (err) {
        console.warn(
          'WildDuck hook failed, falling back to service layer:',
          err
        );

        try {
          // Fallback to mailbox service if provided
          if (!mailboxService) {
            throw new Error('Mailbox service not provided for fallback');
          }

          const wildDuckUserId =
            userId ||
            emailToUserId(
              emailAddresses.find(addr => addr.id === emailId)?.email || ''
            );
          const serviceMailboxes =
            await mailboxService.getMailboxes(wildDuckUserId);
          const convertedMailboxes = serviceMailboxes
            .filter(mailbox => !mailbox.hidden)
            .map(convertServiceMailbox)
            .sort((a, b) => {
              if (a.specialUse && !b.specialUse) return -1;
              if (!a.specialUse && b.specialUse) return 1;
              return a.name.localeCompare(b.name);
            });

          setMailBoxes(convertedMailboxes);
          setError(null);
          console.log('Using service layer fallback');
        } catch (serviceErr) {
          console.warn(
            'Service layer failed, falling back to mock data:',
            serviceErr
          );

          try {
            // Final fallback to mock service for development
            if (!mockMailboxService) {
              throw new Error('Mock mailbox service not provided');
            }

            const mockServiceMailboxes =
              await mockMailboxService.getMailboxes(emailId);
            const mockMailBoxes = mockServiceMailboxes
              .filter(mailbox => !mailbox.hidden)
              .map(convertServiceMailbox)
              .sort((a, b) => {
                if (a.specialUse && !b.specialUse) return -1;
                if (!a.specialUse && b.specialUse) return 1;
                return a.name.localeCompare(b.name);
              });

            setMailBoxes(mockMailBoxes);
            setError(null);
            console.log('Using offline mode with mock mailboxes');
          } catch (mockErr) {
            console.error('All fallback methods failed:', mockErr);
            setError('Failed to load mailboxes');
            setMailBoxes([]);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [emailAddresses, getMailboxes, mailboxService, mockMailboxService, userId]
  );

  const refreshMailBoxes = useCallback(async () => {
    await fetchMailBoxes(emailAddressId);
  }, [emailAddressId, fetchMailBoxes]);

  useEffect(() => {
    fetchMailBoxes(emailAddressId);
  }, [emailAddressId, fetchMailBoxes]);

  return {
    mailBoxes,
    loading,
    error,
    refreshMailBoxes,
  };
};
