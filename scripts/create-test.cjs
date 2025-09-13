#!/usr/bin/env node

/**
 * AI-Friendly Test Generator
 * Creates comprehensive test files for existing components
 */

const fs = require('fs');
const path = require('path');

const testTemplates = {
  hook: (hookName, filePath) => `import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ${hookName} } from '../${path.basename(filePath, '.ts')}';

describe('${hookName}', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => ${hookName}(/* add required params */));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful operations', async () => {
    const { result } = renderHook(() => ${hookName}(/* add required params */));
    
    await act(async () => {
      // TODO: Add test for successful operation
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle error cases', async () => {
    const { result } = renderHook(() => ${hookName}(/* add required params */));
    
    await act(async () => {
      // TODO: Add test for error case
    });
    
    expect(result.current.error).toBeTruthy();
  });

  it('should cleanup properly on unmount', () => {
    const { unmount } = renderHook(() => ${hookName}(/* add required params */));
    
    expect(() => unmount()).not.toThrow();
  });
});`,

  service: (serviceName, filePath) => `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ${serviceName} } from '../${path.basename(filePath, '.ts')}';

describe('${serviceName}', () => {
  let service: ${serviceName};
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = {
      // TODO: Mock required dependencies
    };
    service = new ${serviceName}(mockDependency);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(${serviceName});
    });
  });

  describe('core functionality', () => {
    it('should handle successful operations', async () => {
      // TODO: Add test for main functionality
      const result = await service.mainMethod(/* params */);
      expect(result).toBeDefined();
    });

    it('should handle error conditions', async () => {
      // TODO: Add test for error handling
      mockDependency.method.mockRejectedValue(new Error('Test error'));
      
      await expect(service.mainMethod(/* params */))
        .rejects.toThrow('Test error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty/null inputs', async () => {
      // TODO: Add edge case tests
    });

    it('should validate input parameters', async () => {
      // TODO: Add input validation tests
    });
  });
});`,

  utility: (utilityName, filePath) => `import { describe, it, expect } from 'vitest';
import { ${utilityName} } from '../${path.basename(filePath, '.ts')}';

describe('${utilityName}', () => {
  describe('basic functionality', () => {
    it('should work with valid inputs', () => {
      // TODO: Add test for normal operation
      const result = ${utilityName}(/* valid params */);
      expect(result).toBeDefined();
    });

    it('should handle edge cases', () => {
      // TODO: Add edge case tests
      expect(() => ${utilityName}(null)).not.toThrow();
      expect(() => ${utilityName}(undefined)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid inputs gracefully', () => {
      // TODO: Add error handling tests
    });

    it('should throw appropriate errors for invalid data', () => {
      // TODO: Add validation error tests
    });
  });

  describe('performance', () => {
    it('should complete within reasonable time', () => {
      const start = Date.now();
      ${utilityName}(/* params */);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});`
};

function generateTest(filePath, testType = 'auto') {
  const fileName = path.basename(filePath, '.ts');
  const testDir = path.join(path.dirname(filePath), '__tests__');
  const testFile = path.join(testDir, `${fileName}.test.ts`);

  // Auto-detect test type
  if (testType === 'auto') {
    if (fileName.startsWith('use')) testType = 'hook';
    else if (fileName.includes('service') || fileName.includes('Service')) testType = 'service';
    else testType = 'utility';
  }

  // Extract main export name (simplified)
  const content = fs.readFileSync(filePath, 'utf8');
  const exportMatch = content.match(/export (?:class|function|const) (\w+)/);
  const mainName = exportMatch ? exportMatch[1] : fileName;

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  if (fs.existsSync(testFile)) {
    console.log(`❌ Test file already exists: ${testFile}`);
    return;
  }

  const template = testTemplates[testType](mainName, filePath);
  fs.writeFileSync(testFile, template);

  console.log(`✅ Created ${testType} test: ${testFile}`);
  console.log(`🔧 TODO: Update test with actual implementation details`);
}

// CLI usage
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: npm run create:test <file-path> [test-type]');
    console.log('Test types: hook, service, utility, auto');
    console.log('Example: npm run create:test src/hooks/useMyHook.ts hook');
    process.exit(1);
  }

  const [filePath, testType = 'auto'] = args;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File does not exist: ${filePath}`);
    process.exit(1);
  }

  generateTest(filePath, testType);
}

if (require.main === module) {
  main();
}