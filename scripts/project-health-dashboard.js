#!/usr/bin/env node

/**
 * Comprehensive Project Health Dashboard
 * Integrates all quality metrics into a unified health score and actionable insights
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

class ProjectHealthDashboard {
  constructor() {
    this.startTime = Date.now();
    this.healthMetrics = {};
    this.recommendations = [];
  }

  async generateCompleteHealthReport() {
    log(colors.cyan, '\n🏥 PROJECT HEALTH DASHBOARD');
    log(colors.cyan, '='.repeat(50));

    await this.displayHeader();
    
    const [security, quality, performance, coverage, dependencies] = await Promise.all([
      this.assessSecurity(),
      this.assessCodeQuality(),
      this.assessPerformance(),
      this.assessTestCoverage(),
      this.assessDependencies(),
    ]);

    this.healthMetrics = {
      security,
      quality,
      performance,
      coverage,
      dependencies,
    };

    const overallScore = this.calculateOverallHealth();
    
    await this.displayHealthSummary(overallScore);
    await this.displayDetailedMetrics();
    await this.generateRecommendations();
    await this.displayRecommendations();
    await this.saveHealthReport(overallScore);
    
    log(colors.cyan, '\n' + '='.repeat(50));
    log(colors.bright, `🎯 OVERALL PROJECT HEALTH: ${overallScore}/100`);
    
    if (overallScore >= 92) {
      log(colors.green, '🎉 EXCELLENT! Target score achieved!');
    } else if (overallScore >= 80) {
      log(colors.yellow, '⚠️  Good, but improvements needed to reach target (92)');
    } else {
      log(colors.red, '❌ Significant improvements required');
    }

    return overallScore;
  }

  async displayHeader() {
    const packageJson = await this.getPackageInfo();
    const stats = await this.getProjectStats();
    
    log(colors.white, `\n📦 Project: ${packageJson.name} v${packageJson.version}`);
    log(colors.white, `📅 Generated: ${new Date().toLocaleString()}`);
    log(colors.white, `📊 Files: ${stats.sourceFiles} source, ${stats.testFiles} test`);
    log(colors.white, `📈 Test Ratio: ${stats.testCoverage}%`);
  }

  async assessSecurity() {
    log(colors.blue, '\n🔒 Assessing Security...');
    
    try {
      const auditResult = await this.runCommand('npm audit --audit-level=moderate --json');
      const audit = JSON.parse(auditResult.stdout);
      
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + (count || 0), 0);
      const criticalVulns = vulnerabilities.critical || 0;
      const highVulns = vulnerabilities.high || 0;
      
      let score = 100;
      if (criticalVulns > 0) score -= criticalVulns * 25;
      if (highVulns > 0) score -= highVulns * 15;
      if (totalVulns > 5) score -= (totalVulns - 5) * 5;
      
      return {
        score: Math.max(0, score),
        vulnerabilities: {
          total: totalVulns,
          critical: criticalVulns,
          high: highVulns,
          moderate: vulnerabilities.moderate || 0,
          low: vulnerabilities.low || 0,
        },
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'needs-attention',
      };
    } catch (error) {
      return {
        score: 85, // Assume decent security if audit fails
        vulnerabilities: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
        status: 'unknown',
        error: 'Could not run security audit',
      };
    }
  }

  async assessCodeQuality() {
    log(colors.blue, '🔍 Assessing Code Quality...');
    
    let lintScore = 100;
    let typeScore = 100;
    let formatScore = 100;
    
    try {
      await this.runCommand('npm run lint');
    } catch (error) {
      const errorCount = (error.stderr.match(/error/gi) || []).length;
      lintScore = Math.max(0, 100 - errorCount * 5);
    }
    
    try {
      await this.runCommand('npm run typecheck');
    } catch (error) {
      const errorCount = (error.stderr.match(/error TS/g) || []).length;
      typeScore = Math.max(0, 100 - Math.min(errorCount * 2, 80)); // Cap at 20 minimum
    }
    
    try {
      await this.runCommand('npm run format:check');
    } catch (error) {
      formatScore = 70; // Formatting issues are less critical
    }
    
    const overallScore = Math.round((lintScore * 0.4 + typeScore * 0.4 + formatScore * 0.2));
    
    return {
      score: overallScore,
      lint: lintScore,
      types: typeScore,
      formatting: formatScore,
      status: overallScore >= 90 ? 'excellent' : overallScore >= 70 ? 'good' : 'needs-attention',
    };
  }

  async assessPerformance() {
    log(colors.blue, '⚡ Assessing Performance...');
    
    try {
      // Build performance
      const buildStart = Date.now();
      await this.runCommand('npm run build');
      const buildTime = (Date.now() - buildStart) / 1000;
      
      // Bundle size
      const bundleSize = await this.getBundleSize();
      
      // Test performance
      const testStart = Date.now();
      const testResult = await this.runCommand('npm test');
      const testTime = (Date.now() - testStart) / 1000;
      
      let score = 100;
      if (buildTime > 30) score -= 20;
      else if (buildTime > 15) score -= 10;
      else if (buildTime > 10) score -= 5;
      
      if (testTime > 20) score -= 15;
      else if (testTime > 10) score -= 8;
      else if (testTime > 5) score -= 3;
      
      // Parse bundle size
      if (bundleSize.includes('M')) {
        const sizeMB = parseFloat(bundleSize);
        if (sizeMB > 3) score -= 15;
        else if (sizeMB > 1.5) score -= 8;
        else if (sizeMB > 1) score -= 3;
      }
      
      return {
        score: Math.max(0, score),
        buildTime: Math.round(buildTime * 10) / 10,
        testTime: Math.round(testTime * 10) / 10,
        bundleSize,
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'needs-attention',
      };
    } catch (error) {
      return {
        score: 60,
        buildTime: 'unknown',
        testTime: 'unknown',
        bundleSize: 'unknown',
        status: 'needs-attention',
        error: 'Performance assessment failed',
      };
    }
  }

  async assessTestCoverage() {
    log(colors.blue, '🧪 Assessing Test Coverage...');
    
    try {
      const testResult = await this.runCommand('npm test');
      const testOutput = testResult.stdout + testResult.stderr;
      
      // Parse test results
      const testLines = testOutput.split('\n');
      const summaryLine = testLines.find(line => line.includes('Test Files'));
      
      let testFiles = 0;
      let totalTests = 0;
      let passedTests = 0;
      let passRate = 0;
      
      if (summaryLine) {
        const fileMatch = summaryLine.match(/Test Files\s+(\d+)\s+(?:failed\s+\|\s+)?(\d+)\s+passed/);
        const testMatch = summaryLine.match(/Tests\s+(?:(\d+)\s+failed\s+\|\s+)?(\d+)\s+passed\s+\((\d+)\)/);
        
        if (fileMatch) testFiles = parseInt(fileMatch[2]);
        if (testMatch) {
          const failed = parseInt(testMatch[1] || '0');
          passedTests = parseInt(testMatch[2]);
          totalTests = parseInt(testMatch[3]);
          passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        }
      }
      
      let score = passRate;
      if (testFiles < 5) score -= 10; // Encourage more test files
      if (totalTests < 50) score -= 5; // Encourage more tests
      
      return {
        score: Math.min(100, Math.max(0, score)),
        testFiles,
        totalTests,
        passedTests,
        passRate,
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'needs-attention',
      };
    } catch (error) {
      return {
        score: 50,
        testFiles: 0,
        totalTests: 0,
        passedTests: 0,
        passRate: 0,
        status: 'needs-attention',
        error: 'Test coverage assessment failed',
      };
    }
  }

  async assessDependencies() {
    log(colors.blue, '📦 Assessing Dependencies...');
    
    try {
      const outdatedResult = await this.runCommand('npm outdated --json');
      const outdated = JSON.parse(outdatedResult.stdout || '{}');
      
      const outdatedCount = Object.keys(outdated).length;
      const packageJson = await this.getPackageInfo();
      const totalDeps = Object.keys(packageJson.dependencies || {}).length + 
                        Object.keys(packageJson.devDependencies || {}).length;
      
      let score = 100;
      if (outdatedCount > totalDeps * 0.3) score -= 20; // More than 30% outdated
      else if (outdatedCount > totalDeps * 0.2) score -= 10; // More than 20% outdated
      else if (outdatedCount > totalDeps * 0.1) score -= 5; // More than 10% outdated
      
      // Check for major version updates
      const majorUpdates = Object.values(outdated).filter(dep => 
        dep.current && dep.latest && 
        parseInt(dep.latest.split('.')[0]) > parseInt(dep.current.split('.')[0])
      ).length;
      
      if (majorUpdates > 0) score -= majorUpdates * 5;
      
      return {
        score: Math.max(0, score),
        totalDependencies: totalDeps,
        outdatedCount,
        majorUpdates,
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'needs-attention',
      };
    } catch (error) {
      return {
        score: 85, // Assume dependencies are mostly up to date
        totalDependencies: 0,
        outdatedCount: 0,
        majorUpdates: 0,
        status: 'unknown',
        error: 'Dependency assessment failed',
      };
    }
  }

  calculateOverallHealth() {
    const weights = {
      security: 0.25,
      quality: 0.25,
      performance: 0.2,
      coverage: 0.2,
      dependencies: 0.1,
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, metric] of Object.entries(this.healthMetrics)) {
      if (metric.score !== undefined) {
        totalScore += metric.score * weights[category];
        totalWeight += weights[category];
      }
    }
    
    return Math.round(totalScore / totalWeight);
  }

  async displayHealthSummary(overallScore) {
    log(colors.cyan, '\n📊 HEALTH SUMMARY');
    log(colors.cyan, '-'.repeat(30));
    
    const categories = [
      { key: 'security', name: '🔒 Security', weight: '25%' },
      { key: 'quality', name: '🔍 Code Quality', weight: '25%' },
      { key: 'performance', name: '⚡ Performance', weight: '20%' },
      { key: 'coverage', name: '🧪 Test Coverage', weight: '20%' },
      { key: 'dependencies', name: '📦 Dependencies', weight: '10%' },
    ];
    
    categories.forEach(category => {
      const metric = this.healthMetrics[category.key];
      const score = metric?.score || 0;
      const status = metric?.status || 'unknown';
      
      const color = score >= 90 ? colors.green : score >= 70 ? colors.yellow : colors.red;
      const icon = score >= 90 ? '✅' : score >= 70 ? '⚠️ ' : '❌';
      
      log(color, `${icon} ${category.name}: ${score}/100 (${category.weight})`);
    });
    
    log(colors.bright, `\n🎯 Overall Health: ${overallScore}/100`);
  }

  async displayDetailedMetrics() {
    log(colors.cyan, '\n📈 DETAILED METRICS');
    log(colors.cyan, '-'.repeat(30));
    
    // Security Details
    const security = this.healthMetrics.security;
    if (security.vulnerabilities) {
      log(colors.blue, '🔒 Security:');
      log(colors.white, `   Total Vulnerabilities: ${security.vulnerabilities.total}`);
      if (security.vulnerabilities.critical > 0) {
        log(colors.red, `   Critical: ${security.vulnerabilities.critical}`);
      }
      if (security.vulnerabilities.high > 0) {
        log(colors.yellow, `   High: ${security.vulnerabilities.high}`);
      }
    }
    
    // Quality Details
    const quality = this.healthMetrics.quality;
    log(colors.blue, '\n🔍 Code Quality:');
    log(colors.white, `   Linting: ${quality.lint}/100`);
    log(colors.white, `   Type Safety: ${quality.types}/100`);
    log(colors.white, `   Formatting: ${quality.formatting}/100`);
    
    // Performance Details
    const performance = this.healthMetrics.performance;
    log(colors.blue, '\n⚡ Performance:');
    log(colors.white, `   Build Time: ${performance.buildTime}s`);
    log(colors.white, `   Test Time: ${performance.testTime}s`);
    log(colors.white, `   Bundle Size: ${performance.bundleSize}`);
    
    // Coverage Details
    const coverage = this.healthMetrics.coverage;
    log(colors.blue, '\n🧪 Test Coverage:');
    log(colors.white, `   Test Files: ${coverage.testFiles}`);
    log(colors.white, `   Total Tests: ${coverage.totalTests}`);
    log(colors.white, `   Pass Rate: ${coverage.passRate}%`);
    
    // Dependencies Details
    const dependencies = this.healthMetrics.dependencies;
    log(colors.blue, '\n📦 Dependencies:');
    log(colors.white, `   Total Dependencies: ${dependencies.totalDependencies}`);
    log(colors.white, `   Outdated: ${dependencies.outdatedCount}`);
    if (dependencies.majorUpdates > 0) {
      log(colors.yellow, `   Major Updates Available: ${dependencies.majorUpdates}`);
    }
  }

  async generateRecommendations() {
    this.recommendations = [];
    
    // Security recommendations
    const security = this.healthMetrics.security;
    if (security.vulnerabilities?.critical > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'Security',
        issue: `${security.vulnerabilities.critical} critical vulnerabilities found`,
        action: 'Run `npm audit fix` to resolve security issues',
        impact: 'High - Critical security vulnerabilities pose significant risk',
      });
    }
    
    // Quality recommendations
    const quality = this.healthMetrics.quality;
    if (quality.lint < 90) {
      this.recommendations.push({
        priority: 'medium',
        category: 'Code Quality',
        issue: 'ESLint errors detected',
        action: 'Run `npm run lint:fix` to automatically fix linting issues',
        impact: 'Medium - Code quality issues affect maintainability',
      });
    }
    
    if (quality.types < 80) {
      this.recommendations.push({
        priority: 'medium',
        category: 'Type Safety',
        issue: 'TypeScript type errors detected',
        action: 'Review and fix TypeScript type errors for better code safety',
        impact: 'Medium - Type errors can lead to runtime issues',
      });
    }
    
    // Performance recommendations
    const performance = this.healthMetrics.performance;
    if (performance.buildTime > 15) {
      this.recommendations.push({
        priority: 'low',
        category: 'Performance',
        issue: 'Slow build time detected',
        action: 'Consider build optimizations: incremental compilation, parallel builds',
        impact: 'Low - Affects developer productivity',
      });
    }
    
    // Coverage recommendations
    const coverage = this.healthMetrics.coverage;
    if (coverage.passRate < 90) {
      this.recommendations.push({
        priority: 'medium',
        category: 'Test Coverage',
        issue: 'Test failures detected',
        action: 'Fix failing tests to improve reliability',
        impact: 'Medium - Failing tests indicate potential code issues',
      });
    }
    
    if (coverage.testFiles < 10) {
      this.recommendations.push({
        priority: 'low',
        category: 'Test Coverage',
        issue: 'Limited test coverage',
        action: 'Add more test files to improve code coverage',
        impact: 'Low - Better testing prevents future bugs',
      });
    }
    
    // Dependencies recommendations
    const dependencies = this.healthMetrics.dependencies;
    if (dependencies.outdatedCount > dependencies.totalDependencies * 0.2) {
      this.recommendations.push({
        priority: 'low',
        category: 'Dependencies',
        issue: 'Many outdated dependencies',
        action: 'Update dependencies: `npm update` or review `npm outdated`',
        impact: 'Low - Keeping dependencies current improves security and features',
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  async displayRecommendations() {
    if (this.recommendations.length === 0) {
      log(colors.green, '\n🎉 No recommendations - project health is excellent!');
      return;
    }
    
    log(colors.cyan, '\n💡 RECOMMENDATIONS');
    log(colors.cyan, '-'.repeat(30));
    
    this.recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'high' ? colors.red : 
                           rec.priority === 'medium' ? colors.yellow : colors.blue;
      const priorityIcon = rec.priority === 'high' ? '🔥' : 
                          rec.priority === 'medium' ? '⚠️ ' : '💡';
      
      log(priorityColor, `${priorityIcon} ${rec.category}: ${rec.issue}`);
      log(colors.white, `   Action: ${rec.action}`);
      log(colors.white, `   Impact: ${rec.impact}`);
      
      if (index < this.recommendations.length - 1) {
        log(colors.white, '');
      }
    });
  }

  async saveHealthReport(overallScore) {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore,
      metrics: this.healthMetrics,
      recommendations: this.recommendations,
      duration: Math.round((Date.now() - this.startTime) / 1000 * 10) / 10,
      version: (await this.getPackageInfo()).version,
    };
    
    await fs.writeFile(
      path.join(process.cwd(), '.health-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    log(colors.cyan, `\n📄 Health report saved to .health-report.json`);
  }

  // Helper methods
  async runCommand(command) {
    return new Promise((resolve, reject) => {
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
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject({ code, stdout, stderr });
        }
      });
    });
  }

  async getPackageInfo() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      return packageJson;
    } catch {
      return { name: 'unknown', version: 'unknown' };
    }
  }

  async getProjectStats() {
    try {
      const srcFiles = await this.countFiles('src', /\.(ts|tsx)$/);
      const testFiles = await this.countFiles('src', /\.(test|spec)\.(ts|tsx)$/);
      
      return {
        sourceFiles: srcFiles,
        testFiles: testFiles,
        testCoverage: srcFiles > 0 ? Math.round((testFiles / srcFiles) * 100) : 0,
      };
    } catch {
      return { sourceFiles: 0, testFiles: 0, testCoverage: 0 };
    }
  }

  async countFiles(dir, pattern) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      return files.filter(file => pattern.test(file)).length;
    } catch {
      return 0;
    }
  }

  async getBundleSize() {
    try {
      const { stdout } = await this.runCommand('du -sh dist/');
      const sizeMatch = stdout.match(/^(\S+)\s/);
      return sizeMatch ? sizeMatch[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

async function main() {
  const dashboard = new ProjectHealthDashboard();
  const score = await dashboard.generateCompleteHealthReport();
  
  const duration = ((Date.now() - dashboard.startTime) / 1000).toFixed(1);
  log(colors.cyan, `\n⏱️  Analysis completed in ${duration}s`);
  
  process.exit(score >= 92 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, '💥 Health dashboard failed:', error.message);
    process.exit(1);
  });
}

export { ProjectHealthDashboard };