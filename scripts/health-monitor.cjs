#!/usr/bin/env node

/**
 * AI-Assisted Development Health Monitor
 * Continuous monitoring and reporting for project health
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealthMonitor {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.metrics = {
      timestamp: new Date().toISOString(),
      overall: 0,
      categories: {
        codeQuality: { score: 0, issues: [], recommendations: [] },
        typeScript: { score: 0, issues: [], recommendations: [] },
        testing: { score: 0, issues: [], recommendations: [] },
        dependencies: { score: 0, issues: [], recommendations: [] },
        aiReadiness: { score: 0, issues: [], recommendations: [] }
      },
      trends: [],
      alerts: []
    };
  }

  async monitor() {
    console.log('🔍 AI Development Health Monitor');
    console.log('=================================\n');

    await this.checkCodeQuality();
    await this.checkTypeScript();
    await this.checkTesting();
    await this.checkDependencies();
    await this.checkAIReadiness();
    
    this.calculateOverallHealth();
    this.generateReport();
    this.saveMetrics();
    
    return this.metrics;
  }

  async checkCodeQuality() {
    console.log('📋 Checking Code Quality...');
    
    try {
      // Run linting
      const lintResult = execSync('npm run lint', { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      this.metrics.categories.codeQuality.score += 25;
      console.log('✅ Linting: PASSED');
    } catch (error) {
      const errorCount = (error.stdout.match(/error/gi) || []).length;
      const warningCount = (error.stdout.match(/warning/gi) || []).length;
      
      this.metrics.categories.codeQuality.issues.push({
        type: 'lint',
        errors: errorCount,
        warnings: warningCount
      });
      
      if (errorCount === 0) {
        this.metrics.categories.codeQuality.score += 15;
        console.log(`⚠️  Linting: ${warningCount} warnings`);
      } else {
        console.log(`❌ Linting: ${errorCount} errors, ${warningCount} warnings`);
      }
    }

    // Check file organization
    const srcExists = fs.existsSync(path.join(this.rootDir, 'src'));
    const typesExists = fs.existsSync(path.join(this.rootDir, 'src/types'));
    const businessExists = fs.existsSync(path.join(this.rootDir, 'src/business'));
    
    if (srcExists && typesExists && businessExists) {
      this.metrics.categories.codeQuality.score += 25;
      console.log('✅ File Organization: GOOD');
    } else {
      this.metrics.categories.codeQuality.issues.push({
        type: 'structure',
        missing: [
          !srcExists && 'src/',
          !typesExists && 'src/types/',
          !businessExists && 'src/business/'
        ].filter(Boolean)
      });
      console.log('⚠️  File Organization: Issues found');
    }
    
    console.log('');
  }

  async checkTypeScript() {
    console.log('🔷 Checking TypeScript...');
    
    try {
      execSync('npm run typecheck', { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      this.metrics.categories.typeScript.score = 100;
      console.log('✅ TypeScript: No errors');
    } catch (error) {
      const errorCount = (error.stdout.match(/error TS/g) || []).length;
      
      this.metrics.categories.typeScript.issues.push({
        type: 'compilation',
        errors: errorCount
      });
      
      this.metrics.categories.typeScript.score = Math.max(0, 100 - (errorCount * 10));
      console.log(`❌ TypeScript: ${errorCount} errors`);
      
      if (errorCount > 0) {
        this.metrics.categories.typeScript.recommendations.push(
          'Run npm run typecheck to see detailed errors'
        );
      }
    }
    
    console.log('');
  }

  async checkTesting() {
    console.log('🧪 Checking Testing...');
    
    try {
      // Check if tests exist
      const testFiles = this.findFiles('**/*.test.ts').length + 
                       this.findFiles('**/*.spec.ts').length;
      
      if (testFiles === 0) {
        this.metrics.categories.testing.issues.push({
          type: 'no-tests',
          count: 0
        });
        console.log('❌ Testing: No test files found');
      } else {
        console.log(`📊 Found ${testFiles} test files`);
        this.metrics.categories.testing.score += 25;
      }

      // Run tests
      const testResult = execSync('npm run test:run', { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      this.metrics.categories.testing.score += 50;
      console.log('✅ Tests: PASSED');
      
      // Check coverage if available
      const coverageFile = path.join(this.rootDir, 'coverage/coverage-summary.json');
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        const totalCoverage = coverage.total?.statements?.pct || 0;
        
        if (totalCoverage >= 80) {
          this.metrics.categories.testing.score += 25;
          console.log(`✅ Coverage: ${totalCoverage}%`);
        } else if (totalCoverage >= 60) {
          this.metrics.categories.testing.score += 15;
          console.log(`⚠️  Coverage: ${totalCoverage}% (target: 80%)`);
        } else {
          console.log(`❌ Coverage: ${totalCoverage}% (target: 80%)`);
          this.metrics.categories.testing.recommendations.push(
            'Increase test coverage to at least 80%'
          );
        }
      }
      
    } catch (error) {
      const failedTests = (error.stdout.match(/FAIL/g) || []).length;
      
      this.metrics.categories.testing.issues.push({
        type: 'test-failures',
        count: failedTests
      });
      
      console.log(`❌ Tests: ${failedTests} failures`);
      this.metrics.categories.testing.recommendations.push(
        'Fix failing tests before proceeding'
      );
    }
    
    console.log('');
  }

  async checkDependencies() {
    console.log('📦 Checking Dependencies...');
    
    try {
      // Check for security vulnerabilities
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
      
      if (totalVulns === 0) {
        this.metrics.categories.dependencies.score += 40;
        console.log('✅ Security: No vulnerabilities');
      } else {
        this.metrics.categories.dependencies.issues.push({
          type: 'security',
          vulnerabilities: vulnerabilities
        });
        console.log(`⚠️  Security: ${totalVulns} vulnerabilities`);
        this.metrics.categories.dependencies.recommendations.push(
          'Run npm audit fix to resolve vulnerabilities'
        );
      }
    } catch (error) {
      console.log('⚠️  Security audit failed');
    }

    try {
      // Check for outdated packages
      const outdatedResult = execSync('npm outdated --json', { 
        encoding: 'utf8', 
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      const outdated = JSON.parse(outdatedResult || '{}');
      const outdatedCount = Object.keys(outdated).length;
      
      if (outdatedCount === 0) {
        this.metrics.categories.dependencies.score += 30;
        console.log('✅ Dependencies: Up to date');
      } else {
        this.metrics.categories.dependencies.score += 15;
        this.metrics.categories.dependencies.issues.push({
          type: 'outdated',
          packages: Object.keys(outdated)
        });
        console.log(`⚠️  Dependencies: ${outdatedCount} packages need updates`);
      }
    } catch (error) {
      // npm outdated returns exit code 1 when packages are outdated
      this.metrics.categories.dependencies.score += 15;
    }

    // Check package.json structure
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const hasScripts = pkg.scripts && Object.keys(pkg.scripts).length > 0;
      const hasTypes = pkg.types || pkg.main;
      const hasKeywords = pkg.keywords && pkg.keywords.length > 0;
      
      let structureScore = 0;
      if (hasScripts) structureScore += 10;
      if (hasTypes) structureScore += 10;
      if (hasKeywords) structureScore += 10;
      
      this.metrics.categories.dependencies.score += structureScore;
      console.log(`📄 Package.json: ${structureScore}/30 points`);
    }
    
    console.log('');
  }

  async checkAIReadiness() {
    console.log('🤖 Checking AI Readiness...');
    
    let score = 0;
    const checks = [];

    // Check for AI development files
    const aiFiles = [
      'CLAUDE.md',
      'docs/AI_DEVELOPMENT_WORKFLOWS.md',
      'templates/',
      'scripts/analyze-code.cjs',
      'scripts/create-service.js',
      'scripts/create-hook.js'
    ];

    aiFiles.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        score += 15;
        checks.push(`✅ ${file}`);
      } else {
        checks.push(`❌ ${file}`);
        this.metrics.categories.aiReadiness.recommendations.push(
          `Create ${file} for better AI assistance`
        );
      }
    });

    // Check for comprehensive interfaces
    const interfaceFiles = this.findFiles('**/*.interface.ts').length;
    if (interfaceFiles >= 10) {
      score += 10;
      checks.push(`✅ Interfaces: ${interfaceFiles}`);
    } else {
      checks.push(`⚠️  Interfaces: ${interfaceFiles} (target: 10+)`);
    }

    this.metrics.categories.aiReadiness.score = Math.min(100, score);
    
    checks.forEach(check => console.log(check));
    console.log(`🎯 AI Readiness Score: ${this.metrics.categories.aiReadiness.score}/100\n`);
  }

  calculateOverallHealth() {
    const scores = Object.values(this.metrics.categories).map(cat => cat.score);
    this.metrics.overall = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  generateReport() {
    console.log('📊 Health Report Summary');
    console.log('========================');
    
    console.log(`Overall Health: ${this.getHealthEmoji(this.metrics.overall)} ${this.metrics.overall}/100\n`);
    
    Object.entries(this.metrics.categories).forEach(([name, data]) => {
      const emoji = this.getHealthEmoji(data.score);
      const displayName = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${emoji} ${displayName}: ${data.score}/100`);
      
      if (data.issues.length > 0) {
        console.log(`   Issues: ${data.issues.length}`);
      }
      
      if (data.recommendations.length > 0) {
        console.log(`   Recommendations: ${data.recommendations.length}`);
      }
    });

    console.log('\n🔧 Top Recommendations:');
    const allRecommendations = Object.values(this.metrics.categories)
      .flatMap(cat => cat.recommendations)
      .slice(0, 3);
    
    if (allRecommendations.length === 0) {
      console.log('✅ No immediate recommendations - project is healthy!');
    } else {
      allRecommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\n💡 AI Development Tips:');
    console.log('• Run npm run analyze:code for detailed analysis');
    console.log('• Use npm run create:service for new features');
    console.log('• Check docs/AI_DEVELOPMENT_WORKFLOWS.md for workflows');
    console.log('• Run npm run health:monitor regularly');
  }

  getHealthEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  saveMetrics() {
    const reportDir = path.join(this.rootDir, '.reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save current metrics
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `health-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));

    // Save summary for trending
    const summaryPath = path.join(reportDir, 'health-summary.json');
    let summaries = [];
    
    if (fs.existsSync(summaryPath)) {
      summaries = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    }
    
    summaries.push({
      timestamp: this.metrics.timestamp,
      overall: this.metrics.overall,
      categories: Object.fromEntries(
        Object.entries(this.metrics.categories).map(([k, v]) => [k, v.score])
      )
    });

    // Keep last 30 reports
    if (summaries.length > 30) {
      summaries = summaries.slice(-30);
    }

    fs.writeFileSync(summaryPath, JSON.stringify(summaries, null, 2));
    
    console.log(`\n📁 Report saved: ${reportPath}`);
  }

  findFiles(pattern) {
    const glob = require('glob');
    return glob.sync(pattern, { cwd: this.rootDir });
  }

  // Continuous monitoring mode
  async startContinuousMonitoring(intervalMinutes = 30) {
    console.log(`🔄 Starting continuous health monitoring (every ${intervalMinutes} minutes)`);
    
    const monitor = async () => {
      try {
        await this.monitor();
        
        // Check for critical issues
        const criticalIssues = Object.values(this.metrics.categories)
          .filter(cat => cat.score < 50);
        
        if (criticalIssues.length > 0) {
          console.log(`\n🚨 ALERT: ${criticalIssues.length} categories need immediate attention!`);
        }
        
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
      
      console.log(`\n⏰ Next check in ${intervalMinutes} minutes...\n`);
    };

    // Run initial check
    await monitor();
    
    // Schedule recurring checks
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  const monitor = new HealthMonitor();
  
  if (args.includes('--continuous')) {
    const interval = parseInt(args[args.indexOf('--continuous') + 1]) || 30;
    await monitor.startContinuousMonitoring(interval);
  } else {
    await monitor.monitor();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HealthMonitor };