/**
 * Template for migrating/updating existing services
 * 
 * Use this template when updating APIs, changing service interfaces,
 * or migrating to new patterns.
 */

// ============================================================================
// MIGRATION CHECKLIST
// ============================================================================

/**
 * Pre-Migration Steps:
 * [ ] Identify all consumers of the service
 * [ ] Document current API interface
 * [ ] Write tests for current behavior
 * [ ] Create feature flag if needed
 * [ ] Plan rollback strategy
 */

// ============================================================================
// STEP 1: Create New Interface (Keep Old One)
// ============================================================================

// OLD - Keep for backward compatibility
export interface OldServiceInterface {
  oldMethod(param: string): Promise<OldResult>;
}

// NEW - Updated interface
export interface NewServiceInterface {
  newMethod(param: string, options?: Options): Promise<NewResult>;
  // Can include old methods during transition
  oldMethod?(param: string): Promise<OldResult>;
}

// ============================================================================
// STEP 2: Create Adapter/Bridge Pattern
// ============================================================================

/**
 * Adapter to support both old and new interfaces during migration
 */
export class ServiceAdapter implements NewServiceInterface, OldServiceInterface {
  constructor(
    private implementation: NewServiceInterface | OldServiceInterface
  ) {}
  
  // New method implementation
  async newMethod(param: string, options?: Options): Promise<NewResult> {
    if ('newMethod' in this.implementation) {
      return this.implementation.newMethod(param, options);
    }
    
    // Fallback: adapt old method to new interface
    const oldResult = await (this.implementation as OldServiceInterface).oldMethod(param);
    return this.adaptOldToNew(oldResult);
  }
  
  // Keep old method for backward compatibility
  async oldMethod(param: string): Promise<OldResult> {
    if ('oldMethod' in this.implementation) {
      return this.implementation.oldMethod(param);
    }
    
    // Forward compatibility: use new method
    const newResult = await (this.implementation as NewServiceInterface).newMethod(param);
    return this.adaptNewToOld(newResult);
  }
  
  private adaptOldToNew(oldResult: OldResult): NewResult {
    // Transform old format to new format
    return {
      ...oldResult,
      // Add new fields with defaults
      newField: 'default',
    } as NewResult;
  }
  
  private adaptNewToOld(newResult: NewResult): OldResult {
    // Transform new format to old format
    const { newField, ...rest } = newResult as any;
    return rest as OldResult;
  }
}

// ============================================================================
// STEP 3: Feature Flag Support
// ============================================================================

export const createService = (config: ServiceConfig): ServiceInterface => {
  const useNewImplementation = config.featureFlags?.useNewService ?? false;
  
  if (useNewImplementation) {
    // Use new implementation
    if (Platform.OS === 'web') {
      const { WebNewService } = require('./service-new.web');
      return new ServiceAdapter(new WebNewService(config));
    } else {
      const { ReactNativeNewService } = require('./service-new.reactnative');
      return new ServiceAdapter(new ReactNativeNewService(config));
    }
  } else {
    // Use old implementation
    if (Platform.OS === 'web') {
      const { WebOldService } = require('./service-old.web');
      return new ServiceAdapter(new WebOldService(config));
    } else {
      const { ReactNativeOldService } = require('./service-old.reactnative');
      return new ServiceAdapter(new ReactNativeOldService(config));
    }
  }
};

// ============================================================================
// STEP 4: Deprecation Warnings
// ============================================================================

export class ServiceWithDeprecations implements ServiceInterface {
  constructor(private service: ServiceInterface) {}
  
  /**
   * @deprecated Use newMethod() instead. This will be removed in v3.0.0
   */
  async oldMethod(param: string): Promise<OldResult> {
    console.warn(
      'Warning: oldMethod() is deprecated and will be removed in v3.0.0. ' +
      'Please use newMethod() instead.'
    );
    
    // Log usage for monitoring
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('deprecated_method_usage', {
        method: 'oldMethod',
        service: 'ServiceName',
      });
    }
    
    return this.service.oldMethod!(param);
  }
  
  async newMethod(param: string, options?: Options): Promise<NewResult> {
    return this.service.newMethod(param, options);
  }
}

