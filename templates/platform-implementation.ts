/**
 * Template: Platform Implementation (Web)
 * Location: src/utils/my-service/my-service.web.ts
 * 
 * This template shows how to implement a service interface for web platforms.
 * The React Native version would be in my-service.reactnative.ts
 */

import {
  MyService,
  MyServiceConfig,
  MyServiceData,
  MyServiceResult,
  MyServiceError,
} from '../../types/services/my-service.interface';

/**
 * Web-specific implementation of MyService using localStorage and fetch
 * 
 * Key principles:
 * - Implement ALL interface methods
 * - Handle platform-specific APIs (localStorage, fetch, etc.)
 * - Provide proper error handling
 * - Use platform-appropriate storage/networking
 */
export class WebMyService implements MyService {
  private config: MyServiceConfig | null = null;
  private storage: Storage;

  constructor() {
    // Platform-specific initialization
    this.storage = window.localStorage;
  }

  async initialize(config: MyServiceConfig): Promise<void> {
    try {
      this.config = config;
      
      // Test connectivity
      const response = await fetch(`${config.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        throw new MyServiceError(
          'Service not available',
          'INITIALIZATION_FAILED',
          response.status
        );
      }

      // Store config in localStorage for persistence
      this.storage.setItem('myservice-config', JSON.stringify(config));
    } catch (error) {
      throw new MyServiceError(
        `Failed to initialize service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED'
      );
    }
  }

  async create(data: Omit<MyServiceData, 'id' | 'createdAt'>): Promise<MyServiceData> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/items', {
        value: data.value,
        metadata: data.metadata,
      });

      return this.transformResponseToData(response);
    } catch (error) {
      throw this.handleError(error, 'CREATE_FAILED');
    }
  }

  async getById(id: string): Promise<MyServiceData | null> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', `/items/${encodeURIComponent(id)}`);
      
      if (response.status === 404) {
        return null;
      }

      return this.transformResponseToData(response);
    } catch (error) {
      if (error instanceof MyServiceError && error.statusCode === 404) {
        return null;
      }
      throw this.handleError(error, 'GET_FAILED');
    }
  }

  async update(id: string, updates: Partial<MyServiceData>): Promise<MyServiceData> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('PATCH', `/items/${encodeURIComponent(id)}`, {
        value: updates.value,
        metadata: updates.metadata,
      });

      return this.transformResponseToData(response);
    } catch (error) {
      throw this.handleError(error, 'UPDATE_FAILED');
    }
  }

  async delete(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.makeRequest('DELETE', `/items/${encodeURIComponent(id)}`);
      return true;
    } catch (error) {
      if (error instanceof MyServiceError && error.statusCode === 404) {
        return false;
      }
      throw this.handleError(error, 'DELETE_FAILED');
    }
  }

  async list(filters?: Record<string, unknown>): Promise<MyServiceData[]> {
    this.ensureInitialized();

    try {
      const queryString = filters ? this.buildQueryString(filters) : '';
      const response = await this.makeRequest('GET', `/items${queryString}`);
      
      const responseData = await response.json();
      
      if (!Array.isArray(responseData.items)) {
        throw new MyServiceError('Invalid response format', 'INVALID_RESPONSE');
      }

      return responseData.items.map((item: any) => this.transformResponseToData({ json: () => item }));
    } catch (error) {
      throw this.handleError(error, 'LIST_FAILED');
    }
  }

  async healthCheck(): Promise<MyServiceResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'Service not initialized',
      };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.config) {
      throw new MyServiceError('Service not initialized', 'NOT_INITIALIZED');
    }
  }

  private async makeRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<Response> {
    const url = `${this.config!.apiUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.config!.retryAttempts) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.config!.timeout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new MyServiceError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            errorData.code || 'HTTP_ERROR',
            response.status
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (error instanceof MyServiceError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        attempt++;
        if (attempt <= this.config!.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  private transformResponseToData(response: any): MyServiceData {
    // In a real implementation, you'd parse the actual response
    // This is a simplified example
    return {
      id: response.id,
      value: response.value,
      metadata: response.metadata || {},
      createdAt: new Date(response.createdAt),
    };
  }

  private buildQueryString(filters: Record<string, unknown>): string {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  private handleError(error: unknown, defaultCode: string): MyServiceError {
    if (error instanceof MyServiceError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return new MyServiceError(message, defaultCode);
  }
}

/**
 * Factory function to create WebMyService instance
 * This pattern allows for easy testing and dependency injection
 */
export const createWebMyService = (): MyService => {
  return new WebMyService();
};

/**
 * Platform detection helper (used in main service file)
 */
export const isWebPlatform = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};