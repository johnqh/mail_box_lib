#!/usr/bin/env node

/**
 * AI-Friendly Project Health Analyzer for @johnqh/lib
 * 
 * This tool provides comprehensive analysis of project health metrics
 * optimized for AI-assisted development workflows.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ProjectHealthAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.metrics = {
      typeScriptHealth: 0,
      testCoverage: 0,
      codeQuality: 0,
      dependencyHealth: 0,
      architecturalCompliance: 0,
      aiReadiness: 0,
    };
    this.issues = [];
    this.recommendations = [];
  }

  async analyze() {
    console.log('🔍 Analyzing project health for @johnqh/lib...\n');

    try {
      await this.analyzeTypeScriptHealth();
      await this.analyzeTestCoverage();
      await this.analyzeCodeQuality();
      await this.analyzeDependencyHealth();
      await this.analyzeArchitecturalCompliance();
      await this.analyzeAIReadiness();

      this.generateReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeTypeScriptHealth() {
    console.log('📊 Analyzing TypeScript health...');
    
    try {
      // Run TypeScript compiler
      await execAsync('npm run typecheck', { cwd: this.projectRoot });
      this.metrics.typeScriptHealth = 100;
      console.log('✅ TypeScript compilation: PASS');
    } catch (error) {
      const errorCount = (error.stdout.match(/error TS\d+:/g) || []).length;
      this.metrics.typeScriptHealth = Math.max(0, 100 - (errorCount * 10));
      this.issues.push(`TypeScript errors: ${errorCount} errors found`);
      console.log(`⚠️  TypeScript compilation: ${errorCount} errors`);
    }

    // Analyze type coverage
    const typeCoverage = await this.analyzeTypeCoverage();
    this.metrics.typeScriptHealth = Math.min(this.metrics.typeScriptHealth, typeCoverage);
  }

  async analyzeTypeCoverage() {
    const sourceFiles = this.getSourceFiles();
    let totalTypes = 0;
    let typedElements = 0;

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Count function parameters, return types, and variables
      const anyTypes = (content.match(/:\s*any/g) || []).length;
      const explicitTypes = (content.match(/:\s*[A-Z][a-zA-Z]*[^;]/g) || []).length;
      
      totalTypes += anyTypes + explicitTypes;
      typedElements += explicitTypes;
    }

    const coverage = totalTypes > 0 ? Math.round((typedElements / totalTypes) * 100) : 100;
    
    if (coverage < 95) {
      this.issues.push(`Type coverage: ${coverage}% (target: 95%+)`);
      this.recommendations.push('Add explicit type annotations to improve type safety');
    }

    console.log(`📋 Type coverage: ${coverage}%`);
    return coverage;
  }

  async analyzeTestCoverage() {
    console.log('🧪 Analyzing test coverage...');
    
    try {
      const { stdout } = await execAsync('npm run test:coverage -- --reporter=json', { 
        cwd: this.projectRoot 
      });
      
      // Parse coverage report (simplified)
      const coverage = this.extractCoverageFromOutput(stdout);
      this.metrics.testCoverage = coverage;
      
      if (coverage < 80) {
        this.issues.push(`Test coverage: ${coverage}% (target: 80%+)`);
        this.recommendations.push('Increase test coverage for business logic');
      }
      
      console.log(`✅ Test coverage: ${coverage}%`);
    } catch (error) {
      this.metrics.testCoverage = 0;
      this.issues.push('Test coverage analysis failed');
      console.log('❌ Test coverage: Analysis failed');
    }
  }

  async analyzeCodeQuality() {
    console.log('🔍 Analyzing code quality...');
    
    try {
      const { stdout } = await execAsync('npm run lint', { cwd: this.projectRoot });
      
      const warningCount = (stdout.match(/warning/gi) || []).length;
      const errorCount = (stdout.match(/error/gi) || []).length;
      
      // Calculate quality score
      const issues = warningCount + (errorCount * 2);
      this.metrics.codeQuality = Math.max(0, 100 - (issues * 2));
      
      if (issues > 0) {
        this.issues.push(`ESLint issues: ${errorCount} errors, ${warningCount} warnings`);
      }
      
      console.log(`✅ Code quality score: ${this.metrics.codeQuality}%`);
    } catch (error) {
      this.metrics.codeQuality = 50;
      this.issues.push('Code quality analysis failed');
      console.log('❌ Code quality: Analysis failed');
    }

    // Analyze file structure compliance
    await this.analyzeFileStructure();
  }

  async analyzeFileStructure() {
    const structureScore = this.checkArchitecturalStructure();
    this.metrics.codeQuality = Math.min(this.metrics.codeQuality, structureScore);
  }

  checkArchitecturalStructure() {
    const requiredDirs = [
      'src/business/core',
      'src/business/hooks',
      'src/types/services',
      'src/utils',
      'src/network/clients',
    ];

    const existingDirs = requiredDirs.filter(dir => 
      fs.existsSync(path.join(this.projectRoot, dir))
    );

    const score = Math.round((existingDirs.length / requiredDirs.length) * 100);
    
    if (score < 100) {
      this.issues.push(`Missing architectural directories: ${requiredDirs.length - existingDirs.length}`);
    }

    return score;
  }

  async analyzeDependencyHealth() {
    console.log('📦 Analyzing dependency health...');
    
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );

      // Check for outdated dependencies
      const { stdout } = await execAsync('npm outdated --json', { 
        cwd: this.projectRoot 
      });
      
      const outdated = JSON.parse(stdout || '{}');
      const outdatedCount = Object.keys(outdated).length;
      
      // Check for security vulnerabilities
      const auditResult = await this.checkSecurityVulnerabilities();
      
      this.metrics.dependencyHealth = Math.max(0, 100 - (outdatedCount * 5) - (auditResult.vulnerabilities * 10));
      
      if (outdatedCount > 0) {
        this.issues.push(`Outdated dependencies: ${outdatedCount} packages`);
        this.recommendations.push('Update outdated dependencies');
      }
      
      if (auditResult.vulnerabilities > 0) {
        this.issues.push(`Security vulnerabilities: ${auditResult.vulnerabilities} found`);
        this.recommendations.push('Fix security vulnerabilities');
      }
      
      console.log(`✅ Dependency health: ${this.metrics.dependencyHealth}%`);
    } catch (error) {
      this.metrics.dependencyHealth = 75;
      console.log('⚠️  Dependency health: Limited analysis');
    }
  }

  async checkSecurityVulnerabilities() {
    try {
      const { stdout } = await execAsync('npm audit --json', { 
        cwd: this.projectRoot 
      });
      
      const audit = JSON.parse(stdout);
      return {
        vulnerabilities: audit.metadata?.vulnerabilities?.total || 0,
      };
    } catch (error) {
      return { vulnerabilities: 0 };
    }
  }

  async analyzeArchitecturalCompliance() {
    console.log('🏗️  Analyzing architectural compliance...');
    
    let complianceScore = 100;
    
    // Check interface-first pattern compliance
    const interfaceCompliance = this.checkInterfaceFirstCompliance();
    complianceScore = Math.min(complianceScore, interfaceCompliance);
    
    // Check platform abstraction compliance
    const platformCompliance = this.checkPlatformAbstractionCompliance();
    complianceScore = Math.min(complianceScore, platformCompliance);
    
    // Check dependency injection compliance
    const diCompliance = this.checkDependencyInjectionCompliance();
    complianceScore = Math.min(complianceScore, diCompliance);
    
    this.metrics.architecturalCompliance = complianceScore;
    console.log(`✅ Architectural compliance: ${complianceScore}%`);
  }

  checkInterfaceFirstCompliance() {
    const serviceFiles = this.getFiles('src/business/core', /.*-operations\.ts$/);
    const interfaceFiles = this.getFiles('src/types/services', /.*\.interface\.ts$/);
    
    if (serviceFiles.length === 0) return 100;
    
    const compliance = Math.round((interfaceFiles.length / serviceFiles.length) * 100);
    
    if (compliance < 90) {
      this.issues.push(`Interface compliance: ${compliance}% (target: 90%+)`);
      this.recommendations.push('Define interfaces for all services');
    }
    
    return compliance;
  }

  checkPlatformAbstractionCompliance() {
    const businessFiles = this.getFiles('src/business', /\.ts$/);
    let violations = 0;
    
    const platformSpecificImports = [
      /import.*from ['"]react-native['"]/,
      /import.*from ['"]@react-native/,
      /import.*from ['"]react-native-/,
    ];
    
    for (const file of businessFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of platformSpecificImports) {
        if (pattern.test(content)) {
          violations++;
          break;
        }
      }
    }
    
    const compliance = businessFiles.length > 0 ? 
      Math.max(0, 100 - Math.round((violations / businessFiles.length) * 100)) : 100;
    
    if (compliance < 95) {
      this.issues.push(`Platform abstraction violations: ${violations} files`);
      this.recommendations.push('Remove platform-specific imports from business logic');
    }
    
    return compliance;
  }

  checkDependencyInjectionCompliance() {
    // Check that operations classes use constructor injection
    const operationFiles = this.getFiles('src/business/core', /-operations\.ts$/);
    let compliantFiles = 0;
    
    for (const file of operationFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (content.includes('constructor(') && content.includes('private ')) {
        compliantFiles++;
      }
    }
    
    const compliance = operationFiles.length > 0 ? 
      Math.round((compliantFiles / operationFiles.length) * 100) : 100;
    
    if (compliance < 90) {
      this.issues.push(`Dependency injection compliance: ${compliance}%`);
      this.recommendations.push('Use constructor injection in operations classes');
    }
    
    return compliance;
  }

  async analyzeAIReadiness() {
    console.log('🤖 Analyzing AI readiness...');
    
    let aiScore = 100;
    
    // Check for AI documentation
    const aiDocs = [
      '.ai/README.md',
      '.ai/architecture.md',
      '.ai/development-patterns.md',
      '.ai/prompting-guide.md',
    ];
    
    const existingAIDocs = aiDocs.filter(doc => 
      fs.existsSync(path.join(this.projectRoot, doc))
    );
    
    const docsScore = Math.round((existingAIDocs.length / aiDocs.length) * 100);
    aiScore = Math.min(aiScore, docsScore);
    
    // Check for comprehensive type definitions
    const sourceFiles = this.getSourceFiles();
    const filesWithJSDoc = sourceFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('/**');
    });
    
    const jsdocScore = sourceFiles.length > 0 ? 
      Math.round((filesWithJSDoc.length / sourceFiles.length) * 100) : 100;
    aiScore = Math.min(aiScore, jsdocScore);
    
    // Check for consistent patterns
    const patternScore = this.checkPatternConsistency();
    aiScore = Math.min(aiScore, patternScore);
    
    this.metrics.aiReadiness = aiScore;
    
    if (aiScore < 90) {
      this.recommendations.push('Improve AI readiness with better documentation and patterns');
    }
    
    console.log(`✅ AI readiness: ${aiScore}%`);
  }

  checkPatternConsistency() {
    // Check hook naming consistency
    const hookFiles = this.getFiles('src/business/hooks', /use.*\.ts$/);
    const consistentHooks = hookFiles.filter(file => {
      const basename = path.basename(file, '.ts');
      return basename.startsWith('use') && basename.length > 3;
    });
    
    const consistency = hookFiles.length > 0 ? 
      Math.round((consistentHooks.length / hookFiles.length) * 100) : 100;
    
    if (consistency < 95) {
      this.issues.push(`Hook naming consistency: ${consistency}%`);
    }
    
    return consistency;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROJECT HEALTH REPORT');
    console.log('='.repeat(60));
    
    // Overall score
    const overallScore = Math.round(
      (this.metrics.typeScriptHealth +
       this.metrics.testCoverage +
       this.metrics.codeQuality +
       this.metrics.dependencyHealth +
       this.metrics.architecturalCompliance +
       this.metrics.aiReadiness) / 6
    );
    
    console.log(`\n🎯 Overall Health Score: ${overallScore}/100 ${this.getScoreEmoji(overallScore)}`);
    
    // Detailed metrics
    console.log('\n📈 Detailed Metrics:');
    console.log(`  TypeScript Health:        ${this.metrics.typeScriptHealth}%`);
    console.log(`  Test Coverage:            ${this.metrics.testCoverage}%`);
    console.log(`  Code Quality:             ${this.metrics.codeQuality}%`);
    console.log(`  Dependency Health:        ${this.metrics.dependencyHealth}%`);
    console.log(`  Architectural Compliance: ${this.metrics.architecturalCompliance}%`);
    console.log(`  AI Readiness:             ${this.metrics.aiReadiness}%`);
    
    // Issues
    if (this.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    // Recommendations
    if (this.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    // Quick actions
    console.log('\n🚀 Quick Actions:');
    console.log('  npm run validate         # Run full validation');
    console.log('  npm run test:coverage    # Check test coverage');
    console.log('  npm run lint:fix         # Fix linting issues');
    console.log('  npm outdated            # Check dependency updates');
    
    console.log('\n' + '='.repeat(60));
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore,
      metrics: this.metrics,
      issues: this.issues,
      recommendations: this.recommendations,
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'health-report.json'),
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('📄 Report saved to health-report.json');
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  }

  getSourceFiles() {
    return this.getFiles('src', /\.ts$/).filter(file => !file.includes('.test.ts'));
  }

  getFiles(dir, pattern) {
    const fullDir = path.join(this.projectRoot, dir);
    if (!fs.existsSync(fullDir)) return [];
    
    const files = [];
    
    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      }
    };
    
    walk(fullDir);
    return files;
  }

  extractCoverageFromOutput(output) {
    // Simplified coverage extraction - would need to be more robust
    const coverageMatch = output.match(/All files.*?(\d+(?:\.\d+)?)%/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new ProjectHealthAnalyzer();
  analyzer.analyze();
}

module.exports = ProjectHealthAnalyzer;