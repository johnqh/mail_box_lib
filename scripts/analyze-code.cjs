#!/usr/bin/env node

/**
 * AI-Friendly Code Analysis Tool
 * Provides quick insights about the codebase for AI assistants
 */

const fs = require('fs');
const path = require('path');

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = {
    files: [],
    totalLines: 0,
    directories: new Set(),
    fileTypes: {},
  };

  function walkDir(currentDir, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          if (item === 'node_modules' || item === '.git' || item === 'coverage' || item === 'dist') {
            continue;
          }
          results.directories.add(currentDir);
          walkDir(itemPath, depth + 1);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            const relativePath = path.relative(process.cwd(), itemPath);
            const lines = countLines(itemPath);
            
            results.files.push({
              path: relativePath,
              lines,
              extension: ext,
              size: stat.size,
            });
            
            results.totalLines += lines;
            results.fileTypes[ext] = (results.fileTypes[ext] || 0) + 1;
          }
        }
      }
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  walkDir(dir);
  return results;
}

function analyzeProject() {
  console.log('🔍 AI Code Analysis for @johnqh/lib');
  console.log('=====================================\n');

  // Analyze source code
  const srcAnalysis = scanDirectory('./src');
  console.log('📊 Source Code Analysis:');
  console.log(`  • Total files: ${srcAnalysis.files.length}`);
  console.log(`  • Total lines: ${srcAnalysis.totalLines.toLocaleString()}`);
  console.log(`  • File types: ${Object.entries(srcAnalysis.fileTypes).map(([ext, count]) => `${ext}(${count})`).join(', ')}`);
  
  // Find largest files
  const largestFiles = srcAnalysis.files
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5);
  
  console.log('\n📄 Largest Files:');
  largestFiles.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.path} (${file.lines} lines)`);
  });

  // Analyze architecture
  const hooks = srcAnalysis.files.filter(f => f.path.includes('/hooks/'));
  const types = srcAnalysis.files.filter(f => f.path.includes('/types/'));
  const business = srcAnalysis.files.filter(f => f.path.includes('/business/'));
  const utils = srcAnalysis.files.filter(f => f.path.includes('/utils/'));

  console.log('\n🏗️ Architecture Breakdown:');
  console.log(`  • Business Logic: ${business.length} files (${business.reduce((sum, f) => sum + f.lines, 0)} lines)`);
  console.log(`  • React Hooks: ${hooks.length} files (${hooks.reduce((sum, f) => sum + f.lines, 0)} lines)`);
  console.log(`  • Type Definitions: ${types.length} files (${types.reduce((sum, f) => sum + f.lines, 0)} lines)`);
  console.log(`  • Utilities: ${utils.length} files (${utils.reduce((sum, f) => sum + f.lines, 0)} lines)`);

  // Analyze tests
  const testFiles = srcAnalysis.files.filter(f => f.path.includes('.test.') || f.path.includes('.spec.'));
  const testCoverage = testFiles.length > 0 ? ((testFiles.length / srcAnalysis.files.length) * 100).toFixed(1) : 0;

  console.log('\n🧪 Testing:');
  console.log(`  • Test files: ${testFiles.length}`);
  console.log(`  • Test coverage: ${testCoverage}% (files with tests)`);

  // Find potential issues
  console.log('\n⚠️  Potential Areas for AI Attention:');
  
  // Large files that might need refactoring
  const largeFiles = srcAnalysis.files.filter(f => f.lines > 300);
  if (largeFiles.length > 0) {
    console.log(`  • ${largeFiles.length} files >300 lines (consider refactoring):`);
    largeFiles.forEach(f => console.log(`    - ${f.path} (${f.lines} lines)`));
  }

  // Files without tests
  const sourceFiles = srcAnalysis.files.filter(f => 
    !f.path.includes('.test.') && 
    !f.path.includes('.spec.') && 
    !f.path.includes('/types/') &&
    (f.path.includes('/business/') || f.path.includes('/utils/'))
  );
  
  const filesWithoutTests = sourceFiles.filter(f => {
    const testPath1 = f.path.replace('.ts', '.test.ts');
    const testPath2 = f.path.replace('.ts', '.spec.ts');
    const testDirPath = f.path.replace(/\/([^\/]+)\.ts$/, '/__tests__/$1.test.ts');
    
    return !testFiles.some(t => t.path === testPath1 || t.path === testPath2 || t.path === testDirPath);
  });

  if (filesWithoutTests.length > 0 && filesWithoutTests.length < 20) {
    console.log(`  • ${filesWithoutTests.length} business files without tests:`);
    filesWithoutTests.slice(0, 10).forEach(f => console.log(`    - ${f.path}`));
    if (filesWithoutTests.length > 10) console.log(`    ... and ${filesWithoutTests.length - 10} more`);
  }

  // Hook patterns analysis
  const indexerHooks = hooks.filter(f => f.path.includes('/indexer/'));
  const wildduckHooks = hooks.filter(f => f.path.includes('/wildduck/'));
  
  console.log('\n🪝 Hook Patterns:');
  console.log(`  • Indexer hooks: ${indexerHooks.length} (use endpointUrl, dev params)`);
  console.log(`  • WildDuck hooks: ${wildduckHooks.length} (use config: WildDuckConfig param)`);

  // Package analysis
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    
    console.log('\n📦 Dependencies:');
    console.log(`  • Runtime dependencies: ${depCount}`);
    console.log(`  • Dev dependencies: ${devDepCount}`);
    console.log(`  • Package version: ${packageJson.version}`);
  } catch {
    // Skip if package.json not readable
  }

  console.log('\n🤖 AI Development Tips:');
  console.log('  • Use `npm run create:hook` for new hooks');
  console.log('  • Use `npm run create:type` for new interfaces');
  console.log('  • Run `npm run check-all` before committing');
  console.log('  • See CLAUDE.md for complete development guide');
  console.log('  • Hook params: indexer(endpointUrl, dev), wildduck(config)');
}

analyzeProject();