/**
 * React Native implementation of platform storage using AsyncStorage
 *
 * This file shows how to implement the storage interface for React Native.
 * To use this in a React Native app:
 *
 * 1. Install AsyncStorage: npm install @react-native-async-storage/async-storage
 * 2. Import AsyncStorage from '@react-native-async-storage/async-storage'
 * 3. Use this implementation instead of the web storage
 *
 * Example usage in React Native:
 *
 * import { ReactNativeStorage } from './storage.reactnative';
 * import { StorageManager } from './storage';
 *
 * const reactNativeStorage = new ReactNativeStorage();
 * const walletStorage = new StorageManager({
 *   prefix: 'walletUser',
 *   platformStorage: reactNativeStorage
 * });
 */

import { PlatformStorage } from '../types';

// Mock AsyncStorage interface for documentation purposes
interface AsyncStorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/**
 * React Native storage implementation using AsyncStorage
 * This would be the actual implementation in a React Native environment
 */
export class ReactNativeStorage implements PlatformStorage {
  private asyncStorage: AsyncStorageInterface;

  constructor(asyncStorage: AsyncStorageInterface) {
    this.asyncStorage = asyncStorage;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.asyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }
}

/**
 * Example of how to set up storage in React Native:
 *
 * // In your React Native app:
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import { ReactNativeStorage } from './utils/storage.reactnative';
 * import { StorageManager } from './utils/storage';
 *
 * const reactNativeStorage = new ReactNativeStorage(AsyncStorage);
 *
 * export const appStorage = new StorageManager({
 *   platformStorage: reactNativeStorage
 * });
 *
 * export const walletStorage = new StorageManager({
 *   prefix: 'walletUser',
 *   ttl: 7 * 24 * 60 * 60 * 1000,
 *   platformStorage: reactNativeStorage
 * });
 *
 * // The rest of your business logic remains exactly the same!
 */
