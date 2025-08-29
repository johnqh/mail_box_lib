/**
 * Platform-agnostic URLSearchParams wrapper
 * Provides URLSearchParams functionality with React Native compatibility
 */

/**
 * URLSearchParams interface for cross-platform compatibility
 */
export interface URLSearchParamsLike {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  toString(): string;
  forEach(callback: (value: string, key: string) => void): void;
}

/**
 * Simple URLSearchParams implementation for environments that don't have it
 */
class SimpleURLSearchParams implements URLSearchParamsLike {
  private params: Map<string, string[]> = new Map();

  constructor(init?: string | Record<string, string> | string[][]) {
    if (init) {
      if (typeof init === 'string') {
        this.parseString(init);
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.append(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.append(key, value);
        }
      }
    }
  }

  private parseString(str: string): void {
    const params = str.startsWith('?') ? str.slice(1) : str;
    if (!params) return;

    for (const pair of params.split('&')) {
      const [key, value = ''] = pair.split('=');
      this.append(decodeURIComponent(key), decodeURIComponent(value));
    }
  }

  append(name: string, value: string): void {
    if (!this.params.has(name)) {
      this.params.set(name, []);
    }
    this.params.get(name)!.push(value);
  }

  delete(name: string): void {
    this.params.delete(name);
  }

  get(name: string): string | null {
    const values = this.params.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  getAll(name: string): string[] {
    return this.params.get(name) || [];
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  set(name: string, value: string): void {
    this.params.set(name, [value]);
  }

  toString(): string {
    const pairs: string[] = [];
    this.params.forEach((values, key) => {
      for (const value of values) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });
    return pairs.join('&');
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.params.forEach((values, key) => {
      for (const value of values) {
        callback(value, key);
      }
    });
  }
}

/**
 * Create a URLSearchParams instance with cross-platform compatibility
 */
export function createURLSearchParams(init?: string | Record<string, string> | string[][]): URLSearchParamsLike {
  // Check if native URLSearchParams is available
  if (typeof URLSearchParams !== 'undefined') {
    return new URLSearchParams(init as any);
  }
  
  // Fall back to our implementation for React Native or other environments
  return new SimpleURLSearchParams(init);
}

/**
 * Convenience function to create URL search params from an object
 */
export function createSearchParams(params: Record<string, string | number | boolean>): URLSearchParamsLike {
  const searchParams = createURLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  
  return searchParams;
}

/**
 * Convert search params to a query string
 */
export function searchParamsToString(params: URLSearchParamsLike): string {
  return params.toString();
}

/**
 * Parse a query string into an object
 */
export function parseSearchParams(queryString: string): Record<string, string> {
  const params = createURLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}