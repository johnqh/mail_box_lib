/**
 * AI-Friendly Service Template for @johnqh/lib
 * 
 * This template provides a complete pattern for implementing new services
 * following the established architecture patterns.
 * 
 * Usage Instructions for AI:
 * 1. Replace all {{SERVICE_NAME}} with the actual service name (PascalCase)
 * 2. Replace all {{service-name}} with kebab-case version
 * 3. Replace all {{FEATURE_DESCRIPTION}} with actual feature description
 * 4. Implement the actual business logic in marked sections
 * 5. Update method signatures and types as needed
 */

// =============================================================================
// INTERFACE DEFINITION
// Location: src/types/services/{{service-name}}.interface.ts
// =============================================================================

/**
 * {{SERVICE_NAME}} service interface for {{FEATURE_DESCRIPTION}}
 */
export interface {{SERVICE_NAME}}Service {
  /**
   * Main service method - replace with actual service methods
   */
  performAction(params: {{SERVICE_NAME}}Params): Promise<{{SERVICE_NAME}}Result>;
  
  /**
   * Validation method for service inputs
   */
  validateInput(input: unknown): input is {{SERVICE_NAME}}Params;
}

/**
 * Parameters for {{SERVICE_NAME}} operations
 */
export interface {{SERVICE_NAME}}Params {
  // TODO: Define actual parameters
  id: string;
  data: string;
}

/**
 * Result type for {{SERVICE_NAME}} operations
 */
export interface {{SERVICE_NAME}}Result {
  success: boolean;
  data?: {{SERVICE_NAME}}Data;
  error?: string;
}

/**
 * Data structure returned by {{SERVICE_NAME}}
 */
export interface {{SERVICE_NAME}}Data {
  // TODO: Define actual data structure
  id: string;
  value: string;
  timestamp: Date;
}

/**
 * Custom error for {{SERVICE_NAME}} operations
 */
export class {{SERVICE_NAME}}Error extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = '{{SERVICE_NAME}}Error';
  }
}

// =============================================================================
// BUSINESS OPERATIONS
// Location: src/business/core/{{service-name}}/{{service-name}}-operations.ts
// =============================================================================

/**
 * Business operations for {{SERVICE_NAME}}
 * Contains platform-agnostic business logic
 */
export class {{SERVICE_NAME}}Operations {
  constructor(private service: {{SERVICE_NAME}}Service) {}

  /**
   * Main business operation - implement actual business logic here
   */
  async execute{{SERVICE_NAME}}(params: {{SERVICE_NAME}}Params): Promise<{{SERVICE_NAME}}Result> {
    // Input validation
    if (!this.service.validateInput(params)) {
      throw new {{SERVICE_NAME}}Error('Invalid input parameters', 'INVALID_INPUT');
    }

    // TODO: Add business validation rules here
    // Example:
    // if (!params.id || params.id.trim().length === 0) {
    //   throw new {{SERVICE_NAME}}Error('ID cannot be empty', 'EMPTY_ID');
    // }

    try {
      // Delegate to service implementation
      const result = await this.service.performAction(params);
      
      // TODO: Add business logic post-processing here
      if (!result.success) {
        throw new {{SERVICE_NAME}}Error(
          result.error || 'Operation failed', 
          'OPERATION_FAILED'
        );
      }

      return result;
    } catch (error) {
      if (error instanceof {{SERVICE_NAME}}Error) {
        throw error;
      }
      throw new {{SERVICE_NAME}}Error(
        `Unexpected error: ${error}`, 
        'UNEXPECTED_ERROR'
      );
    }
  }

  // TODO: Add additional business methods as needed
  // async validateBusinessRules(data: unknown): Promise<boolean> {
  //   // Business validation logic
  // }
}

// =============================================================================
// WEB PLATFORM IMPLEMENTATION
// Location: src/utils/{{service-name}}/{{service-name}}.web.ts
// =============================================================================

/**
 * Web platform implementation of {{SERVICE_NAME}}Service
 */
