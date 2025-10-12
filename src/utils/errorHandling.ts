import { Optional } from '@sudobility/types';
import { ERROR_MESSAGES, logger } from '@sudobility/types';
// import { EnvUtils } from '../../di'; // TODO: Implement proper DI setup

// Platform-specific global
declare const fetch: typeof globalThis.fetch; // eslint-disable-line @typescript-eslint/no-unused-vars

class AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode ?? 500;
    this.details = details;
  }
}

const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

const getErrorMessage = (error: unknown): string => {
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

const handleApiError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR', 0);
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
        return new AppError(ERROR_MESSAGES.PERMISSION_DENIED, 'FORBIDDEN', 403);
      case 429:
        return new AppError(ERROR_MESSAGES.RATE_LIMITED, 'RATE_LIMITED', 429);
      default:
        return new AppError(ERROR_MESSAGES.NETWORK_ERROR, 'API_ERROR', status);
    }
  }

  return new AppError(getErrorMessage(error), 'UNKNOWN_ERROR');
};

const logError = (error: unknown, context?: string): void => {
  const errorMessage = getErrorMessage(error);
  logger.error(errorMessage, context, error);

  // In production, you might want to send this to an error tracking service
  // Note: EnvUtils would need to be instantiated with a platform-specific implementation
  // For now, we'll comment this out until proper DI setup
  // if (envUtils.isProduction()) {
  //   // Send to error tracking service
  //   // e.g., Sentry, LogRocket, etc.
  // }
};

const retryWithBackoff = async <T>(
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

const withErrorBoundary = async <T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<Optional<T>> => {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
};

export {
  isAppError,
  getErrorMessage,
  handleApiError,
  logError,
  retryWithBackoff,
  withErrorBoundary,
  AppError,
};
