#!/usr/bin/env node

/**
 * Comprehensive code quality checker for @johnqh/lib
 * Runs all quality checks in parallel for fast feedback
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const checks = [
  {
    name: 'TypeScript Type Check',
    command: 'npm run typecheck',
    weight: 0.3,
    critical: true,
  },
  {
    name: 'ESLint Code Quality',
    command: 'npm run lint',
    weight: 0.25,
    critical: true,
  },
  {
    name: 'Prettier Code Formatting',
    command: 'npm run format:check',
    weight: 0.15,
    critical: false,
  },
  {
    name: 'Test Suite',
    command: 'npm test',
    weight: 0.2,
    critical: true,
  },
  {
    name: 'Build Process',
    command: 'npm run build',
    weight: 0.1,
    critical: false,
  },
];

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

function runCommand(command) {
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
        output: stdout + stderr,
      });
    });
  });
}

async function getProjectStats() {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    
    const srcFiles = await countFiles('src', /\.(ts|tsx)$/);
    const testFiles = await countFiles('src', /\.(test|spec)\.(ts|tsx)$/);
    
    return {
      version: packageJson.version,
      name: packageJson.name,
      sourceFiles: srcFiles,
      testFiles: testFiles,
      testCoverage: testFiles > 0 ? Math.round((testFiles / srcFiles) * 100) : 0,
    };
  } catch (error) {
    return {
      version: 'unknown',
      name: 'unknown',
      sourceFiles: 0,
      testFiles: 0,
      testCoverage: 0,
    };
  }
}

async function countFiles(dir, pattern) {
  try {
    const files = await fs.readdir(dir, { recursive: true });
    return files.filter(file => pattern.test(file)).length;
  } catch {
    return 0;
  }
}

async function generateQualityReport(results, stats) {
  const timestamp = new Date().toISOString();
  const totalScore = results.reduce((sum, result) => 
    sum + (result.success ? result.check.weight * 100 : 0), 0
  );
  
  const report = {
    timestamp,
    projectStats: stats,
    overallScore: Math.round(totalScore),
    checks: results.map(result => ({
      name: result.check.name,
      success: result.success,
      weight: result.check.weight,
      critical: result.check.critical,
      score: result.success ? Math.round(result.check.weight * 100) : 0,
      errors: result.success ? [] : parseErrors(result.output),
    })),
    recommendations: generateRecommendations(results),
  };
  
  await fs.writeFile(
    path.join(process.cwd(), '.quality-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

function parseErrors(output) {
  const lines = output.split('\n');
  return lines
    .filter(line => line.includes('error') || line.includes('✗') || line.includes('FAIL'))
    .slice(0, 10) // Limit to first 10 errors
    .map(line => line.trim());
}

function generateRecommendations(results) {
  const recommendations = [];
  
  const failedChecks = results.filter(result => !result.success);
  
  if (failedChecks.some(r => r.check.name.includes('TypeScript'))) {
    recommendations.push('Fix TypeScript type errors to improve code safety and maintainability');
  }
  
  if (failedChecks.some(r => r.check.name.includes('ESLint'))) {
    recommendations.push('Address ESLint issues to maintain code quality standards');
  }
  
  if (failedChecks.some(r => r.check.name.includes('Test'))) {
    recommendations.push('Fix failing tests to ensure code reliability');
  }
  
  if (failedChecks.some(r => r.check.name.includes('Prettier'))) {
    recommendations.push('Run `npm run format` to fix code formatting issues');
  }
  
  return recommendations;
}

async function main() {
  const startTime = Date.now();
  
  log(colors.cyan, '\n🔍 Running comprehensive code quality checks...\n');
  
  const stats = await getProjectStats();
  log(colors.blue, `📊 Project: ${stats.name} v${stats.version}`);
  log(colors.blue, `📁 Source files: ${stats.sourceFiles} | Test files: ${stats.testFiles}`);
  log(colors.blue, `📈 Test coverage ratio: ${stats.testCoverage}%\n`);
  
  const results = [];
  
  // Run all checks in parallel for speed
  const promises = checks.map(async (check) => {
    log(colors.yellow, `⏳ Running ${check.name}...`);
    const result = await runCommand(check.command);
    
    if (result.success) {
      log(colors.green, `✅ ${check.name} - PASSED`);
    } else {
      const level = check.critical ? colors.red : colors.yellow;
      const icon = check.critical ? '❌' : '⚠️';
      log(level, `${icon} ${check.name} - FAILED`);
    }
    
    return { check, ...result };
  });
  
  const allResults = await Promise.all(promises);
  results.push(...allResults);
  
  const report = await generateQualityReport(results, stats);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  log(colors.cyan, '\n📋 Quality Check Summary:');
  log(colors.bright, `⏱️  Duration: ${duration}s`);
  log(colors.bright, `🎯 Overall Score: ${report.overallScore}/100`);
  
  const criticalFailures = results.filter(r => !r.success && r.check.critical).length;
  const warnings = results.filter(r => !r.success && !r.check.critical).length;
  
  if (criticalFailures > 0) {
    log(colors.red, `❌ Critical failures: ${criticalFailures}`);
  }
  
  if (warnings > 0) {
    log(colors.yellow, `⚠️  Warnings: ${warnings}`);
  }
  
  if (report.recommendations.length > 0) {
    log(colors.cyan, '\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      log(colors.cyan, `   • ${rec}`);
    });
  }
  
  log(colors.cyan, `\n📄 Detailed report saved to .quality-report.json\n`);
  
  // Exit with error code if critical checks failed
  if (criticalFailures > 0) {
    process.exit(1);
  } else {
    log(colors.green, '🎉 All critical quality checks passed!');
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, '💥 Quality check failed:', error.message);
    process.exit(1);
  });
}

export { main as runQualityCheck };