/**
 * Template for writing comprehensive tests
 * Copy and adapt this template for your test files
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Import what you're testing
import { {{ServiceName}}Operations } from '../{{service-name}}-operations';
import { {{ServiceName}}Service } from '../../types/services/{{service-name}}.interface';
import { use{{HookName}} } from '../hooks/use-{{hook-name}}';

// Mock external dependencies
vi.mock('../../utils/{{service-name}}/{{service-name}}.web', () => ({
  Web{{ServiceName}}Service: vi.fn(),
}));

// Test data fixtures
const mockData = {
  validInput: {
    id: 'test-id',
    name: 'Test Item',
    value: 42,
  },
  invalidInput: {
    id: '',
    name: '',
    value: -1,
  },
  apiResponse: {
    success: true,
    data: {
      id: 'response-id',
      result: 'success',
    },
  },
  apiError: {
    success: false,
    error: 'API Error occurred',
  },
};

// Mock service implementation
const createMock{{ServiceName}}Service = (): jest.Mocked<{{ServiceName}}Service> => ({
  methodName: vi.fn(),
  anotherMethod: vi.fn(),
});

// Tests for service operations
describe('{{ServiceName}}Operations', () => {
  let operations: {{ServiceName}}Operations;
  let mockService: jest.Mocked<{{ServiceName}}Service>;

  beforeEach(() => {
    mockService = createMock{{ServiceName}}Service();
    operations = new {{ServiceName}}Operations(mockService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('performBusinessOperation', () => {
    it('should successfully process valid input', async () => {
      // Arrange
      mockService.methodName.mockResolvedValue(mockData.apiResponse);

      // Act
      const result = await operations.performBusinessOperation(mockData.validInput);

      // Assert
      expect(mockService.methodName).toHaveBeenCalledWith(
        mockData.validInput.name,
        mockData.validInput.value
      );
      expect(result).toEqual({
        id: mockData.apiResponse.data.id,
        success: true,
      });
    });

    it('should throw error for invalid input', async () => {
      // Act & Assert
      await expect(
        operations.performBusinessOperation(mockData.invalidInput)
      ).rejects.toThrow('Invalid input data');

      // Verify service was not called
      expect(mockService.methodName).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockService.methodName.mockResolvedValue(mockData.apiError);

      // Act & Assert
      await expect(
        operations.performBusinessOperation(mockData.validInput)
      ).rejects.toThrow('API Error occurred');
    });

    it('should handle service exceptions', async () => {
      // Arrange
      const serviceError = new Error('Network error');
      mockService.methodName.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(
        operations.performBusinessOperation(mockData.validInput)
      ).rejects.toThrow('Network error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      const emptyInput = { id: '', name: '', value: 0 };

      await expect(
        operations.performBusinessOperation(emptyInput)
      ).rejects.toThrow('Invalid input data');
    });

    it('should handle null/undefined values', async () => {
      const nullInput = null as any;

      await expect(
        operations.performBusinessOperation(nullInput)
      ).rejects.toThrow('Invalid input data');
    });
  });
});

// Tests for React hooks
describe('use{{HookName}}', () => {
  let mockService: jest.Mocked<{{ServiceName}}Service>;

  beforeEach(() => {
    mockService = createMock{{ServiceName}}Service();
    // Mock the service globally or through dependency injection
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data on mount', async () => {
    // Arrange
    mockService.methodName.mockResolvedValue(mockData.apiResponse);

    // Act
    const { result } = renderHook(() => use{{HookName}}('test-id'));

    // Assert initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert final state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBe(null);
  });

  it('should handle loading errors', async () => {
    // Arrange
    const error = new Error('Failed to load data');
    mockService.methodName.mockRejectedValue(error);

    // Act
    const { result } = renderHook(() => use{{HookName}}('test-id'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(error);
  });

  it('should refetch data when refetch is called', async () => {
    // Arrange
    mockService.methodName
      .mockResolvedValueOnce(mockData.apiResponse)
      .mockResolvedValueOnce({
        ...mockData.apiResponse,
        data: { ...mockData.apiResponse.data, id: 'updated-id' },
      });

    // Act
    const { result } = renderHook(() => use{{HookName}}('test-id'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const initialData = result.current.data;

    await act(async () => {
      await result.current.refetch();
    });

    // Assert
    expect(mockService.methodName).toHaveBeenCalledTimes(2);
    expect(result.current.data).not.toEqual(initialData);
  });

  it('should not fetch when disabled', () => {
    // Act
    renderHook(() => use{{HookName}}('test-id', { enabled: false }));

    // Assert
    expect(mockService.methodName).not.toHaveBeenCalled();
  });

  it('should update data when update is called', async () => {
    // Arrange
    mockService.methodName.mockResolvedValue(mockData.apiResponse);
    const mockUpdate = vi.fn().mockResolvedValue({
      ...mockData.apiResponse.data,
      name: 'Updated Name',
    });
    mockService.updateData = mockUpdate;

    // Act
    const { result } = renderHook(() => use{{HookName}}('test-id'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.update({ name: 'Updated Name' });
    });

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith('response-id', { name: 'Updated Name' });
  });
});

// Integration tests
describe('{{ServiceName}} Integration', () => {
  it('should work end-to-end with real service', async () => {
    // This would test with actual service implementations
    // Use carefully in CI/CD to avoid external dependencies
  });
});

// Performance tests
describe('{{ServiceName}} Performance', () => {
  it('should handle large datasets efficiently', async () => {
    // Test with large amounts of data
    // Verify memory usage, timing, etc.
  });

  it('should debounce rapid calls', async () => {
    // Test debouncing behavior if applicable
  });
});

// Accessibility tests (for UI components)
describe('{{ComponentName}} Accessibility', () => {
  it('should be accessible to screen readers', async () => {
    // Test with @testing-library/jest-dom matchers
    // screen.getByRole, screen.getByLabelText, etc.
  });
});

/*
Testing Best Practices:

1. **Arrange, Act, Assert pattern**
   - Arrange: Set up test data and mocks
   - Act: Execute the code being tested
   - Assert: Verify the results

2. **Test naming**
   - Use descriptive names: "should do X when Y"
   - Include edge cases and error scenarios

3. **Mock external dependencies**
   - Mock APIs, databases, file systems
   - Use dependency injection for easier testing

4. **Test coverage**
   - Aim for high coverage but focus on critical paths
   - Test happy paths, error cases, and edge cases

5. **Async testing**
   - Use proper async/await patterns
   - Handle promises and timers correctly

6. **Cleanup**
   - Clear mocks between tests
   - Clean up any side effects

7. **Test data**
   - Use realistic test data
   - Create reusable fixtures
   - Test with various data scenarios

8. **Integration vs Unit tests**
   - Unit: Test single functions/classes in isolation
   - Integration: Test multiple components together
   - E2E: Test complete user workflows

9. **Error testing**
   - Test error handling paths
   - Verify appropriate errors are thrown
   - Test recovery scenarios

10. **Performance testing**
    - Test with realistic data sizes
    - Verify timeout handling
    - Check memory usage for large operations
*/