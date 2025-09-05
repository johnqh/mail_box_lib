/**
 * Template for creating a new service
 * 
 * INSTRUCTIONS:
 * 1. Copy this template to create a new service
 * 2. Replace all {{ServiceName}} with your actual service name (PascalCase)
 * 3. Replace all {{serviceName}} with camelCase version
 * 4. Replace all {{service-name}} with kebab-case version
 * 5. Update all type definitions to match your needs
 * 6. Remove this comment block when done
 */

// ============================================================================
// STEP 1: Interface Definition
// File: src/types/services/{{service-name}}.interface.ts
// ============================================================================

export interface {{ServiceName}}Service {
  /**
   * Brief description of what this method does
   * @param param1 Description of parameter
   * @param param2 Description of parameter
   * @returns Promise resolving to the result
   */
  methodName(param1: string, param2: number): Promise<ResultType>;
  
  /**
   * Another method example
   * @param input Input parameter
   */
  anotherMethod(input: InputType): Promise<void>;
}

// Type definitions for this service
export interface InputType {
  id: string;
  data: unknown;
}

export interface ResultType {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Custom error for this service
export class {{ServiceName}}Error extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = '{{ServiceName}}Error';
  }
}

// ============================================================================
// STEP 2: Web Implementation
// File: src/utils/{{service-name}}/{{service-name}}.web.ts
// ============================================================================

import { {{ServiceName}}Service, ResultType, InputType } from '../../types/services/{{service-name}}.interface';

export class Web{{ServiceName}}Service implements {{ServiceName}}Service {
  constructor(private config: ServiceConfig) {}
  
