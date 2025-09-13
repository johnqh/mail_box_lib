#!/usr/bin/env node

/**
 * Performance monitoring and optimization analysis
 * Analyzes bundle size, build time, and test performance
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
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function runCommand(command) {
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
        reject(new Error(`Command failed: ${command}`));
      }
    });
  });
}

async function measureBuildPerformance() {
  log(colors.cyan, '📦 Measuring build performance...');
  
  // Clean build
  await runCommand('npm run clean');
  
  const buildStart = Date.now();
  await runCommand('npm run build');
  const buildTime = Date.now() - buildStart;
  
  // Get bundle size
  const distStats = await fs.stat(path.join(process.cwd(), 'dist'));
  const bundleSize = await getBundleSize();
  
  return {
    buildTime: Math.round(buildTime / 1000 * 10) / 10, // seconds
    bundleSize,
    timestamp: new Date().toISOString(),
  };
}

async function getBundleSize() {
  try {
    const { stdout } = await runCommand('du -sh dist/');
    const sizeMatch = stdout.match(/^(\S+)\s/);
    return sizeMatch ? sizeMatch[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function measureTestPerformance() {
  log(colors.cyan, '🧪 Measuring test performance...');
  
  const testStart = Date.now();
  const { stdout } = await runCommand('npm run test:run');
  const testTime = Date.now() - testStart;
  
  // Parse test output for metrics
  const testLines = stdout.split('\n');
  const summaryLine = testLines.find(line => line.includes('Test Files'));
  
  let testFiles = 0;
  let totalTests = 0;
  let passedTests = 0;
  
  if (summaryLine) {
    const fileMatch = summaryLine.match(/Test Files\s+\d+\s+passed\s+\((\d+)\)/);
    const testMatch = summaryLine.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    
    if (fileMatch) testFiles = parseInt(fileMatch[1]);
    if (testMatch) {
      passedTests = parseInt(testMatch[1]);
      totalTests = parseInt(testMatch[2]);
    }
  }
  
  return {
    testTime: Math.round(testTime / 1000 * 10) / 10,
    testFiles,
    totalTests,
    passedTests,
    passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
  };
}

async function analyzeCodeComplexity() {
  log(colors.cyan, '🔍 Analyzing code complexity...');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = await getTypeScriptFiles(srcPath);
  
  let totalLines = 0;
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalInterfaces = 0;
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '').length;
    totalLines += lines;
    
    // Simple pattern matching for code structures
    totalFunctions += (content.match(/(?:function|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*\w+\s*=>))/g) || []).length;
    totalClasses += (content.match(/class\s+\w+/g) || []).length;
    totalInterfaces += (content.match(/interface\s+\w+/g) || []).length;
  }
  
  return {
    totalFiles: files.length,
    totalLines,
    totalFunctions,
    totalClasses,
    totalInterfaces,
    avgLinesPerFile: Math.round(totalLines / files.length),
    avgFunctionsPerFile: Math.round((totalFunctions / files.length) * 10) / 10,
  };
}

async function getTypeScriptFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const items = await fs.readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && !item.includes('node_modules')) {
        await scan(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function generatePerformanceReport(metrics) {
  const report = {
    timestamp: new Date().toISOString(),
    version: await getPackageVersion(),
    build: metrics.build,
    tests: metrics.tests,
    complexity: metrics.complexity,
    score: calculatePerformanceScore(metrics),
    recommendations: generateOptimizations(metrics),
  };
  
  await fs.writeFile(
    path.join(process.cwd(), '.performance-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

async function getPackageVersion() {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // Build performance (30 points)
  if (metrics.build.buildTime > 60) score -= 15;
  else if (metrics.build.buildTime > 30) score -= 10;
  else if (metrics.build.buildTime > 15) score -= 5;
  
  // Test performance (25 points)
  if (metrics.tests.testTime > 30) score -= 12;
  else if (metrics.tests.testTime > 15) score -= 8;
  else if (metrics.tests.testTime > 10) score -= 4;
  
  if (metrics.tests.passRate < 90) score -= 10;
  else if (metrics.tests.passRate < 95) score -= 5;
  
  // Code complexity (25 points)
  if (metrics.complexity.avgLinesPerFile > 300) score -= 10;
  else if (metrics.complexity.avgLinesPerFile > 200) score -= 5;
  
  if (metrics.complexity.avgFunctionsPerFile > 20) score -= 8;
  else if (metrics.complexity.avgFunctionsPerFile > 15) score -= 4;
  
  // Bundle size (20 points)
  const bundleSize = metrics.build.bundleSize;
  if (bundleSize.includes('M')) {
    const sizeMB = parseFloat(bundleSize);
    if (sizeMB > 5) score -= 15;
    else if (sizeMB > 2) score -= 10;
    else if (sizeMB > 1) score -= 5;
  }
  
  return Math.max(0, Math.round(score));
}

function generateOptimizations(metrics) {
  const recommendations = [];
  
  if (metrics.build.buildTime > 30) {
    recommendations.push('Consider build optimization: parallel compilation, incremental builds');
  }
  
  if (metrics.tests.testTime > 15) {
    recommendations.push('Optimize test performance: parallel execution, test splitting');
  }
  
  if (metrics.tests.passRate < 95) {
    recommendations.push('Fix failing tests to improve reliability');
  }
  
  if (metrics.complexity.avgLinesPerFile > 200) {
    recommendations.push('Break down large files into smaller, more maintainable modules');
  }
  
  if (metrics.complexity.avgFunctionsPerFile > 15) {
    recommendations.push('Consider refactoring files with high function density');
  }
  
  const bundleSize = metrics.build.bundleSize;
  if (bundleSize.includes('M') && parseFloat(bundleSize) > 2) {
    recommendations.push('Optimize bundle size: tree-shaking, code splitting, dependency analysis');
  }
  
  return recommendations;
}

async function main() {
  const startTime = Date.now();
  
  log(colors.cyan, '\n⚡ Running performance analysis...\n');
  
  try {
    const [build, tests, complexity] = await Promise.all([
      measureBuildPerformance(),
      measureTestPerformance(),
      analyzeCodeComplexity(),
    ]);
    
    const metrics = { build, tests, complexity };
    const report = await generatePerformanceReport(metrics);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(colors.cyan, '\n📊 Performance Analysis Results:');
    log(colors.bright, `⏱️  Analysis Duration: ${duration}s`);
    log(colors.bright, `🎯 Performance Score: ${report.score}/100`);
    
    log(colors.blue, '\n📦 Build Metrics:');
    log(colors.blue, `   Build Time: ${build.buildTime}s`);
    log(colors.blue, `   Bundle Size: ${build.bundleSize}`);
    
    log(colors.blue, '\n🧪 Test Metrics:');
    log(colors.blue, `   Test Time: ${tests.testTime}s`);
    log(colors.blue, `   Test Files: ${tests.testFiles}`);
    log(colors.blue, `   Total Tests: ${tests.totalTests}`);
    log(colors.blue, `   Pass Rate: ${tests.passRate}%`);
    
    log(colors.blue, '\n🔍 Complexity Metrics:');
    log(colors.blue, `   Source Files: ${complexity.totalFiles}`);
    log(colors.blue, `   Total Lines: ${complexity.totalLines}`);
    log(colors.blue, `   Functions: ${complexity.totalFunctions}`);
    log(colors.blue, `   Classes: ${complexity.totalClasses}`);
    log(colors.blue, `   Interfaces: ${complexity.totalInterfaces}`);
    log(colors.blue, `   Avg Lines/File: ${complexity.avgLinesPerFile}`);
    
    if (report.recommendations.length > 0) {
      log(colors.yellow, '\n💡 Performance Recommendations:');
      report.recommendations.forEach(rec => {
        log(colors.yellow, `   • ${rec}`);
      });
    }
    
    log(colors.cyan, `\n📄 Detailed report saved to .performance-report.json\n`);
    
    if (report.score >= 80) {
      log(colors.green, '🚀 Excellent performance!');
    } else if (report.score >= 60) {
      log(colors.yellow, '⚠️  Performance needs improvement');
    } else {
      log(colors.red, '🐌 Performance requires significant optimization');
    }
    
  } catch (error) {
    log(colors.red, '💥 Performance analysis failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, '💥 Performance monitoring failed:', error.message);
    process.exit(1);
  });
}