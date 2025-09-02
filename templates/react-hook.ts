/**
 * Template: React Hook
 * Location: src/business/hooks/my-service/useMyService.ts
 * 
 * This template shows how to create React hooks that use business operations
 * and provide a clean interface for React components.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useAppConfig } from '../../useServices';
import { MyServiceOperations } from '../../core/my-service/my-service-operations';
import { createMyService } from '../../../utils/my-service';
import {
  CreateMyItemRequest,
  UpdateMyItemRequest,
  ListMyItemsRequest,
  MyItemResponse,
  ListMyItemsResponse,
} from '../../core/my-service/my-service-operations';

/**
 * Hook state interface
 */
export interface UseMyServiceState {
  // Loading states for different operations
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Data state
  items: MyItemResponse[];
  currentItem: MyItemResponse | null;
  totalCount: number;
  hasMore: boolean;
}

/**
 * Hook return type
 */
export interface UseMyServiceReturn extends UseMyServiceState {
  // CRUD operations
  createItem: (request: Omit<CreateMyItemRequest, 'userId'>) => Promise<MyItemResponse>;
  updateItem: (request: Omit<UpdateMyItemRequest, 'userId'>) => Promise<MyItemResponse>;
  deleteItem: (id: string) => Promise<boolean>;
  getItem: (id: string) => Promise<MyItemResponse | null>;
  
  // List operations
  listItems: (request?: Omit<ListMyItemsRequest, 'userId'>) => Promise<ListMyItemsResponse>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  resetState: () => void;
}

/**
 * Custom hook for MyService operations
 * 
 * Key principles:
 * - Manage loading states for different operations
 * - Handle errors gracefully
 * - Provide optimistic updates where appropriate
 * - Cache data efficiently
 * - Clean up resources on unmount
 */
