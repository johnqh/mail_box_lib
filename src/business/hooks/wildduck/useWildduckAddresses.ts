import { useState, useCallback } from 'react';
import { WildDuckAPI } from "../../../network/clients/wildduck";

export interface WildduckAddress {
  id: string;
  address: string;
  name?: string;
  main: boolean;
  created: string;
  tags?: string[];
}

export interface CreateAddressParams {
  address: string;
  name?: string;
  main?: boolean;
  tags?: string[];
}

export interface UpdateAddressParams {
  name?: string;
  main?: boolean;
  tags?: string[];
}

export interface ForwardedAddress {
  id: string;
  address: string;
  forwarded: boolean;
  target: string;
  user?: string;
}

export interface UseWildduckAddressesReturn {
  isLoading: boolean;
  error: string | null;
  addresses: WildduckAddress[];
  getUserAddresses: (userId: string) => Promise<WildduckAddress[]>;
  createAddress: (userId: string, params: CreateAddressParams) => Promise<{ success: boolean; id: string }>;
  updateAddress: (userId: string, addressId: string, params: UpdateAddressParams) => Promise<{ success: boolean }>;
  deleteAddress: (userId: string, addressId: string) => Promise<{ success: boolean }>;
  getForwardedAddresses: () => Promise<ForwardedAddress[]>;
  createForwardedAddress: (address: string, target: string) => Promise<{ success: boolean; id: string }>;
  deleteForwardedAddress: (addressId: string) => Promise<{ success: boolean }>;
  resolveAddress: (address: string) => Promise<{ success: boolean; user?: string }>;
  clearError: () => void;
  refresh: (userId: string) => Promise<void>;
}

/**
 * Hook for WildDuck address management operations
 */
export const useWildduckAddresses = (): UseWildduckAddressesReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<WildduckAddress[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserAddresses = useCallback(async (userId: string): Promise<WildduckAddress[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await WildDuckAPI.getAddresses(userId);
      const addressList = response.results || [];
      setAddresses(addressList as WildduckAddress[]);
      return addressList as WildduckAddress[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get addresses';
      setError(errorMessage);
      setAddresses([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAddress = useCallback(async (userId: string, params: CreateAddressParams): Promise<{ success: boolean; id: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/${userId}/addresses`, {
        method: 'POST',
        headers: WildDuckAPI['headers'],
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (userId: string, addressId: string, params: UpdateAddressParams): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/${userId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: WildDuckAPI['headers'],
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (userId: string, addressId: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/users/${userId}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getForwardedAddresses = useCallback(async (): Promise<ForwardedAddress[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/addresses/forwarded`, {
        method: 'GET',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.results || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get forwarded addresses';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createForwardedAddress = useCallback(async (address: string, target: string): Promise<{ success: boolean; id: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/addresses/forwarded`, {
        method: 'POST',
        headers: WildDuckAPI['headers'],
        body: JSON.stringify({ address, target })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create forwarded address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteForwardedAddress = useCallback(async (addressId: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/addresses/forwarded/${addressId}`, {
        method: 'DELETE',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete forwarded address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveAddress = useCallback(async (address: string): Promise<{ success: boolean; user?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/addresses/resolve/${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async (userId: string): Promise<void> => {
    await getUserAddresses(userId);
  }, [getUserAddresses]);

  return {
    isLoading,
    error,
    addresses,
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    getForwardedAddresses,
    createForwardedAddress,
    deleteForwardedAddress,
    resolveAddress,
    clearError,
    refresh
  };
};