export class Web{{SERVICE_NAME}}Service implements {{SERVICE_NAME}}Service {
  async performAction(params: {{SERVICE_NAME}}Params): Promise<{{SERVICE_NAME}}Result> {
    try {
      // TODO: Implement web-specific logic
      const response = await fetch('/api/{{service-name}}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          id: data.id,
          value: data.value,
          timestamp: new Date(data.timestamp),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  validateInput(input: unknown): input is {{SERVICE_NAME}}Params {
    // TODO: Implement actual validation logic
    return (
      typeof input === 'object' &&
      input !== null &&
      'id' in input &&
      'data' in input &&
      typeof (input as any).id === 'string' &&
      typeof (input as any).data === 'string'
    );
  }
}

// =============================================================================
// REACT NATIVE PLATFORM IMPLEMENTATION
// Location: src/utils/{{service-name}}/{{service-name}}.reactnative.ts
// =============================================================================

/**
 * React Native platform implementation of {{SERVICE_NAME}}Service
 */
export class ReactNative{{SERVICE_NAME}}Service implements {{SERVICE_NAME}}Service {
  async performAction(params: {{SERVICE_NAME}}Params): Promise<{{SERVICE_NAME}}Result> {
    try {
      // TODO: Implement React Native-specific logic
      // Can use AsyncStorage, React Native-specific APIs, etc.
      
      // Example implementation:
      return {
        success: true,
        data: {
          id: params.id,
          value: `processed-${params.data}`,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      };
    }
  }

  validateInput(input: unknown): input is {{SERVICE_NAME}}Params {
    // Same validation logic as web (or platform-specific if needed)
    return (
      typeof input === 'object' &&
      input !== null &&
      'id' in input &&
      'data' in input &&
      typeof (input as any).id === 'string' &&
      typeof (input as any).data === 'string'
    );
  }
}

// =============================================================================
// PLATFORM FACTORY
// Location: src/utils/{{service-name}}/index.ts
// =============================================================================

import { Platform } from '../../types/environment';
import { {{SERVICE_NAME}}Service } from '../../types/services/{{service-name}}.interface';

/**
 * Factory function to create platform-appropriate {{SERVICE_NAME}}Service
 */
export const create{{SERVICE_NAME}}Service = (): {{SERVICE_NAME}}Service => {
  if (Platform.OS === 'web') {
    const { Web{{SERVICE_NAME}}Service } = require('./{{service-name}}.web');
    return new Web{{SERVICE_NAME}}Service();
  } else {
    const { ReactNative{{SERVICE_NAME}}Service } = require('./{{service-name}}.reactnative');
    return new ReactNative{{SERVICE_NAME}}Service();
  }
};

// =============================================================================
// REACT HOOK
// Location: src/business/hooks/data/use{{SERVICE_NAME}}.ts
// =============================================================================

import { useState, useCallback } from 'react';
import { {{SERVICE_NAME}}Operations } from '../../core/{{service-name}}/{{service-name}}-operations';
import { 
  {{SERVICE_NAME}}Params, 
  {{SERVICE_NAME}}Result, 
  {{SERVICE_NAME}}Error 
} from '../../../types/services/{{service-name}}.interface';
import { create{{SERVICE_NAME}}Service } from '../../../utils/{{service-name}}';

/**
 * React hook for {{SERVICE_NAME}} operations
 */
export const use{{SERVICE_NAME}} = () => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{{SERVICE_NAME}}Error | null>(null);
  const [result, setResult] = useState<{{SERVICE_NAME}}Result | null>(null);

  // Operations instance
  const operations = new {{SERVICE_NAME}}Operations(create{{SERVICE_NAME}}Service());

  // Main action method
  const execute{{SERVICE_NAME}} = useCallback(async (params: {{SERVICE_NAME}}Params) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await operations.execute{{SERVICE_NAME}}(params);
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof {{SERVICE_NAME}}Error 
        ? err 
        : new {{SERVICE_NAME}}Error('Unknown error', 'UNKNOWN');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operations]);

  // Utility methods
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    // Actions
    execute{{SERVICE_NAME}},
    
    // State
    isLoading,
    error,
    result,
    
    // Utilities
    clearError,
    clearResult,
    reset,
  };
};

// =============================================================================
// UNIT TESTS
// Location: src/business/core/{{service-name}}/__tests__/{{service-name}}-operations.test.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {{SERVICE_NAME}}Operations } from '../{{service-name}}-operations';
import { 
  {{SERVICE_NAME}}Service, 
  {{SERVICE_NAME}}Error,
  {{SERVICE_NAME}}Params 
} from '../../../../types/services/{{service-name}}.interface';

describe('{{SERVICE_NAME}}Operations', () => {
  const mockService: {{SERVICE_NAME}}Service = {
    performAction: vi.fn(),
    validateInput: vi.fn(),
  };

  const operations = new {{SERVICE_NAME}}Operations(mockService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute{{SERVICE_NAME}}', () => {
    const validParams: {{SERVICE_NAME}}Params = {
      id: 'test-id',
      data: 'test-data',
    };

    it('should execute successfully with valid input', async () => {
      const expectedResult = { 
        success: true, 
        data: { id: 'test-id', value: 'test-data', timestamp: new Date() } 
      };
      
      mockService.validateInput.mockReturnValue(true);
      mockService.performAction.mockResolvedValue(expectedResult);

      const result = await operations.execute{{SERVICE_NAME}}(validParams);

      expect(mockService.validateInput).toHaveBeenCalledWith(validParams);
      expect(mockService.performAction).toHaveBeenCalledWith(validParams);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error for invalid input', async () => {
      mockService.validateInput.mockReturnValue(false);

      await expect(operations.execute{{SERVICE_NAME}}(validParams)).rejects.toThrow(
        new {{SERVICE_NAME}}Error('Invalid input parameters', 'INVALID_INPUT')
      );
    });

    it('should handle service errors', async () => {
      mockService.validateInput.mockReturnValue(true);
      mockService.performAction.mockRejectedValue(new Error('Service error'));

      await expect(operations.execute{{SERVICE_NAME}}(validParams)).rejects.toThrow(
        new {{SERVICE_NAME}}Error('Unexpected error: Error: Service error', 'UNEXPECTED_ERROR')
      );
    });

    it('should handle service failure results', async () => {
      mockService.validateInput.mockReturnValue(true);
      mockService.performAction.mockResolvedValue({ 
        success: false, 
        error: 'Service failed' 
      });

      await expect(operations.execute{{SERVICE_NAME}}(validParams)).rejects.toThrow(
        new {{SERVICE_NAME}}Error('Service failed', 'OPERATION_FAILED')
      );
    });
  });
});

