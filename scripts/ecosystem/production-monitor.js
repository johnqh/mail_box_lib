#!/usr/bin/env node

/**
 * Production Monitoring Dashboard
 * Real-time monitoring and analytics for the 0xmail.box ecosystem
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
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset}`, color, ...args, colors.reset);
}

class ProductionMonitor {
  constructor() {
    this.metrics = {
      performance: new Map(),
      errors: new Map(),
      usage: new Map(),
      health: new Map(),
    };
    this.alerts = [];
    this.isMonitoring = false;
  }

  async collectPerformanceMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      bundle: await this.analyzeBundleSize(),
      memory: process.memoryUsage(),
      dependencies: await this.analyzeDependencies(),
      buildTime: await this.measureBuildTime(),
    };

    this.metrics.performance.set(Date.now(), metrics);
    return metrics;
  }

  async analyzeBundleSize() {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      const stats = await this.getDirectorySize(distPath);
      
      return {
        totalSize: stats.totalSize,
        fileCount: stats.fileCount,
        breakdown: await this.getBundleBreakdown(),
      };
    } catch (error) {
      return { error: error.message };
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
      // Directory doesn't exist or is inaccessible
    }

    return { totalSize, fileCount };
  }

  async getBundleBreakdown() {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      const files = await fs.readdir(distPath);
      const breakdown = {};

      for (const file of files) {
        const filePath = path.join(distPath, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          breakdown[file] = {
            size: stat.size,
            sizeKB: Math.round(stat.size / 1024),
          };
        }
      }

      return breakdown;
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeDependencies() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
      );

      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});

      return {
        production: deps.length,
        development: devDeps.length,
        total: deps.length + devDeps.length,
        outdated: await this.checkOutdatedPackages(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkOutdatedPackages() {
    return new Promise((resolve) => {
      const child = spawn('npm', ['outdated', '--json'], { 
        stdio: 'pipe',
        shell: true 
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        try {
          const outdated = output.trim() ? JSON.parse(output) : {};
          resolve({
            count: Object.keys(outdated).length,
            packages: Object.keys(outdated),
          });
        } catch {
          resolve({ count: 0, packages: [] });
        }
      });

      child.on('error', () => {
        resolve({ count: 0, packages: [] });
      });
    });
  }

  async measureBuildTime() {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true,
      });

      child.on('close', (code) => {
        const endTime = Date.now();
        resolve({
          duration: endTime - startTime,
          success: code === 0,
        });
      });

      child.on('error', () => {
        resolve({
          duration: Date.now() - startTime,
          success: false,
        });
      });
    });
  }

  async collectHealthMetrics() {
    const health = {
      timestamp: new Date().toISOString(),
      typeScript: await this.checkTypeScriptHealth(),
      linting: await this.checkLintingHealth(),
      tests: await this.checkTestHealth(),
      security: await this.checkSecurityHealth(),
    };

    this.metrics.health.set(Date.now(), health);
    return health;
  }

  async runCommand(command) {
    return new Promise((resolve) => {
      const child = spawn(command, {
        stdio: 'pipe',
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
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

  async checkTypeScriptHealth() {
    const result = await this.runCommand('npm run typecheck');
    return {
      success: result.success,
      errors: result.success ? 0 : this.extractErrorCount(result.stderr),
    };
  }

  async checkLintingHealth() {
    const result = await this.runCommand('npm run lint');
    return {
      success: result.success,
      warnings: this.extractWarningCount(result.stdout),
      errors: this.extractErrorCount(result.stderr),
    };
  }

  async checkTestHealth() {
    const result = await this.runCommand('npm test');
    return {
      success: result.success,
      coverage: await this.extractTestCoverage(result.stdout),
    };
  }

  async checkSecurityHealth() {
    const auditResult = await this.runCommand('npm audit --json');
    
    try {
      const audit = JSON.parse(auditResult.stdout);
      return {
        vulnerabilities: audit.metadata?.vulnerabilities || {},
        totalVulnerabilities: audit.metadata?.totalVulnerabilities || 0,
      };
    } catch {
      return {
        vulnerabilities: {},
        totalVulnerabilities: 0,
      };
    }
  }

  extractErrorCount(output) {
    const matches = output.match(/(\d+)\s+error[s]?/g);
    return matches ? matches.length : 0;
  }

  extractWarningCount(output) {
    const matches = output.match(/(\d+)\s+warning[s]?/g);
    return matches ? matches.length : 0;
  }

  async extractTestCoverage(output) {
    try {
      // Look for coverage patterns in test output
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
      return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    } catch {
      return 0;
    }
  }

  analyzeMetrics() {
    const analysis = {
      timestamp: new Date().toISOString(),
      performance: this.analyzePerformanceMetrics(),
      health: this.analyzeHealthMetrics(),
      trends: this.analyzeTrends(),
      alerts: this.generateAlerts(),
    };

    return analysis;
  }

  analyzePerformanceMetrics() {
    const recent = Array.from(this.metrics.performance.values()).slice(-10);
    
    if (recent.length === 0) return {};

    const latest = recent[recent.length - 1];
    const bundleSize = latest.bundle?.totalSize || 0;
    const buildTime = latest.buildTime?.duration || 0;

    return {
      bundleSize: {
        current: bundleSize,
        sizeKB: Math.round(bundleSize / 1024),
        sizeMB: Math.round(bundleSize / 1024 / 1024 * 100) / 100,
      },
      buildTime: {
        current: buildTime,
        seconds: Math.round(buildTime / 1000),
      },
      dependencies: latest.dependencies,
    };
  }

  analyzeHealthMetrics() {
    const recent = Array.from(this.metrics.health.values()).slice(-5);
    
    if (recent.length === 0) return {};

    const latest = recent[recent.length - 1];

    return {
      overall: this.calculateOverallHealth(latest),
      typescript: latest.typeScript,
      linting: latest.linting,
      tests: latest.tests,
      security: latest.security,
    };
  }

  calculateOverallHealth(metrics) {
    let score = 100;

    // TypeScript errors
    if (!metrics.typeScript?.success) score -= 30;

    // Linting issues
    if (metrics.linting?.errors > 0) score -= 20;
    if (metrics.linting?.warnings > 5) score -= 10;

    // Test failures
    if (!metrics.tests?.success) score -= 25;

    // Security vulnerabilities
    if (metrics.security?.totalVulnerabilities > 0) {
      score -= Math.min(25, metrics.security.totalVulnerabilities * 5);
    }

    return Math.max(0, score);
  }

  analyzeTrends() {
    const performanceData = Array.from(this.metrics.performance.values());
    const healthData = Array.from(this.metrics.health.values());

    return {
      bundleSizeTrend: this.calculateTrend(
        performanceData.map(d => d.bundle?.totalSize || 0)
      ),
      buildTimeTrend: this.calculateTrend(
        performanceData.map(d => d.buildTime?.duration || 0)
      ),
      healthTrend: this.calculateTrend(
        healthData.map(d => this.calculateOverallHealth(d))
      ),
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const recent = values.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const last = recent[recent.length - 1];

    if (last > avg * 1.1) return 'increasing';
    if (last < avg * 0.9) return 'decreasing';
    return 'stable';
  }

  generateAlerts() {
    const alerts = [];
    const latest = this.analyzeMetrics();

    // Performance alerts
    if (latest.performance?.bundleSize?.sizeMB > 2) {
      alerts.push({
        type: 'warning',
        category: 'performance',
        message: `Bundle size is ${latest.performance.bundleSize.sizeMB}MB, consider optimization`,
      });
    }

    if (latest.performance?.buildTime?.seconds > 60) {
      alerts.push({
        type: 'warning',
        category: 'performance',
        message: `Build time is ${latest.performance.buildTime.seconds}s, consider optimization`,
      });
    }

    // Health alerts
    if (latest.health?.overall < 80) {
      alerts.push({
        type: 'error',
        category: 'health',
        message: `Overall health score is ${latest.health.overall}%, needs attention`,
      });
    }

    // Security alerts
    if (latest.health?.security?.totalVulnerabilities > 0) {
      alerts.push({
        type: 'error',
        category: 'security',
        message: `${latest.health.security.totalVulnerabilities} security vulnerabilities found`,
      });
    }

    return alerts;
  }

  async generateReport() {
    log(colors.cyan, '📊 Collecting production metrics...');

    const performance = await this.collectPerformanceMetrics();
    const health = await this.collectHealthMetrics();
    const analysis = this.analyzeMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallHealth: analysis.health?.overall || 0,
        bundleSize: analysis.performance?.bundleSize?.sizeMB || 0,
        buildTime: analysis.performance?.buildTime?.seconds || 0,
        vulnerabilities: analysis.health?.security?.totalVulnerabilities || 0,
      },
      performance,
      health,
      analysis,
      recommendations: this.generateRecommendations(analysis),
    };

    // Save report
    await fs.writeFile(
      path.join(process.cwd(), '.production-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Performance recommendations
    if (analysis.performance?.bundleSize?.sizeMB > 1) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        message: 'Consider bundle splitting or tree-shaking optimization',
        action: 'npm run analyze:size',
      });
    }

    // Health recommendations
    if (analysis.health?.typescript && !analysis.health.typescript.success) {
      recommendations.push({
        category: 'health',
        priority: 'high',
        message: 'Fix TypeScript errors for better type safety',
        action: 'npm run typecheck',
      });
    }

    if (analysis.health?.tests && !analysis.health.tests.success) {
      recommendations.push({
        category: 'health',
        priority: 'high',
        message: 'Fix failing tests to ensure code reliability',
        action: 'npm test',
      });
    }

    // Dependency recommendations
    if (analysis.performance?.dependencies?.outdated?.count > 5) {
      recommendations.push({
        category: 'maintenance',
        priority: 'medium',
        message: 'Update outdated dependencies for security and performance',
        action: 'npm update',
      });
    }

    return recommendations;
  }

  async startContinuousMonitoring(intervalMinutes = 15) {
    this.isMonitoring = true;
    
    log(colors.green, `🚀 Starting continuous production monitoring (every ${intervalMinutes} minutes)`);

    const monitor = async () => {
      if (!this.isMonitoring) return;

      try {
        const report = await this.generateReport();
        
        log(colors.cyan, '📊 Production Report Generated');
        log(colors.bright, `Health Score: ${report.summary.overallHealth}%`);
        log(colors.bright, `Bundle Size: ${report.summary.bundleSize}MB`);
        log(colors.bright, `Build Time: ${report.summary.buildTime}s`);
        
        if (report.summary.vulnerabilities > 0) {
          log(colors.red, `⚠️  ${report.summary.vulnerabilities} security vulnerabilities`);
        }

        // Show recommendations
        if (report.recommendations.length > 0) {
          log(colors.yellow, '💡 Recommendations:');
          report.recommendations.slice(0, 3).forEach(rec => {
            log(colors.yellow, `   • ${rec.message}`);
          });
        }

      } catch (error) {
        log(colors.red, '❌ Monitoring error:', error.message);
      }

      // Schedule next check
      setTimeout(monitor, intervalMinutes * 60 * 1000);
    };

    // Start monitoring
    await monitor();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    log(colors.yellow, '🛑 Stopping production monitoring');
  }
}

async function main() {
  const monitor = new ProductionMonitor();
  
  const action = process.argv[2] || 'report';
  
  switch (action) {
    case 'report':
      log(colors.cyan, '📊 Generating production monitoring report...');
      const report = await monitor.generateReport();
      
      console.log('\n📋 Production Status Summary:');
      console.log(`Health Score: ${report.summary.overallHealth}%`);
      console.log(`Bundle Size: ${report.summary.bundleSize}MB`);
      console.log(`Build Time: ${report.summary.buildTime}s`);
      console.log(`Vulnerabilities: ${report.summary.vulnerabilities}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`   • [${rec.priority}] ${rec.message}`);
        });
      }
      
      log(colors.cyan, '\n📄 Detailed report saved to .production-report.json');
      break;

    case 'monitor':
      const interval = parseInt(process.argv[3]) || 15;
      await monitor.startContinuousMonitoring(interval);
      break;

    default:
      console.log('Usage:');
      console.log('  node production-monitor.js report    # Generate single report');
      console.log('  node production-monitor.js monitor [minutes]  # Continuous monitoring');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionMonitor };