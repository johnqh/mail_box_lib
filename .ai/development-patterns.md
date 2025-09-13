# Development Patterns - @johnqh/lib

This document provides concrete patterns and templates for AI-assisted development.

## 🎯 Core Development Patterns

### 1. Service Implementation Pattern

#### Interface Definition (`src/types/services/`)
```typescript
// src/types/services/my-feature.interface.ts
export interface MyFeatureService {
  performAction(param: string): Promise<MyFeatureResult>;
  validateInput(input: unknown): boolean;
}

export interface MyFeatureResult {
  success: boolean;
  data?: MyFeatureData;
  error?: string;
}

export interface MyFeatureData {
  id: string;
  value: string;
  timestamp: Date;
}

export class MyFeatureError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MyFeatureError';
  }
}
```

#### Business Operations (`src/business/core/`)
```typescript
// src/business/core/my-feature/my-feature-operations.ts
import { MyFeatureService, MyFeatureResult, MyFeatureError } from '../../../types/services/my-feature.interface';

export class MyFeatureOperations {
  constructor(private service: MyFeatureService) {}

  async executeFeature(input: string): Promise<MyFeatureResult> {
    // Input validation
    if (!input || input.trim().length === 0) {
      throw new MyFeatureError('Input cannot be empty', 'INVALID_INPUT');
    }

    // Business logic validation
    if (!this.service.validateInput(input)) {
      throw new MyFeatureError('Input validation failed', 'VALIDATION_FAILED');
    }

    try {
      // Delegate to service
      const result = await this.service.performAction(input);
      
      // Business logic post-processing
      if (!result.success) {
        throw new MyFeatureError(result.error || 'Operation failed', 'OPERATION_FAILED');
      }

      return result;
    } catch (error) {
      if (error instanceof MyFeatureError) {
        throw error;
      }
      throw new MyFeatureError(`Unexpected error: ${error}`, 'UNEXPECTED_ERROR');
    }
  }
}
```

#### Platform Implementation (`src/utils/`)
```typescript
// src/utils/my-feature/my-feature.web.ts
import { MyFeatureService, MyFeatureResult } from '../../types/services/my-feature.interface';

export class WebMyFeatureService implements MyFeatureService {
  async performAction(param: string): Promise<MyFeatureResult> {
    try {
      const response = await fetch('/api/my-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ param }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  validateInput(input: unknown): boolean {
    return typeof input === 'string' && input.length > 0;
  }
}

// src/utils/my-feature/my-feature.reactnative.ts
export class ReactNativeMyFeatureService implements MyFeatureService {
  async performAction(param: string): Promise<MyFeatureResult> {
    // React Native-specific implementation
    // Can use RN-specific APIs, AsyncStorage, etc.
    return { success: true, data: { id: '1', value: param, timestamp: new Date() } };
  }

  validateInput(input: unknown): boolean {
    return typeof input === 'string' && input.length > 0;
  }
}

// src/utils/my-feature/index.ts
import { Platform } from '../../types/environment';
import { MyFeatureService } from '../../types/services/my-feature.interface';

export const createMyFeatureService = (): MyFeatureService => {
  if (Platform.OS === 'web') {
    const { WebMyFeatureService } = require('./my-feature.web');
    return new WebMyFeatureService();
  } else {
    const { ReactNativeMyFeatureService } = require('./my-feature.reactnative');
    return new ReactNativeMyFeatureService();
  }
};
```

#### React Hook (`src/business/hooks/`)
```typescript
// src/business/hooks/data/useMyFeature.ts
import { useState, useCallback } from 'react';
import { MyFeatureOperations } from '../../core/my-feature/my-feature-operations';
import { MyFeatureResult, MyFeatureError } from '../../../types/services/my-feature.interface';
import { createMyFeatureService } from '../../../utils/my-feature';

export const useMyFeature = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MyFeatureError | null>(null);
  const [result, setResult] = useState<MyFeatureResult | null>(null);

  const operations = new MyFeatureOperations(createMyFeatureService());

  const executeFeature = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await operations.executeFeature(input);
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof MyFeatureError ? err : new MyFeatureError('Unknown error', 'UNKNOWN');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    executeFeature,
    isLoading,
    error,
    result,
    clearError,
    clearResult,
  };
};
```

### 2. Indexer Hook Pattern

```typescript
// src/business/hooks/indexer/useIndexerMyFeature.ts
import { useCallback, useState } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';

export const useIndexerMyFeature = (endpointUrl: string, dev: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = new IndexerClient(endpointUrl, dev);

  const myFeatureAction = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await client.myFeatureEndpoint(param);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Feature operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { 
    myFeatureAction, 
    isLoading, 
    error, 
    clearError: () => setError(null) 
  };
};
```

### 3. WildDuck Hook Pattern

```typescript
// src/business/hooks/wildduck/useWildduckMyFeature.ts
import { useCallback, useState } from 'react';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import axios from 'axios';

export const useWildduckMyFeature = (config: WildDuckConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myFeatureAction = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (config.cloudflareWorkerUrl) {
        headers['Authorization'] = `Bearer ${config.apiToken}`;
        headers['X-App-Source'] = '0xmail-box';
      } else {
        headers['X-Access-Token'] = config.apiToken;
      }

      const response = await axios.post(`${apiUrl}/my-feature`, { param }, { headers });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'WildDuck operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return { 
    myFeatureAction, 
    isLoading, 
    error, 
    clearError: () => setError(null) 
  };
};
```

## 🧪 Testing Patterns

