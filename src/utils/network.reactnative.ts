/**
 * React Native implementation of network client
 * This shows how to implement the NetworkClient for React Native
 */

import { NetworkClient, NetworkResponse, NetworkRequestOptions, NetworkError } from './network.interface';

/**
 * React Native network client implementation
 * This would typically use libraries like @react-native-async-storage/async-storage
 * or react-native-fetch-api for React Native environments
 */
export class ReactNativeNetworkClient implements NetworkClient {
  private defaultTimeout: number;

  constructor(defaultTimeout: number = 10000) {
    this.defaultTimeout = defaultTimeout;
  }

  async request<T = any>(url: string, options: NetworkRequestOptions = {}): Promise<NetworkResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      signal
    } = options;

    // In React Native, you would use libraries like:
    // - react-native-fetch-api for fetch polyfill
    // - @react-native-async-storage/async-storage for persistent storage
    // - react-native-network-info for network status

    // Create AbortController for timeout
    const controller = new AbortController();
    const finalSignal = signal || controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Note: In React Native, you might use a different HTTP client
      // like react-native-axios or built-in fetch with polyfills
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: finalSignal
      });

      clearTimeout(timeoutId);

      // Parse response data
      let data: T;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        // In React Native, you might handle binary data differently
        data = await response.blob() as unknown as T;
      }

      // Convert headers to plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const networkResponse: NetworkResponse<T> = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders
      };

      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          url
        );
      }

      return networkResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NetworkError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout', 408, 'Request Timeout', url);
        }
        throw new NetworkError(error.message, 0, 'Network Error', url);
      }

      throw new NetworkError('Unknown network error', 0, 'Unknown Error', url);
    }
  }

  async get<T = any>(url: string, options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, options: Omit<NetworkRequestOptions, 'method'> = {}): Promise<NetworkResponse<T>> {
    const requestBody = typeof body === 'object' && body !== null && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

    const headers = { ...options.headers };
    if (typeof body === 'object' && body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(url, { 
      ...options, 
      method: 'POST', 
      body: requestBody,
      headers 
    });
  }

  async put<T = any>(url: string, body?: any, options: Omit<NetworkRequestOptions, 'method'> = {}): Promise<NetworkResponse<T>> {
    const requestBody = typeof body === 'object' && body !== null && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

    const headers = { ...options.headers };
    if (typeof body === 'object' && body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(url, { 
      ...options, 
      method: 'PUT', 
      body: requestBody,
      headers 
    });
  }

  async delete<T = any>(url: string, options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Export default instance
export const reactNativeNetworkClient = new ReactNativeNetworkClient();

/**
 * Usage instructions for React Native:
 * 
 * 1. Install required packages:
 *    npm install react-native-fetch-api
 * 
 * 2. In your React Native app setup:
 *    import { ReactNativeNetworkClient } from './utils/network.reactnative';
 *    import { WildDuckAPI } from './config/api';
 *    
 *    const networkClient = new ReactNativeNetworkClient();
 *    const api = new WildDuckAPI(networkClient);
 * 
 * 3. The API will work exactly the same as in web, but use React Native networking
 */