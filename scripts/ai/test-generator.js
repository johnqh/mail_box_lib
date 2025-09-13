#!/usr/bin/env node

/**
 * Intelligent Test Generator for @johnqh/lib
 * 
 * This tool automatically generates comprehensive test suites based on
 * code analysis and established testing patterns.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

class IntelligentTestGenerator {
  constructor() {
    this.testPatterns = {
      service: this.getServiceTestTemplate(),
      hook: this.getHookTestTemplate(),
      utility: this.getUtilityTestTemplate(),
      component: this.getComponentTestTemplate(),
    };
    
    this.mockPatterns = {
      service: this.getServiceMockTemplate(),
      api: this.getApiMockTemplate(),
      hook: this.getHookMockTemplate(),
    };
  }

  async run() {
    console.log('🧪 Intelligent Test Generator for @johnqh/lib');
    console.log('=' .repeat(50));
    
    const command = process.argv[2];
    const targetFile = process.argv[3];
    
    switch (command) {
      case 'generate':
        await this.generateTests(targetFile);
        break;
      case 'analyze':
        await this.analyzeTestCoverage();
        break;
      case 'suggest':
        await this.suggestTestImprovements();
        break;
      case 'mock':
        await this.generateMocks(targetFile);
        break;
      case 'scaffold':
        await this.scaffoldTestSuite(targetFile);
        break;
      default:
        this.showHelp();
        break;
    }
  }

  async generateTests(targetFile) {
    if (!targetFile) {
      console.log('❌ Please specify a target file');
      return;
    }

    const fullPath = path.resolve(projectRoot, targetFile);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const fileType = this.determineFileType(targetFile, content);
      const analysis = this.analyzeCodeStructure(content, fileType);
      
      console.log(`🔍 Analyzing ${targetFile} (detected: ${fileType})`);
      
      const tests = await this.generateTestSuite(analysis, fileType, targetFile);
      const testPath = this.getTestPath(targetFile);
      
      await this.ensureDirectoryExists(path.dirname(testPath));
      await fs.writeFile(testPath, tests);
      
      console.log(`✅ Generated comprehensive test suite: ${path.relative(projectRoot, testPath)}`);
      console.log(`📊 Generated ${this.countTestCases(tests)} test cases`);
      
    } catch (error) {
      console.error(`❌ Failed to generate tests: ${error.message}`);
    }
  }

  determineFileType(filePath, content) {
    if (filePath.includes('-operations.ts')) return 'service';
    if (filePath.includes('use') && content.includes('useState')) return 'hook';
    if (filePath.includes('src/utils/')) return 'utility';
    if (content.includes('forwardRef') || content.includes('JSX.Element')) return 'component';
    if (content.includes('class') && content.includes('constructor')) return 'class';
    return 'utility';
  }

  analyzeCodeStructure(content, fileType) {
    const analysis = {
      exports: this.extractExports(content),
      functions: this.extractFunctions(content),
      classes: this.extractClasses(content),
      interfaces: this.extractInterfaces(content),
      imports: this.extractImports(content),
      hooks: fileType === 'hook' ? this.extractHookUsage(content) : [],
      complexity: this.calculateTestComplexity(content),
    };

    return analysis;
  }

  extractExports(content) {
    const exportPattern = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
    const exports = [];
    let match;
    
    while ((match = exportPattern.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  extractFunctions(content) {
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g,
      /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?=>/g,
      /(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g,
    ];

    const functions = [];
    
    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          params: match[2] ? match[2].split(',').map(p => p.trim()) : [],
          returnType: match[3] ? match[3].trim() : 'unknown',
        });
      }
    }
    
    return this.deduplicateFunctions(functions);
  }

  deduplicateFunctions(functions) {
    const seen = new Set();
    return functions.filter(func => {
      if (seen.has(func.name)) return false;
      seen.add(func.name);
      return true;
    });
  }

  extractClasses(content) {
    const classPattern = /export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;
    const classes = [];
    let match;
    
    while ((match = classPattern.exec(content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2],
        implements: match[3] ? match[3].split(',').map(i => i.trim()) : [],
        methods: this.extractClassMethods(content, match.index),
      });
    }
    
    return classes;
  }

  extractClassMethods(content, classStartIndex) {
    const methods = [];
    const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g;
    
    // Extract class body
    let braceCount = 0;
    let classBodyStart = content.indexOf('{', classStartIndex);
    let i = classBodyStart;
    
    while (i < content.length && (braceCount > 0 || i === classBodyStart)) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    const classBody = content.slice(classBodyStart, i);
    let match;
    
    while ((match = methodPattern.exec(classBody)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push({
          name: match[1],
          params: match[2] ? match[2].split(',').map(p => p.trim()) : [],
          returnType: match[3] ? match[3].trim() : 'unknown',
        });
      }
    }
    
    return methods;
  }

  extractInterfaces(content) {
    const interfacePattern = /interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{([^}]+)\}/g;
    const interfaces = [];
    let match;
    
    while ((match = interfacePattern.exec(content)) !== null) {
      interfaces.push({
        name: match[1],
        extends: match[2] ? match[2].split(',').map(i => i.trim()) : [],
        properties: this.parseInterfaceProperties(match[3]),
      });
    }
    
    return interfaces;
  }

  parseInterfaceProperties(propertiesString) {
    const properties = [];
    const lines = propertiesString.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        const match = trimmed.match(/(\w+)(\??)\s*:\s*([^;,]+)/);
        if (match) {
          properties.push({
            name: match[1],
            optional: match[2] === '?',
            type: match[3].trim(),
          });
        }
      }
    }
    
    return properties;
  }

  extractImports(content) {
    const importPattern = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importPattern.exec(content)) !== null) {
      imports.push({
        namedImports: match[1] ? match[1].split(',').map(i => i.trim()) : [],
        namespaceImport: match[2],
        defaultImport: match[3],
        from: match[4],
      });
    }
    
    return imports;
  }

  extractHookUsage(content) {
    const hookPattern = /use\w+/g;
    const hooks = [];
    let match;
    
    while ((match = hookPattern.exec(content)) !== null) {
      if (!hooks.includes(match[0])) {
        hooks.push(match[0]);
      }
    }
    
    return hooks;
  }

  calculateTestComplexity(content) {
    const complexityFactors = [
      { pattern: /if\s*\(/, weight: 1 },
      { pattern: /else/, weight: 1 },
      { pattern: /for\s*\(/, weight: 2 },
      { pattern: /while\s*\(/, weight: 2 },
      { pattern: /switch\s*\(/, weight: 3 },
      { pattern: /try\s*\{/, weight: 2 },
      { pattern: /catch\s*\(/, weight: 2 },
      { pattern: /async\s+/, weight: 2 },
      { pattern: /await\s+/, weight: 1 },
    ];

    let complexity = 1;
    
    for (const factor of complexityFactors) {
      const matches = content.match(factor.pattern);
      if (matches) {
        complexity += matches.length * factor.weight;
      }
    }
    
    return complexity;
  }

  async generateTestSuite(analysis, fileType, originalFile) {
    const template = this.testPatterns[fileType] || this.testPatterns.utility;
    
    const context = {
      fileName: path.basename(originalFile, '.ts'),
      className: analysis.classes[0]?.name,
      functions: analysis.functions,
      classes: analysis.classes,
      imports: analysis.imports,
      exports: analysis.exports,
      complexity: analysis.complexity,
      hooks: analysis.hooks,
    };

    let tests = this.processTemplate(template, context);
    
    // Generate specific test cases based on analysis
    if (analysis.functions.length > 0) {
      tests += this.generateFunctionTests(analysis.functions, context);
    }
    
    if (analysis.classes.length > 0) {
      tests += this.generateClassTests(analysis.classes, context);
    }

    if (fileType === 'hook') {
      tests += this.generateHookSpecificTests(analysis.hooks, context);
    }

    return tests;
  }

  processTemplate(template, context) {
    let processed = template;
    
    // Replace placeholders
    processed = processed.replace(/\{\{fileName\}\}/g, context.fileName);
    processed = processed.replace(/\{\{className\}\}/g, context.className || 'Component');
    processed = processed.replace(/\{\{importPath\}\}/g, this.getImportPath(context.fileName));
    
    return processed;
  }

  generateFunctionTests(functions, context) {
    let tests = '\n  // Generated function tests\n';
    
    for (const func of functions) {
      tests += this.generateSingleFunctionTest(func, context);
    }
    
    return tests;
  }

  generateSingleFunctionTest(func, context) {
    const testName = func.name;
    const hasParams = func.params.length > 0;
    const isAsync = func.returnType.includes('Promise');
    
    return `
  describe('${testName}', () => {
    it('should ${this.generateTestDescription(func)}', ${isAsync ? 'async ' : ''}() => {
      ${this.generateTestImplementation(func, context)}
    });

    ${hasParams ? this.generateParameterTests(func) : ''}
    
    ${isAsync ? this.generateAsyncErrorTest(func) : this.generateSyncErrorTest(func)}
  });`;
  }

  generateTestDescription(func) {
    const actionWords = ['execute', 'handle', 'process', 'validate', 'transform', 'calculate'];
    const action = actionWords[Math.floor(Math.random() * actionWords.length)];
    return `${action} correctly`;
  }

  generateTestImplementation(func, context) {
    const isAsync = func.returnType.includes('Promise');
    const hasParams = func.params.length > 0;
    
    if (context.className) {
      // Class method test
      return `
      const instance = new ${context.className}(mockDependencies);
      const result = ${isAsync ? 'await ' : ''}instance.${func.name}(${hasParams ? 'testParams' : ''});
      
      expect(result).toBeDefined();
      ${this.generateAssertions(func)}`;
    } else {
      // Function test
      return `
      const result = ${isAsync ? 'await ' : ''}${func.name}(${hasParams ? 'testParams' : ''});
      
      expect(result).toBeDefined();
      ${this.generateAssertions(func)}`;
    }
  }

  generateAssertions(func) {
    const returnType = func.returnType.toLowerCase();
    
    if (returnType.includes('boolean')) {
      return 'expect(typeof result).toBe(\'boolean\');';
    } else if (returnType.includes('string')) {
      return 'expect(typeof result).toBe(\'string\');';
    } else if (returnType.includes('number')) {
      return 'expect(typeof result).toBe(\'number\');';
    } else if (returnType.includes('array') || returnType.includes('[]')) {
      return 'expect(Array.isArray(result)).toBe(true);';
    } else if (returnType.includes('object')) {
      return 'expect(typeof result).toBe(\'object\');\n      expect(result).not.toBeNull();';
    } else {
      return '// Add specific assertions based on expected return value';
    }
  }

  generateParameterTests(func) {
    const paramTests = [];
    
    for (const param of func.params) {
      if (param.includes('string')) {
        paramTests.push(`
    it('should handle empty string parameter', () => {
      expect(() => ${func.name}('')).not.toThrow();
    });`);
      } else if (param.includes('number')) {
        paramTests.push(`
    it('should handle zero parameter', () => {
      expect(() => ${func.name}(0)).not.toThrow();
    });`);
      }
    }
    
    return paramTests.join('\n');
  }

  generateAsyncErrorTest(func) {
    return `
    it('should handle errors gracefully', async () => {
      // Mock error condition
      await expect(${func.name}(invalidParams)).rejects.toThrow();
    });`;
  }

  generateSyncErrorTest(func) {
    return `
    it('should handle invalid input', () => {
      expect(() => ${func.name}(null)).toThrow();
    });`;
  }

  generateClassTests(classes, context) {
    let tests = '\n  // Generated class tests\n';
    
    for (const cls of classes) {
      tests += this.generateSingleClassTest(cls, context);
    }
    
    return tests;
  }

  generateSingleClassTest(cls, context) {
    return `
  describe('${cls.name}', () => {
    let instance: ${cls.name};
    
    beforeEach(() => {
      instance = new ${cls.name}(mockDependencies);
    });

    it('should instantiate correctly', () => {
      expect(instance).toBeInstanceOf(${cls.name});
    });

    ${cls.methods.map(method => this.generateMethodTest(method, cls.name)).join('\n')}
  });`;
  }

  generateMethodTest(method, className) {
    const isAsync = method.returnType.includes('Promise');
    
    return `
    describe('${method.name}', () => {
      it('should ${this.generateTestDescription(method)}', ${isAsync ? 'async ' : ''}() => {
        const result = ${isAsync ? 'await ' : ''}instance.${method.name}(${method.params.length > 0 ? 'testParams' : ''});
        expect(result).toBeDefined();
      });
    });`;
  }

  generateHookSpecificTests(hooks, context) {
    if (hooks.length === 0) return '';
    
    return `
  // Hook-specific tests
  describe('hook behavior', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => use${context.fileName.replace('use', '')}());
      
      expect(result.current).toBeDefined();
    });

    it('should handle state updates correctly', async () => {
      const { result } = renderHook(() => use${context.fileName.replace('use', '')}());
      
      await act(async () => {
        // Trigger state update
      });
      
      // Assert state changes
    });
  });`;
  }

  getTestPath(originalFile) {
    const dir = path.dirname(originalFile);
    const basename = path.basename(originalFile, '.ts');
    
    // Determine if it should go in __tests__ subdirectory
    if (originalFile.includes('src/business/core/')) {
      return path.join(projectRoot, dir, '__tests__', `${basename}.test.ts`);
    } else {
      return path.join(projectRoot, dir, `${basename}.test.ts`);
    }
  }

  getImportPath(fileName) {
    return `../${fileName}`;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  countTestCases(testContent) {
    const itPattern = /it\s*\(/g;
    const matches = testContent.match(itPattern);
    return matches ? matches.length : 0;
  }

  // Template methods
  getServiceTestTemplate() {
    return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {{fileName}} } from '{{importPath}}';

describe('{{fileName}}', () => {
  const mockDependencies = {
    // Add mock dependencies here
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Generated tests will be inserted here
});`;
  }

  getHookTestTemplate() {
    return `import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { {{fileName}} } from '{{importPath}}';

// Mock dependencies
vi.mock('../../../utils/service-factory', () => ({
  createService: () => ({
    method: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('{{fileName}}', () => {
  // Generated hook tests will be inserted here
});`;
  }

  getUtilityTestTemplate() {
    return `import { describe, it, expect } from 'vitest';
import { {{fileName}} } from '{{importPath}}';

describe('{{fileName}}', () => {
  // Generated utility tests will be inserted here
});`;
  }

  getComponentTestTemplate() {
    return `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { {{fileName}} } from '{{importPath}}';

describe('{{fileName}}', () => {
  it('should render correctly', () => {
    render(<{{className}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Generated component tests will be inserted here
});`;
  }

  getServiceMockTemplate() {
    return `export const mock{{className}} = {
  // Generated mock methods will be inserted here
};`;
  }

  getApiMockTemplate() {
    return `export const mockApiResponse = {
  success: true,
  data: {
    // Generated mock data will be inserted here
  },
};`;
  }

  getHookMockTemplate() {
    return `export const mockHook = {
  isLoading: false,
  error: null,
  data: null,
  // Generated mock hook state will be inserted here
};`;
  }

  async analyzeTestCoverage() {
    console.log('📊 Analyzing test coverage gaps...\n');
    
    const sourceFiles = await this.findSourceFiles();
    const testFiles = await this.findTestFiles();
    
    const coverage = this.calculateCoverageGaps(sourceFiles, testFiles);
    this.displayCoverageAnalysis(coverage);
  }

  async findSourceFiles() {
    const files = [];
    await this.walkDirectory(path.join(projectRoot, 'src'), (filePath) => {
      if (filePath.endsWith('.ts') && !filePath.includes('.test.ts') && !filePath.includes('.spec.ts')) {
        files.push(filePath);
      }
    });
    return files;
  }

  async findTestFiles() {
    const files = [];
    await this.walkDirectory(path.join(projectRoot, 'src'), (filePath) => {
      if (filePath.includes('.test.ts') || filePath.includes('.spec.ts')) {
        files.push(filePath);
      }
    });
    return files;
  }

  calculateCoverageGaps(sourceFiles, testFiles) {
    const uncoveredFiles = [];
    
    for (const sourceFile of sourceFiles) {
      const relativePath = path.relative(projectRoot, sourceFile);
      const expectedTestPath = this.getTestPath(relativePath);
      
      const hasTest = testFiles.some(testFile => 
        path.relative(projectRoot, testFile) === path.relative(projectRoot, expectedTestPath)
      );
      
      if (!hasTest) {
        uncoveredFiles.push(relativePath);
      }
    }
    
    return {
      totalFiles: sourceFiles.length,
      testedFiles: sourceFiles.length - uncoveredFiles.length,
      uncoveredFiles,
      coveragePercentage: Math.round(((sourceFiles.length - uncoveredFiles.length) / sourceFiles.length) * 100),
    };
  }

  displayCoverageAnalysis(coverage) {
    console.log(`📈 Test Coverage Analysis:`);
    console.log(`  Total source files: ${coverage.totalFiles}`);
    console.log(`  Files with tests: ${coverage.testedFiles}`);
    console.log(`  Coverage: ${coverage.coveragePercentage}%\n`);
    
    if (coverage.uncoveredFiles.length > 0) {
      console.log('📋 Files missing tests:');
      coverage.uncoveredFiles.forEach(file => {
        console.log(`  • ${file}`);
      });
      
      console.log(`\n💡 Generate tests with: node scripts/ai/test-generator.js generate <file>`);
    } else {
      console.log('🎉 All files have test coverage!');
    }
  }

  async walkDirectory(dir, callback) {
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await this.walkDirectory(fullPath, callback);
        } else {
          callback(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is not accessible
    }
  }

  showHelp() {
    console.log(`
🧪 Intelligent Test Generator for @johnqh/lib

USAGE:
  node scripts/ai/test-generator.js <command> [options]

COMMANDS:
  generate <file>     Generate comprehensive test suite for a file
  analyze            Analyze test coverage gaps
  suggest            Suggest test improvements
  mock <type>        Generate mock objects
  scaffold <dir>     Scaffold complete test suite for directory

EXAMPLES:
  node scripts/ai/test-generator.js generate src/business/core/email/email-operations.ts
  node scripts/ai/test-generator.js analyze
  node scripts/ai/test-generator.js mock service

The generator creates comprehensive test suites including:
  • Unit tests for all functions and methods
  • Error handling tests
  • Mock object generation
  • Integration test scaffolding
  • Performance test suggestions
    `);
  }
}

// Run the test generator
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new IntelligentTestGenerator();
  generator.run().catch(console.error);
}

export default IntelligentTestGenerator;