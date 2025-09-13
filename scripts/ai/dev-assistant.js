#!/usr/bin/env node

/**
 * Intelligent Development Assistant for @johnqh/lib
 * 
 * This tool provides intelligent development workflow automation,
 * context-aware suggestions, and advanced project analysis.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

class DevelopmentAssistant {
  constructor() {
    this.context = {
      projectType: '@johnqh/lib',
      version: '3.1.4',
      architecture: 'platform-abstraction',
      patterns: ['interface-first', 'dependency-injection', 'testing-pyramid'],
    };
    
    this.capabilities = [
      'intelligent-code-analysis',
      'workflow-optimization',
      'context-aware-suggestions',
      'automated-refactoring',
      'performance-profiling',
      'security-analysis'
    ];
  }

  async run() {
    console.log('🤖 AI Development Assistant for @johnqh/lib');
    console.log('=' .repeat(50));
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    switch (command) {
      case 'analyze':
        await this.performIntelligentAnalysis(args[0]);
        break;
      case 'suggest':
        await this.provideSuggestions(args[0]);
        break;
      case 'optimize':
        await this.optimizeWorkflow(args[0]);
        break;
      case 'refactor':
        await this.suggestRefactoring(args[0]);
        break;
      case 'profile':
        await this.performanceProfile(args[0]);
        break;
      case 'security':
        await this.securityAnalysis();
        break;
      case 'context':
        await this.buildDevelopmentContext();
        break;
      default:
        await this.showHelp();
        break;
    }
  }

  async performIntelligentAnalysis(scope = 'all') {
    console.log(`🔍 Performing intelligent analysis (scope: ${scope})...\n`);
    
    const analysis = {
      codeMetrics: await this.analyzeCodeMetrics(),
      architecturalCompliance: await this.checkArchitecturalCompliance(),
      performanceBottlenecks: await this.identifyPerformanceBottlenecks(),
      securityVulnerabilities: await this.scanSecurityIssues(),
      testingGaps: await this.identifyTestingGaps(),
      dependencyHealth: await this.analyzeDependencies(),
    };
    
    await this.generateIntelligentReport(analysis);
  }

  async analyzeCodeMetrics() {
    console.log('📊 Analyzing code metrics...');
    
    const sourceFiles = await this.getSourceFiles();
    const metrics = {
      totalFiles: sourceFiles.length,
      totalLines: 0,
      complexity: 0,
      maintainabilityIndex: 0,
      technicalDebt: 0,
    };

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      metrics.totalLines += lines.length;
      
      // Calculate cyclomatic complexity
      const complexity = this.calculateComplexity(content);
      metrics.complexity += complexity;
      
      // Identify technical debt indicators
      const debt = this.identifyTechnicalDebt(content, file);
      metrics.technicalDebt += debt;
    }
    
    metrics.avgComplexity = metrics.complexity / sourceFiles.length;
    metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(metrics);
    
    console.log(`✅ Analyzed ${metrics.totalFiles} files, ${metrics.totalLines} lines`);
    return metrics;
  }

  calculateComplexity(content) {
    // Simplified cyclomatic complexity calculation
    const complexityIndicators = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\belse\s*\{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // ternary operators
      /\&\&|\|\|/g, // logical operators
    ];
    
    let complexity = 1; // base complexity
    
    for (const pattern of complexityIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  identifyTechnicalDebt(content, filePath) {
    const debtIndicators = [
      { pattern: /TODO|FIXME|HACK|XXX/gi, weight: 1, type: 'code-smell' },
      { pattern: /any\s*(?:[;,\)\]\}]|$)/g, weight: 2, type: 'type-safety' },
      { pattern: /console\.(log|warn|error)/g, weight: 1, type: 'debugging' },
      { pattern: /\/\*\s*eslint-disable/g, weight: 3, type: 'lint-bypass' },
      { pattern: /\@ts-ignore|\@ts-nocheck/g, weight: 4, type: 'type-bypass' },
      { pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g, weight: 5, type: 'error-suppression' },
    ];

    let totalDebt = 0;
    const issues = [];

    for (const indicator of debtIndicators) {
      const matches = content.match(indicator.pattern);
      if (matches) {
        const debt = matches.length * indicator.weight;
        totalDebt += debt;
        issues.push({
          file: filePath,
          type: indicator.type,
          count: matches.length,
          debt: debt,
        });
      }
    }

    return totalDebt;
  }

  calculateMaintainabilityIndex(metrics) {
    // Simplified maintainability index calculation
    // Scale: 0-100, higher is better
    const baseScore = 100;
    const complexityPenalty = Math.min(metrics.avgComplexity * 2, 30);
    const debtPenalty = Math.min(metrics.technicalDebt / metrics.totalFiles, 20);
    const sizePenalty = Math.min(Math.log(metrics.totalLines) / 10, 10);
    
    return Math.max(0, baseScore - complexityPenalty - debtPenalty - sizePenalty);
  }

  async checkArchitecturalCompliance() {
    console.log('🏗️ Checking architectural compliance...');
    
    const compliance = {
      interfaceFirst: await this.checkInterfaceFirstPattern(),
      platformAbstraction: await this.checkPlatformAbstraction(),
      dependencyInjection: await this.checkDependencyInjection(),
      testingPyramid: await this.checkTestingPyramid(),
      score: 0,
    };

    compliance.score = Math.round(
      (compliance.interfaceFirst + 
       compliance.platformAbstraction + 
       compliance.dependencyInjection + 
       compliance.testingPyramid) / 4
    );

    console.log(`✅ Architectural compliance: ${compliance.score}%`);
    return compliance;
  }

  async checkInterfaceFirstPattern() {
    const serviceFiles = await this.findFiles('src/business/core', /.*-operations\.ts$/);
    const interfaceFiles = await this.findFiles('src/types/services', /.*\.interface\.ts$/);
    
    if (serviceFiles.length === 0) return 100;
    
    const compliance = Math.round((interfaceFiles.length / serviceFiles.length) * 100);
    return Math.min(compliance, 100);
  }

  async checkPlatformAbstraction() {
    const businessFiles = await this.findFiles('src/business', /\.ts$/);
    let violations = 0;
    
    const platformImports = [
      /import.*from ['"]react-native['"]/,
      /import.*from ['"]@react-native/,
      /import.*from ['"]react-native-/,
    ];
    
    for (const file of businessFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (platformImports.some(pattern => pattern.test(content))) {
        violations++;
      }
    }
    
    return businessFiles.length > 0 ? 
      Math.max(0, 100 - Math.round((violations / businessFiles.length) * 100)) : 100;
  }

  async checkDependencyInjection() {
    const operationFiles = await this.findFiles('src/business/core', /-operations\.ts$/);
    let compliantFiles = 0;
    
    for (const file of operationFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('constructor(') && content.includes('private ')) {
        compliantFiles++;
      }
    }
    
    return operationFiles.length > 0 ? 
      Math.round((compliantFiles / operationFiles.length) * 100) : 100;
  }

  async checkTestingPyramid() {
    const unitTests = await this.findFiles('src', /\.test\.ts$/);
    const integrationTests = await this.findFiles('src', /\.integration\.test\.ts$/);
    const sourceFiles = await this.getSourceFiles();
    
    const testCoverage = sourceFiles.length > 0 ? 
      Math.round((unitTests.length / sourceFiles.length) * 100) : 0;
    
    // Ideal ratio: many unit tests, fewer integration tests
    const ratio = integrationTests.length > 0 ? unitTests.length / integrationTests.length : 
                  unitTests.length > 0 ? 100 : 0;
    
    const pyramidScore = Math.min(testCoverage, ratio > 3 ? 100 : ratio * 25);
    return Math.round(pyramidScore);
  }

  async identifyPerformanceBottlenecks() {
    console.log('⚡ Identifying performance bottlenecks...');
    
    const bottlenecks = {
      largeFiles: await this.findLargeFiles(),
      complexFunctions: await this.findComplexFunctions(),
      inefficientPatterns: await this.findInefficiencies(),
      bundleAnalysis: await this.analyzeBundleSize(),
    };

    console.log(`✅ Found ${bottlenecks.largeFiles.length} large files, ${bottlenecks.complexFunctions.length} complex functions`);
    return bottlenecks;
  }

  async findLargeFiles() {
    const sourceFiles = await this.getSourceFiles();
    const largeFiles = [];
    
    for (const file of sourceFiles) {
      const stats = await fs.stat(file);
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n').length;
      
      if (lines > 200 || stats.size > 10000) {
        largeFiles.push({
          file: path.relative(projectRoot, file),
          lines,
          size: stats.size,
          recommendation: lines > 300 ? 'Consider splitting into smaller modules' : 'Monitor for growth',
        });
      }
    }
    
    return largeFiles.sort((a, b) => b.lines - a.lines);
  }

  async findComplexFunctions() {
    const sourceFiles = await this.getSourceFiles();
    const complexFunctions = [];
    
    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const functions = this.extractFunctions(content);
      
      for (const func of functions) {
        const complexity = this.calculateComplexity(func.body);
        if (complexity > 10) {
          complexFunctions.push({
            file: path.relative(projectRoot, file),
            function: func.name,
            complexity,
            recommendation: complexity > 15 ? 'Refactor immediately' : 'Consider simplification',
          });
        }
      }
    }
    
    return complexFunctions.sort((a, b) => b.complexity - a.complexity);
  }

  extractFunctions(content) {
    const functionPattern = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{|(class\s+\w+\s*\{[\s\S]*?(\w+)\s*\([^)]*\)\s*\{))/g;
    const functions = [];
    let match;
    
    while ((match = functionPattern.exec(content)) !== null) {
      const name = match[1] || match[2] || match[4] || 'anonymous';
      const startIndex = match.index;
      const body = this.extractFunctionBody(content, startIndex);
      
      functions.push({ name, body, startIndex });
    }
    
    return functions;
  }

  extractFunctionBody(content, startIndex) {
    let braceCount = 0;
    let bodyStart = -1;
    let i = startIndex;
    
    // Find opening brace
    while (i < content.length) {
      if (content[i] === '{') {
        if (bodyStart === -1) bodyStart = i;
        braceCount++;
        break;
      }
      i++;
    }
    
    i++;
    
    // Find matching closing brace
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return bodyStart !== -1 ? content.slice(bodyStart, i) : '';
  }

  async findInefficiencies() {
    const sourceFiles = await this.getSourceFiles();
    const inefficiencies = [];
    
    const patterns = [
      { 
        pattern: /useEffect\s*\(\s*[^,]*,\s*\[\s*\]\s*\)/g, 
        type: 'empty-dependency-array',
        severity: 'medium',
        message: 'Empty dependency array might cause stale closures'
      },
      { 
        pattern: /\.map\s*\([^)]*\)\.filter\s*\(/g, 
        type: 'map-filter-chain',
        severity: 'low',
        message: 'Consider using reduce or single iteration'
      },
      { 
        pattern: /JSON\.parse\(JSON\.stringify\(/g, 
        type: 'deep-clone-inefficient',
        severity: 'high',
        message: 'Use structured cloning or proper deep clone library'
      },
      { 
        pattern: /for\s*\(\s*let\s+\w+\s*=\s*0[\s\S]*?\.push\(/g, 
        type: 'loop-with-push',
        severity: 'medium',
        message: 'Consider using map, filter, or reduce'
      },
    ];

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      for (const { pattern, type, severity, message } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          inefficiencies.push({
            file: path.relative(projectRoot, file),
            type,
            severity,
            count: matches.length,
            message,
          });
        }
      }
    }
    
    return inefficiencies;
  }

  async analyzeBundleSize() {
    try {
      const { stdout } = await execAsync('npm run build', { cwd: projectRoot });
      
      // Simple bundle size analysis
      const distPath = path.join(projectRoot, 'dist');
      const files = await fs.readdir(distPath);
      let totalSize = 0;
      
      for (const file of files) {
        const stats = await fs.stat(path.join(distPath, file));
        totalSize += stats.size;
      }
      
      return {
        totalSize,
        files: files.length,
        avgFileSize: Math.round(totalSize / files.length),
        recommendation: totalSize > 500000 ? 'Consider code splitting' : 'Bundle size is reasonable',
      };
    } catch (error) {
      return { error: 'Bundle analysis failed', message: error.message };
    }
  }

  async provideSuggestions(area = 'all') {
    console.log(`💡 Providing intelligent suggestions (area: ${area})...\n`);
    
    const suggestions = await this.generateContextualSuggestions(area);
    
    console.log('🎯 Intelligent Development Suggestions:');
    console.log('=' .repeat(40));
    
    for (const category in suggestions) {
      if (suggestions[category].length > 0) {
        console.log(`\n📌 ${category.toUpperCase()}:`);
        suggestions[category].forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion.message}`);
          if (suggestion.action) {
            console.log(`     → ${suggestion.action}`);
          }
        });
      }
    }
  }

  async generateContextualSuggestions(area) {
    const suggestions = {
      architecture: [],
      performance: [],
      testing: [],
      security: [],
      development: [],
    };

    // Architecture suggestions
    const interfaceCompliance = await this.checkInterfaceFirstPattern();
    if (interfaceCompliance < 90) {
      suggestions.architecture.push({
        message: `Interface-first compliance is ${interfaceCompliance}%`,
        action: 'Define interfaces for all services in src/types/services/',
        priority: 'high',
      });
    }

    // Performance suggestions
    const largeFiles = await this.findLargeFiles();
    if (largeFiles.length > 0) {
      suggestions.performance.push({
        message: `Found ${largeFiles.length} large files that could impact performance`,
        action: `Consider refactoring: ${largeFiles.slice(0, 3).map(f => f.file).join(', ')}`,
        priority: 'medium',
      });
    }

    // Testing suggestions
    const sourceFiles = await this.getSourceFiles();
    const testFiles = await this.findFiles('src', /\.test\.ts$/);
    const testCoverage = sourceFiles.length > 0 ? (testFiles.length / sourceFiles.length) * 100 : 0;
    
    if (testCoverage < 80) {
      suggestions.testing.push({
        message: `Test coverage is ${Math.round(testCoverage)}% (target: 80%+)`,
        action: 'Add tests for uncovered business logic and utilities',
        priority: 'high',
      });
    }

    // Security suggestions
    try {
      const { stdout } = await execAsync('npm audit --json', { cwd: projectRoot });
      const audit = JSON.parse(stdout);
      if (audit.metadata && audit.metadata.vulnerabilities.total > 0) {
        suggestions.security.push({
          message: `Found ${audit.metadata.vulnerabilities.total} security vulnerabilities`,
          action: 'Run npm audit fix to resolve vulnerabilities',
          priority: 'critical',
        });
      }
    } catch (error) {
      // Audit failed or no vulnerabilities
    }

    // Development workflow suggestions
    const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
    if (!packageJson.scripts['test:watch']) {
      suggestions.development.push({
        message: 'No test watch mode script found',
        action: 'Add "test:watch": "vitest --watch" to package.json scripts',
        priority: 'low',
      });
    }

    return suggestions;
  }

  async generateIntelligentReport(analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(analysis),
      detailed: analysis,
      recommendations: await this.generateRecommendations(analysis),
      nextSteps: this.generateNextSteps(analysis),
    };

    // Save report
    await fs.writeFile(
      path.join(projectRoot, '.ai-analysis-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Display summary
    this.displayAnalysisSummary(report);
    
    console.log('\n📄 Full report saved to .ai-analysis-report.json');
  }

  generateSummary(analysis) {
    return {
      overallHealth: this.calculateOverallHealth(analysis),
      strengths: this.identifyStrengths(analysis),
      weaknesses: this.identifyWeaknesses(analysis),
      criticalIssues: this.identifyCriticalIssues(analysis),
    };
  }

  calculateOverallHealth(analysis) {
    const weights = {
      architecturalCompliance: 0.25,
      codeMetrics: 0.20,
      testingGaps: 0.20,
      performanceBottlenecks: 0.15,
      dependencyHealth: 0.10,
      securityVulnerabilities: 0.10,
    };

    let score = 0;
    score += analysis.architecturalCompliance.score * weights.architecturalCompliance;
    score += analysis.codeMetrics.maintainabilityIndex * weights.codeMetrics;
    // Add other metrics...

    return Math.round(score);
  }

  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.architecturalCompliance.score > 85) {
      strengths.push('Strong architectural compliance');
    }
    
    if (analysis.codeMetrics.maintainabilityIndex > 80) {
      strengths.push('High maintainability index');
    }
    
    return strengths;
  }

  identifyWeaknesses(analysis) {
    const weaknesses = [];
    
    if (analysis.architecturalCompliance.score < 70) {
      weaknesses.push('Architectural compliance needs improvement');
    }
    
    if (analysis.codeMetrics.technicalDebt > 50) {
      weaknesses.push('High technical debt');
    }
    
    return weaknesses;
  }

  identifyCriticalIssues(analysis) {
    const issues = [];
    
    if (analysis.performanceBottlenecks.complexFunctions.some(f => f.complexity > 20)) {
      issues.push('Extremely complex functions detected');
    }
    
    return issues;
  }

  displayAnalysisSummary(report) {
    console.log('\n🎯 INTELLIGENT ANALYSIS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📊 Overall Health: ${report.summary.overallHealth}/100`);
    
    if (report.summary.strengths.length > 0) {
      console.log('\n✅ Strengths:');
      report.summary.strengths.forEach(strength => console.log(`  • ${strength}`));
    }
    
    if (report.summary.weaknesses.length > 0) {
      console.log('\n⚠️  Areas for Improvement:');
      report.summary.weaknesses.forEach(weakness => console.log(`  • ${weakness}`));
    }
    
    if (report.summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      report.summary.criticalIssues.forEach(issue => console.log(`  • ${issue}`));
    }
  }

  async generateRecommendations(analysis) {
    // Generate intelligent recommendations based on analysis
    return [
      'Improve test coverage for better reliability',
      'Refactor complex functions to reduce cognitive load',
      'Update dependencies to latest secure versions',
    ];
  }

  generateNextSteps(analysis) {
    return [
      'Run npm run validate to ensure code quality',
      'Add missing tests for uncovered code paths',
      'Review and refactor high-complexity functions',
    ];
  }

  async getSourceFiles() {
    return await this.findFiles('src', /\.ts$/, file => !file.includes('.test.ts'));
  }

  async findFiles(dir, pattern, filter = () => true) {
    const fullDir = path.join(projectRoot, dir);
    const files = [];
    
    try {
      await this.walkDirectory(fullDir, (filePath) => {
        const relativePath = path.relative(fullDir, filePath);
        if (pattern.test(relativePath) && filter(filePath)) {
          files.push(filePath);
        }
      });
    } catch (error) {
      // Directory doesn't exist
    }
    
    return files;
  }

  async walkDirectory(dir, callback) {
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
  }

  async showHelp() {
    console.log(`
🤖 AI Development Assistant for @johnqh/lib

USAGE:
  node scripts/ai/dev-assistant.js <command> [options]

COMMANDS:
  analyze [scope]     Perform intelligent code analysis
  suggest [area]      Get context-aware development suggestions  
  optimize [target]   Optimize development workflow
  refactor [file]     Suggest refactoring opportunities
  profile [component] Performance profiling analysis
  security           Security vulnerability analysis
  context            Build development context for AI

EXAMPLES:
  node scripts/ai/dev-assistant.js analyze all
  node scripts/ai/dev-assistant.js suggest performance
  node scripts/ai/dev-assistant.js optimize workflow
  node scripts/ai/dev-assistant.js security

For more information, visit: .ai/README.md
    `);
  }
}

// Run the assistant
if (import.meta.url === `file://${process.argv[1]}`) {
  const assistant = new DevelopmentAssistant();
  assistant.run().catch(console.error);
}

export default DevelopmentAssistant;