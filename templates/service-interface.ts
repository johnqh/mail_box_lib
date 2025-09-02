/**
 * Template: Service Interface
 * Location: src/types/services/my-service.interface.ts
 * 
 * This template shows how to define a service interface that will
 * have platform-specific implementations.
 */

/**
 * Configuration options for MyService
 */
export interface MyServiceConfig {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly retryAttempts: number;
}

/**
 * Data structures used by the service
 */
export interface MyServiceData {
  readonly id: string;
  readonly value: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
}

/**
 * Result type for service operations
 */
export interface MyServiceResult {
  readonly success: boolean;
  readonly data?: MyServiceData;
  readonly error?: string;
}

/**
 * Main service interface - this will be implemented by platform-specific classes
 * 
 * Key principles:
 * - All methods are async (return Promises)
 * - Use readonly properties where possible
 * - Include proper error types
 * - Document expected behavior
 */
export interface MyService {
  /**
   * Initialize the service with configuration
   * @param config Service configuration options
   */
  initialize(config: MyServiceConfig): Promise<void>;

  /**
   * Create a new item
   * @param data The data to create
   * @returns Promise resolving to the created item
   * @throws MyServiceError if creation fails
   */
  create(data: Omit<MyServiceData, 'id' | 'createdAt'>): Promise<MyServiceData>;

  /**
   * Retrieve an item by ID
   * @param id The item ID
   * @returns Promise resolving to the item, or null if not found
   * @throws MyServiceError if retrieval fails
   */
  getById(id: string): Promise<MyServiceData | null>;

  /**
   * Update an existing item
   * @param id The item ID
   * @param updates Partial data to update
   * @returns Promise resolving to the updated item
   * @throws MyServiceError if update fails
   */
  update(id: string, updates: Partial<MyServiceData>): Promise<MyServiceData>;

  /**
   * Delete an item
   * @param id The item ID
   * @returns Promise resolving to success status
   * @throws MyServiceError if deletion fails
   */
  delete(id: string): Promise<boolean>;

  /**
   * List items with optional filtering
   * @param filters Optional filters to apply
   * @returns Promise resolving to array of items
   */
  list(filters?: Record<string, unknown>): Promise<MyServiceData[]>;

  /**
   * Check if the service is available and properly configured
   * @returns Promise resolving to service health status
   */
  healthCheck(): Promise<MyServiceResult>;
}

/**
 * Custom error type for this service
 * Create specific error types for better error handling
 */
export class MyServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'MyServiceError';
  }
}

/**
 * Event types that the service might emit
 */
export interface MyServiceEvents {
  created: { data: MyServiceData };
  updated: { data: MyServiceData };
  deleted: { id: string };
  error: { error: MyServiceError };
}

/**
 * Optional: If your service needs to emit events
 */
export interface MyServiceWithEvents extends MyService {
  on<K extends keyof MyServiceEvents>(
    event: K,
    listener: (data: MyServiceEvents[K]) => void
  ): void;
  
  off<K extends keyof MyServiceEvents>(
    event: K,
    listener: (data: MyServiceEvents[K]) => void
  ): void;
}