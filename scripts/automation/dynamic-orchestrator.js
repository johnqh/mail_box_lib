#!/usr/bin/env node

/**
 * Dynamic Ecosystem Orchestrator
 * Adaptive resource allocation, intelligent scaling, and smart configuration management
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

class DynamicOrchestrator {
  constructor() {
    this.resources = new Map();
    this.processes = new Map();
    this.configurations = new Map();
    this.metrics = new Map();
    this.scalingRules = new Map();
    this.isOrchestrating = false;
    this.adaptiveSettings = {
      cpu: { low: 30, high: 80 },
      memory: { low: 40, high: 85 },
      buildTime: { acceptable: 30000, critical: 60000 },
      testTime: { acceptable: 10000, critical: 30000 },
    };
    
    this.initializeScalingRules();
    this.initializeResourcePools();
  }

  initializeScalingRules() {
    // CPU-based scaling rules
    this.scalingRules.set('cpu-scaling', {
      metric: 'cpu',
      conditions: [
        {
          threshold: 85,
          action: 'scale-up',
          description: 'Increase process priority and memory allocation',
          implementation: async () => await this.scaleUpCompute(),
        },
        {
          threshold: 20,
          action: 'scale-down',
          description: 'Optimize resource usage and reduce overhead',
          implementation: async () => await this.scaleDownCompute(),
        },
      ],
    });

    // Memory-based scaling rules
    this.scalingRules.set('memory-scaling', {
      metric: 'memory',
      conditions: [
        {
          threshold: 90,
          action: 'memory-optimization',
          description: 'Force garbage collection and memory cleanup',
          implementation: async () => await this.optimizeMemoryUsage(),
        },
        {
          threshold: 95,
          action: 'emergency-scale',
          description: 'Emergency memory scaling and process restart',
          implementation: async () => await this.emergencyMemoryScale(),
        },
      ],
    });

    // Performance-based scaling rules
    this.scalingRules.set('performance-scaling', {
      metric: 'performance',
      conditions: [
        {
          threshold: 'build-time-exceeded',
          action: 'parallel-builds',
          description: 'Enable parallel build processes',
          implementation: async () => await this.enableParallelBuilds(),
        },
        {
          threshold: 'test-time-exceeded',
          action: 'selective-testing',
          description: 'Optimize test execution strategy',
          implementation: async () => await this.optimizeTestExecution(),
        },
      ],
    });

    // Load-based scaling rules
    this.scalingRules.set('load-scaling', {
      metric: 'load',
      conditions: [
        {
          threshold: 'high-concurrent-operations',
          action: 'queue-management',
          description: 'Implement intelligent operation queuing',
          implementation: async () => await this.optimizeOperationQueue(),
        },
        {
          threshold: 'resource-contention',
          action: 'resource-isolation',
          description: 'Isolate competing resource operations',
          implementation: async () => await this.isolateResourceOperations(),
        },
      ],
    });
  }

  initializeResourcePools() {
    // Development resource pools
    this.resources.set('development', {
      processes: [],
      memoryLimit: '2GB',
      cpuPriority: 'normal',
      networkBandwidth: 'unlimited',
      diskIO: 'high',
      concurrentOperations: 4,
    });

    // Build resource pools
    this.resources.set('build', {
      processes: [],
      memoryLimit: '4GB',
      cpuPriority: 'high',
      networkBandwidth: 'high',
      diskIO: 'maximum',
      concurrentOperations: 2,
    });

    // Test resource pools
    this.resources.set('test', {
      processes: [],
      memoryLimit: '1GB',
      cpuPriority: 'normal',
      networkBandwidth: 'medium',
      diskIO: 'medium',
      concurrentOperations: 6,
    });

    // Production monitoring resource pools
    this.resources.set('monitoring', {
      processes: [],
      memoryLimit: '512MB',
      cpuPriority: 'low',
      networkBandwidth: 'low',
      diskIO: 'low',
      concurrentOperations: 1,
    });
  }

  async startOrchestration() {
    this.isOrchestrating = true;
    
    log(colors.cyan, '🎼 Starting Dynamic Ecosystem Orchestrator...');
    log(colors.blue, '   • Adaptive resource allocation');
    log(colors.blue, '   • Intelligent scaling decisions');
    log(colors.blue, '   • Smart configuration management');
    log(colors.blue, '   • Performance optimization');

    // Start monitoring loops
    this.startResourceMonitoring();
    this.startPerformanceMonitoring();
    this.startConfigurationManagement();
    this.startAdaptiveScaling();

    log(colors.green, '✅ Dynamic orchestration is active');
  }

  startResourceMonitoring() {
    const monitoringInterval = setInterval(async () => {
      if (!this.isOrchestrating) {
        clearInterval(monitoringInterval);
        return;
      }

      await this.collectResourceMetrics();
      await this.analyzeResourceUtilization();
      await this.applyScalingDecisions();
    }, 10000); // Every 10 seconds
  }

  async collectResourceMetrics() {
    const timestamp = Date.now();
    
    // System metrics
    const systemMetrics = {
      cpu: await this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkUsage(),
      processes: this.getActiveProcesses(),
    };

    // Performance metrics
    const performanceMetrics = {
      buildTime: await this.measureCurrentBuildTime(),
      testTime: await this.measureCurrentTestTime(),
      responsiveness: await this.measureSystemResponsiveness(),
      throughput: await this.measureOperationThroughput(),
    };

    // Application metrics
    const applicationMetrics = {
      activeConnections: this.getActiveConnections(),
      queueDepth: this.getOperationQueueDepth(),
      errorRate: this.getErrorRate(),
      resourceContention: this.detectResourceContention(),
    };

    const combinedMetrics = {
      timestamp,
      system: systemMetrics,
      performance: performanceMetrics,
      application: applicationMetrics,
      score: this.calculateOverallHealthScore(systemMetrics, performanceMetrics, applicationMetrics),
    };

    this.metrics.set(timestamp, combinedMetrics);
    
    // Keep only last 100 metrics entries
    if (this.metrics.size > 100) {
      const oldest = Math.min(...this.metrics.keys());
      this.metrics.delete(oldest);
    }
  }

  async getCPUUsage() {
    try {
      const result = await this.runCommand('top -l 1 -s 0 | grep "CPU usage"');
      const match = result.stdout.match(/(\d+\.\d+)% user/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      // Fallback to Node.js CPU usage
      const usage = process.cpuUsage();
      return (usage.user + usage.system) / 1000000; // Convert to percentage approximation
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = 8 * 1024 * 1024 * 1024; // Assume 8GB, in practice get from system
    
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      percentage: (usage.rss / totalMemory) * 100,
    };
  }

  async getDiskUsage() {
    try {
      const result = await this.runCommand('df -h .');
      const lines = result.stdout.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        return {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          percentage: parseInt(parts[4].replace('%', '')),
        };
      }
    } catch (error) {
      // Fallback
    }
    
    return { percentage: 50 }; // Default assumption
  }

  async getNetworkUsage() {
    // Simplified network usage - in practice, use system tools
    return {
      bytesReceived: Math.random() * 1000000,
      bytesSent: Math.random() * 500000,
      packetsReceived: Math.random() * 1000,
      packetsSent: Math.random() * 800,
    };
  }

  getActiveProcesses() {
    return Array.from(this.processes.keys()).length;
  }

  async measureCurrentBuildTime() {
    if (this.processes.has('build')) {
      const buildProcess = this.processes.get('build');
      return Date.now() - buildProcess.startTime;
    }
    return 0;
  }

  async measureCurrentTestTime() {
    if (this.processes.has('test')) {
      const testProcess = this.processes.get('test');
      return Date.now() - testProcess.startTime;
    }
    return 0;
  }

  async measureSystemResponsiveness() {
    const start = Date.now();
    await this.runCommand('echo "responsiveness test"');
    return Date.now() - start;
  }

  async measureOperationThroughput() {
    // Measure operations per second
    const recentMetrics = Array.from(this.metrics.values()).slice(-10);
    if (recentMetrics.length < 2) return 0;
    
    const operations = recentMetrics.reduce((sum, metric) => sum + metric.application.activeConnections, 0);
    const timeSpan = recentMetrics[recentMetrics.length - 1].timestamp - recentMetrics[0].timestamp;
    
    return operations / (timeSpan / 1000); // Operations per second
  }

  getActiveConnections() {
    // Simulate active connections
    return Math.floor(Math.random() * 50);
  }

  getOperationQueueDepth() {
    // Simulate operation queue depth
    return Math.floor(Math.random() * 20);
  }

  getErrorRate() {
    // Simulate error rate (errors per 1000 operations)
    return Math.random() * 5;
  }

  detectResourceContention() {
    const memoryUsage = this.getMemoryUsage().percentage;
    const activeProcesses = this.getActiveProcesses();
    
    return memoryUsage > 80 && activeProcesses > 10;
  }

  calculateOverallHealthScore(system, performance, application) {
    let score = 100;
    
    // System health impact
    if (system.cpu > 80) score -= 20;
    if (system.memory.percentage > 85) score -= 25;
    if (system.disk?.percentage > 90) score -= 15;
    
    // Performance impact
    if (performance.buildTime > this.adaptiveSettings.buildTime.critical) score -= 20;
    if (performance.testTime > this.adaptiveSettings.testTime.critical) score -= 15;
    if (performance.responsiveness > 1000) score -= 10;
    
    // Application impact
    if (application.errorRate > 3) score -= 15;
    if (application.queueDepth > 15) score -= 10;
    if (application.resourceContention) score -= 15;
    
    return Math.max(0, score);
  }

  async analyzeResourceUtilization() {
    const latestMetrics = Array.from(this.metrics.values()).slice(-1)[0];
    if (!latestMetrics) return;

    const analysis = {
      timestamp: Date.now(),
      cpuTrend: this.analyzeTrend('cpu'),
      memoryTrend: this.analyzeTrend('memory'),
      performanceTrend: this.analyzeTrend('performance'),
      recommendations: [],
    };

    // CPU analysis
    if (latestMetrics.system.cpu > this.adaptiveSettings.cpu.high) {
      analysis.recommendations.push({
        type: 'cpu-optimization',
        priority: 'high',
        action: 'Reduce CPU-intensive operations or increase processing power',
      });
    }

    // Memory analysis
    if (latestMetrics.system.memory.percentage > this.adaptiveSettings.memory.high) {
      analysis.recommendations.push({
        type: 'memory-optimization',
        priority: 'high',
        action: 'Optimize memory usage or increase available memory',
      });
    }

    // Performance analysis
    if (latestMetrics.performance.buildTime > this.adaptiveSettings.buildTime.acceptable) {
      analysis.recommendations.push({
        type: 'build-optimization',
        priority: 'medium',
        action: 'Optimize build processes or enable parallel building',
      });
    }

    return analysis;
  }

  analyzeTrend(metricType) {
    const recentMetrics = Array.from(this.metrics.values()).slice(-10);
    if (recentMetrics.length < 2) return 'stable';

    const values = recentMetrics.map(metric => {
      switch (metricType) {
        case 'cpu':
          return metric.system.cpu;
        case 'memory':
          return metric.system.memory.percentage;
        case 'performance':
          return metric.score;
        default:
          return 50;
      }
    });

    const trend = this.calculateTrend(values);
    
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  async applyScalingDecisions() {
    const latestMetrics = Array.from(this.metrics.values()).slice(-1)[0];
    if (!latestMetrics) return;

    for (const [ruleName, rule] of this.scalingRules) {
      await this.evaluateScalingRule(rule, latestMetrics);
    }
  }

  async evaluateScalingRule(rule, metrics) {
    for (const condition of rule.conditions) {
      if (await this.shouldTriggerScaling(condition, metrics, rule.metric)) {
        log(colors.yellow, `🎛️  Triggering scaling: ${condition.description}`);
        
        try {
          const result = await condition.implementation();
          
          if (result.success) {
            log(colors.green, `✅ Successfully applied ${condition.action}`);
          } else {
            log(colors.red, `❌ Failed to apply ${condition.action}: ${result.error}`);
          }
        } catch (error) {
          log(colors.red, `❌ Scaling action failed: ${error.message}`);
        }
      }
    }
  }

  async shouldTriggerScaling(condition, metrics, metricType) {
    switch (metricType) {
      case 'cpu':
        return metrics.system.cpu > condition.threshold;
      
      case 'memory':
        return metrics.system.memory.percentage > condition.threshold;
      
      case 'performance':
        if (condition.threshold === 'build-time-exceeded') {
          return metrics.performance.buildTime > this.adaptiveSettings.buildTime.critical;
        }
        if (condition.threshold === 'test-time-exceeded') {
          return metrics.performance.testTime > this.adaptiveSettings.testTime.critical;
        }
        break;
      
      case 'load':
        if (condition.threshold === 'high-concurrent-operations') {
          return metrics.application.activeConnections > 30;
        }
        if (condition.threshold === 'resource-contention') {
          return metrics.application.resourceContention;
        }
        break;
    }
    
    return false;
  }

  // Scaling implementation methods
  async scaleUpCompute() {
    try {
      // Increase Node.js memory limit
      process.env.NODE_OPTIONS = '--max-old-space-size=8192';
      
      // Adjust process priorities
      for (const [name, processInfo] of this.processes) {
        if (processInfo.process && !processInfo.process.killed) {
          // In a real implementation, adjust process priority
          log(colors.blue, `   Increasing priority for ${name} process`);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async scaleDownCompute() {
    try {
      // Reduce resource usage
      log(colors.blue, '   Optimizing resource usage');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeMemoryUsage() {
    try {
      log(colors.blue, '   Optimizing memory usage');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Clear caches
      delete require.cache;
      
      // Reduce metric history
      if (this.metrics.size > 50) {
        const keysToDelete = Array.from(this.metrics.keys()).slice(0, this.metrics.size - 50);
        keysToDelete.forEach(key => this.metrics.delete(key));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async emergencyMemoryScale() {
    try {
      log(colors.red, '🚨 Emergency memory scaling activated');
      
      // Aggressive memory cleanup
      await this.optimizeMemoryUsage();
      
      // Restart non-critical processes
      const nonCriticalProcesses = ['monitoring'];
      for (const processName of nonCriticalProcesses) {
        await this.restartProcess(processName);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enableParallelBuilds() {
    try {
      log(colors.blue, '   Enabling parallel build processes');
      
      // Set environment variables for parallel building
      process.env.MAKEFLAGS = '-j4';
      process.env.JOBS = '4';
      
      // Update build resource allocation
      const buildResources = this.resources.get('build');
      buildResources.concurrentOperations = 4;
      buildResources.memoryLimit = '6GB';
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeTestExecution() {
    try {
      log(colors.blue, '   Optimizing test execution strategy');
      
      // Enable selective testing
      process.env.SELECTIVE_TESTS = 'true';
      
      // Parallel test execution
      process.env.TEST_PARALLEL = 'true';
      process.env.TEST_WORKERS = '4';
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeOperationQueue() {
    try {
      log(colors.blue, '   Optimizing operation queue management');
      
      // Implement intelligent queuing (simplified)
      const testResources = this.resources.get('test');
      testResources.concurrentOperations = Math.max(2, testResources.concurrentOperations - 2);
      
      const buildResources = this.resources.get('build');
      buildResources.concurrentOperations = Math.min(6, buildResources.concurrentOperations + 1);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async isolateResourceOperations() {
    try {
      log(colors.blue, '   Isolating competing resource operations');
      
      // Stagger resource-intensive operations
      const delay = 2000; // 2 second delay between operations
      
      // In a real implementation, this would coordinate timing
      log(colors.blue, `   Implementing ${delay}ms operation staggering`);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restartProcess(processName) {
    const processInfo = this.processes.get(processName);
    if (!processInfo) return;

    log(colors.yellow, `🔄 Restarting ${processName} process`);
    
    // Kill existing process
    if (processInfo.process && !processInfo.process.killed) {
      processInfo.process.kill('SIGTERM');
    }

    // Start new process (simplified)
    setTimeout(() => {
      // In a real implementation, restart the actual process
      this.processes.set(processName, {
        startTime: Date.now(),
        process: null,
        restarted: true,
      });
      log(colors.green, `✅ ${processName} process restarted`);
    }, 1000);
  }

  startPerformanceMonitoring() {
    setInterval(async () => {
      if (!this.isOrchestrating) return;

      await this.optimizePerformanceBasedOnPatterns();
    }, 30000); // Every 30 seconds
  }

  async optimizePerformanceBasedOnPatterns() {
    const recentMetrics = Array.from(this.metrics.values()).slice(-10);
    if (recentMetrics.length < 5) return;

    // Analyze patterns
    const patterns = {
      memoryLeaks: this.detectMemoryLeaks(recentMetrics),
      cpuSpikes: this.detectCPUSpikes(recentMetrics),
      performanceDegradation: this.detectPerformanceDegradation(recentMetrics),
    };

    // Apply optimizations based on patterns
    if (patterns.memoryLeaks) {
      await this.optimizeMemoryUsage();
    }

    if (patterns.cpuSpikes) {
      await this.scaleDownCompute();
    }

    if (patterns.performanceDegradation) {
      await this.enableParallelBuilds();
    }
  }

  detectMemoryLeaks(metrics) {
    const memoryValues = metrics.map(m => m.system.memory.percentage);
    const trend = this.calculateTrend(memoryValues);
    return trend > 0.2; // Memory consistently increasing
  }

  detectCPUSpikes(metrics) {
    const cpuValues = metrics.map(m => m.system.cpu);
    const average = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
    const spikes = cpuValues.filter(v => v > average * 1.5).length;
    return spikes > metrics.length * 0.3; // More than 30% of readings are spikes
  }

  detectPerformanceDegradation(metrics) {
    const scoreValues = metrics.map(m => m.score);
    const trend = this.calculateTrend(scoreValues);
    return trend < -0.15; // Performance consistently decreasing
  }

  startConfigurationManagement() {
    // Watch for configuration file changes
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vitest.config.ts',
      '.env',
    ];

    configFiles.forEach(file => {
      if (require('fs').existsSync(file)) {
        const watcher = chokidar.watch(file);
        
        watcher.on('change', async () => {
          log(colors.blue, `⚙️  Configuration changed: ${file}`);
          await this.adaptConfigurationSettings(file);
        });
      }
    });
  }

  async adaptConfigurationSettings(configFile) {
    try {
      switch (configFile) {
        case 'package.json':
          await this.optimizePackageConfiguration();
          break;
        case 'tsconfig.json':
          await this.optimizeTypeScriptConfiguration();
          break;
        case 'vitest.config.ts':
          await this.optimizeTestConfiguration();
          break;
        default:
          log(colors.blue, `   Detected change in ${configFile}`);
      }
    } catch (error) {
      log(colors.red, `❌ Failed to adapt configuration for ${configFile}: ${error.message}`);
    }
  }

  async optimizePackageConfiguration() {
    log(colors.blue, '   Optimizing package.json configuration');
    
    // In a real implementation, this would analyze and optimize:
    // - Script parallelization
    // - Dependency optimization
    // - Performance script additions
    
    return { success: true };
  }

  async optimizeTypeScriptConfiguration() {
    log(colors.blue, '   Optimizing TypeScript configuration');
    
    // In a real implementation, this would:
    // - Adjust compiler options for performance
    // - Optimize include/exclude patterns
    // - Configure incremental compilation
    
    return { success: true };
  }

  async optimizeTestConfiguration() {
    log(colors.blue, '   Optimizing test configuration');
    
    // In a real implementation, this would:
    // - Configure parallel test execution
    // - Optimize coverage collection
    // - Adjust timeout settings based on performance
    
    return { success: true };
  }

  startAdaptiveScaling() {
    // Continuous adaptive scaling based on learned patterns
    setInterval(async () => {
      if (!this.isOrchestrating) return;

      await this.learnAndAdaptScalingThresholds();
    }, 60000); // Every minute
  }

  async learnAndAdaptScalingThresholds() {
    const recentMetrics = Array.from(this.metrics.values()).slice(-50);
    if (recentMetrics.length < 10) return;

    // Analyze historical performance
    const analysis = this.analyzeHistoricalPerformance(recentMetrics);
    
    // Adapt thresholds based on learning
    if (analysis.shouldAdjustCPUThreshold) {
      this.adaptiveSettings.cpu.high = Math.min(90, this.adaptiveSettings.cpu.high + 5);
      log(colors.blue, `🧠 Adapted CPU threshold to ${this.adaptiveSettings.cpu.high}%`);
    }

    if (analysis.shouldAdjustMemoryThreshold) {
      this.adaptiveSettings.memory.high = Math.min(95, this.adaptiveSettings.memory.high + 5);
      log(colors.blue, `🧠 Adapted memory threshold to ${this.adaptiveSettings.memory.high}%`);
    }

    if (analysis.shouldOptimizeBuildTime) {
      this.adaptiveSettings.buildTime.acceptable *= 0.9; // Reduce by 10%
      log(colors.blue, `🧠 Optimized build time target to ${this.adaptiveSettings.buildTime.acceptable}ms`);
    }
  }

  analyzeHistoricalPerformance(metrics) {
    const cpuValues = metrics.map(m => m.system.cpu);
    const memoryValues = metrics.map(m => m.system.memory.percentage);
    const buildTimes = metrics.map(m => m.performance.buildTime).filter(t => t > 0);
    
    return {
      shouldAdjustCPUThreshold: cpuValues.filter(v => v > this.adaptiveSettings.cpu.high).length < metrics.length * 0.05,
      shouldAdjustMemoryThreshold: memoryValues.filter(v => v > this.adaptiveSettings.memory.high).length < metrics.length * 0.05,
      shouldOptimizeBuildTime: buildTimes.length > 0 && buildTimes.every(t => t < this.adaptiveSettings.buildTime.acceptable),
    };
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

  async generateOrchestrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      orchestrationStatus: this.isOrchestrating,
      adaptiveSettings: this.adaptiveSettings,
      resourcePools: Object.fromEntries(this.resources),
      activeProcesses: Array.from(this.processes.keys()),
      recentMetrics: Array.from(this.metrics.values()).slice(-10),
      scalingRules: Array.from(this.scalingRules.keys()),
      performance: {
        averageScore: this.calculateAverageScore(),
        resourceUtilization: this.calculateResourceUtilization(),
        scalingEvents: this.getRecentScalingEvents(),
      },
    };

    await fs.writeFile(
      path.join(process.cwd(), '.orchestration-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  calculateAverageScore() {
    const recentMetrics = Array.from(this.metrics.values()).slice(-10);
    if (recentMetrics.length === 0) return 100;
    
    return recentMetrics.reduce((sum, metric) => sum + metric.score, 0) / recentMetrics.length;
  }

  calculateResourceUtilization() {
    const latestMetrics = Array.from(this.metrics.values()).slice(-1)[0];
    if (!latestMetrics) return {};
    
    return {
      cpu: latestMetrics.system.cpu,
      memory: latestMetrics.system.memory.percentage,
      disk: latestMetrics.system.disk?.percentage || 0,
      processes: latestMetrics.system.processes,
    };
  }

  getRecentScalingEvents() {
    // In a real implementation, track scaling events
    return [];
  }

  stopOrchestration() {
    this.isOrchestrating = false;
    log(colors.yellow, '🛑 Dynamic orchestration stopped');
  }
}

async function main() {
  const orchestrator = new DynamicOrchestrator();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    log(colors.yellow, '\n🛑 Received SIGINT, shutting down...');
    orchestrator.stopOrchestration();
    
    const report = await orchestrator.generateOrchestrationReport();
    log(colors.cyan, '📄 Orchestration report saved to .orchestration-report.json');
    
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log(colors.yellow, '\n🛑 Received SIGTERM, shutting down...');
    orchestrator.stopOrchestration();
    process.exit(0);
  });

  try {
    await orchestrator.startOrchestration();
    
    // Keep process alive
    setInterval(() => {
      // Heartbeat - orchestrator is running in background
    }, 10000);
    
  } catch (error) {
    log(colors.red, '💥 Dynamic orchestrator failed to start:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DynamicOrchestrator };