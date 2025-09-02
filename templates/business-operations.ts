/**
 * Template: Business Operations
 * Location: src/business/core/my-service/my-service-operations.ts
 * 
 * This template shows how to implement business logic that uses services
 * through dependency injection. Business operations should be pure and
 * testable, with no direct platform dependencies.
 */

import { MyService, MyServiceData, MyServiceError } from '../../../types/services/my-service.interface';

/**
 * Input data for business operations (request DTOs)
 */
export interface CreateMyItemRequest {
  readonly value: string;
  readonly metadata?: Record<string, unknown>;
  readonly userId: string;
}

export interface UpdateMyItemRequest {
  readonly id: string;
  readonly value?: string;
  readonly metadata?: Record<string, unknown>;
  readonly userId: string;
}

export interface ListMyItemsRequest {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: 'createdAt' | 'value';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Output data for business operations (response DTOs)
 */
export interface MyItemResponse {
  readonly id: string;
  readonly value: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string; // ISO string for JSON serialization
  readonly isEditable: boolean; // Computed property
}

export interface ListMyItemsResponse {
  readonly items: MyItemResponse[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

/**
 * Business rules and validation logic
 */
class MyServiceBusinessRules {
  static validateCreateRequest(request: CreateMyItemRequest): void {
    if (!request.value || request.value.trim().length === 0) {
      throw new MyServiceError('Value is required', 'VALIDATION_ERROR', 400);
    }
    
    if (request.value.length > 1000) {
      throw new MyServiceError('Value too long (max 1000 characters)', 'VALIDATION_ERROR', 400);
    }
    
    if (!request.userId) {
      throw new MyServiceError('User ID is required', 'VALIDATION_ERROR', 400);
    }
  }

  static validateUpdateRequest(request: UpdateMyItemRequest): void {
    if (!request.id) {
      throw new MyServiceError('Item ID is required', 'VALIDATION_ERROR', 400);
    }
    
    if (request.value !== undefined && request.value.length > 1000) {
      throw new MyServiceError('Value too long (max 1000 characters)', 'VALIDATION_ERROR', 400);
    }
    
    if (!request.userId) {
      throw new MyServiceError('User ID is required', 'VALIDATION_ERROR', 400);
    }
  }

  static canUserEditItem(item: MyServiceData, userId: string): boolean {
    // Example business rule: only creator can edit within 24 hours
    const hoursSinceCreation = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60);
    const isCreator = item.metadata?.createdBy === userId;
    return isCreator && hoursSinceCreation < 24;
  }
}

/**
 * Main business operations class
 * 
 * Key principles:
 * - Inject dependencies through constructor
 * - Keep methods pure (no side effects except through injected services)
 * - Handle all business rules and validation
 * - Transform between DTOs and domain models
 * - Provide clear error messages
 */
export class MyServiceOperations {
  constructor(
    private readonly myService: MyService
  ) {}