export const useMyService = (userId: string): UseMyServiceReturn => {
  // Dependencies
  const appConfig = useAppConfig();
  const operationsRef = useRef<MyServiceOperations | null>(null);
  
  // State management
  const [state, setState] = useState<UseMyServiceState>({
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    items: [],
    currentItem: null,
    totalCount: 0,
    hasMore: false,
  });

  // Refs for cleanup and consistency
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<ListMyItemsRequest | null>(null);

  // Initialize operations
  useEffect(() => {
    const initializeOperations = async () => {
      try {
        const service = createMyService();
        await service.initialize({
          apiUrl: appConfig.myServiceUrl || 'https://api.example.com',
          timeout: 30000,
          retryAttempts: 3,
        });
        
        operationsRef.current = new MyServiceOperations(service);
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize service',
        }));
      }
    };

    initializeOperations();
  }, [appConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to handle errors
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Failed to ${operation}`;
    
    setState(prev => ({ ...prev, error: errorMessage }));
    console.error(`MyService ${operation} error:`, error);
  }, []);

  // Helper function to ensure operations are available
  const ensureOperations = (): MyServiceOperations => {
    if (!operationsRef.current) {
      throw new Error('Service not initialized');
    }
    return operationsRef.current;
  };

  // Create item operation
  const createItem = useCallback(async (
    request: Omit<CreateMyItemRequest, 'userId'>
  ): Promise<MyItemResponse> => {
    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }));
      
      const operations = ensureOperations();
      const result = await operations.createItem({
        ...request,
        userId,
      });

      // Optimistically add to items list
      setState(prev => ({
        ...prev,
        items: [result, ...prev.items],
        totalCount: prev.totalCount + 1,
        isCreating: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isCreating: false }));
      handleError(error, 'create item');
      throw error;
    }
  }, [userId, handleError]);

  // Update item operation
  const updateItem = useCallback(async (
    request: Omit<UpdateMyItemRequest, 'userId'>
  ): Promise<MyItemResponse> => {
    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));
      
      const operations = ensureOperations();
      const result = await operations.updateItem({
        ...request,
        userId,
      });

      // Update in items list and currentItem
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === result.id ? result : item),
        currentItem: prev.currentItem?.id === result.id ? result : prev.currentItem,
        isUpdating: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isUpdating: false }));
      handleError(error, 'update item');
      throw error;
    }
  }, [userId, handleError]);

  // Delete item operation
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isDeleting: true, error: null }));
      
      const operations = ensureOperations();
      const success = await operations.deleteItem(id, userId);

      if (success) {
        // Remove from items list
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== id),
          currentItem: prev.currentItem?.id === id ? null : prev.currentItem,
          totalCount: Math.max(0, prev.totalCount - 1),
          isDeleting: false,
        }));
      } else {
        setState(prev => ({ ...prev, isDeleting: false }));
      }

      return success;
    } catch (error) {
      setState(prev => ({ ...prev, isDeleting: false }));
      handleError(error, 'delete item');
      throw error;
    }
  }, [userId, handleError]);

  // Get single item
  const getItem = useCallback(async (id: string): Promise<MyItemResponse | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const operations = ensureOperations();
      const result = await operations.getItem(id, userId);

      setState(prev => ({
        ...prev,
        currentItem: result,
        isLoading: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      handleError(error, 'get item');
      throw error;
    }
  }, [userId, handleError]);

  // List items
  const listItems = useCallback(async (
    request?: Omit<ListMyItemsRequest, 'userId'>
  ): Promise<ListMyItemsResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const fullRequest: ListMyItemsRequest = {
        ...request,
        userId,
      };
      lastRequestRef.current = fullRequest;

      const operations = ensureOperations();
      const result = await operations.listItems(fullRequest);

      setState(prev => ({
        ...prev,
        items: request?.offset ? [...prev.items, ...result.items] : result.items,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        isLoading: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      handleError(error, 'list items');
      throw error;
    }
  }, [userId, handleError]);

  // Load more items (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!lastRequestRef.current || !state.hasMore || state.isLoading) {
      return;
    }

    const nextRequest: ListMyItemsRequest = {
      ...lastRequestRef.current,
      offset: (lastRequestRef.current.offset || 0) + (lastRequestRef.current.limit || 10),
    };

    await listItems(nextRequest);
  }, [state.hasMore, state.isLoading, listItems]);

  // Refresh current list
  const refresh = useCallback(async (): Promise<void> => {
    if (!lastRequestRef.current) {
      return;
    }

    const refreshRequest: ListMyItemsRequest = {
      ...lastRequestRef.current,
      offset: 0, // Reset to first page
    };

    await listItems(refreshRequest);
  }, [listItems]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      items: [],
      currentItem: null,
      totalCount: 0,
      hasMore: false,
    });
    lastRequestRef.current = null;
  }, []);

  return {
    // State
    ...state,
    
    // Operations
    createItem,
    updateItem,
    deleteItem,
    getItem,
    listItems,
    loadMore,
    refresh,
    
    // Utilities
    clearError,
    resetState,
  };
};

/**
 * Simplified hook for read-only operations
 * Use this when you only need to fetch data
 */
export const useMyServiceReadOnly = (userId: string) => {
  const { getItem, listItems, items, currentItem, isLoading, error, clearError } = useMyService(userId);
  
  return {
    getItem,
    listItems,
    items,
    currentItem,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for a single item management
 * Use this when working with a specific item
 */
export const useMyServiceItem = (itemId: string, userId: string) => {
  const {
    getItem,
    updateItem,
    deleteItem,
    currentItem,
    isLoading,
    isUpdating,
    isDeleting,
    error,
    clearError,
  } = useMyService(userId);

  useEffect(() => {
    if (itemId) {
      getItem(itemId);
    }
  }, [itemId, getItem]);

  return {
    item: currentItem,
    updateItem: useCallback((updates: Omit<UpdateMyItemRequest, 'id' | 'userId'>) => 
      updateItem({ ...updates, id: itemId }), [updateItem, itemId]),
    deleteItem: useCallback(() => deleteItem(itemId), [deleteItem, itemId]),
    isLoading,
    isUpdating,
    isDeleting,
    error,
    clearError,
  };
};