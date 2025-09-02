/**
 * Template: Test Example
 * Location: src/business/core/my-service/__tests__/my-service-operations.test.ts
 * 
 * This template shows comprehensive testing patterns for business operations.
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { MyServiceOperations } from '../my-service-operations';
import { MyService, MyServiceError, MyServiceData } from '../../../../types/services/my-service.interface';

// Mock the service interface
const createMockService = (): MockedService => ({
  initialize: vi.fn(),
  create: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  healthCheck: vi.fn(),
});

type MockedService = {
  [K in keyof MyService]: MockedFunction<MyService[K]>;
};

describe('MyServiceOperations', () => {
  let mockService: MockedService;
  let operations: MyServiceOperations;
  let mockData: MyServiceData;

  beforeEach(() => {
    mockService = createMockService();
    operations = new MyServiceOperations(mockService);
    
    // Setup common mock data
    mockData = {
      id: 'test-id-123',
      value: 'Test Value',
      metadata: {
        createdBy: 'user-123',
        version: 1,
      },
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
    };
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create item successfully with valid data', async () => {
      // Arrange
      const request = {
        value: 'New Item',
        metadata: { category: 'test' },
        userId: 'user-123',
      };
      
      mockService.create.mockResolvedValue(mockData);

      // Act
      const result = await operations.createItem(request);

      // Assert
      expect(mockService.create).toHaveBeenCalledWith({
        value: 'New Item',
        metadata: {
          category: 'test',
          createdBy: 'user-123',
          version: 1,
        },
      });
      
      expect(result).toEqual({
        id: mockData.id,
        value: mockData.value,
        metadata: mockData.metadata,
        createdAt: mockData.createdAt.toISOString(),
        isEditable: true, // Within 24 hours of creation
      });
    });

    it('should trim whitespace from value', async () => {
      // Arrange
      const request = {
        value: '  Trimmed Value  ',
        userId: 'user-123',
      };
      
      mockService.create.mockResolvedValue(mockData);

      // Act
      await operations.createItem(request);

      // Assert
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'Trimmed Value', // Should be trimmed
        })
      );
    });

    it('should throw validation error for empty value', async () => {
      // Arrange
      const request = {
        value: '',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow(MyServiceError);
      
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for missing userId', async () => {
      // Arrange
      const request = {
        value: 'Valid Value',
        userId: '', // Empty userId
      };

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow('User ID is required');
    });

    it('should throw validation error for value too long', async () => {
      // Arrange
      const request = {
        value: 'x'.repeat(1001), // Too long
        userId: 'user-123',
      };

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow('Value too long');
    });

    it('should handle service errors', async () => {
      // Arrange
      const request = {
        value: 'Valid Value',
        userId: 'user-123',
      };
      
      mockService.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow('Failed to create item: Database error');
    });
  });

  describe('updateItem', () => {
    it('should update item successfully when user is authorized', async () => {
      // Arrange
      const existingItem: MyServiceData = {
        ...mockData,
        createdAt: new Date(), // Recent creation for edit permission
      };
      
      const request = {
        id: 'test-id-123',
        value: 'Updated Value',
        userId: 'user-123',
      };

      mockService.getById.mockResolvedValue(existingItem);
      mockService.update.mockResolvedValue({
        ...existingItem,
        value: 'Updated Value',
        metadata: {
          ...existingItem.metadata,
          updatedBy: 'user-123',
          version: 2,
        },
      });

      // Act
      const result = await operations.updateItem(request);

      // Assert
      expect(mockService.getById).toHaveBeenCalledWith('test-id-123');
      expect(mockService.update).toHaveBeenCalledWith('test-id-123', {
        value: 'Updated Value',
        metadata: {
          createdBy: 'user-123',
          version: 2,
          updatedBy: 'user-123',
        },
      });
      
      expect(result.value).toBe('Updated Value');
    });

    it('should throw error when item not found', async () => {
      // Arrange
      const request = {
        id: 'non-existent-id',
        value: 'Updated Value',
        userId: 'user-123',
      };

      mockService.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(operations.updateItem(request))
        .rejects
        .toThrow('Item not found');
    });

    it('should throw error when user not authorized', async () => {
      // Arrange
      const existingItem: MyServiceData = {
        ...mockData,
        metadata: {
          createdBy: 'other-user', // Different user
          version: 1,
        },
      };
      
      const request = {
        id: 'test-id-123',
        value: 'Updated Value',
        userId: 'user-123',
      };

      mockService.getById.mockResolvedValue(existingItem);

      // Act & Assert
      await expect(operations.updateItem(request))
        .rejects
        .toThrow('Not authorized to edit this item');
    });

    it('should throw error when item too old to edit', async () => {
      // Arrange
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
      
      const existingItem: MyServiceData = {
        ...mockData,
        createdAt: oldDate,
      };
      
      const request = {
        id: 'test-id-123',
        value: 'Updated Value',
        userId: 'user-123',
      };

      mockService.getById.mockResolvedValue(existingItem);

      // Act & Assert
      await expect(operations.updateItem(request))
        .rejects
        .toThrow('Not authorized to edit this item');
    });
  });

  describe('getItem', () => {
    it('should return item when user has access', async () => {
      // Arrange
      const itemWithAccess: MyServiceData = {
        ...mockData,
        metadata: {
          createdBy: 'user-123', // Same user
        },
      };

      mockService.getById.mockResolvedValue(itemWithAccess);

      // Act
      const result = await operations.getItem('test-id-123', 'user-123');

      // Assert
      expect(result).toEqual({
        id: itemWithAccess.id,
        value: itemWithAccess.value,
        metadata: itemWithAccess.metadata,
        createdAt: itemWithAccess.createdAt.toISOString(),
        isEditable: expect.any(Boolean),
      });
    });

    it('should return null when item not found', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(null);

      // Act
      const result = await operations.getItem('non-existent-id', 'user-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when user has no access', async () => {
      // Arrange
      const itemWithoutAccess: MyServiceData = {
        ...mockData,
        metadata: {
          createdBy: 'other-user', // Different user
        },
      };

      mockService.getById.mockResolvedValue(itemWithoutAccess);

      // Act & Assert
      await expect(operations.getItem('test-id-123', 'user-123'))
        .rejects
        .toThrow('Not authorized to access this item');
    });
  });

  describe('listItems', () => {
    it('should return paginated items', async () => {
      // Arrange
      const mockItems: MyServiceData[] = [
        { ...mockData, id: 'item-1' },
        { ...mockData, id: 'item-2' },
      ];
      
      const request = {
        userId: 'user-123',
        limit: 10,
        offset: 0,
      };

      mockService.list.mockResolvedValue(mockItems);

      // Act
      const result = await operations.listItems(request);

      // Assert
      expect(mockService.list).toHaveBeenCalledWith({
        createdBy: 'user-123',
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should limit maximum items per page', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        limit: 1000, // Too high
      };

      mockService.list.mockResolvedValue([]);

      // Act
      await operations.listItems(request);

      // Assert
      expect(mockService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100, // Should be capped at 100
        })
      );
    });

    it('should indicate hasMore when limit reached', async () => {
      // Arrange
      const mockItems = Array(10).fill(mockData).map((item, index) => ({
        ...item,
        id: `item-${index}`,
      }));
      
      const request = {
        userId: 'user-123',
        limit: 10,
      };

      mockService.list.mockResolvedValue(mockItems);

      // Act
      const result = await operations.listItems(request);

      // Assert
      expect(result.hasMore).toBe(true); // items.length === limit
    });
  });

  describe('deleteItem', () => {
    it('should delete item when user is authorized', async () => {
      // Arrange
      const existingItem: MyServiceData = {
        ...mockData,
        metadata: {
          createdBy: 'user-123', // Same user
        },
      };

      mockService.getById.mockResolvedValue(existingItem);
      mockService.delete.mockResolvedValue(true);

      // Act
      const result = await operations.deleteItem('test-id-123', 'user-123');

      // Assert
      expect(mockService.delete).toHaveBeenCalledWith('test-id-123');
      expect(result).toBe(true);
    });

    it('should throw error when item not found', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(operations.deleteItem('non-existent-id', 'user-123'))
        .rejects
        .toThrow('Item not found');
    });

    it('should throw error when user not authorized', async () => {
      // Arrange
      const existingItem: MyServiceData = {
        ...mockData,
        metadata: {
          createdBy: 'other-user', // Different user
        },
      };

      mockService.getById.mockResolvedValue(existingItem);

      // Act & Assert
      await expect(operations.deleteItem('test-id-123', 'user-123'))
        .rejects
        .toThrow('Not authorized to delete this item');
    });
  });

  describe('error handling', () => {
    it('should preserve MyServiceError instances', async () => {
      // Arrange
      const customError = new MyServiceError('Custom error', 'CUSTOM_ERROR', 400);
      mockService.create.mockRejectedValue(customError);

      const request = {
        value: 'Valid Value',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow(customError);
    });

    it('should wrap generic errors', async () => {
      // Arrange
      const genericError = new Error('Generic error');
      mockService.create.mockRejectedValue(genericError);

      const request = {
        value: 'Valid Value',
        userId: 'user-123',
      };

      // Act & Assert
      await expect(operations.createItem(request))
        .rejects
        .toThrow('Failed to create item: Generic error');
    });
  });

  describe('business rules', () => {
    it('should calculate isEditable correctly', () => {
      // Test the business logic for edit permissions
      const recentItem: MyServiceData = {
        ...mockData,
        createdAt: new Date(), // Now
        metadata: { createdBy: 'user-123' },
      };

      const oldItem: MyServiceData = {
        ...mockData,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        metadata: { createdBy: 'user-123' },
      };

      const otherUserItem: MyServiceData = {
        ...mockData,
        createdAt: new Date(),
        metadata: { createdBy: 'other-user' },
      };

      // These tests would be for the actual business rules implementation
      // In the template, we're showing how to structure the tests
    });
  });
});