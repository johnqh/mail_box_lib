import { useState, useEffect, useCallback } from 'react';
import { Email } from "../../../types/email";
import { EmailService } from "../../../types/services";
// Services will be injected through options or dependency injection
import { WildDuckMessageResponse, WildDuckMessageDetail } from '../../../types/api';

interface UseEmailReturn {
  email: Email | null;
  loading: boolean;
  error: string | null;
  refreshEmail: () => Promise<void>;
}

interface UseEmailOptions {
  emailService?: EmailService;
  mockEmailService?: EmailService;
  getMessage?: (userId: string, messageId: string) => Promise<any>;
}

// Convert WildDuck full message to our Email interface
const convertFullWildDuckMessage = (response: WildDuckMessageResponse): Email => {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get message data');
  }
  
  const wildDuckMessage = response.data;
  return {
    id: wildDuckMessage.id,
    from: wildDuckMessage.from?.address || 'unknown@0xmail.box',
    to: wildDuckMessage.to[0]?.address || 'unknown@0xmail.box',
    subject: wildDuckMessage.subject || '(No Subject)',
    body: wildDuckMessage.html || wildDuckMessage.text || 'No content available',
    date: new Date(wildDuckMessage.date),
    read: wildDuckMessage.seen,
    starred: wildDuckMessage.flagged,
    folder: 'inbox' as Email['folder'],
    attachments: wildDuckMessage.attachments?.map(att => att.filename)
  };
};

export const useEmail = (
  emailId: string | null, 
  userId?: string,
  options: UseEmailOptions = {}
): UseEmailReturn => {
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provided services (must be injected by caller)
  const emailService = options.emailService;
  const mockEmailService = options.mockEmailService;
  const getMessage = options.getMessage;

  const fetchEmail = useCallback(async (id: string | null) => {
    if (!id) {
      setEmail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching email with ID:', id);
      
      if (userId && getMessage) {
        // Use WildDuck getMessage function if provided
        const wildDuckMessage = await getMessage(userId, id);
        const convertedEmail = convertFullWildDuckMessage(wildDuckMessage);
        setEmail(convertedEmail);
        console.log('Successfully fetched full email from WildDuck');
        setError(null);
      } else {
        throw new Error('No user ID or getMessage function provided');
      }
    } catch (err) {
      console.warn('WildDuck hook failed, falling back to service layer:', err);
      
      try {
        // Fallback to email service if provided
        if (!emailService) {
          throw new Error('Email service not provided for fallback');
        }
        const fallbackEmail = await emailService.getEmail(userId || 'user', id);
        setEmail(fallbackEmail);
        setError(null);
        console.log('Using service layer fallback');
      } catch (serviceErr) {
        console.warn('Service layer failed, falling back to mock data:', serviceErr);
        
        try {
          // Final fallback to mock service for development
          if (!mockEmailService) {
            throw new Error('Mock email service not provided');
          }
          const mockEmail = await mockEmailService.getEmail(userId || 'user', id);
          setEmail(mockEmail);
          setError(null);
          console.log('Using offline mode with mock email');
        } catch (mockErr) {
          console.error('All fallback methods failed:', mockErr);
          setError('Failed to load email');
          setEmail(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId, getMessage, emailService, mockEmailService]);

  const refreshEmail = useCallback(async () => {
    await fetchEmail(emailId);
  }, [emailId, fetchEmail]);

  useEffect(() => {
    fetchEmail(emailId);
  }, [emailId, fetchEmail]);

  return {
    email,
    loading,
    error,
    refreshEmail
  };
};