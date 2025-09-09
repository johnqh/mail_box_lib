/**
 * Network client interface for dependency injection
 * Platform-agnostic HTTP client interface
 */

interface NetworkRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | Blob;
  signal?: AbortSignal;
  timeout?: number;
}

interface NetworkResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

interface NetworkClient {
  /**
   * Make a network request
   */
  request<T = any>(
    url: string,
    options?: NetworkRequestOptions
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a GET request
   */
  get<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a POST request
   */
  post<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a PUT request
   */
  put<T = any>(
    url: string,
    body?: any,
    options?: Omit<NetworkRequestOptions, 'method'>
  ): Promise<NetworkResponse<T>>;

  /**
   * Make a DELETE request
   */
  delete<T = any>(
    url: string,
    options?: Omit<NetworkRequestOptions, 'method' | 'body'>
  ): Promise<NetworkResponse<T>>;
}

class NetworkError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly response?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    response?: any
  ) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export {
  type NetworkClient,
  type NetworkResponse,
  type NetworkRequestOptions,
  NetworkError,
};
