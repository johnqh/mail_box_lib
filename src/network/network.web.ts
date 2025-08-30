/**
 * Web implementation of network client using fetch API
 */

import { NetworkClient, NetworkResponse, NetworkRequestOptions, NetworkError } from "../types";

/**
 * Web network client using the Fetch API
 * This implementation works in browsers and maintains the current behavior
 */
export class WebNetworkClient implements NetworkClient {
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

    // Create abort controller for timeout if no signal provided
    const controller = new AbortController();
    const finalSignal = signal || controller.signal;

    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
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
        // Include response data in error for better debugging
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (data && typeof data === 'object' && 'message' in data) {
          errorMessage += ` - ${(data as any).message}`;
        }
        
        throw new NetworkError(
          errorMessage,
          response.status,
          response.statusText,
          url,
          data
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
    const requestBody = typeof body === 'object' && body !== null && !(body instanceof FormData) && !(body instanceof Blob)
      ? JSON.stringify(body)
      : body;

    const headers = { ...options.headers };
    if (typeof body === 'object' && body !== null && !(body instanceof FormData) && !(body instanceof Blob)) {
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
    const requestBody = typeof body === 'object' && body !== null && !(body instanceof FormData) && !(body instanceof Blob)
      ? JSON.stringify(body)
      : body;

    const headers = { ...options.headers };
    if (typeof body === 'object' && body !== null && !(body instanceof FormData) && !(body instanceof Blob)) {
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
export const webNetworkClient = new WebNetworkClient();