// =============================================================================
// HOOK TESTS
// Location: src/business/hooks/data/__tests__/use{{SERVICE_NAME}}.test.ts
// =============================================================================

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { use{{SERVICE_NAME}} } from '../use{{SERVICE_NAME}}';

// Mock the service creation
vi.mock('../../../utils/{{service-name}}', () => ({
  create{{SERVICE_NAME}}Service: () => ({
    performAction: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { id: 'test', value: 'test', timestamp: new Date() } 
    }),
    validateInput: vi.fn().mockReturnValue(true),
  }),
}));

describe('use{{SERVICE_NAME}}', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => use{{SERVICE_NAME}}());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);
  });

  it('should handle successful execution', async () => {
    const { result } = renderHook(() => use{{SERVICE_NAME}}());
    const params = { id: 'test-id', data: 'test-data' };

    await act(async () => {
      await result.current.execute{{SERVICE_NAME}}(params);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.success).toBe(true);
  });

  it('should handle execution errors', async () => {
    const { result } = renderHook(() => use{{SERVICE_NAME}}());
    const invalidParams = { id: '', data: 'test-data' };

    await act(async () => {
      try {
        await result.current.execute{{SERVICE_NAME}}(invalidParams);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.result).toBe(null);
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => use{{SERVICE_NAME}}());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});

// =============================================================================
// EXPORT UPDATES
// Add these exports to the appropriate index files
// =============================================================================

/*
// src/types/services/index.ts
export * from './{{service-name}}.interface';

// src/business/core/index.ts
export * from './{{service-name}}/{{service-name}}-operations';

// src/business/hooks/data/index.ts
export { use{{SERVICE_NAME}} } from './use{{SERVICE_NAME}}';

// src/index.ts (main exports)
export {
  // Types
  type {{SERVICE_NAME}}Service,
  type {{SERVICE_NAME}}Params,
  type {{SERVICE_NAME}}Result,
  type {{SERVICE_NAME}}Data,
  {{SERVICE_NAME}}Error,
  
  // Hooks
  use{{SERVICE_NAME}},
  
  // Operations (if needed externally)
  {{SERVICE_NAME}}Operations,
} from './business';
*/