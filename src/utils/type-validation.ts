/**
 * Type validation utilities for runtime type checking
 *
 * These utilities help ensure type safety at runtime, especially useful
 * for validating API responses and external data.
 */

export type ValidationResult<T = unknown> =
  | {
      isValid: true;
      data: T;
    }
  | {
      isValid: false;
      error: string;
      data?: never;
    };

/**
 * Creates a validation function that safely checks if a value matches expected type
 */
export const createValidator = <T>(
  validationFn: (data: unknown) => data is T,
  typeName: string
) => {
  return (data: unknown): ValidationResult<T> => {
    try {
      if (validationFn(data)) {
        return { isValid: true, data };
      }
      return { isValid: false, error: `Invalid ${typeName}` };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error for ${typeName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
};

/**
 * Basic type validators
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

export const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Validates that an object has required properties
 */
export const hasRequiredProperties = <T extends Record<string, unknown>>(
  obj: unknown,
  requiredProps: (keyof T)[]
): obj is T => {
  if (!isObject(obj)) return false;
  return requiredProps.every(prop => prop in obj);
};

/**
 * Validates array of objects with a validator function
 */
export const validateArray = <T>(
  data: unknown,
  itemValidator: (item: unknown) => item is T
): data is T[] => {
  if (!isArray(data)) return false;
  return data.every(itemValidator);
};

/**
 * Creates optional property validator
 */
export const optional =
  <T>(validator: (value: unknown) => value is T) =>
  (value: unknown): value is T | undefined => {
    return value === undefined || validator(value);
  };

/**
 * Common pattern validators for API responses
 */
export const isApiResponse = (data: unknown): data is { success: boolean } => {
  return isObject(data) && isBoolean(data.success);
};

export const isSuccessResponse = <T>(
  data: unknown,
  dataValidator?: (value: unknown) => value is T
): data is { success: true; data: T } => {
  if (!isApiResponse(data) || !data.success) return false;
  if (dataValidator && 'data' in data) {
    return dataValidator(data.data);
  }
  return true;
};

export const isErrorResponse = (
  data: unknown
): data is { success: false; error: string } => {
  return (
    isApiResponse(data) &&
    !data.success &&
    'error' in data &&
    isString(data.error)
  );
};

/**
 * Date validation
 */
export const isValidDate = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Email validation (basic)
 */
export const isEmail = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * URL validation (basic)
 */
export const isUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a type assertion function that throws on invalid data
 */
export const createAssertion = <T>(
  validator: (data: unknown) => data is T,
  typeName: string
) => {
  return (data: unknown, context = typeName): asserts data is T => {
    if (!validator(data)) {
      throw new TypeError(`Invalid ${context}: expected ${typeName}`);
    }
  };
};

/**
 * Safe JSON parsing with validation
 */
export const parseJson = <T>(
  jsonString: string,
  validator?: (data: unknown) => data is T
): ValidationResult<T> => {
  try {
    const parsed = JSON.parse(jsonString);
    if (validator) {
      if (validator(parsed)) {
        return { isValid: true, data: parsed };
      }
      return {
        isValid: false,
        error: 'Parsed JSON does not match expected type',
      };
    }
    return { isValid: true, data: parsed as T };
  } catch (error) {
    return {
      isValid: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