  async methodName(param1: string, param2: number): Promise<ResultType> {
    try {
      // Web-specific implementation using browser APIs
      const response = await fetch(`/api/{{service-name}}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ param1, param2 }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('{{ServiceName}} error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  async anotherMethod(input: InputType): Promise<void> {
    // Implementation here
  }
}

// ============================================================================
// STEP 3: React Native Implementation
// File: src/utils/{{service-name}}/{{service-name}}.reactnative.ts
// ============================================================================

import { {{ServiceName}}Service, ResultType, InputType } from '../../types/services/{{service-name}}.interface';

export class ReactNative{{ServiceName}}Service implements {{ServiceName}}Service {
  constructor(private config: ServiceConfig) {}
  
  async methodName(param1: string, param2: number): Promise<ResultType> {
    try {
      // React Native-specific implementation
      // Use react-native libraries or APIs as needed
      
      return { success: true };
    } catch (error) {
      console.error('{{ServiceName}} error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  async anotherMethod(input: InputType): Promise<void> {
    // Implementation here
  }
}

// ============================================================================
// STEP 4: Platform Detection
// File: src/utils/{{service-name}}/index.ts
// ============================================================================

import { Platform } from '../../types/environment';
import { {{ServiceName}}Service } from '../../types/services/{{service-name}}.interface';

export const create{{ServiceName}}Service = (config: ServiceConfig): {{ServiceName}}Service => {
  if (Platform.OS === 'web') {
    const { Web{{ServiceName}}Service } = require('./{{service-name}}.web');
    return new Web{{ServiceName}}Service(config);
  } else {
    const { ReactNative{{ServiceName}}Service } = require('./{{service-name}}.reactnative');
    return new ReactNative{{ServiceName}}Service(config);
  }
};

// ============================================================================
// STEP 5: Business Operations
// File: src/business/core/{{service-name}}/{{service-name}}-operations.ts
// ============================================================================

import { {{ServiceName}}Service, {{ServiceName}}Error } from '../../../types/services/{{service-name}}.interface';

export class {{ServiceName}}Operations {
  constructor(private {{serviceName}}Service: {{ServiceName}}Service) {}
  
  /**
   * Business logic method that uses the service
   * Keep this pure and platform-agnostic
   */
  async performBusinessOperation(data: BusinessData): Promise<BusinessResult> {
    // Validate input
    if (!this.isValidInput(data)) {
      throw new Error('Invalid input data');
    }
    
    // Use the service
    const result = await this.{{serviceName}}Service.methodName(
      data.param1, 
      data.param2
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Operation failed');
    }
    
    // Transform result to business domain
    return this.transformToBusinessResult(result);
  }
  
  private isValidInput(data: BusinessData): boolean {
    // Validation logic
    return Boolean(data?.param1 && data?.param2);
  }
  
  private transformToBusinessResult(result: ResultType): BusinessResult {
    // Transform service result to business domain
    return {
      id: result.data?.id || '',
      success: result.success,
    };
  }
}

// ============================================================================
// STEP 6: React Hook (Optional)
// File: src/business/hooks/data/use{{ServiceName}}.ts
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { {{ServiceName}}Operations } from '../../core/{{service-name}}/{{service-name}}-operations';
import { create{{ServiceName}}Service } from '../../../utils/{{service-name}}';

export const use{{ServiceName}} = (config?: ServiceConfig) => {
  const [data, setData] = useState<BusinessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Create service and operations instances
  const service = create{{ServiceName}}Service(config || defaultConfig);
  const operations = new {{ServiceName}}Operations(service);
  
  const executeOperation = useCallback(async (input: BusinessData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operations.performBusinessOperation(input);
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Optional: Auto-fetch on mount
  useEffect(() => {
    // Uncomment if you want to fetch data on mount
    // executeOperation(defaultInput);
  }, []);
  
  return {
    data,
    loading,
    error,
    executeOperation,
    retry: () => data && executeOperation(data),
  };
};

// Types for business layer
interface ServiceConfig {
  apiUrl: string;
  timeout: number;
}

interface BusinessData {
  param1: string;
  param2: number;
}

interface BusinessResult {
  id: string;
  success: boolean;
}

// ============================================================================
// STEP 7: Unit Tests
// File: src/business/core/{{service-name}}/__tests__/{{service-name}}-operations.test.ts
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {{ServiceName}}Operations } from '../{{service-name}}-operations';
import { {{ServiceName}}Service } from '../../../../types/services/{{service-name}}.interface';

describe('{{ServiceName}}Operations', () => {
  let mockService: {{ServiceName}}Service;
  let operations: {{ServiceName}}Operations;
  
  beforeEach(() => {
    mockService = {
      methodName: vi.fn(),
      anotherMethod: vi.fn(),
    };
    operations = new {{ServiceName}}Operations(mockService);
  });
  
  describe('performBusinessOperation', () => {
    it('should successfully process valid data', async () => {
      const mockResult = { success: true, data: { id: '123' } };
      vi.mocked(mockService.methodName).mockResolvedValue(mockResult);
      
      const input = { param1: 'test', param2: 42 };
      const result = await operations.performBusinessOperation(input);
      
      expect(result).toEqual({
        id: '123',
        success: true,
      });
      expect(mockService.methodName).toHaveBeenCalledWith('test', 42);
    });
    
    it('should throw error for invalid input', async () => {
      const invalidInput = { param1: '', param2: 0 };
      
      await expect(
        operations.performBusinessOperation(invalidInput)
      ).rejects.toThrow('Invalid input data');
    });
    
    it('should handle service errors properly', async () => {
      const mockError = { success: false, error: 'Service failed' };
      vi.mocked(mockService.methodName).mockResolvedValue(mockError);
      
      const input = { param1: 'test', param2: 42 };
      
      await expect(
        operations.performBusinessOperation(input)
      ).rejects.toThrow('Service failed');
    });
  });
});

// ============================================================================
// STEP 8: Export Configuration
// ============================================================================

// Add to src/types/services/index.ts:
// export * from './{{service-name}}.interface';

// Add to src/business/core/index.ts:
// export * from './{{service-name}}/{{service-name}}-operations';

// Add to src/business/hooks/data/index.ts (if hook created):
// export { use{{ServiceName}} } from './use{{ServiceName}}';

// Add to src/utils/index.ts:
// export * from './{{service-name}}';

// ============================================================================
// CHECKLIST
// ============================================================================

// Before completing your service:
// ✅ Replace all placeholders ({{ServiceName}}, {{serviceName}}, {{service-name}})
// ✅ Update all type definitions to match your needs
// ✅ Implement all methods in both web and React Native versions
// ✅ Add comprehensive error handling
// ✅ Write unit tests with good coverage
// ✅ Update all relevant index.ts files for exports
// ✅ Add JSDoc comments for all public methods
// ✅ Consider adding caching if appropriate
// ✅ Run npm run typecheck to verify types
// ✅ Run npm test to ensure all tests pass
// ✅ Run npm run lint:fix to fix formatting

const defaultConfig: ServiceConfig = {
  apiUrl: process.env.API_URL || 'https://api.example.com',
  timeout: 30000,
};