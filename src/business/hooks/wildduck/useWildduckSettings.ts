import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckAPI } from '../../../network/clients/wildduck';

interface WildduckSettings {
  [key: string]: any;
}

interface UseWildduckSettingsReturn {
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
const useWildduckSettings = (): UseWildduckSettingsReturn => {
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
      const response = await axios.get(`${WildDuckAPI['baseUrl']}/settings`, {
        headers: WildDuckAPI['headers'],
      });

      const settingsData = (response.data as { results?: WildduckSettings } | WildduckSettings).results || response.data as WildduckSettings;
      setSettings(settingsData);
      return settingsData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get settings';
      setError(errorMessage);
      setSettings({});
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(
    async (key: string, value: any): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.put(
          `${WildDuckAPI['baseUrl']}/settings/${key}`,
          { value },
          {
            headers: WildDuckAPI['headers'],
          }
        );

        // Update local settings
        setSettings(prev => ({ ...prev, [key]: value }));

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update setting';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteSetting = useCallback(
    async (key: string): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.delete(
          `${WildDuckAPI['baseUrl']}/settings/${key}`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        // Remove from local settings
        setSettings(prev => {
          const { [key]: _removed, ...rest } = prev;
          return rest;
        });

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete setting';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
    refresh,
  };
};

export {
  useWildduckSettings,
  type WildduckSettings,
  type UseWildduckSettingsReturn
};