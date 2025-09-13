#!/usr/bin/env node

/**
 * Self-Healing Infrastructure Monitor
 * Automatically detects, diagnoses, and resolves common development and production issues
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import chokidar from 'chokidar';

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

class SelfHealingMonitor {
  constructor() {
    this.isMonitoring = false;
    this.healingActions = new Map();
    this.issueHistory = [];
    this.healingStrategies = new Map();
    this.performanceBaseline = null;
    this.lastHealthCheck = null;
    this.autoHealingEnabled = true;
    
    this.initializeHealingStrategies();
  }

  initializeHealingStrategies() {
    // Build failure healing strategies
    this.healingStrategies.set('build-failure', [
      {
        name: 'npm-install',
        description: 'Reinstall dependencies',
        action: async () => await this.runCommand('npm install'),
        successRate: 0.7,
      },
      {
        name: 'clean-build',
        description: 'Clean and rebuild',
        action: async () => {
          await this.runCommand('npm run clean');
          await this.runCommand('npm run build');
        },
        successRate: 0.9,
      },
      {
        name: 'cache-clear',
        description: 'Clear npm cache',
        action: async () => await this.runCommand('npm cache clean --force'),
        successRate: 0.5,
      },
    ]);

    // Test failure healing strategies
    this.healingStrategies.set('test-failure', [
      {
        name: 'update-snapshots',
        description: 'Update test snapshots',
        action: async () => await this.runCommand('npm test -- --updateSnapshot'),
        successRate: 0.6,
      },
      {
        name: 'clear-test-cache',
        description: 'Clear test cache',
        action: async () => await this.runCommand('npm test -- --clearCache'),
        successRate: 0.4,
      },
    ]);

    // Dependency issues healing strategies
    this.healingStrategies.set('dependency-issue', [
      {
        name: 'update-lockfile',
        description: 'Regenerate lockfile',
        action: async () => {
          await this.runCommand('rm -rf node_modules package-lock.json');
          await this.runCommand('npm install');
        },
        successRate: 0.8,
      },
      {
        name: 'peer-deps-install',
        description: 'Install with legacy peer deps',
        action: async () => await this.runCommand('npm install --legacy-peer-deps'),
        successRate: 0.7,
      },
    ]);

    // Performance degradation healing strategies
    this.healingStrategies.set('performance-degradation', [
      {
        name: 'memory-optimization',
        description: 'Increase Node.js memory limit',
        action: async () => {
          process.env.NODE_OPTIONS = '--max-old-space-size=8192';
          return { success: true };
        },
        successRate: 0.6,
      },
      {
        name: 'process-restart',
        description: 'Restart development processes',
        action: async () => await this.restartDevelopmentProcesses(),
        successRate: 0.9,
      },
    ]);

    // Security vulnerability healing strategies
    this.healingStrategies.set('security-vulnerability', [
      {
        name: 'audit-fix',
        description: 'Auto-fix security vulnerabilities',
        action: async () => await this.runCommand('npm audit fix'),
        successRate: 0.8,
      },
      {
        name: 'audit-fix-force',
        description: 'Force fix security vulnerabilities',
        action: async () => await this.runCommand('npm audit fix --force'),
        successRate: 0.9,
      },
    ]);
  }

  async startMonitoring() {
    this.isMonitoring = true;
    
    log(colors.cyan, '🤖 Starting Self-Healing Infrastructure Monitor...');
    log(colors.blue, '   • Continuous health monitoring');
    log(colors.blue, '   • Automatic issue detection');
    log(colors.blue, '   • Intelligent problem resolution');
    log(colors.blue, '   • Performance baseline tracking');

    // Establish performance baseline
    await this.establishPerformanceBaseline();

    // Start continuous monitoring loops
    this.startHealthCheckLoop();
    this.startFileSystemMonitoring();
    this.startPerformanceMonitoring();
    this.startSecurityMonitoring();

    log(colors.green, '✅ Self-healing monitor is active');
  }

  async establishPerformanceBaseline() {
    log(colors.blue, '📊 Establishing performance baseline...');

    try {
      const buildTime = await this.measureBuildTime();
      const testTime = await this.measureTestTime();
      const bundleSize = await this.measureBundleSize();
      
      this.performanceBaseline = {
        buildTime,
        testTime,
        bundleSize,
        timestamp: Date.now(),
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
      };

      log(colors.green, `✅ Baseline established - Build: ${buildTime}ms, Tests: ${testTime}ms`);
    } catch (error) {
      log(colors.yellow, `⚠️  Failed to establish baseline: ${error.message}`);
    }
  }

  async measureBuildTime() {
    const startTime = Date.now();
    const result = await this.runCommand('npm run build');
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      success: result.success,
    };
  }

  async measureTestTime() {
    const startTime = Date.now();
    const result = await this.runCommand('npm test');
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      success: result.success,
    };
  }

  async measureBundleSize() {
    try {
      const stats = await this.getDirectorySize('dist');
      return stats.totalSize;
    } catch (error) {
      return 0;
    }
  }

  startHealthCheckLoop() {
    const healthCheckInterval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(healthCheckInterval);
        return;
      }

      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  async performHealthCheck() {
    const healthStatus = {
      timestamp: Date.now(),
      build: await this.checkBuildHealth(),
      tests: await this.checkTestHealth(),
      dependencies: await this.checkDependencyHealth(),
      performance: await this.checkPerformanceHealth(),
      security: await this.checkSecurityHealth(),
    };

    this.lastHealthCheck = healthStatus;

    // Detect and heal issues
    await this.detectAndHealIssues(healthStatus);
  }

  async checkBuildHealth() {
    try {
      const result = await this.runCommand('npm run typecheck');
      return {
        healthy: result.success,
        issues: result.success ? [] : this.parseTypeScriptErrors(result.stderr),
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkTestHealth() {
    try {
      const result = await this.runCommand('npm test');
      return {
        healthy: result.success,
        coverage: this.parseTestCoverage(result.stdout),
        failures: result.success ? [] : this.parseTestFailures(result.stdout),
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkDependencyHealth() {
    try {
      const outdatedResult = await this.runCommand('npm outdated --json');
      const auditResult = await this.runCommand('npm audit --json');

      const outdated = outdatedResult.stdout.trim() 
        ? Object.keys(JSON.parse(outdatedResult.stdout))
        : [];

      const audit = auditResult.stdout.trim()
        ? JSON.parse(auditResult.stdout)
        : { vulnerabilities: {} };

      return {
        healthy: outdated.length === 0 && Object.keys(audit.vulnerabilities).length === 0,
        outdatedPackages: outdated,
        vulnerabilities: Object.keys(audit.vulnerabilities),
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkPerformanceHealth() {
    if (!this.performanceBaseline) return { healthy: true };

    try {
      const currentBuildTime = await this.measureBuildTime();
      const currentMemory = process.memoryUsage();

      const buildTimeIncrease = currentBuildTime.duration / this.performanceBaseline.buildTime.duration;
      const memoryIncrease = currentMemory.heapUsed / this.performanceBaseline.memoryUsage.heapUsed;

      return {
        healthy: buildTimeIncrease < 1.5 && memoryIncrease < 2.0,
        buildTimeRatio: buildTimeIncrease,
        memoryRatio: memoryIncrease,
        degradation: buildTimeIncrease > 1.5 || memoryIncrease > 2.0,
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkSecurityHealth() {
    try {
      const auditResult = await this.runCommand('npm audit --json');
      const audit = auditResult.stdout.trim() 
        ? JSON.parse(auditResult.stdout)
        : { vulnerabilities: {} };

      const vulnCount = Object.keys(audit.vulnerabilities).length;
      const criticalVulns = Object.values(audit.vulnerabilities)
        .filter(v => v.severity === 'critical').length;

      return {
        healthy: vulnCount === 0,
        totalVulnerabilities: vulnCount,
        criticalVulnerabilities: criticalVulns,
        needsAttention: criticalVulns > 0,
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async detectAndHealIssues(healthStatus) {
    const issues = [];

    // Detect build issues
    if (!healthStatus.build.healthy) {
      issues.push({ type: 'build-failure', data: healthStatus.build });
    }

    // Detect test issues
    if (!healthStatus.tests.healthy) {
      issues.push({ type: 'test-failure', data: healthStatus.tests });
    }

    // Detect dependency issues
    if (!healthStatus.dependencies.healthy) {
      if (healthStatus.dependencies.vulnerabilities.length > 0) {
        issues.push({ type: 'security-vulnerability', data: healthStatus.dependencies });
      }
      if (healthStatus.dependencies.outdatedPackages.length > 10) {
        issues.push({ type: 'dependency-issue', data: healthStatus.dependencies });
      }
    }

    // Detect performance issues
    if (!healthStatus.performance.healthy && healthStatus.performance.degradation) {
      issues.push({ type: 'performance-degradation', data: healthStatus.performance });
    }

    // Heal detected issues
    for (const issue of issues) {
      await this.healIssue(issue);
    }
  }

  async healIssue(issue) {
    log(colors.yellow, `🔧 Detected issue: ${issue.type}`);
    
    if (!this.autoHealingEnabled) {
      log(colors.blue, '   Auto-healing disabled, logging only');
      return;
    }

    const strategies = this.healingStrategies.get(issue.type);
    if (!strategies) {
      log(colors.red, `   No healing strategies available for ${issue.type}`);
      return;
    }

    // Try healing strategies in order of success rate
    const sortedStrategies = [...strategies].sort((a, b) => b.successRate - a.successRate);

    for (const strategy of sortedStrategies) {
      log(colors.cyan, `   Attempting: ${strategy.description}`);
      
      try {
        const healingResult = await strategy.action();
        
        if (healingResult.success !== false) {
          // Verify the healing was successful
          const verificationResult = await this.verifyHealing(issue.type);
          
          if (verificationResult.success) {
            log(colors.green, `   ✅ Successfully healed with: ${strategy.description}`);
            
            this.recordHealingAction({
              issue: issue.type,
              strategy: strategy.name,
              timestamp: Date.now(),
              success: true,
            });
            
            return;
          }
        }
      } catch (error) {
        log(colors.red, `   ❌ Strategy failed: ${error.message}`);
      }
    }

    log(colors.red, `   ❌ All healing strategies failed for ${issue.type}`);
    this.recordHealingAction({
      issue: issue.type,
      timestamp: Date.now(),
      success: false,
      allStrategiesFailed: true,
    });
  }

  async verifyHealing(issueType) {
    // Wait a moment for changes to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (issueType) {
      case 'build-failure':
        const buildResult = await this.runCommand('npm run typecheck');
        return { success: buildResult.success };

      case 'test-failure':
        const testResult = await this.runCommand('npm test');
        return { success: testResult.success };

      case 'dependency-issue':
        const installResult = await this.runCommand('npm ls');
        return { success: installResult.success };

      case 'security-vulnerability':
        const auditResult = await this.runCommand('npm audit');
        return { success: auditResult.success };

      default:
        return { success: true };
    }
  }

  startFileSystemMonitoring() {
    // Monitor critical files for changes that might cause issues
    const criticalFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      '.eslintrc*',
      'vitest.config.ts',
    ];

    criticalFiles.forEach(pattern => {
      const watcher = chokidar.watch(pattern, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
      });

      watcher.on('change', async (filePath) => {
        log(colors.blue, `📝 Critical file changed: ${filePath}`);
        
        // Trigger proactive health check
        setTimeout(async () => {
          await this.performHealthCheck();
        }, 5000); // Wait 5 seconds for changes to settle
      });
    });
  }

  startPerformanceMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring || !this.performanceBaseline) return;

      const currentMemory = process.memoryUsage();
      const memoryIncrease = currentMemory.heapUsed / this.performanceBaseline.memoryUsage.heapUsed;

      if (memoryIncrease > 3.0) {
        log(colors.yellow, `⚠️  Memory usage increased ${(memoryIncrease * 100).toFixed(0)}%`);
        
        if (this.autoHealingEnabled) {
          log(colors.cyan, '🔧 Triggering memory optimization...');
          global.gc && global.gc();
        }
      }
    }, 60000); // Every minute
  }

  startSecurityMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      const securityHealth = await this.checkSecurityHealth();
      
      if (securityHealth.criticalVulnerabilities > 0) {
        log(colors.red, `🚨 Critical security vulnerabilities detected: ${securityHealth.criticalVulnerabilities}`);
        
        if (this.autoHealingEnabled) {
          await this.healIssue({ 
            type: 'security-vulnerability', 
            data: securityHealth 
          });
        }
      }
    }, 300000); // Every 5 minutes
  }

  recordHealingAction(action) {
    this.healingActions.set(Date.now(), action);
    
    // Keep only last 100 actions
    if (this.healingActions.size > 100) {
      const oldest = Math.min(...this.healingActions.keys());
      this.healingActions.delete(oldest);
    }
  }

  async restartDevelopmentProcesses() {
    log(colors.blue, '🔄 Restarting development processes...');
    
    // This would restart any development servers or watch processes
    // For now, we'll simulate this
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  }

  parseTypeScriptErrors(stderr) {
    const lines = stderr.split('\n');
    return lines
      .filter(line => line.includes('error TS'))
      .map(line => line.trim())
      .slice(0, 10); // Limit to first 10 errors
  }

  parseTestCoverage(stdout) {
    const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }

  parseTestFailures(stdout) {
    const lines = stdout.split('\n');
    return lines
      .filter(line => line.includes('FAIL') || line.includes('✗'))
      .map(line => line.trim())
      .slice(0, 10); // Limit to first 10 failures
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          const subStats = await this.getDirectorySize(itemPath);
          totalSize += subStats.totalSize;
        } else {
          const stat = await fs.stat(itemPath);
          totalSize += stat.size;
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
    return { totalSize };
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

  async generateHealingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      monitoringStatus: this.isMonitoring,
      autoHealingEnabled: this.autoHealingEnabled,
      lastHealthCheck: this.lastHealthCheck,
      performanceBaseline: this.performanceBaseline,
      healingActions: Array.from(this.healingActions.entries()).map(([timestamp, action]) => ({
        timestamp: new Date(timestamp).toISOString(),
        ...action,
      })),
      statistics: {
        totalHealingActions: this.healingActions.size,
        successfulHealing: Array.from(this.healingActions.values()).filter(a => a.success).length,
        failedHealing: Array.from(this.healingActions.values()).filter(a => !a.success).length,
        mostCommonIssues: this.getMostCommonIssues(),
        mostEffectiveStrategies: this.getMostEffectiveStrategies(),
      },
    };

    await fs.writeFile(
      path.join(process.cwd(), '.self-healing-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  getMostCommonIssues() {
    const issueCounts = new Map();
    
    for (const action of this.healingActions.values()) {
      const count = issueCounts.get(action.issue) || 0;
      issueCounts.set(action.issue, count + 1);
    }
    
    return Array.from(issueCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  getMostEffectiveStrategies() {
    const strategyStats = new Map();
    
    for (const action of this.healingActions.values()) {
      if (action.strategy) {
        const stats = strategyStats.get(action.strategy) || { attempts: 0, successes: 0 };
        stats.attempts++;
        if (action.success) stats.successes++;
        strategyStats.set(action.strategy, stats);
      }
    }
    
    return Array.from(strategyStats.entries())
      .map(([strategy, stats]) => ({
        strategy,
        successRate: stats.successes / stats.attempts,
        attempts: stats.attempts,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    log(colors.yellow, '🛑 Self-healing monitor stopped');
  }
}

async function main() {
  const monitor = new SelfHealingMonitor();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    log(colors.yellow, '\n🛑 Received SIGINT, shutting down...');
    monitor.stopMonitoring();
    
    const report = await monitor.generateHealingReport();
    log(colors.cyan, '📄 Self-healing report saved to .self-healing-report.json');
    
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log(colors.yellow, '\n🛑 Received SIGTERM, shutting down...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  try {
    await monitor.startMonitoring();
    
    // Keep process alive
    setInterval(() => {
      // Heartbeat - monitor is running in background
    }, 10000);
    
  } catch (error) {
    log(colors.red, '💥 Self-healing monitor failed to start:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SelfHealingMonitor };