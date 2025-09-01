import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Get mocked functions from global setup
const localStorageMock = window.localStorage as any;
const addEventListener = window.addEventListener as any;
const removeEventListener = window.removeEventListener as any;
const dispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', { value: dispatchEvent });
Object.defineProperty(window, 'CustomEvent', {
  value: class CustomEvent {
    detail: any;
    constructor(type: string, options?: { detail?: any }) {
      this.detail = options?.detail;
    }
  },
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      );

      expect(result.current[0]).toBe('initial-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return stored value when localStorage has data', () => {
      localStorageMock.getItem.mockReturnValue('"stored-value"');

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('should handle JSON parsing errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      );

      expect(result.current[0]).toBe('initial-value');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "test-key":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should work with complex objects', () => {
      const complexObject = {
        user: { name: 'John', age: 30 },
        preferences: ['dark-mode'],
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));

      const { result } = renderHook(() => useLocalStorage('user-data', {}));

      expect(result.current[0]).toEqual(complexObject);
    });
  });

  describe('setValue', () => {
    it('should update localStorage and state with new value', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        '"new-value"'
      );
      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { key: 'test-key', value: 'new-value' },
        })
      );
    });

    it('should work with function updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '1');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      // State should still update even if localStorage fails
      expect(result.current[0]).toBe('new-value');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "test-key":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('removeValue', () => {
    it('should remove value from localStorage and reset to initial', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      // First set a value
      act(() => {
        result.current[1]('some-value');
      });

      expect(result.current[0]).toBe('some-value');

      // Then remove it
      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
      expect(dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { key: 'test-key', value: null },
        })
      );
    });

    it('should handle removeItem errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[2]();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error removing localStorage key "test-key":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('custom serialization', () => {
    it('should use custom serialize and deserialize functions', () => {
      const customSerialize = vi.fn((value: number) => `custom:${value}`);
      const customDeserialize = vi.fn((value: string) =>
        parseInt(value.replace('custom:', ''), 10)
      );

      localStorageMock.getItem.mockReturnValue('custom:42');

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 0, {
          serialize: customSerialize,
          deserialize: customDeserialize,
        })
      );

      expect(customDeserialize).toHaveBeenCalledWith('custom:42');
      expect(result.current[0]).toBe(42);

      act(() => {
        result.current[1](100);
      });

      expect(customSerialize).toHaveBeenCalledWith(100);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        'custom:100'
      );
    });
  });

  describe('event listeners', () => {
    it('should set up storage event listeners', () => {
      renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(addEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      );
      expect(addEventListener).toHaveBeenCalledWith(
        'local-storage',
        expect.any(Function)
      );
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      );
      expect(removeEventListener).toHaveBeenCalledWith(
        'local-storage',
        expect.any(Function)
      );
    });

    it('should handle storage events from other tabs', () => {
      localStorageMock.getItem.mockReturnValue('"initial"');
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      expect(result.current[0]).toBe('initial');

      // Simulate storage event from another tab
      const storageHandler = addEventListener.mock.calls.find(
        call => call[0] === 'storage'
      )?.[1];

      if (storageHandler) {
        act(() => {
          storageHandler({
            key: 'test-key',
            newValue: '"updated-from-other-tab"',
          });
        });

        expect(result.current[0]).toBe('updated-from-other-tab');
      }
    });

    it('should handle custom events for same-tab synchronization', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      // Simulate custom event
      const customHandler = addEventListener.mock.calls.find(
        call => call[0] === 'local-storage'
      )?.[1];

      if (customHandler) {
        act(() => {
          customHandler({
            detail: {
              key: 'test-key',
              value: 'updated-via-custom-event',
            },
          });
        });

        expect(result.current[0]).toBe('updated-via-custom-event');
      }
    });
  });

  describe('non-web environment support', () => {
    it('should work when localStorage is not available', () => {
      // Mock scenario where localStorage throws an error
      const originalGetItem = localStorageMock.getItem;
      const originalSetItem = localStorageMock.setItem;

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      expect(result.current[0]).toBe('initial');

      // Should still allow state updates
      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');

      // Restore mocks
      localStorageMock.getItem = originalGetItem;
      localStorageMock.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });
});
