import { useState, useEffect, useCallback } from 'react';
import { Email } from '../types';
import { emailToUserId, WildDuckMessage, WildDuckMessageResponse } from '../config/api';
import { EmailService, EmailListOptions } from '../services/email.interface';
import { webEmailService } from '../services/email.web';
import { mockEmailService } from '../services/email.mock';
import { useWildduckMessages } from '../hooks/useWildduckMessages';

interface UseEmailsReturn {
  emails: Email[];
  loading: boolean;
  error: string | null;
  refreshEmails: () => Promise<void>;
  updateEmail: (emailId: string, updates: Partial<Email>) => void;
}

interface UseEmailsOptions {
  emailService?: EmailService;
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
}

// Convert WildDuck message to our Email interface
const convertWildDuckMessage = (wildDuckMessage: WildDuckMessage, mailboxId: string): Email => {
  return {
    id: wildDuckMessage.id,
    from: wildDuckMessage.from?.address || 'unknown@0xmail.box',
    to: wildDuckMessage.to[0]?.address || 'unknown@0xmail.box',
    subject: wildDuckMessage.subject || '(No Subject)',
    body: wildDuckMessage.intro || '',
    date: new Date(wildDuckMessage.date),
    read: wildDuckMessage.seen,
    starred: wildDuckMessage.flagged,
    folder: mailboxId as Email['folder'],
    attachments: wildDuckMessage.attachments ? ['attachment'] : undefined
  };
};

export const useEmails = (
  emailAddressId: string, 
  mailBoxId: string, 
  emailAddresses: Array<{id: string, email: string}> = [],
  options: UseEmailsOptions = {}
): UseEmailsReturn => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use WildDuck hooks directly
  const { getMessages, isLoading: wildduckLoading, error: wildduckError } = useWildduckMessages();
  
  // Use provided email service or default to web service with mock fallback
  const emailService = options.emailService || webEmailService;

  const fetchEmails = useCallback(async (emailId: string, boxId: string) => {
    if (!emailId || !boxId) {
      setEmails([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the actual email address from the provided email addresses
      const selectedEmail = emailAddresses.find(addr => addr.id === emailId);
      if (!selectedEmail) {
        throw new Error(`Email address not found for ID: ${emailId}`);
      }
      
      const userId = emailToUserId(selectedEmail.email);
      console.log(`Fetching emails for user: ${userId}, mailbox: ${boxId}`);
      
      // Use WildDuck hook directly
      const fetchOptions = {
        limit: options.limit || 50,
        page: options.page || 1,
        order: options.order || 'desc'
      };

      const wildDuckMessages = await getMessages(userId, boxId, fetchOptions);
      const convertedEmails = wildDuckMessages.map(msg => convertWildDuckMessage(msg, boxId));
      console.log('Successfully fetched emails:', convertedEmails.length);
      setEmails(convertedEmails);
      setError(null);
    } catch (err) {
      console.warn('WildDuck hook failed, falling back to service layer:', err);
      
      try {
        // Fallback to service layer (which may use mock data)
        const fetchOptions: EmailListOptions = {
          limit: options.limit || 50,
          page: options.page || 1,
          order: options.order || 'desc'
        };
        const fallbackEmails = await emailService.getEmails(emailToUserId(emailAddresses.find(addr => addr.id === emailId)?.email || ''), boxId, fetchOptions);
        setEmails(fallbackEmails);
        setError(null);
        console.log('Using service layer fallback');
      } catch (serviceErr) {
        console.warn('Service layer failed, falling back to mock data:', serviceErr);
        
        try {
          // Final fallback to mock service for development
          const mockEmails = await mockEmailService.getEmails(emailId, boxId, {
            limit: options.limit || 50,
            page: options.page || 1,
            order: options.order || 'desc'
          });
          setEmails(mockEmails);
          setError(null);
          console.log('Using offline mode with mock emails');
        } catch (mockErr) {
          console.error('All fallback methods failed:', mockErr);
          setError('Failed to load emails');
          setEmails([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [emailAddresses, getMessages, emailService, options.limit, options.page, options.order]);

  const refreshEmails = useCallback(async () => {
    await fetchEmails(emailAddressId, mailBoxId);
  }, [emailAddressId, mailBoxId, fetchEmails]);

  const updateEmail = useCallback((emailId: string, updates: Partial<Email>) => {
    setEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId ? { ...email, ...updates } : email
      )
    );
  }, []);

  useEffect(() => {
    fetchEmails(emailAddressId, mailBoxId);
  }, [emailAddressId, mailBoxId, fetchEmails]);

  return {
    emails,
    loading,
    error,
    refreshEmails,
    updateEmail
  };
};