/**
 * Example validated response types demonstrating type validation patterns
 *
 * This shows how to use the validation utilities with interface definitions
 */

import {
  createValidator,
  hasRequiredProperties,
  isBoolean,
  isObject,
  isString,
} from '@sudobility/types';

/**
 * Base API response interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Validation for base API response
 */
export const isApiResponse = <T>(
  data: unknown,
  dataValidator?: (value: unknown) => value is T
): data is ApiResponse<T> => {
  if (!isObject(data)) return false;
  if (!hasRequiredProperties(data, ['success'])) return false;
  if (!isBoolean(data.success)) return false;

  // Optional fields
  if ('data' in data && dataValidator && !dataValidator(data.data))
    return false;
  if ('error' in data && data.error !== undefined && !isString(data.error))
    return false;
  if (
    'message' in data &&
    data.message !== undefined &&
    !isString(data.message)
  )
    return false;
  if (
    'timestamp' in data &&
    data.timestamp !== undefined &&
    !isString(data.timestamp)
  )
    return false;

  return true;
};

/**
 * User data interface with validation
 */
export interface UserData {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Validation for UserData
 */
export const isUserData = (data: unknown): data is UserData => {
  if (!isObject(data)) return false;
  if (
    !hasRequiredProperties(data, [
      'id',
      'email',
      'isActive',
      'createdAt',
    ] as const)
  )
    return false;

  return (
    isString(data.id) &&
    isString(data.email) &&
    (data.name === undefined || isString(data.name)) &&
    isBoolean(data.isActive) &&
    isString(data.createdAt)
  );
};

/**
 * Create validators using the utility
 */
export const validateUserData = createValidator(isUserData, 'UserData');
export const validateApiResponse = <T>(
  dataValidator?: (value: unknown) => value is T
) =>
  createValidator(
    (data: unknown): data is ApiResponse<T> =>
      isApiResponse(data, dataValidator),
    'ApiResponse'
  );

/**
 * Example usage patterns:
 *
 * // Basic validation
 * const result = validateUserData(unknownData);
 * if (result.isValid) {
 *   console.log(result.data.email); // TypeScript knows this is UserData
 * }
 *
 * // API response validation
 * const apiValidator = validateApiResponse(isUserData);
 * const apiResult = apiValidator(response);
 * if (apiResult.isValid && apiResult.data.success) {
 *   console.log(apiResult.data.data?.email); // Safely access nested data
 * }
 *
 * // Direct type guards
 * if (isUserData(data)) {
 *   console.log(data.email); // TypeScript narrows type automatically
 * }
 */
