import { useState, useCallback } from 'react';
import { WildDuckAPI } from "../../../network/clients/wildduck";

export interface WildduckSettings {
  [key: string]: any;
}

export interface UseWildduckSettingsReturn {
  isLoading: boolean;
  error: string | null;
  settings: WildduckSettings;
  getSettings: () => Promise<WildduckSettings>;
  updateSetting: (key: string, value: any) => Promise<{ success: boolean }>;
  deleteSetting: (key: string) => Promise<{ success: boolean }>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for WildDuck settings management operations
 */
export const useWildduckSettings = (): UseWildduckSettingsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WildduckSettings>({});

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSettings = useCallback(async (): Promise<WildduckSettings> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/settings`, {
        method: 'GET',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const settingsData = result.results || result;
      setSettings(settingsData);
      return settingsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get settings';
      setError(errorMessage);
      setSettings({});
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: any): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/settings/${key}`, {
        method: 'PUT',
        headers: WildDuckAPI['headers'],
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update local settings
      setSettings(prev => ({ ...prev, [key]: value }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update setting';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSetting = useCallback(async (key: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be added to the WildDuckAPI class
      const response = await fetch(`${WildDuckAPI['baseUrl']}/settings/${key}`, {
        method: 'DELETE',
        headers: WildDuckAPI['headers']
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Remove from local settings
      setSettings(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete setting';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await getSettings();
  }, [getSettings]);

  return {
    isLoading,
    error,
    settings,
    getSettings,
    updateSetting,
    deleteSetting,
    clearError,
    refresh
  };
};