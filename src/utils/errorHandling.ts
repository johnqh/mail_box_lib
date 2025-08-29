import { ERROR_MESSAGES } from './constants';
import { env } from '../di/env';

export class AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return ERROR_MESSAGES.NETWORK_ERROR;
};

export const handleApiError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      ERROR_MESSAGES.NETWORK_ERROR,
      'NETWORK_ERROR',
      0
    );
  }

  // Handle response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    
    switch (status) {
      case 401:
        return new AppError(
          ERROR_MESSAGES.AUTHENTICATION_FAILED,
          'UNAUTHORIZED',
          401
        );
      case 403:
        return new AppError(
          ERROR_MESSAGES.PERMISSION_DENIED,
          'FORBIDDEN',
          403
        );
      case 429:
        return new AppError(
          ERROR_MESSAGES.RATE_LIMITED,
          'RATE_LIMITED',
          429
        );
      default:
        return new AppError(
          ERROR_MESSAGES.NETWORK_ERROR,
          'API_ERROR',
          status
        );
    }
  }

  return new AppError(
    getErrorMessage(error),
    'UNKNOWN_ERROR'
  );
};

export const logError = (error: unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const errorMessage = getErrorMessage(error);
  
  console.error(`[${timestamp}]${context ? ` [${context}]` : ''}: ${errorMessage}`, error);
  
  // In production, you might want to send this to an error tracking service
  if (env.isProduction()) {
    // Send to error tracking service
    // e.g., Sentry, LogRocket, etc.
  }
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export const withErrorBoundary = async <T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
};