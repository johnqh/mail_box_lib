import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

// Mock timers
vi.useFakeTimers();

describe('useDebounce', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial-value', 500));

    expect(result.current).toBe('initial-value');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time by less than delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('initial');

    // Fast forward remaining time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Rapid updates
    rerender({ value: 'update1' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'update2' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'final' });

    // Should still be initial value
    expect(result.current).toBe('initial');

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('final');
  });

  it('should work with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { count: 1 } } }
    );

    expect(result.current).toEqual({ count: 1 });

    rerender({ value: { count: 2 } });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual({ count: 2 });
  });

  it('should use default delay when not provided', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Default delay is 500ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Change delay mid-debounce
    act(() => vi.advanceTimersByTime(500));
    rerender({ value: 'updated', delay: 200 });

    // Should respect the new delay
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('updated');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    // Call multiple times rapidly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    // Callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Only the last call should execute
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });

  it('should cancel previous timeout on new calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    // First call
    act(() => {
      result.current('first');
    });

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Second call should cancel the first
    act(() => {
      result.current('second');
    });

    // Complete the new timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('should update callback reference', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 500),
      { initialProps: { callback: callback1 } }
    );

    // Call with first callback
    act(() => {
      result.current('test');
    });

    // Update callback before timeout
    rerender({ callback: callback2 });

    // Complete timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should call the updated callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('test');
  });

  it('should preserve callback arguments', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));

    act(() => {
      result.current('arg1', 'arg2', { prop: 'value' });
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', { prop: 'value' });
  });

  it('should use default delay when not provided', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback));

    act(() => {
      result.current('test');
    });

    // Default delay is 500ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should clean up timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 500)
    );

    act(() => {
      result.current('test');
    });

    // Unmount before timeout completes
    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle delay changes', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay }) => useDebouncedCallback(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    act(() => {
      result.current('test');
    });

    // Change delay
    rerender({ delay: 200 });

    // Should respect the new delay for subsequent calls
    act(() => {
      result.current('test2');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledWith('test2');
  });

  it('should work with complex callback signatures', () => {
    type ComplexCallback = (
      id: string,
      data: { value: number; active: boolean },
      options?: { immediate?: boolean }
    ) => void;

    const callback = vi.fn() as ComplexCallback;
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current(
        'test-id',
        { value: 42, active: true },
        { immediate: false }
      );
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith(
      'test-id',
      { value: 42, active: true },
      { immediate: false }
    );
  });
});