### Unit Test Pattern
```typescript
// src/business/core/my-feature/__tests__/my-feature-operations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyFeatureOperations } from '../my-feature-operations';
import { MyFeatureService, MyFeatureError } from '../../../../types/services/my-feature.interface';

describe('MyFeatureOperations', () => {
  const mockService: MyFeatureService = {
    performAction: vi.fn(),
    validateInput: vi.fn(),
  };

  const operations = new MyFeatureOperations(mockService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeFeature', () => {
    it('should execute successfully with valid input', async () => {
      const input = 'valid-input';
      const expectedResult = { success: true, data: { id: '1', value: input, timestamp: new Date() } };
      
      mockService.validateInput.mockReturnValue(true);
      mockService.performAction.mockResolvedValue(expectedResult);

      const result = await operations.executeFeature(input);

      expect(mockService.validateInput).toHaveBeenCalledWith(input);
      expect(mockService.performAction).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error for empty input', async () => {
      await expect(operations.executeFeature('')).rejects.toThrow(
        new MyFeatureError('Input cannot be empty', 'INVALID_INPUT')
      );
    });

    it('should throw error for invalid input', async () => {
      const input = 'invalid-input';
      mockService.validateInput.mockReturnValue(false);

      await expect(operations.executeFeature(input)).rejects.toThrow(
        new MyFeatureError('Input validation failed', 'VALIDATION_FAILED')
      );
    });

    it('should handle service errors', async () => {
      const input = 'valid-input';
      mockService.validateInput.mockReturnValue(true);
      mockService.performAction.mockRejectedValue(new Error('Service error'));

      await expect(operations.executeFeature(input)).rejects.toThrow(
        new MyFeatureError('Unexpected error: Error: Service error', 'UNEXPECTED_ERROR')
      );
    });
  });
});
```

### Hook Test Pattern
```typescript
// src/business/hooks/data/__tests__/useMyFeature.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMyFeature } from '../useMyFeature';

// Mock the service creation
vi.mock('../../../utils/my-feature', () => ({
  createMyFeatureService: () => ({
    performAction: vi.fn(),
    validateInput: vi.fn().mockReturnValue(true),
  }),
}));

describe('useMyFeature', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMyFeature());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);
  });

  it('should handle successful execution', async () => {
    const { result } = renderHook(() => useMyFeature());
    const expectedResult = { success: true, data: { id: '1', value: 'test', timestamp: new Date() } };

    await act(async () => {
      const serviceResult = await result.current.executeFeature('test');
      expect(serviceResult).toEqual(expectedResult);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toEqual(expectedResult);
  });

  it('should handle execution errors', async () => {
    const { result } = renderHook(() => useMyFeature());

    await act(async () => {
      try {
        await result.current.executeFeature('');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.result).toBe(null);
  });
});
```

## 📁 File Organization Patterns

### Export Pattern
```typescript
// src/types/services/index.ts
export * from './my-feature.interface';
export * from './email.interface';
export * from './persistence.interface';

// src/business/core/index.ts
export * from './my-feature/my-feature-operations';
export * from './email/email-operations';

// src/business/hooks/data/index.ts
export { useMyFeature } from './useMyFeature';
export { useEmail } from './useEmail';

// src/index.ts (main exports)
export {
  // Types
  type MyFeatureService,
  type MyFeatureResult,
  MyFeatureError,
  
  // Hooks
  useMyFeature,
  
  // Operations (if needed externally)
  MyFeatureOperations,
} from './business';
```

### Naming Conventions
```typescript
// Interfaces: PascalCase with descriptive suffix
interface EmailService {}
interface AuthenticationService {}

// Implementations: PascalCase with platform prefix
class WebEmailService {}
class ReactNativeEmailService {}

// Hooks: camelCase starting with 'use'
const useEmailService = () => {}
const useIndexerPoints = () => {}

// Operations: PascalCase ending with 'Operations'
class EmailOperations {}
class AuthOperations {}

// Errors: PascalCase ending with 'Error'
class EmailError extends Error {}
class AuthenticationError extends Error {}

// Types: PascalCase, descriptive
type EmailAddress = string;
type WalletUserData = {};

// Constants: UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000;
const API_ENDPOINTS = {};
```

## 🔄 State Management Patterns

### Hook State Pattern
```typescript
const useFeature = () => {
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Data states
  const [data, setData] = useState<FeatureData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Action states
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  
  // Cleanup functions
  const clearError = useCallback(() => setError(null), []);
  const clearData = useCallback(() => setData(null), []);
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLastAction(null);
    setActionHistory([]);
  }, []);
  
  return {
    // State
    isLoading,
    isInitializing,
    data,
    error,
    lastAction,
    actionHistory,
    
    // Actions
    /* ... action methods ... */
    
    // Utilities
    clearError,
    clearData,
    reset,
  };
};
```

## 📊 Performance Patterns

### Memoization Pattern
```typescript
const useOptimizedFeature = (config: FeatureConfig) => {
  // Memoize expensive computations
  const processedConfig = useMemo(() => {
    return processConfig(config);
  }, [config]);
  
  // Memoize stable references
  const stableActions = useMemo(() => ({
    action1: () => {},
    action2: () => {},
  }), []); // Empty dependency array for truly stable actions
  
  // Memoize derived data
  const derivedData = useMemo(() => {
    return data?.map(item => transformItem(item));
  }, [data]);
  
  return { processedConfig, stableActions, derivedData };
};
```

---

These patterns ensure consistent, testable, and maintainable code that works efficiently with AI-assisted development.