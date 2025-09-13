#!/usr/bin/env node

/**
 * Cross-Project Synchronization Tool
 * Manages dependencies and versioning across the 0xmail.box ecosystem
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

const ECOSYSTEM_PROJECTS = {
  mail_box_lib: {
    path: process.cwd(),
    package: '@johnqh/lib',
    dependencies: ['@johnqh/di', '@johnqh/mail_box_contracts'],
  },
  mail_box_components: {
    path: path.resolve(process.cwd(), '../mail_box_components'),
    package: '@johnqh/mail_box_components',
    dependencies: ['@johnqh/design_system'],
  },
  mail_box: {
    path: path.resolve(process.cwd(), '../mail_box'),
    package: '0xmail-box-web',
    dependencies: ['@johnqh/lib', '@johnqh/mail_box_components'],
  },
  design_system: {
    path: path.resolve(process.cwd(), '../design_system'),
    package: '@johnqh/design_system',
    dependencies: [],
  },
  di: {
    path: path.resolve(process.cwd(), '../di'),
    package: '@johnqh/di',
    dependencies: [],
  },
  mail_box_contracts: {
    path: path.resolve(process.cwd(), '../mail_box_contracts'),
    package: '@johnqh/mail_box_contracts',
    dependencies: [],
  },
};

async function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { 
      stdio: 'pipe', 
      shell: true, 
      cwd 
    });
    
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

async function checkProjectExists(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    await fs.access(packageJsonPath);
    return true;
  } catch {
    return false;
  }
}

async function getPackageInfo(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function updatePackageVersion(projectPath, version) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await getPackageInfo(projectPath);
    
    if (!packageJson) return false;
    
    packageJson.version = version;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    return true;
  } catch (error) {
    log(colors.red, `Error updating package version: ${error.message}`);
    return false;
  }
}

async function syncDependencies() {
  log(colors.cyan, '\n🔄 Synchronizing ecosystem dependencies...\n');
  
  const projectStatus = {};
  
  // Check which projects exist
  for (const [name, config] of Object.entries(ECOSYSTEM_PROJECTS)) {
    const exists = await checkProjectExists(config.path);
    const packageInfo = exists ? await getPackageInfo(config.path) : null;
    
    projectStatus[name] = {
      exists,
      packageInfo,
      config,
    };
    
    if (exists) {
      log(colors.green, `✅ ${name} (v${packageInfo?.version || 'unknown'})`);
    } else {
      log(colors.yellow, `⚠️  ${name} - Not found at ${config.path}`);
    }
  }
  
  log(colors.cyan, '\n📋 Dependency Analysis:\n');
  
  // Analyze dependency relationships
  for (const [name, status] of Object.entries(projectStatus)) {
    if (!status.exists) continue;
    
    const { packageInfo, config } = status;
    log(colors.blue, `📦 ${name}:`);
    
    for (const dep of config.dependencies) {
      const depProject = Object.values(projectStatus).find(
        p => p.packageInfo?.name === dep
      );
      
      if (depProject) {
        const currentVersion = packageInfo.dependencies?.[dep] || 
                              packageInfo.devDependencies?.[dep] ||
                              'not installed';
        const availableVersion = depProject.packageInfo.version;
        
        if (currentVersion.includes(availableVersion)) {
          log(colors.green, `  ✅ ${dep}: ${currentVersion} (up to date)`);
        } else {
          log(colors.yellow, `  ⚠️  ${dep}: ${currentVersion} → ${availableVersion} available`);
        }
      } else {
        log(colors.red, `  ❌ ${dep}: external dependency`);
      }
    }
    log('');
  }
  
  return projectStatus;
}

async function buildAllProjects(projectStatus) {
  log(colors.cyan, '\n🔨 Building all ecosystem projects...\n');
  
  const buildOrder = [
    'di',
    'mail_box_contracts', 
    'design_system',
    'mail_box_lib',
    'mail_box_components',
    'mail_box'
  ];
  
  const results = [];
  
  for (const projectName of buildOrder) {
    const status = projectStatus[projectName];
    
    if (!status?.exists) {
      log(colors.yellow, `⏭️  Skipping ${projectName} (not found)`);
      continue;
    }
    
    log(colors.blue, `🔨 Building ${projectName}...`);
    
    const buildResult = await runCommand('npm run build', status.config.path);
    
    if (buildResult.success) {
      log(colors.green, `✅ ${projectName} built successfully`);
      results.push({ project: projectName, success: true });
    } else {
      log(colors.red, `❌ ${projectName} build failed`);
      log(colors.red, buildResult.output);
      results.push({ project: projectName, success: false, error: buildResult.output });
    }
  }
  
  return results;
}

async function runTests(projectStatus) {
  log(colors.cyan, '\n🧪 Running tests across ecosystem...\n');
  
  const testResults = [];
  
  for (const [name, status] of Object.entries(projectStatus)) {
    if (!status.exists) continue;
    
    log(colors.blue, `🧪 Testing ${name}...`);
    
    const testResult = await runCommand('npm test', status.config.path);
    
    if (testResult.success) {
      log(colors.green, `✅ ${name} tests passed`);
      testResults.push({ project: name, success: true });
    } else {
      log(colors.red, `❌ ${name} tests failed`);
      testResults.push({ project: name, success: false, error: testResult.output });
    }
  }
  
  return testResults;
}

async function generateEcosystemReport(projectStatus, buildResults, testResults) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    summary: {
      totalProjects: Object.keys(projectStatus).length,
      existingProjects: Object.values(projectStatus).filter(p => p.exists).length,
      successfulBuilds: buildResults.filter(r => r.success).length,
      passedTests: testResults.filter(r => r.success).length,
    },
    projects: {},
    recommendations: [],
  };
  
  // Project details
  for (const [name, status] of Object.entries(projectStatus)) {
    const buildResult = buildResults.find(r => r.project === name);
    const testResult = testResults.find(r => r.project === name);
    
    report.projects[name] = {
      exists: status.exists,
      version: status.packageInfo?.version || 'unknown',
      buildSuccess: buildResult?.success || false,
      testSuccess: testResult?.success || false,
    };
  }
  
  // Generate recommendations
  const failedBuilds = buildResults.filter(r => !r.success);
  const failedTests = testResults.filter(r => !r.success);
  
  if (failedBuilds.length > 0) {
    report.recommendations.push(
      `Fix build failures in: ${failedBuilds.map(r => r.project).join(', ')}`
    );
  }
  
  if (failedTests.length > 0) {
    report.recommendations.push(
      `Fix test failures in: ${failedTests.map(r => r.project).join(', ')}`
    );
  }
  
  const missingProjects = Object.entries(projectStatus)
    .filter(([, status]) => !status.exists)
    .map(([name]) => name);
    
  if (missingProjects.length > 0) {
    report.recommendations.push(
      `Clone missing projects: ${missingProjects.join(', ')}`
    );
  }
  
  // Save report
  await fs.writeFile(
    path.join(process.cwd(), '.ecosystem-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

async function main() {
  const startTime = Date.now();
  
  log(colors.cyan, '🌐 0xmail.box Ecosystem Synchronization Tool\n');
  
  try {
    // Sync dependencies
    const projectStatus = await syncDependencies();
    
    // Build projects
    const buildResults = await buildAllProjects(projectStatus);
    
    // Run tests
    const testResults = await runTests(projectStatus);
    
    // Generate report
    const report = await generateEcosystemReport(projectStatus, buildResults, testResults);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(colors.cyan, '\n📊 Ecosystem Status Summary:');
    log(colors.bright, `⏱️  Duration: ${duration}s`);
    log(colors.bright, `📦 Projects: ${report.summary.existingProjects}/${report.summary.totalProjects} available`);
    log(colors.bright, `🔨 Builds: ${report.summary.successfulBuilds}/${buildResults.length} successful`);
    log(colors.bright, `🧪 Tests: ${report.summary.passedTests}/${testResults.length} passed`);
    
    if (report.recommendations.length > 0) {
      log(colors.cyan, '\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        log(colors.cyan, `   • ${rec}`);
      });
    }
    
    log(colors.cyan, '\n📄 Detailed report saved to .ecosystem-report.json\n');
    
    const allSuccessful = buildResults.every(r => r.success) && testResults.every(r => r.success);
    
    if (allSuccessful) {
      log(colors.green, '🎉 All ecosystem projects are healthy!');
      process.exit(0);
    } else {
      log(colors.red, '⚠️  Some ecosystem projects need attention');
      process.exit(1);
    }
    
  } catch (error) {
    log(colors.red, '💥 Ecosystem sync failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runEcosystemSync };