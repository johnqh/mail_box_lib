/**
 * AI-Friendly Service Template
 * 
 * Instructions for AI assistants:
 * 1. Replace {{SERVICE_NAME}} with the actual service name (e.g., WalletService)
 * 2. Replace {{INTERFACE_NAME}} with the service interface name
 * 3. Replace {{DEPENDENCY_TYPE}} with the actual dependency type
 * 4. Add specific methods and business logic as needed
 * 5. Update imports to match actual dependencies
 * 6. Follow the established error handling patterns
 * 
 * Pattern: Business service with dependency injection and error handling
 */

import { {{INTERFACE_NAME}} } from '../../types/services/{{service-name}}.interface';
import { {{DEPENDENCY_TYPE}} } from '../../types/{{dependency-path}}';

/**
 * Service-specific error class
 * Use this for domain-specific errors that need special handling
 */
export class {{SERVICE_NAME}}Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = '{{SERVICE_NAME}}Error';
  }
}

/**
 * Configuration interface for the service
 * Define any configuration options the service needs
 */
export interface {{SERVICE_NAME}}Config {
  /** Required configuration option */
  apiUrl: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Optional retry attempts */
  retryAttempts?: number;
}

/**
 * {{SERVICE_NAME}} implementation
 * 
 * This service handles [DESCRIBE MAIN RESPONSIBILITY]
 * 
 * @example
 * ```typescript
 * const config = { apiUrl: 'https://api.example.com' };
 * const dependency = new DependencyImplementation();
 * const service = new {{SERVICE_NAME}}(dependency, config);
 * 
 * try {
 *   const result = await service.performOperation(params);
 *   console.log('Success:', result);
 * } catch (error) {
 *   if (error instanceof {{SERVICE_NAME}}Error) {
 *     console.error('Service error:', error.code, error.message);
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * ```
 */
export class {{SERVICE_NAME}} implements {{INTERFACE_NAME}} {
  private readonly config: Required<{{SERVICE_NAME}}Config>;

  constructor(
    private readonly dependency: {{DEPENDENCY_TYPE}},
    config: {{SERVICE_NAME}}Config
  ) {
    // Set default values for optional config
    this.config = {
      timeout: 5000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Main service operation
   * 
   * @param params - Operation parameters
   * @returns Promise with operation result
   * @throws {{SERVICE_NAME}}Error when operation fails
   */
  async performOperation(params: {{PARAMS_TYPE}}): Promise<{{RESULT_TYPE}}> {
    try {
      // Input validation
      this.validateParams(params);

      // Business logic implementation
      const result = await this.executeOperation(params);

      // Result validation/transformation
      return this.processResult(result);
    } catch (error) {
      // Error handling and re-throwing with context
      throw this.handleError(error, 'performOperation', params);
    }
  }

  /**
   * Secondary service operation (add more as needed)
   */
  async secondaryOperation(params: {{SECONDARY_PARAMS}}): Promise<{{SECONDARY_RESULT}}> {
    try {
      // Implementation here
      const result = await this.dependency.secondaryCall(params);
      return result;
    } catch (error) {
      throw this.handleError(error, 'secondaryOperation', params);
    }
  }

  // Private helper methods

  /**
   * Validates input parameters
   */
  private validateParams(params: {{PARAMS_TYPE}}): void {
    if (!params) {
      throw new {{SERVICE_NAME}}Error(
        'Parameters are required',
        'INVALID_PARAMS'
      );
    }

    // Add specific validation logic
    if (!params.requiredField) {
      throw new {{SERVICE_NAME}}Error(
        'Required field is missing',
        'MISSING_REQUIRED_FIELD'
      );
    }
  }

  /**
   * Executes the main business operation
   */
  private async executeOperation(params: {{PARAMS_TYPE}}): Promise<any> {
    // Implement the core business logic here
    // This is where you'd make API calls, database operations, etc.
    
    const result = await this.dependency.performTask({
      ...params,
      timeout: this.config.timeout,
    });

    return result;
  }

  /**
   * Processes and validates the operation result
   */
  private processResult(rawResult: any): {{RESULT_TYPE}} {
    // Transform/validate the result before returning
    if (!rawResult) {
      throw new {{SERVICE_NAME}}Error(
        'No result returned from operation',
        'EMPTY_RESULT'
      );
    }

    return {
      // Transform result to match interface
      data: rawResult.data,
      timestamp: Date.now(),
      status: 'success',
    };
  }

  /**
   * Centralized error handling
   */
  private handleError(
    error: unknown,
    operation: string,
    params?: any
  ): {{SERVICE_NAME}}Error {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error(`{{SERVICE_NAME}}.${operation} error:`, error, { params });
    }

    // Handle different error types
    if (error instanceof {{SERVICE_NAME}}Error) {
      // Re-throw service errors as-is
      return error;
    }

    if (error instanceof Error) {
      // Wrap generic errors
      return new {{SERVICE_NAME}}Error(
        `${operation} failed: ${error.message}`,
        'OPERATION_FAILED',
        error
      );
    }

    // Handle unknown error types
    return new {{SERVICE_NAME}}Error(
      `${operation} failed with unknown error`,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Factory function for creating service instances
 * This is useful for dependency injection and testing
 */
export const create{{SERVICE_NAME}} = (
  dependency: {{DEPENDENCY_TYPE}},
  config: {{SERVICE_NAME}}Config
): {{SERVICE_NAME}} => {
  return new {{SERVICE_NAME}}(dependency, config);
};

/**
 * Default service instance (for simple use cases)
 * Only use this if you don't need custom configuration
 */
export const default{{SERVICE_NAME}} = (dependency: {{DEPENDENCY_TYPE}}): {{SERVICE_NAME}} => {
  const defaultConfig: {{SERVICE_NAME}}Config = {
    apiUrl: process.env.DEFAULT_API_URL || 'https://api.example.com',
    timeout: 5000,
    retryAttempts: 3,
  };
  
  return new {{SERVICE_NAME}}(dependency, defaultConfig);
};

/**
 * AI Instructions for customization:
 * 
 * 1. Service Patterns:
 *    - API Service: Add HTTP client dependency, handle network errors
 *    - Data Service: Add database/storage dependency, handle data validation
 *    - Business Logic Service: Focus on domain rules, less external dependencies
 *    - Integration Service: Handle external service integrations, add retry logic
 * 
 * 2. Error Handling Strategies:
 *    - Use specific error codes for different failure types
 *    - Include original error for debugging in development
 *    - Add retry logic for transient failures
 *    - Log errors appropriately for monitoring
 * 
 * 3. Configuration Patterns:
 *    - Use environment variables for deployment-specific config
 *    - Provide sensible defaults for optional settings
 *    - Validate configuration in constructor
 *    - Make configuration immutable after construction
 * 
 * 4. Testing Patterns:
 *    - Mock the dependency in tests
 *    - Test both success and error scenarios
 *    - Test configuration validation
 *    - Test error handling and error types
 * 
 * 5. Performance Considerations:
 *    - Add caching if expensive operations are repeated
 *    - Use timeouts for network operations
 *    - Consider rate limiting for external API calls
 *    - Add metrics/logging for performance monitoring
 * 
 * 6. Common Extensions:
 *    - Add event emitter for status updates
 *    - Add circuit breaker for external dependencies
 *    - Add request deduplication
 *    - Add request/response logging
 */