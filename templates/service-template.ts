/**
 * Template for creating a new service
 * Copy this file and replace placeholders with your service name
 */

// 1. First, define the interface in src/types/services/
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

// 2. Define any specific types needed
export interface InputType {
  id: string;
  data: unknown;
}

export interface ResultType {
  success: boolean;
  data?: unknown;
  error?: string;
}

// 3. Create the web implementation in src/utils/{{service-name}}/
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

// 4. Create the React Native implementation in src/utils/{{service-name}}/
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

// 5. Create business operations in src/business/core/{{service-name}}/
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

// 6. Create React hook in src/business/hooks/data/ (if needed)
export const use{{ServiceName}} = () => {
  // Hook implementation using the operations class
  // Example: useState, useEffect, useCallback patterns
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

// 7. Don't forget to:
// - Add exports to appropriate index.ts files
// - Write comprehensive tests
// - Update documentation
// - Add error handling
// - Consider caching if appropriate