/**
 * Platform-agnostic network interface
 * This interface can be implemented for web (fetch) or React Native (different networking libraries)
 */

export interface NetworkResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

export interface NetworkRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | Blob;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Platform-agnostic network client interface
 * Abstracts HTTP requests to work across web and React Native
 */
export interface NetworkClient {
  /**
   * Make an HTTP request
   * @param url Request URL
   * @param options Request options
   * @returns Promise with the response
   */
  request<T = any>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a GET request
   * @param url Request URL
   * @param options Request options
   * @returns Promise with the response
   */
  get<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a POST request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns Promise with the response
   */
  post<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a PUT request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns Promise with the response
   */
  put<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a DELETE request
   * @param url Request URL
   * @param options Request options
   * @returns Promise with the response
   */
  delete<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>>;
}

/**
 * Network error class for consistent error handling
 */
export class NetworkError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;
  public readonly data?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    data?: any
  ) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
  }
}