// ============================================================================
// STEP 5: Migration Utilities
// ============================================================================

/**
 * Utility to help consumers migrate their code
 */
export class MigrationHelper {
  /**
   * Validates that data conforms to new format
   */
  static validateNewFormat(data: unknown): data is NewResult {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as any;
    return (
      typeof obj.newField === 'string' &&
      // Add other validation checks
      true
    );
  }
  
  /**
   * Migrates old data to new format
   */
  static migrateData(oldData: OldResult): NewResult {
    return {
      ...oldData,
      newField: 'migrated',
      // Add other transformations
    } as NewResult;
  }
  
  /**
   * Checks if code is using old patterns
   */
  static detectOldUsage(code: string): string[] {
    const issues: string[] = [];
    
    if (code.includes('oldMethod(')) {
      issues.push('Found usage of deprecated oldMethod()');
    }
    
    if (code.includes('OldServiceInterface')) {
      issues.push('Found reference to old interface');
    }
    
    return issues;
  }
}

// ============================================================================
// STEP 6: Testing Migration
// ============================================================================

import { describe, it, expect, vi } from 'vitest';

describe('Service Migration', () => {
  describe('Backward Compatibility', () => {
    it('should support old interface with new implementation', async () => {
      const service = new ServiceAdapter(new NewServiceImplementation());
      const result = await service.oldMethod('test');
      
      expect(result).toBeDefined();
      expect(result).toMatchObject(/* old format */);
    });
  });
  
  describe('Forward Compatibility', () => {
    it('should support new interface with old implementation', async () => {
      const service = new ServiceAdapter(new OldServiceImplementation());
      const result = await service.newMethod('test');
      
      expect(result).toBeDefined();
      expect(result).toMatchObject(/* new format */);
    });
  });
  
  describe('Data Migration', () => {
    it('should correctly migrate old data format', () => {
      const oldData: OldResult = { /* old format */ };
      const newData = MigrationHelper.migrateData(oldData);
      
      expect(MigrationHelper.validateNewFormat(newData)).toBe(true);
    });
  });
});

// ============================================================================
// STEP 7: Documentation
// ============================================================================

/**
 * MIGRATION GUIDE: ServiceName v1 to v2
 * 
 * Breaking Changes:
 * - `oldMethod()` is deprecated, use `newMethod()` instead
 * - Result format has changed (see below)
 * 
 * Before:
 * ```typescript
 * const result = await service.oldMethod('param');
 * console.log(result.oldField);
 * ```
 * 
 * After:
 * ```typescript
 * const result = await service.newMethod('param', { option: true });
 * console.log(result.newField);
 * ```
 * 
 * Migration Path:
 * 1. Update to latest version with compatibility layer
 * 2. Replace `oldMethod()` calls with `newMethod()`
 * 3. Update result handling for new format
 * 4. Test thoroughly
 * 5. Remove deprecated code in next major version
 * 
 * Timeline:
 * - v2.0.0: New API available, old API deprecated
 * - v2.x.x: Both APIs supported with warnings
 * - v3.0.0: Old API removed
 */

// ============================================================================
// Types
// ============================================================================

interface OldResult {
  oldField: string;
  // ... old structure
}

interface NewResult {
  newField: string;
  // ... new structure
}

interface Options {
  // New options for enhanced functionality
  timeout?: number;
  retry?: boolean;
}

interface ServiceConfig {
  featureFlags?: {
    useNewService?: boolean;
  };
}

type ServiceInterface = NewServiceInterface | OldServiceInterface;

// ============================================================================
// ROLLBACK PLAN
// ============================================================================

/**
 * If issues arise during migration:
 * 
 * 1. Immediate: Disable feature flag
 *    config.featureFlags.useNewService = false
 * 
 * 2. Hotfix: Deploy adapter fixes
 *    - Update ServiceAdapter to handle edge cases
 * 
 * 3. Full Rollback: Revert to previous version
 *    npm install @johnqh/lib@1.x.x
 * 
 * 4. Monitor these metrics:
 *    - Error rates for old vs new methods
 *    - Performance impact
 *    - Deprecation warning frequency
 */

export default {
  ServiceAdapter,
  MigrationHelper,
  createService,
};