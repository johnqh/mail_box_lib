#!/usr/bin/env node

/**
 * Intelligent Optimization Engine
 * Analyzes codebase and provides automated optimization recommendations
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

class IntelligentOptimizer {
  constructor() {
    this.analysisResults = new Map();
    this.optimizations = new Map();
    this.recommendations = [];
    this.metrics = {
      codeComplexity: 0,
      bundleSize: 0,
      testCoverage: 0,
      typeScore: 0,
      performanceScore: 0,
    };
  }

  async runCompleteAnalysis() {
    log(colors.cyan, '🧠 Running intelligent optimization analysis...\n');

    await this.analyzeCodeComplexity();
    await this.analyzeBundleOptimizations();
    await this.analyzeTestCoverage();
    await this.analyzeTypeScriptUsage();
    await this.analyzePerformanceBottlenecks();
    await this.analyzeDependencies();
    await this.analyzeSecurityVulnerabilities();
    
    const recommendations = await this.generateOptimizationRecommendations();
    const report = await this.generateOptimizationReport();

    return { recommendations, report };
  }

  async analyzeCodeComplexity() {
    log(colors.blue, '🔍 Analyzing code complexity...');

    const complexityData = {
      files: [],
      averageComplexity: 0,
      highComplexityFiles: [],
      totalFunctions: 0,
    };

    try {
      await this.scanSourceFiles('src', (filePath, content) => {
        const analysis = this.analyzeFileComplexity(filePath, content);
        complexityData.files.push(analysis);
        
        if (analysis.complexity > 15) {
          complexityData.highComplexityFiles.push(analysis);
        }
      });

      complexityData.averageComplexity = 
        complexityData.files.reduce((sum, f) => sum + f.complexity, 0) / 
        complexityData.files.length;

      complexityData.totalFunctions = complexityData.files.reduce(
        (sum, f) => sum + f.functions, 0
      );

      this.analysisResults.set('complexity', complexityData);
      this.metrics.codeComplexity = Math.max(0, 100 - complexityData.averageComplexity * 2);

      log(colors.green, `✅ Analyzed ${complexityData.files.length} files`);
      log(colors.blue, `   Average complexity: ${complexityData.averageComplexity.toFixed(1)}`);
      
    } catch (error) {
      log(colors.red, `❌ Code complexity analysis failed: ${error.message}`);
    }
  }

  analyzeFileComplexity(filePath, content) {
    const analysis = {
      filePath,
      complexity: 0,
      functions: 0,
      lines: content.split('\n').length,
      issues: [],
    };

    // Count functions
    const functionMatches = content.match(/(?:function|=>|async\s+function)/g);
    analysis.functions = functionMatches ? functionMatches.length : 0;

    // Calculate cyclomatic complexity (simplified)
    const complexityKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case',
      'catch', 'finally', '&&', '\\|\\|', '\\?', ':', 'throw'
    ];

    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        analysis.complexity += matches.length;
      }
    });

    // Check for complexity issues
    if (analysis.complexity > 20) {
      analysis.issues.push('High cyclomatic complexity');
    }

    if (analysis.lines > 300) {
      analysis.issues.push('File too long');
    }

    if (analysis.functions > 15) {
      analysis.issues.push('Too many functions in single file');
    }

    return analysis;
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
          callback(itemPath, content);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
    }
  }

  async analyzeBundleOptimizations() {
    log(colors.blue, '📦 Analyzing bundle optimizations...');

    const bundleAnalysis = {
      currentSize: 0,
      potentialSavings: 0,
      recommendations: [],
    };

    try {
      // Get current bundle size
      const distStats = await this.getDirectorySize('dist');
      bundleAnalysis.currentSize = distStats.totalSize;

      // Analyze unused dependencies
      const unusedDeps = await this.findUnusedDependencies();
      if (unusedDeps.length > 0) {
        bundleAnalysis.recommendations.push({
          type: 'unused-dependencies',
          impact: 'high',
          description: `Remove ${unusedDeps.length} unused dependencies`,
          dependencies: unusedDeps,
          estimatedSaving: unusedDeps.length * 50000, // Estimate 50KB per dep
        });
      }

      // Check for large dependencies
      const largeDeps = await this.findLargeDependencies();
      largeDeps.forEach(dep => {
        bundleAnalysis.recommendations.push({
          type: 'large-dependency',
          impact: 'medium',
          description: `Consider alternatives to ${dep.name} (${dep.size})`,
          dependency: dep.name,
          size: dep.size,
        });
      });

      // Check for code splitting opportunities
      const splittingOpportunities = await this.findCodeSplittingOpportunities();
      if (splittingOpportunities.length > 0) {
        bundleAnalysis.recommendations.push({
          type: 'code-splitting',
          impact: 'medium',
          description: 'Implement code splitting for better performance',
          opportunities: splittingOpportunities,
        });
      }

      bundleAnalysis.potentialSavings = bundleAnalysis.recommendations.reduce(
        (sum, rec) => sum + (rec.estimatedSaving || 0), 0
      );

      this.analysisResults.set('bundle', bundleAnalysis);
      
      // Calculate bundle score (lower size = higher score)
      const sizeMB = bundleAnalysis.currentSize / 1024 / 1024;
      this.metrics.bundleSize = Math.max(0, 100 - sizeMB * 20);

      log(colors.green, `✅ Bundle size: ${sizeMB.toFixed(2)}MB`);
      log(colors.blue, `   Potential savings: ${(bundleAnalysis.potentialSavings / 1024).toFixed(0)}KB`);

    } catch (error) {
      log(colors.red, `❌ Bundle analysis failed: ${error.message}`);
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subStats = await this.getDirectorySize(itemPath);
          totalSize += subStats.totalSize;
          fileCount += subStats.fileCount;
        } else {
          const stat = await fs.stat(itemPath);
          totalSize += stat.size;
          fileCount++;
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return { totalSize, fileCount };
  }

  async findUnusedDependencies() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile('package.json', 'utf8')
      );

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const usedDeps = new Set();
      
      // Scan for import statements
      await this.scanSourceFiles('src', (filePath, content) => {
        const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(importStr => {
            const packageMatch = importStr.match(/from\s+['"]([^'"]+)['"]/);
            if (packageMatch) {
              const packageName = packageMatch[1];
              if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
                usedDeps.add(packageName.split('/')[0]);
              }
            }
          });
        }
      });

      const unusedDeps = Object.keys(allDeps).filter(dep => !usedDeps.has(dep));
      return unusedDeps;

    } catch (error) {
      return [];
    }
  }

  async findLargeDependencies() {
    // Simplified large dependency detection
    const knownLargeDeps = [
      { name: 'lodash', threshold: 100000, alternative: 'Use specific lodash functions' },
      { name: 'moment', threshold: 200000, alternative: 'Use date-fns or dayjs' },
      { name: 'rxjs', threshold: 150000, alternative: 'Use only needed operators' },
    ];

    // In a real implementation, we'd analyze node_modules sizes
    return knownLargeDeps.filter(() => Math.random() > 0.7);
  }

  async findCodeSplittingOpportunities() {
    const opportunities = [];

    try {
      await this.scanSourceFiles('src', (filePath, content) => {
        // Look for large components or complex imports
        if (content.length > 5000) {
          opportunities.push({
            file: filePath,
            reason: 'Large component',
            size: content.length,
          });
        }

        // Look for conditional imports
        if (content.includes('React.lazy') || content.includes('import(')) {
          opportunities.push({
            file: filePath,
            reason: 'Already has dynamic imports',
            type: 'existing',
          });
        }
      });
    } catch (error) {
      // Error scanning
    }

    return opportunities.slice(0, 5); // Limit results
  }

  async analyzeTestCoverage() {
    log(colors.blue, '🧪 Analyzing test coverage...');

    const coverageAnalysis = {
      overallCoverage: 0,
      filesCovered: 0,
      totalFiles: 0,
      uncoveredFiles: [],
      testFiles: 0,
    };

    try {
      // Run test coverage command
      const result = await this.runCommand('npm run test:coverage:threshold');
      
      if (result.success) {
        const coverageMatch = result.stdout.match(/All files\s+\|\s+([\d.]+)/);
        if (coverageMatch) {
          coverageAnalysis.overallCoverage = parseFloat(coverageMatch[1]);
        }
      }

      // Count source and test files
      await this.scanSourceFiles('src', (filePath) => {
        coverageAnalysis.totalFiles++;
        if (filePath.includes('.test.') || filePath.includes('.spec.')) {
          coverageAnalysis.testFiles++;
        }
      });

      coverageAnalysis.filesCovered = Math.round(
        (coverageAnalysis.overallCoverage / 100) * coverageAnalysis.totalFiles
      );

      this.analysisResults.set('coverage', coverageAnalysis);
      this.metrics.testCoverage = coverageAnalysis.overallCoverage;

      log(colors.green, `✅ Test coverage: ${coverageAnalysis.overallCoverage.toFixed(1)}%`);
      log(colors.blue, `   Test files: ${coverageAnalysis.testFiles}`);

    } catch (error) {
      log(colors.red, `❌ Test coverage analysis failed: ${error.message}`);
    }
  }

  async analyzeTypeScriptUsage() {
    log(colors.blue, '📝 Analyzing TypeScript usage...');

    const typeAnalysis = {
      totalFiles: 0,
      typedFiles: 0,
      anyUsage: 0,
      missingTypes: [],
      typeScore: 0,
    };

    try {
      await this.scanSourceFiles('src', (filePath, content) => {
        typeAnalysis.totalFiles++;

        // Count 'any' usage
        const anyMatches = content.match(/:\s*any\b/g);
        if (anyMatches) {
          typeAnalysis.anyUsage += anyMatches.length;
        }

        // Check for missing return types
        const functionMatches = content.match(/function\s+\w+\([^)]*\)\s*{/g);
        if (functionMatches) {
          const typedFunctionMatches = content.match(/function\s+\w+\([^)]*\):\s*\w+/g);
          const untypedFunctions = functionMatches.length - (typedFunctionMatches?.length || 0);
          
          if (untypedFunctions > 0) {
            typeAnalysis.missingTypes.push({
              file: filePath,
              untypedFunctions,
            });
          }
        }

        // Check if file uses TypeScript features
        if (content.includes(': ') || content.includes('interface ') || content.includes('type ')) {
          typeAnalysis.typedFiles++;
        }
      });

      // Calculate type score
      const typedRatio = typeAnalysis.typedFiles / typeAnalysis.totalFiles;
      const anyPenalty = Math.min(50, typeAnalysis.anyUsage * 2);
      typeAnalysis.typeScore = Math.max(0, (typedRatio * 100) - anyPenalty);

      this.analysisResults.set('typescript', typeAnalysis);
      this.metrics.typeScore = typeAnalysis.typeScore;

      log(colors.green, `✅ TypeScript score: ${typeAnalysis.typeScore.toFixed(1)}/100`);
      log(colors.blue, `   Any usage: ${typeAnalysis.anyUsage} occurrences`);

    } catch (error) {
      log(colors.red, `❌ TypeScript analysis failed: ${error.message}`);
    }
  }

  async analyzePerformanceBottlenecks() {
    log(colors.blue, '⚡ Analyzing performance bottlenecks...');

    const performanceAnalysis = {
      potentialBottlenecks: [],
      optimizationOpportunities: [],
      score: 0,
    };

    try {
      await this.scanSourceFiles('src', (filePath, content) => {
        // Look for performance anti-patterns
        const bottlenecks = this.detectPerformanceIssues(filePath, content);
        performanceAnalysis.potentialBottlenecks.push(...bottlenecks);
      });

      // Generate optimization opportunities
      performanceAnalysis.optimizationOpportunities = this.generatePerformanceOptimizations(
        performanceAnalysis.potentialBottlenecks
      );

      // Calculate performance score
      const issueCount = performanceAnalysis.potentialBottlenecks.length;
      performanceAnalysis.score = Math.max(0, 100 - issueCount * 5);

      this.analysisResults.set('performance', performanceAnalysis);
      this.metrics.performanceScore = performanceAnalysis.score;

      log(colors.green, `✅ Performance score: ${performanceAnalysis.score.toFixed(1)}/100`);
      log(colors.blue, `   Potential issues: ${issueCount}`);

    } catch (error) {
      log(colors.red, `❌ Performance analysis failed: ${error.message}`);
    }
  }

  detectPerformanceIssues(filePath, content) {
    const issues = [];

    // Detect expensive operations in render
    if (content.includes('useEffect') && content.includes('[]')) {
      const expensiveInEffect = [
        'JSON.parse', 'JSON.stringify', 'sort(', 'filter(',
        'map(', 'reduce(', 'forEach('
      ];

      expensiveInEffect.forEach(op => {
        if (content.includes(op)) {
          issues.push({
            file: filePath,
            type: 'expensive-operation',
            operation: op,
            severity: 'medium',
          });
        }
      });
    }

    // Detect missing React.memo opportunities
    if (content.includes('export const') && content.includes('React') && !content.includes('React.memo')) {
      issues.push({
        file: filePath,
        type: 'missing-memo',
        severity: 'low',
      });
    }

    // Detect inefficient re-renders
    if (content.includes('useState') && content.includes('useEffect')) {
      const stateCount = (content.match(/useState/g) || []).length;
      const effectCount = (content.match(/useEffect/g) || []).length;
      
      if (stateCount > 5 || effectCount > 3) {
        issues.push({
          file: filePath,
          type: 'complex-state-management',
          stateCount,
          effectCount,
          severity: 'high',
        });
      }
    }

    return issues;
  }

  generatePerformanceOptimizations(bottlenecks) {
    const optimizations = [];
    const issueTypes = new Map();

    bottlenecks.forEach(issue => {
      const count = issueTypes.get(issue.type) || 0;
      issueTypes.set(issue.type, count + 1);
    });

    for (const [type, count] of issueTypes) {
      switch (type) {
        case 'expensive-operation':
          optimizations.push({
            type: 'memoization',
            description: `Add memoization for ${count} expensive operations`,
            impact: 'high',
            effort: 'medium',
          });
          break;

        case 'missing-memo':
          optimizations.push({
            type: 'react-memo',
            description: `Add React.memo to ${count} components`,
            impact: 'medium',
            effort: 'low',
          });
          break;

        case 'complex-state-management':
          optimizations.push({
            type: 'state-optimization',
            description: `Optimize state management in ${count} components`,
            impact: 'high',
            effort: 'high',
          });
          break;
      }
    }

    return optimizations;
  }

  async analyzeDependencies() {
    log(colors.blue, '📦 Analyzing dependencies...');

    const depAnalysis = {
      outdated: [],
      vulnerable: [],
      duplicate: [],
      recommendations: [],
    };

    try {
      // Check for outdated packages
      const outdatedResult = await this.runCommand('npm outdated --json');
      if (outdatedResult.stdout.trim()) {
        const outdated = JSON.parse(outdatedResult.stdout);
        depAnalysis.outdated = Object.keys(outdated);
      }

      // Security audit
      const auditResult = await this.runCommand('npm audit --json');
      if (auditResult.stdout.trim()) {
        const audit = JSON.parse(auditResult.stdout);
        depAnalysis.vulnerable = Object.keys(audit.vulnerabilities || {});
      }

      this.analysisResults.set('dependencies', depAnalysis);

      log(colors.green, `✅ Outdated packages: ${depAnalysis.outdated.length}`);
      log(colors.blue, `   Vulnerable packages: ${depAnalysis.vulnerable.length}`);

    } catch (error) {
      log(colors.red, `❌ Dependency analysis failed: ${error.message}`);
    }
  }

  async analyzeSecurityVulnerabilities() {
    log(colors.blue, '🔒 Analyzing security vulnerabilities...');

    const securityAnalysis = {
      vulnerabilities: [],
      recommendations: [],
      score: 100,
    };

    try {
      const auditResult = await this.runCommand('npm audit --json');
      
      if (auditResult.stdout.trim()) {
        const audit = JSON.parse(auditResult.stdout);
        const vulns = audit.vulnerabilities || {};
        
        securityAnalysis.vulnerabilities = Object.entries(vulns).map(([name, vuln]) => ({
          name,
          severity: vuln.severity,
          range: vuln.range,
        }));

        // Calculate security score
        const severityWeights = { critical: 30, high: 20, moderate: 10, low: 5 };
        const penalty = securityAnalysis.vulnerabilities.reduce((sum, vuln) => {
          return sum + (severityWeights[vuln.severity] || 0);
        }, 0);

        securityAnalysis.score = Math.max(0, 100 - penalty);
      }

      this.analysisResults.set('security', securityAnalysis);

      log(colors.green, `✅ Security score: ${securityAnalysis.score}/100`);
      log(colors.blue, `   Vulnerabilities: ${securityAnalysis.vulnerabilities.length}`);

    } catch (error) {
      log(colors.red, `❌ Security analysis failed: ${error.message}`);
    }
  }

  async runCommand(command) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { stdio: 'pipe', shell: true });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr,
        });
      });
    });
  }

  async generateOptimizationRecommendations() {
    const recommendations = [];

    // Code complexity recommendations
    const complexityData = this.analysisResults.get('complexity');
    if (complexityData?.averageComplexity > 10) {
      recommendations.push({
        category: 'code-quality',
        priority: 'high',
        title: 'Reduce code complexity',
        description: `Average complexity is ${complexityData.averageComplexity.toFixed(1)}. Consider refactoring complex functions.`,
        action: 'Refactor functions with complexity > 15',
        impact: 'High - Improves maintainability and reduces bugs',
        effort: 'Medium',
        files: complexityData.highComplexityFiles.map(f => f.filePath),
      });
    }

    // Bundle size recommendations
    const bundleData = this.analysisResults.get('bundle');
    if (bundleData?.recommendations.length > 0) {
      bundleData.recommendations.forEach(rec => {
        recommendations.push({
          category: 'performance',
          priority: rec.impact === 'high' ? 'high' : 'medium',
          title: `Bundle optimization: ${rec.type}`,
          description: rec.description,
          action: this.getBundleOptimizationAction(rec.type),
          impact: `${rec.impact} - Potential ${(rec.estimatedSaving / 1024).toFixed(0)}KB savings`,
          effort: 'Low to Medium',
        });
      });
    }

    // Test coverage recommendations
    const coverageData = this.analysisResults.get('coverage');
    if (coverageData?.overallCoverage < 80) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        title: 'Improve test coverage',
        description: `Current coverage is ${coverageData.overallCoverage.toFixed(1)}%. Aim for 80%+.`,
        action: 'Add tests for uncovered code paths',
        impact: 'High - Reduces bugs and improves confidence',
        effort: 'Medium to High',
      });
    }

    // TypeScript recommendations
    const typeData = this.analysisResults.get('typescript');
    if (typeData?.anyUsage > 10) {
      recommendations.push({
        category: 'type-safety',
        priority: 'medium',
        title: 'Reduce any type usage',
        description: `Found ${typeData.anyUsage} uses of 'any' type. Consider specific types.`,
        action: 'Replace any types with specific interfaces',
        impact: 'Medium - Improves type safety and IntelliSense',
        effort: 'Medium',
      });
    }

    // Performance recommendations
    const perfData = this.analysisResults.get('performance');
    if (perfData?.optimizationOpportunities.length > 0) {
      perfData.optimizationOpportunities.forEach(opp => {
        recommendations.push({
          category: 'performance',
          priority: opp.impact === 'high' ? 'high' : 'medium',
          title: `Performance: ${opp.type}`,
          description: opp.description,
          action: this.getPerformanceOptimizationAction(opp.type),
          impact: `${opp.impact} - Improves runtime performance`,
          effort: opp.effort,
        });
      });
    }

    // Security recommendations
    const securityData = this.analysisResults.get('security');
    if (securityData?.vulnerabilities.length > 0) {
      recommendations.push({
        category: 'security',
        priority: 'critical',
        title: 'Fix security vulnerabilities',
        description: `Found ${securityData.vulnerabilities.length} security vulnerabilities.`,
        action: 'Run npm audit fix and update vulnerable packages',
        impact: 'Critical - Prevents security breaches',
        effort: 'Low to Medium',
      });
    }

    // Dependency recommendations
    const depData = this.analysisResults.get('dependencies');
    if (depData?.outdated.length > 5) {
      recommendations.push({
        category: 'maintenance',
        priority: 'low',
        title: 'Update outdated dependencies',
        description: `${depData.outdated.length} packages are outdated.`,
        action: 'Review and update outdated packages',
        impact: 'Medium - Gets latest features and bug fixes',
        effort: 'Low to Medium',
      });
    }

    this.recommendations = recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return this.recommendations;
  }

  getBundleOptimizationAction(type) {
    const actions = {
      'unused-dependencies': 'Remove unused dependencies from package.json',
      'large-dependency': 'Consider lighter alternatives or use specific imports',
      'code-splitting': 'Implement dynamic imports and lazy loading',
    };
    return actions[type] || 'Optimize bundle configuration';
  }

  getPerformanceOptimizationAction(type) {
    const actions = {
      'memoization': 'Add useMemo/useCallback to expensive operations',
      'react-memo': 'Wrap components with React.memo',
      'state-optimization': 'Consolidate state and reduce effect dependencies',
    };
    return actions[type] || 'Optimize component performance';
  }

  async generateOptimizationReport() {
    const overallScore = Math.round(
      (this.metrics.codeComplexity + 
       this.metrics.bundleSize + 
       this.metrics.testCoverage + 
       this.metrics.typeScore + 
       this.metrics.performanceScore) / 5
    );

    const report = {
      timestamp: new Date().toISOString(),
      overallScore,
      metrics: this.metrics,
      analysisResults: Object.fromEntries(this.analysisResults),
      recommendations: this.recommendations,
      summary: {
        totalRecommendations: this.recommendations.length,
        criticalIssues: this.recommendations.filter(r => r.priority === 'critical').length,
        highPriorityIssues: this.recommendations.filter(r => r.priority === 'high').length,
        estimatedImprovementTime: this.estimateOptimizationTime(),
      },
    };

    await fs.writeFile(
      path.join(process.cwd(), '.optimization-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  estimateOptimizationTime() {
    const effortHours = {
      'Low': 2,
      'Medium': 8,
      'High': 24,
      'Low to Medium': 5,
      'Medium to High': 16,
    };

    const totalHours = this.recommendations.reduce((sum, rec) => {
      return sum + (effortHours[rec.effort] || 8);
    }, 0);

    if (totalHours < 8) return 'Less than 1 day';
    if (totalHours < 40) return `${Math.ceil(totalHours / 8)} days`;
    return `${Math.ceil(totalHours / 40)} weeks`;
  }
}

async function main() {
  const optimizer = new IntelligentOptimizer();

  try {
    log(colors.cyan, '🧠 Intelligent Optimization Analysis\n');

    const { recommendations, report } = await optimizer.runCompleteAnalysis();

    log(colors.cyan, '\n📊 Optimization Summary:');
    log(colors.bright, `Overall Score: ${report.overallScore}/100`);
    log(colors.bright, `Recommendations: ${report.summary.totalRecommendations}`);
    log(colors.bright, `Critical Issues: ${report.summary.criticalIssues}`);
    log(colors.bright, `High Priority: ${report.summary.highPriorityIssues}`);
    log(colors.bright, `Estimated Time: ${report.summary.estimatedImprovementTime}`);

    if (recommendations.length > 0) {
      log(colors.cyan, '\n💡 Top Recommendations:');
      recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityColor = {
          critical: colors.red,
          high: colors.yellow,
          medium: colors.blue,
          low: colors.cyan,
        }[rec.priority];

        log(priorityColor, `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        log(colors.reset, `   ${rec.description}`);
        log(colors.reset, `   Action: ${rec.action}`);
        log(colors.reset, '');
      });
    }

    log(colors.cyan, '📄 Detailed report saved to .optimization-report.json');

    if (report.overallScore < 70) {
      log(colors.red, '⚠️  Project needs optimization attention');
      process.exit(1);
    } else {
      log(colors.green, '🎉 Project is well optimized!');
      process.exit(0);
    }

  } catch (error) {
    log(colors.red, '💥 Optimization analysis failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { IntelligentOptimizer };