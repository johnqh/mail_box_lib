#!/usr/bin/env node

/**
 * AI-Assisted Development Code Analysis Tool
 * Provides comprehensive project analysis for AI assistants
 */

const fs = require('fs');
const path = require('path');

class ProjectAnalyzer {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.stats = {
      files: { total: 0, byType: {} },
      lines: { total: 0, byType: {} },
      complexity: { hooks: 0, services: 0, components: 0, tests: 0 },
      patterns: { singleton: 0, hooks: 0, factories: 0, interfaces: 0 },
      dependencies: { internal: [], external: [] },
      quality: { coverage: 0, lintErrors: 0, typeErrors: 0 }
    };
  }

  async analyze() {
    console.log('🤖 AI-Assisted Development Analysis');
    console.log('==================================\n');
    
    this.analyzeFileStructure();
    this.analyzeCodePatterns();
    this.analyzeDependencies();
    this.analyzeQualityMetrics();
    this.generateAIRecommendations();
    
    return this.stats;
  }

  analyzeFileStructure() {
    console.log('📁 Project Structure Analysis');
    console.log('----------------------------');
    
    const srcDir = path.join(this.rootDir, 'src');
    this.walkDirectory(srcDir);
    
    console.log(`Total files: ${this.stats.files.total}`);
    console.log(`Total lines: ${this.stats.lines.total}\n`);
    
    console.log('File types:');
    Object.entries(this.stats.files.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} files`);
    });
    console.log('');
  }

  walkDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'coverage'].includes(item)) {
          this.walkDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        this.analyzeFile(fullPath);
      }
    }
  }

  analyzeFile(filePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    
    this.stats.files.total++;
    this.stats.files.byType[ext] = (this.stats.files.byType[ext] || 0) + 1;
    this.stats.lines.total += lines;
    this.stats.lines.byType[ext] = (this.stats.lines.byType[ext] || 0) + lines;
    
    // Analyze code patterns in TypeScript files
    if (['.ts', '.tsx'].includes(ext)) {
      this.analyzeTypeScriptFile(filePath, content);
    }
  }

  analyzeTypeScriptFile(filePath, content) {
    const relativePath = path.relative(this.rootDir, filePath);
    
    // Count patterns
    if (content.includes('interface ')) this.stats.patterns.interfaces++;
    if (content.includes('class ') && content.includes('private static instance')) {
      this.stats.patterns.singleton++;
    }
    if (content.includes('export function create') || content.includes('Factory')) {
      this.stats.patterns.factories++;
    }
    if (content.includes('use') && content.includes('useState')) {
      this.stats.patterns.hooks++;
      this.stats.complexity.hooks++;
    }
    
    // Count component types
    if (relativePath.includes('/hooks/')) this.stats.complexity.hooks++;
    if (relativePath.includes('/services/') || relativePath.includes('-service.ts')) {
      this.stats.complexity.services++;
    }
    if (content.includes('React.FC') || content.includes('function') && content.includes('return')) {
      this.stats.complexity.components++;
    }
    if (relativePath.includes('test') || relativePath.includes('spec')) {
      this.stats.complexity.tests++;
    }
  }

  analyzeCodePatterns() {
    console.log('🎨 Code Patterns Analysis');
    console.log('-------------------------');
    
    console.log(`Design Patterns:`);
    console.log(`  Singletons: ${this.stats.patterns.singleton}`);
    console.log(`  Factories: ${this.stats.patterns.factories}`);
    console.log(`  Interfaces: ${this.stats.patterns.interfaces}`);
    console.log(`  Hooks: ${this.stats.patterns.hooks}\n`);
    
    console.log(`Code Complexity:`);
    console.log(`  React Hooks: ${this.stats.complexity.hooks}`);
    console.log(`  Services: ${this.stats.complexity.services}`);
    console.log(`  Components: ${this.stats.complexity.components}`);
    console.log(`  Tests: ${this.stats.complexity.tests}\n`);
  }

  analyzeDependencies() {
    console.log('📦 Dependencies Analysis');
    console.log('------------------------');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(
        path.join(this.rootDir, 'package.json'), 'utf8'
      ));
      
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});
      
      this.stats.dependencies.external = [...deps, ...devDeps];
      
      console.log(`External dependencies: ${deps.length}`);
      console.log(`Development dependencies: ${devDeps.length}`);
      
      // Identify internal dependencies (starting with @johnqh)
      const internalDeps = deps.filter(dep => dep.startsWith('@johnqh'));
      this.stats.dependencies.internal = internalDeps;
      
      console.log(`Internal dependencies: ${internalDeps.length}`);
      if (internalDeps.length > 0) {
        internalDeps.forEach(dep => console.log(`  - ${dep}`));
      }
      console.log('');
    } catch (error) {
      console.log('Could not analyze package.json\n');
    }
  }

  analyzeQualityMetrics() {
    console.log('🏆 Quality Metrics');
    console.log('------------------');
    
    // Test coverage (if coverage files exist)
    const coverageFile = path.join(this.rootDir, 'coverage/coverage-summary.json');
    if (fs.existsSync(coverageFile)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        this.stats.quality.coverage = coverage.total?.statements?.pct || 0;
        console.log(`Test coverage: ${this.stats.quality.coverage}%`);
      } catch (error) {
        console.log('Test coverage: Unable to read');
      }
    } else {
      console.log('Test coverage: Not available');
    }
    
    console.log(`Test files: ${this.stats.complexity.tests}`);
    console.log(`Test to code ratio: ${this.calculateTestRatio()}%\n`);
  }

  calculateTestRatio() {
    const codeFiles = this.stats.files.total - this.stats.complexity.tests;
    if (codeFiles === 0) return 0;
    return Math.round((this.stats.complexity.tests / codeFiles) * 100);
  }

  generateAIRecommendations() {
    console.log('🤖 AI Assistant Recommendations');
    console.log('-------------------------------');
    
    const recommendations = [];
    
    // Architecture recommendations
    if (this.stats.patterns.interfaces < 10) {
      recommendations.push('🔷 Consider defining more interfaces for better type safety');
    }
    
    if (this.stats.patterns.singleton > 0) {
      recommendations.push('✅ Good use of singleton pattern detected');
    }
    
    if (this.stats.complexity.hooks > 10) {
      recommendations.push('🎣 Rich hook ecosystem - easy to extend functionality');
    }
    
    // Quality recommendations
    if (this.stats.quality.coverage < 80) {
      recommendations.push('🧪 Consider increasing test coverage (target: 80%+)');
    }
    
    if (this.calculateTestRatio() < 30) {
      recommendations.push('📝 Consider adding more test files');
    }
    
    // AI Development recommendations
    recommendations.push('🔄 Use `npm run check-all` before AI tasks');
    recommendations.push('📖 Check CLAUDE.md for AI development patterns');
    recommendations.push('🛠️ Use templates in templates/ for new components');
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Project is well-structured for AI development!');
    }
    
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.log('');
  }

  generateAIContext() {
    console.log('📋 AI Development Context');
    console.log('-------------------------');
    
    console.log('Key project characteristics for AI assistants:');
    console.log(`• TypeScript library with ${this.stats.files.byType['.ts'] || 0} TS files`);
    console.log(`• React integration with ${this.stats.patterns.hooks} custom hooks`);
    console.log(`• ${this.stats.patterns.interfaces} interfaces for type safety`);
    console.log(`• ${this.stats.complexity.services} service classes`);
    console.log(`• ${this.stats.complexity.tests} test files for quality assurance`);
    
    if (this.stats.patterns.singleton > 0) {
      console.log(`• Singleton pattern used for state management`);
    }
    
    console.log('\nCommon AI tasks:');
    console.log('• Adding new hooks: Use templates/react-hook.ts');
    console.log('• Creating services: Use templates/service-template.ts');
    console.log('• Type definitions: Add to src/types/');
    console.log('• Business logic: Add to src/business/core/');
    console.log('• Network clients: Add to src/network/clients/');
    
    console.log('\nQuick commands:');
    console.log('• npm run quick-check    # Fast validation');
    console.log('• npm run check-all      # Full quality check');
    console.log('• npm run create:hook    # Generate new hook');
    console.log('• npm run create:service # Generate new service');
    console.log('• npm run analyze:code   # This analysis');
    console.log('');
  }

  generateReport() {
    this.generateAIContext();
    
    console.log('💡 Project Health Summary');
    console.log('-------------------------');
    
    const health = this.calculateHealthScore();
    console.log(`Overall Health Score: ${health}/100`);
    
    const healthIndicators = [
      { name: 'Type Safety', score: Math.min(this.stats.patterns.interfaces * 10, 100) },
      { name: 'Test Coverage', score: this.stats.quality.coverage || 0 },
      { name: 'Code Organization', score: this.stats.complexity.services > 0 ? 90 : 70 },
      { name: 'AI Readiness', score: this.calculateAIReadiness() }
    ];
    
    healthIndicators.forEach(indicator => {
      const status = indicator.score >= 80 ? '🟢' : indicator.score >= 60 ? '🟡' : '🔴';
      console.log(`${status} ${indicator.name}: ${indicator.score}/100`);
    });
    console.log('');
  }

  calculateHealthScore() {
    let score = 0;
    
    // Code organization (25 points)
    score += Math.min((this.stats.patterns.interfaces / 20) * 25, 25);
    
    // Test coverage (25 points)  
    score += (this.stats.quality.coverage || 0) * 0.25;
    
    // Code patterns (25 points)
    score += Math.min((this.stats.complexity.hooks / 10) * 25, 25);
    
    // AI readiness (25 points)
    score += this.calculateAIReadiness() * 0.25;
    
    return Math.round(score);
  }

  calculateAIReadiness() {
    let score = 0;
    
    // Documentation
    if (fs.existsSync(path.join(this.rootDir, 'CLAUDE.md'))) score += 20;
    if (fs.existsSync(path.join(this.rootDir, 'templates'))) score += 20;
    if (fs.existsSync(path.join(this.rootDir, 'docs'))) score += 20;
    
    // Code quality
    if (this.stats.complexity.tests > 0) score += 20;
    if (this.stats.patterns.interfaces > 10) score += 20;
    
    return score;
  }
}

// CLI usage
async function main() {
  const analyzer = new ProjectAnalyzer();
  await analyzer.analyze();
  analyzer.generateReport();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProjectAnalyzer };