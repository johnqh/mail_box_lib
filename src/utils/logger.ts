/**
 * Centralized logging utility
 * Provides consistent logging across the application with proper formatting
 */

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(
    _level: LogLevel,
    message: string,
    context?: string
  ): string {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? ` [${context}]` : '';
    return `[${timestamp}]${contextStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    return true;
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (data) {
        console.error(data);
      }
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
      if (data) {
        console.warn(data);
      }
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
      if (data) {
        console.log(data);
      }
    }
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Create a contextual logger that automatically includes context in all calls
   */
  withContext(context: string) {
    return {
      error: (message: string, data?: any) =>
        this.error(message, context, data),
      warn: (message: string, data?: any) => this.warn(message, context, data),
      info: (message: string, data?: any) => this.info(message, context, data),
      debug: (message: string, data?: any) =>
        this.debug(message, context, data),
    };
  }
}

// Export singleton instance
const logger = new Logger();

// Export contextual loggers for common areas
const authLogger = logger.withContext('AUTH');
const apiLogger = logger.withContext('API');
const contractLogger = logger.withContext('CONTRACT');
const ensLogger = logger.withContext('ENS');
const storageLogger = logger.withContext('STORAGE');

export {
  LogLevel,
  type LogEntry,
  logger,
  authLogger,
  apiLogger,
  contractLogger,
  ensLogger,
  storageLogger,
};