  /**
   * Create a new item with business validation
   */
  async createItem(request: CreateMyItemRequest): Promise<MyItemResponse> {
    try {
      // 1. Validate input
      MyServiceBusinessRules.validateCreateRequest(request);

      // 2. Transform request to domain model
      const itemData = {
        value: request.value.trim(),
        metadata: {
          ...request.metadata,
          createdBy: request.userId,
          version: 1,
        },
      };

      // 3. Call service layer
      const created = await this.myService.create(itemData);

      // 4. Transform to response DTO
      return this.transformToResponse(created, request.userId);
    } catch (error) {
      if (error instanceof MyServiceError) {
        throw error;
      }
      throw new MyServiceError(
        `Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_FAILED',
        500
      );
    }
  }

  /**
   * Update an existing item with authorization checks
   */
  async updateItem(request: UpdateMyItemRequest): Promise<MyItemResponse> {
    try {
      // 1. Validate input
      MyServiceBusinessRules.validateUpdateRequest(request);

      // 2. Get existing item
      const existing = await this.myService.getById(request.id);
      if (!existing) {
        throw new MyServiceError('Item not found', 'NOT_FOUND', 404);
      }

      // 3. Check permissions
      if (!MyServiceBusinessRules.canUserEditItem(existing, request.userId)) {
        throw new MyServiceError('Not authorized to edit this item', 'FORBIDDEN', 403);
      }

      // 4. Prepare updates
      const updates: Partial<MyServiceData> = {};
      if (request.value !== undefined) {
        updates.value = request.value.trim();
      }
      if (request.metadata !== undefined) {
        updates.metadata = {
          ...existing.metadata,
          ...request.metadata,
          updatedBy: request.userId,
          version: ((existing.metadata?.version as number) || 1) + 1,
        };
      }

      // 5. Update item
      const updated = await this.myService.update(request.id, updates);

      // 6. Transform to response
      return this.transformToResponse(updated, request.userId);
    } catch (error) {
      if (error instanceof MyServiceError) {
        throw error;
      }
      throw new MyServiceError(
        `Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_FAILED',
        500
      );
    }
  }

  /**
   * Get item by ID with authorization
   */
  async getItem(id: string, userId: string): Promise<MyItemResponse | null> {
    try {
      const item = await this.myService.getById(id);
      if (!item) {
        return null;
      }

      // Check if user can access this item (example business rule)
      const canAccess = item.metadata?.createdBy === userId || 
                       item.metadata?.sharedWith?.includes?.(userId);
      
      if (!canAccess) {
        throw new MyServiceError('Not authorized to access this item', 'FORBIDDEN', 403);
      }

      return this.transformToResponse(item, userId);
    } catch (error) {
      if (error instanceof MyServiceError) {
        throw error;
      }
      throw new MyServiceError(
        `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RETRIEVAL_FAILED',
        500
      );
    }
  }

  /**
   * List items for a user with pagination
   */
  async listItems(request: ListMyItemsRequest): Promise<ListMyItemsResponse> {
    try {
      const filters = {
        createdBy: request.userId,
        limit: Math.min(request.limit || 10, 100), // Max 100 items per page
        offset: request.offset || 0,
        sortBy: request.sortBy || 'createdAt',
        sortOrder: request.sortOrder || 'desc',
      };

      const items = await this.myService.list(filters);
      
      // Transform items
      const responseItems = items.map(item => this.transformToResponse(item, request.userId));

      // Check if there are more items
      const hasMore = items.length === filters.limit;

      return {
        items: responseItems,
        totalCount: responseItems.length, // In real implementation, you'd get this from service
        hasMore,
      };
    } catch (error) {
      if (error instanceof MyServiceError) {
        throw error;
      }
      throw new MyServiceError(
        `Failed to list items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LIST_FAILED',
        500
      );
    }
  }

  /**
   * Delete item with authorization
   */
  async deleteItem(id: string, userId: string): Promise<boolean> {
    try {
      // Check if item exists and user can delete it
      const existing = await this.myService.getById(id);
      if (!existing) {
        throw new MyServiceError('Item not found', 'NOT_FOUND', 404);
      }

      const canDelete = existing.metadata?.createdBy === userId;
      if (!canDelete) {
        throw new MyServiceError('Not authorized to delete this item', 'FORBIDDEN', 403);
      }

      return await this.myService.delete(id);
    } catch (error) {
      if (error instanceof MyServiceError) {
        throw error;
      }
      throw new MyServiceError(
        `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETION_FAILED',
        500
      );
    }
  }

  /**
   * Transform domain model to response DTO
   * This is where you compute derived properties and format data for API consumers
   */
  private transformToResponse(item: MyServiceData, userId: string): MyItemResponse {
    return {
      id: item.id,
      value: item.value,
      metadata: item.metadata || {},
      createdAt: item.createdAt.toISOString(),
      isEditable: MyServiceBusinessRules.canUserEditItem(item, userId),
    };
  }
}