#!/usr/bin/env node

/**
 * AI-Driven Code Assistant
 * Intelligent code generation, refactoring, and development assistance
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

class AICodeAssistant {
  constructor() {
    this.codePatterns = new Map();
    this.refactoringRules = new Map();
    this.generationTemplates = new Map();
    this.projectContext = new Map();
    this.learningData = [];
    
    this.initializeCodePatterns();
    this.initializeRefactoringRules();
    this.initializeGenerationTemplates();
  }

  initializeCodePatterns() {
    // React Hook patterns
    this.codePatterns.set('react-hook', {
      pattern: /export const (use\w+) = \((.*?)\) => \{/,
      template: `export const {{hookName}} = ({{parameters}}) => {
  const [{{stateName}}, set{{StateNameCapitalized}}] = useState({{initialValue}});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {{actionName}} = useCallback(async ({{actionParams}}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await {{apiCall}};
      set{{StateNameCapitalized}}(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [{{dependencies}}]);

  return {
    {{stateName}},
    {{actionName}},
    isLoading,
    error,
    clearError: () => setError(null),
  };
};`,
      variables: ['hookName', 'stateName', 'actionName', 'parameters', 'actionParams', 'apiCall', 'dependencies', 'initialValue'],
    });

    // Service class pattern
    this.codePatterns.set('service-class', {
      pattern: /export class (\w+)Service/,
      template: `export class {{serviceName}}Service {
  private client: {{clientType}};

  constructor(config: {{configType}}) {
    this.client = new {{clientName}}(config);
  }

  async {{methodName}}({{methodParams}}): Promise<{{returnType}}> {
    try {
      const response = await this.client.{{apiMethod}}({{apiParams}});
      
      if (!response.success) {
        throw new {{errorType}}(response.error || 'Operation failed');
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof {{errorType}}) {
        throw error;
      }
      throw new {{errorType}}(\`{{serviceName}} operation failed: \${error.message}\`);
    }
  }
}`,
      variables: ['serviceName', 'clientType', 'configType', 'clientName', 'methodName', 'methodParams', 'returnType', 'apiMethod', 'apiParams', 'errorType'],
    });

    // Interface pattern
    this.codePatterns.set('interface', {
      pattern: /export interface (\w+)/,
      template: `export interface {{interfaceName}} {
  {{properties}}
}`,
      variables: ['interfaceName', 'properties'],
    });

    // Test pattern
    this.codePatterns.set('test', {
      pattern: /describe\('(.+)', \(\) => \{/,
      template: `describe('{{testSuite}}', () => {
  let {{instanceName}}: {{className}};
  let {{mockName}}: {{mockType}};

  beforeEach(() => {
    {{mockName}} = {{mockImplementation}};
    {{instanceName}} = new {{className}}({{mockName}});
  });

  describe('{{methodName}}', () => {
    it('should {{expectation}} when {{condition}}', async () => {
      // Arrange
      const {{inputName}} = {{testData}};
      {{mockName}}.{{mockMethod}}.mockResolvedValue({{mockResponse}});

      // Act
      const result = await {{instanceName}}.{{methodName}}({{inputName}});

      // Assert
      expect(result).toEqual({{expectedResult}});
      expect({{mockName}}.{{mockMethod}}).toHaveBeenCalledWith({{expectedParams}});
    });

    it('should throw error when {{errorCondition}}', async () => {
      // Arrange
      const {{inputName}} = {{invalidData}};
      {{mockName}}.{{mockMethod}}.mockRejectedValue(new Error('{{errorMessage}}'));

      // Act & Assert
      await expect({{instanceName}}.{{methodName}}({{inputName}}))
        .rejects.toThrow('{{errorMessage}}');
    });
  });
});`,
      variables: ['testSuite', 'instanceName', 'className', 'mockName', 'mockType', 'mockImplementation', 'methodName', 'expectation', 'condition', 'inputName', 'testData', 'mockMethod', 'mockResponse', 'expectedResult', 'expectedParams', 'errorCondition', 'invalidData', 'errorMessage'],
    });
  }

  initializeRefactoringRules() {
    // Extract complex function
    this.refactoringRules.set('extract-function', {
      condition: (code) => {
        const lines = code.split('\n');
        return lines.length > 20 || code.includes('// TODO') || code.includes('// FIXME');
      },
      description: 'Extract complex logic into separate functions',
      transform: (code) => this.extractComplexFunction(code),
      impact: 'high',
    });

    // Add missing error handling
    this.refactoringRules.set('add-error-handling', {
      condition: (code) => {
        return code.includes('await ') && !code.includes('try') && !code.includes('catch');
      },
      description: 'Add proper error handling to async operations',
      transform: (code) => this.addErrorHandling(code),
      impact: 'high',
    });

    // Replace any types
    this.refactoringRules.set('replace-any-types', {
      condition: (code) => {
        return code.includes(': any') || code.includes('<any>');
      },
      description: 'Replace any types with specific interfaces',
      transform: (code) => this.replaceAnyTypes(code),
      impact: 'medium',
    });

    // Add React.memo optimization
    this.refactoringRules.set('add-react-memo', {
      condition: (code) => {
        return code.includes('export const') && 
               code.includes('React.') && 
               !code.includes('React.memo') &&
               !code.includes('useState') &&
               code.includes('props');
      },
      description: 'Add React.memo for performance optimization',
      transform: (code) => this.addReactMemo(code),
      impact: 'medium',
    });

    // Optimize imports
    this.refactoringRules.set('optimize-imports', {
      condition: (code) => {
        const importLines = code.split('\n').filter(line => line.trim().startsWith('import'));
        return importLines.length > 5 || importLines.some(line => line.includes('import *'));
      },
      description: 'Optimize and organize imports',
      transform: (code) => this.optimizeImports(code),
      impact: 'low',
    });
  }

  initializeGenerationTemplates() {
    this.generationTemplates.set('hook', {
      name: 'React Hook',
      description: 'Generate a React hook with state management and API calls',
      prompts: [
        { key: 'hookName', label: 'Hook name (without "use" prefix)', required: true },
        { key: 'apiEndpoint', label: 'API endpoint or service method', required: true },
        { key: 'returnType', label: 'Return type interface', required: false },
        { key: 'parameters', label: 'Hook parameters', required: false },
      ],
      generate: (inputs) => this.generateHook(inputs),
    });

    this.generationTemplates.set('service', {
      name: 'Service Class',
      description: 'Generate a service class with error handling and typing',
      prompts: [
        { key: 'serviceName', label: 'Service name', required: true },
        { key: 'apiMethods', label: 'API methods (comma-separated)', required: true },
        { key: 'configType', label: 'Configuration interface name', required: true },
      ],
      generate: (inputs) => this.generateService(inputs),
    });

    this.generationTemplates.set('interface', {
      name: 'TypeScript Interface',
      description: 'Generate a TypeScript interface from example data',
      prompts: [
        { key: 'interfaceName', label: 'Interface name', required: true },
        { key: 'exampleData', label: 'Example JSON data', required: true },
        { key: 'optional', label: 'Optional properties (comma-separated)', required: false },
      ],
      generate: (inputs) => this.generateInterface(inputs),
    });

    this.generationTemplates.set('test', {
      name: 'Test Suite',
      description: 'Generate comprehensive test suite for a class or function',
      prompts: [
        { key: 'targetClass', label: 'Class/function to test', required: true },
        { key: 'methods', label: 'Methods to test (comma-separated)', required: true },
        { key: 'mockDependencies', label: 'Dependencies to mock', required: false },
      ],
      generate: (inputs) => this.generateTestSuite(inputs),
    });
  }

  async analyzeCodebase() {
    log(colors.cyan, '🔍 Analyzing codebase for AI assistance opportunities...');

    const analysis = {
      patterns: new Map(),
      refactoringOpportunities: [],
      codeQualityIssues: [],
      generationSuggestions: [],
      totalFiles: 0,
    };

    await this.scanSourceFiles('src', async (filePath, content) => {
      analysis.totalFiles++;
      
      // Analyze patterns
      await this.analyzeFilePatterns(filePath, content, analysis);
      
      // Find refactoring opportunities
      await this.findRefactoringOpportunities(filePath, content, analysis);
      
      // Identify code quality issues
      await this.identifyCodeQualityIssues(filePath, content, analysis);
    });

    // Generate suggestions
    analysis.generationSuggestions = await this.generateCodeSuggestions(analysis);

    log(colors.green, `✅ Analyzed ${analysis.totalFiles} files`);
    log(colors.blue, `   Found ${analysis.refactoringOpportunities.length} refactoring opportunities`);
    log(colors.blue, `   Identified ${analysis.codeQualityIssues.length} quality issues`);

    return analysis;
  }

  async analyzeFilePatterns(filePath, content, analysis) {
    for (const [patternName, pattern] of this.codePatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        const patternData = analysis.patterns.get(patternName) || [];
        patternData.push({
          file: filePath,
          match: matches[0],
          variables: this.extractPatternVariables(matches, pattern),
        });
        analysis.patterns.set(patternName, patternData);
      }
    }
  }

  extractPatternVariables(matches, pattern) {
    const variables = {};
    
    if (pattern.variables) {
      // Simple variable extraction based on common patterns
      if (matches[1]) variables.name = matches[1];
      if (matches[2]) variables.parameters = matches[2];
    }
    
    return variables;
  }

  async findRefactoringOpportunities(filePath, content, analysis) {
    for (const [ruleName, rule] of this.refactoringRules) {
      if (rule.condition(content)) {
        analysis.refactoringOpportunities.push({
          file: filePath,
          rule: ruleName,
          description: rule.description,
          impact: rule.impact,
          preview: await this.generateRefactoringPreview(content, rule),
        });
      }
    }
  }

  async generateRefactoringPreview(code, rule) {
    try {
      const refactored = rule.transform(code);
      const preview = refactored.split('\n').slice(0, 10).join('\n');
      return preview.length < refactored.length ? preview + '\n...' : preview;
    } catch (error) {
      return 'Preview generation failed';
    }
  }

  async identifyCodeQualityIssues(filePath, content, analysis) {
    const issues = [];

    // Check for missing JSDoc
    if (this.isFunctionFile(content) && !content.includes('/**')) {
      issues.push({
        type: 'missing-documentation',
        severity: 'medium',
        description: 'Functions lack JSDoc documentation',
      });
    }

    // Check for console.log statements
    if (content.includes('console.log') || content.includes('console.error')) {
      issues.push({
        type: 'debug-statements',
        severity: 'low',
        description: 'Debug console statements present',
      });
    }

    // Check for TODO/FIXME comments
    const todoCount = (content.match(/TODO|FIXME/g) || []).length;
    if (todoCount > 0) {
      issues.push({
        type: 'pending-tasks',
        severity: 'low',
        description: `${todoCount} TODO/FIXME comments found`,
      });
    }

    // Check for complex nested conditions
    const nestedConditions = content.match(/if\s*\([^)]*\)\s*{\s*if\s*\(/g);
    if (nestedConditions && nestedConditions.length > 2) {
      issues.push({
        type: 'complex-conditions',
        severity: 'high',
        description: 'Deeply nested conditional statements',
      });
    }

    if (issues.length > 0) {
      analysis.codeQualityIssues.push({
        file: filePath,
        issues,
      });
    }
  }

  isFunctionFile(content) {
    return content.includes('function ') || 
           content.includes('const ') && content.includes(' = ') && content.includes('=>');
  }

  async generateCodeSuggestions(analysis) {
    const suggestions = [];

    // Suggest missing hook patterns
    if (analysis.patterns.has('react-hook')) {
      const hooks = analysis.patterns.get('react-hook');
      if (hooks.length < 5) {
        suggestions.push({
          type: 'generate-hook',
          priority: 'medium',
          description: 'Consider creating more reusable hooks for common operations',
          template: 'hook',
        });
      }
    }

    // Suggest service layer improvements
    const hasServices = analysis.patterns.has('service-class');
    if (!hasServices) {
      suggestions.push({
        type: 'generate-services',
        priority: 'high',
        description: 'Create service layer for better separation of concerns',
        template: 'service',
      });
    }

    // Suggest interface definitions
    const interfaceCount = analysis.patterns.get('interface')?.length || 0;
    const totalFiles = analysis.totalFiles;
    
    if (interfaceCount < totalFiles * 0.3) {
      suggestions.push({
        type: 'generate-interfaces',
        priority: 'high',
        description: 'Add more TypeScript interfaces for better type safety',
        template: 'interface',
      });
    }

    return suggestions;
  }

  // Refactoring transformation methods
  extractComplexFunction(code) {
    // Simple implementation - in practice, this would use AST parsing
    const lines = code.split('\n');
    if (lines.length <= 20) return code;

    const functionStart = lines.findIndex(line => line.includes('const ') && line.includes(' => {'));
    if (functionStart === -1) return code;

    // Extract middle section as helper function
    const extractStart = Math.floor(lines.length * 0.3);
    const extractEnd = Math.floor(lines.length * 0.7);
    const extractedLines = lines.slice(extractStart, extractEnd);

    const helperFunction = `
const ${this.generateHelperFunctionName()} = (${this.extractParameters(extractedLines)}) => {
${extractedLines.join('\n')}
};
`;

    // Replace extracted section with function call
    const remainingLines = [
      ...lines.slice(0, extractStart),
      `  const result = ${this.generateHelperFunctionName()}(${this.extractArguments(extractedLines)});`,
      ...lines.slice(extractEnd)
    ];

    return helperFunction + '\n' + remainingLines.join('\n');
  }

  generateHelperFunctionName() {
    return `helper${Date.now().toString(36)}`;
  }

  extractParameters(lines) {
    // Simplified parameter extraction
    return 'data: any';
  }

  extractArguments(lines) {
    return 'data';
  }

  addErrorHandling(code) {
    const lines = code.split('\n');
    const awaitLines = lines.map((line, index) => {
      if (line.includes('await ') && !lines[index - 1]?.trim().startsWith('try')) {
        return {
          index,
          line: line.trim(),
          indentation: line.match(/^\s*/)[0],
        };
      }
      return null;
    }).filter(Boolean);

    if (awaitLines.length === 0) return code;

    // Wrap first await block in try-catch
    const firstAwait = awaitLines[0];
    const tryStart = firstAwait.index;
    const tryEnd = this.findBlockEnd(lines, tryStart);

    const newLines = [
      ...lines.slice(0, tryStart),
      `${firstAwait.indentation}try {`,
      ...lines.slice(tryStart, tryEnd + 1).map(line => `  ${line}`),
      `${firstAwait.indentation}} catch (error) {`,
      `${firstAwait.indentation}  console.error('Operation failed:', error);`,
      `${firstAwait.indentation}  throw error;`,
      `${firstAwait.indentation}}`,
      ...lines.slice(tryEnd + 1),
    ];

    return newLines.join('\n');
  }

  findBlockEnd(lines, startIndex) {
    let braceCount = 0;
    let inBrace = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inBrace = true;
        } else if (char === '}') {
          braceCount--;
          if (inBrace && braceCount === 0) {
            return i;
          }
        }
      }
    }

    return Math.min(startIndex + 10, lines.length - 1);
  }

  replaceAnyTypes(code) {
    // Simple any type replacement
    return code
      .replace(/:\s*any\b/g, ': unknown')
      .replace(/<any>/g, '<unknown>')
      .replace(/any\[\]/g, 'unknown[]');
  }

  addReactMemo(code) {
    if (code.includes('React.memo')) return code;

    const componentMatch = code.match(/export const (\w+) = \((.*?)\) => {/);
    if (!componentMatch) return code;

    const componentName = componentMatch[1];
    const imports = code.match(/import.*from.*;/g) || [];
    const hasReactImport = imports.some(imp => imp.includes('React'));

    let updatedCode = code;

    if (!hasReactImport) {
      const firstImport = imports[0];
      if (firstImport) {
        updatedCode = updatedCode.replace(firstImport, `import React from 'react';\n${firstImport}`);
      }
    }

    return updatedCode.replace(
      new RegExp(`export const ${componentName} =`),
      `const ${componentName}Component =`
    ) + `\n\nexport const ${componentName} = React.memo(${componentName}Component);`;
  }

  optimizeImports(code) {
    const lines = code.split('\n');
    const importLines = [];
    const nonImportLines = [];

    lines.forEach(line => {
      if (line.trim().startsWith('import')) {
        importLines.push(line);
      } else {
        nonImportLines.push(line);
      }
    });

    // Group and sort imports
    const thirdPartyImports = [];
    const localImports = [];

    importLines.forEach(line => {
      if (line.includes("from '") && !line.includes("from '.") && !line.includes("from '..")) {
        thirdPartyImports.push(line);
      } else {
        localImports.push(line);
      }
    });

    const optimizedImports = [
      ...thirdPartyImports.sort(),
      '',
      ...localImports.sort(),
      '',
    ];

    return [...optimizedImports, ...nonImportLines].join('\n');
  }

  // Code generation methods
  generateHook(inputs) {
    const template = this.codePatterns.get('react-hook').template;
    
    return this.processTemplate(template, {
      hookName: `use${inputs.hookName}`,
      stateName: inputs.hookName.toLowerCase(),
      StateNameCapitalized: this.capitalize(inputs.hookName),
      actionName: `fetch${this.capitalize(inputs.hookName)}`,
      parameters: inputs.parameters || 'config: ServiceConfig',
      actionParams: inputs.actionParams || 'id: string',
      apiCall: inputs.apiEndpoint || 'api.getData(id)',
      dependencies: inputs.dependencies || 'config',
      initialValue: inputs.initialValue || 'null',
    });
  }

  generateService(inputs) {
    const template = this.codePatterns.get('service-class').template;
    const methods = inputs.apiMethods.split(',').map(m => m.trim());
    
    let serviceCode = this.processTemplate(template, {
      serviceName: inputs.serviceName,
      clientType: `${inputs.serviceName}Client`,
      configType: inputs.configType,
      clientName: `${inputs.serviceName}Client`,
      methodName: methods[0] || 'getData',
      methodParams: 'id: string',
      returnType: `${inputs.serviceName}Data`,
      apiMethod: methods[0] || 'get',
      apiParams: 'id',
      errorType: `${inputs.serviceName}Error`,
    });

    // Add additional methods
    for (let i = 1; i < methods.length; i++) {
      const method = methods[i];
      serviceCode += `\n\n  async ${method}(data: any): Promise<any> {
    // TODO: Implement ${method} method
    return this.client.${method}(data);
  }`;
    }

    return serviceCode + '\n}';
  }

  generateInterface(inputs) {
    const template = this.codePatterns.get('interface').template;
    
    let properties = '';
    
    if (inputs.exampleData) {
      try {
        const data = JSON.parse(inputs.exampleData);
        properties = this.generateInterfaceProperties(data, inputs.optional?.split(',') || []);
      } catch (error) {
        properties = '// Invalid JSON data provided';
      }
    }
    
    return this.processTemplate(template, {
      interfaceName: inputs.interfaceName,
      properties: properties,
    });
  }

  generateInterfaceProperties(data, optionalProps = []) {
    const properties = [];
    
    for (const [key, value] of Object.entries(data)) {
      const isOptional = optionalProps.includes(key);
      const type = this.inferTypeFromValue(value);
      properties.push(`  ${key}${isOptional ? '?' : ''}: ${type};`);
    }
    
    return properties.join('\n');
  }

  inferTypeFromValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      return `${this.inferTypeFromValue(value[0])}[]`;
    }
    if (typeof value === 'object') return 'object';
    return 'any';
  }

  generateTestSuite(inputs) {
    const template = this.codePatterns.get('test').template;
    const methods = inputs.methods.split(',').map(m => m.trim());
    
    return this.processTemplate(template, {
      testSuite: inputs.targetClass,
      instanceName: inputs.targetClass.toLowerCase(),
      className: inputs.targetClass,
      mockName: `mock${inputs.targetClass}`,
      mockType: `jest.Mocked<${inputs.targetClass}Dependencies>`,
      mockImplementation: '{}',
      methodName: methods[0] || 'testMethod',
      expectation: 'return correct result',
      condition: 'given valid input',
      inputName: 'testInput',
      testData: '{ id: "test" }',
      mockMethod: 'getData',
      mockResponse: '{ success: true, data: {} }',
      expectedResult: '{ success: true }',
      expectedParams: 'testInput',
      errorCondition: 'given invalid input',
      invalidData: '{ id: "" }',
      errorMessage: 'Invalid input',
    });
  }

  processTemplate(template, variables) {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(placeholder, value);
    }
    
    return processed;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async scanSourceFiles(dir, callback) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory() && !item.name.startsWith('.')) {
          await this.scanSourceFiles(itemPath, callback);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          const content = await fs.readFile(itemPath, 'utf8');
          await callback(itemPath, content);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
    }
  }

  async generateInteractiveCode(templateName, inputs) {
    const template = this.generationTemplates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const code = template.generate(inputs);
    
    // Save generated code to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `generated-${templateName}-${timestamp}.ts`;
    const outputPath = path.join(process.cwd(), 'generated', filename);
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, code);
    
    return {
      code,
      outputPath,
      template: template.name,
    };
  }

  async performAutomaticRefactoring(filePath, rules = []) {
    const content = await fs.readFile(filePath, 'utf8');
    let refactoredContent = content;
    const appliedRefactoring = [];

    for (const ruleName of rules) {
      const rule = this.refactoringRules.get(ruleName);
      if (!rule) continue;

      if (rule.condition(refactoredContent)) {
        try {
          refactoredContent = rule.transform(refactoredContent);
          appliedRefactoring.push({
            rule: ruleName,
            description: rule.description,
            impact: rule.impact,
          });
        } catch (error) {
          log(colors.red, `❌ Failed to apply ${ruleName}: ${error.message}`);
        }
      }
    }

    if (appliedRefactoring.length > 0) {
      // Create backup
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.copyFile(filePath, backupPath);
      
      // Apply refactoring
      await fs.writeFile(filePath, refactoredContent);
      
      return {
        success: true,
        appliedRefactoring,
        backupPath,
      };
    }

    return {
      success: false,
      message: 'No applicable refactoring found',
    };
  }

  async generateAssistantReport() {
    const analysis = await this.analyzeCodebase();
    
    const report = {
      timestamp: new Date().toISOString(),
      analysis: {
        totalFiles: analysis.totalFiles,
        patternsFound: Array.from(analysis.patterns.keys()),
        refactoringOpportunities: analysis.refactoringOpportunities.length,
        qualityIssues: analysis.codeQualityIssues.length,
        generationSuggestions: analysis.generationSuggestions.length,
      },
      recommendations: {
        highPriority: analysis.refactoringOpportunities.filter(r => r.impact === 'high'),
        mediumPriority: analysis.refactoringOpportunities.filter(r => r.impact === 'medium'),
        codeGeneration: analysis.generationSuggestions,
      },
      availableTemplates: Array.from(this.generationTemplates.keys()),
      availableRefactoring: Array.from(this.refactoringRules.keys()),
    };

    await fs.writeFile(
      path.join(process.cwd(), '.ai-assistant-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }
}

async function main() {
  const assistant = new AICodeAssistant();
  
  const action = process.argv[2] || 'analyze';
  
  switch (action) {
    case 'analyze':
      log(colors.cyan, '🤖 AI Code Assistant - Analyzing codebase...');
      const report = await assistant.generateAssistantReport();
      
      console.log('\n📊 AI Analysis Summary:');
      console.log(`Files analyzed: ${report.analysis.totalFiles}`);
      console.log(`Patterns found: ${report.analysis.patternsFound.length}`);
      console.log(`Refactoring opportunities: ${report.analysis.refactoringOpportunities}`);
      console.log(`Quality issues: ${report.analysis.qualityIssues}`);
      console.log(`Generation suggestions: ${report.analysis.generationSuggestions}`);
      
      if (report.recommendations.highPriority.length > 0) {
        console.log('\n🔥 High Priority Refactoring:');
        report.recommendations.highPriority.slice(0, 3).forEach(rec => {
          console.log(`   • ${rec.description} (${rec.file})`);
        });
      }
      
      log(colors.cyan, '\n📄 Detailed report saved to .ai-assistant-report.json');
      break;

    case 'generate':
      const templateName = process.argv[3];
      if (!templateName) {
        console.log('Available templates:');
        Array.from(assistant.generationTemplates.keys()).forEach(name => {
          const template = assistant.generationTemplates.get(name);
          console.log(`   • ${name}: ${template.description}`);
        });
        break;
      }
      
      // In a real implementation, this would be interactive
      const sampleInputs = {
        hookName: 'UserData',
        apiEndpoint: 'userService.getUser(id)',
        returnType: 'UserData',
        parameters: 'userId: string',
      };
      
      const result = await assistant.generateInteractiveCode(templateName, sampleInputs);
      log(colors.green, `✅ Generated ${templateName} code`);
      log(colors.cyan, `📄 Saved to: ${result.outputPath}`);
      break;

    case 'refactor':
      const filePath = process.argv[3];
      const rules = process.argv.slice(4);
      
      if (!filePath) {
        console.log('Usage: node ai-code-assistant.js refactor <file-path> [rule1] [rule2] ...');
        console.log('Available rules:', Array.from(assistant.refactoringRules.keys()).join(', '));
        break;
      }
      
      const refactorResult = await assistant.performAutomaticRefactoring(filePath, rules);
      
      if (refactorResult.success) {
        log(colors.green, `✅ Applied ${refactorResult.appliedRefactoring.length} refactoring rules`);
        refactorResult.appliedRefactoring.forEach(rule => {
          log(colors.blue, `   • ${rule.description}`);
        });
        log(colors.cyan, `📄 Backup saved to: ${refactorResult.backupPath}`);
      } else {
        log(colors.yellow, `⚠️  ${refactorResult.message}`);
      }
      break;

    default:
      console.log('AI Code Assistant Commands:');
      console.log('  analyze    - Analyze codebase for improvements');
      console.log('  generate   - Generate code from templates');
      console.log('  refactor   - Apply automatic refactoring');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AICodeAssistant };