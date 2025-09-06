import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckAPI } from '../../../network/clients/wildduck';

interface WildduckFilter {
  id: string;
  name?: string;
  query: {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    ha?: boolean; // has attachments
    size?: number;
  };
  action: {
    seen?: boolean;
    flag?: boolean;
    delete?: boolean;
    spam?: boolean;
    mailbox?: string;
    forward?: string;
    targetUrl?: string;
  };
  disabled?: boolean;
  created: string;
}

interface CreateFilterParams {
  name?: string;
  query: {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    ha?: boolean;
    size?: number;
  };
  action: {
    seen?: boolean;
    flag?: boolean;
    delete?: boolean;
    spam?: boolean;
    mailbox?: string;
    forward?: string;
    targetUrl?: string;
  };
  disabled?: boolean;
}

interface UpdateFilterParams {
  name?: string;
  query?: {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    ha?: boolean;
    size?: number;
  };
  action?: {
    seen?: boolean;
    flag?: boolean;
    delete?: boolean;
    spam?: boolean;
    mailbox?: string;
    forward?: string;
    targetUrl?: string;
  };
  disabled?: boolean;
}

interface UseWildduckFiltersReturn {
  isLoading: boolean;
  error: string | null;
  filters: WildduckFilter[];
  getFilters: (userId: string) => Promise<WildduckFilter[]>;
  getFilter: (userId: string, filterId: string) => Promise<WildduckFilter>;
  createFilter: (
    userId: string,
    params: CreateFilterParams
  ) => Promise<{ success: boolean; id: string }>;
  updateFilter: (
    userId: string,
    filterId: string,
    params: UpdateFilterParams
  ) => Promise<{ success: boolean }>;
  deleteFilter: (
    userId: string,
    filterId: string
  ) => Promise<{ success: boolean }>;
  clearError: () => void;
  refresh: (userId: string) => Promise<void>;
}

/**
 * Hook for WildDuck filter management operations
 */
const useWildduckFilters = (): UseWildduckFiltersReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WildduckFilter[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getFilters = useCallback(
    async (userId: string): Promise<WildduckFilter[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.get(
          `${WildDuckAPI['baseUrl']}/users/${userId}/filters`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        const filterList = response.data.results || [];
        setFilters(filterList);
        return filterList;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get filters';
        setError(errorMessage);
        setFilters([]);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getFilter = useCallback(
    async (userId: string, filterId: string): Promise<WildduckFilter> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.get(
          `${WildDuckAPI['baseUrl']}/users/${userId}/filters/${filterId}`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get filter';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createFilter = useCallback(
    async (
      userId: string,
      params: CreateFilterParams
    ): Promise<{ success: boolean; id: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.post(
          `${WildDuckAPI['baseUrl']}/users/${userId}/filters`,
          params,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create filter';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateFilter = useCallback(
    async (
      userId: string,
      filterId: string,
      params: UpdateFilterParams
    ): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.put(
          `${WildDuckAPI['baseUrl']}/users/${userId}/filters/${filterId}`,
          params,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update filter';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteFilter = useCallback(
    async (userId: string, filterId: string): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.delete(
          `${WildDuckAPI['baseUrl']}/users/${userId}/filters/${filterId}`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete filter';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(
    async (userId: string): Promise<void> => {
      await getFilters(userId);
    },
    [getFilters]
  );

  return {
    isLoading,
    error,
    filters,
    getFilters,
    getFilter,
    createFilter,
    updateFilter,
    deleteFilter,
    clearError,
    refresh,
  };
};

export {
  useWildduckFilters,
  type WildduckFilter,
  type CreateFilterParams,
  type UpdateFilterParams,
  type UseWildduckFiltersReturn
};