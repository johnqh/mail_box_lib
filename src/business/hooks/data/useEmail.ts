import { useState, useEffect, useCallback } from 'react';
import { Email } from '../types';
import { EmailService } from '../services/email.interface';
import { webEmailService } from '../services/email.web';
import { mockEmailService } from '../services/email.mock';
import { useWildduckMessages } from '../hooks/useWildduckMessages';
import { WildDuckMessageResponse } from '../config/api';

interface UseEmailReturn {
  email: Email | null;
  loading: boolean;
  error: string | null;
  refreshEmail: () => Promise<void>;
}

interface UseEmailOptions {
  emailService?: EmailService;
}

// Convert WildDuck full message to our Email interface
const convertFullWildDuckMessage = (wildDuckMessage: WildDuckMessageResponse): Email => {
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

  // Use WildDuck hooks directly
  const { getMessage, isLoading: wildduckLoading, error: wildduckError } = useWildduckMessages();

  // Use provided email service or default to web service with mock fallback
  const emailService = options.emailService || webEmailService;

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
      
      if (userId) {
        // Use WildDuck hook directly
        const wildDuckMessage = await getMessage(userId, id);
        const convertedEmail = convertFullWildDuckMessage(wildDuckMessage);
        setEmail(convertedEmail);
        console.log('Successfully fetched full email from WildDuck hook');
        setError(null);
      } else {
        throw new Error('No user ID provided for email fetch');
      }
    } catch (err) {
      console.warn('WildDuck hook failed, falling back to service layer:', err);
      
      try {
        // Fallback to service layer (which may use mock data)
        const fallbackEmail = await emailService.getEmail(userId || 'user', id);
        setEmail(fallbackEmail);
        setError(null);
        console.log('Using service layer fallback');
      } catch (serviceErr) {
        console.warn('Service layer failed, falling back to mock data:', serviceErr);
        
        try {
          // Final fallback to mock service for development
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
  }, [userId, getMessage, emailService]);

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