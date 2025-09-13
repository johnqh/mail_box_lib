#!/usr/bin/env node

/**
 * Script to find wallet-related components that need to be updated
 * to use the new wallet status hook
 */

const fs = require('fs');
const path = require('path');

// Patterns to look for in components
const WALLET_PATTERNS = [
  /wallet.*address/i,
  /connect.*wallet/i,
  /disconnect.*wallet/i,
  /verify.*wallet/i,
  /wallet.*status/i,
  /wallet.*state/i,
  /isConnected/i,
  /isVerified/i,
  /setWalletAddress/i,
  /useState.*wallet/i,
  /useEffect.*wallet/i,
  /ethereum\.request/i,
  /personal_sign/i,
  /eth_requestAccounts/i
];

// File patterns to search
const FILE_PATTERNS = [
  '**/*.tsx',
  '**/*.ts',
  '**/*.jsx',
  '**/*.js'
];

// Directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next'
];

function findWalletComponents(rootDir) {
  const results = [];

  function searchDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDE_PATTERNS.includes(item)) continue;
        searchDirectory(fullPath);
      } else if (stat.isFile()) {
        // Check file extensions
        const ext = path.extname(item).toLowerCase();
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) continue;

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = [];

          // Check each pattern
          for (const pattern of WALLET_PATTERNS) {
            const match = content.match(pattern);
            if (match) {
              matches.push({
                pattern: pattern.toString(),
                match: match[0],
                line: getLineNumber(content, match.index)
              });
            }
          }

          if (matches.length > 0) {
            results.push({
              file: fullPath,
              matches,
              isComponent: isReactComponent(content),
              hasHooks: hasReactHooks(content),
              priority: calculatePriority(content, matches)
            });
          }
        } catch (error) {
          console.warn(`Could not read file: ${fullPath}`);
        }
      }
    }
  }

  searchDirectory(rootDir);
  return results;
}

function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

function isReactComponent(content) {
  return (
    content.includes('import React') ||
    content.includes('from "react"') ||
    content.includes('from \'react\'') ||
    /function\s+\w+\s*\([^)]*\)\s*{[^}]*return\s*\(/m.test(content) ||
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*return\s*\(/m.test(content)
  );
}

function hasReactHooks(content) {
  return (
    content.includes('useState') ||
    content.includes('useEffect') ||
    content.includes('useCallback') ||
    content.includes('useMemo') ||
    content.includes('useContext')
  );
}

function calculatePriority(content, matches) {
  let priority = 0;
  
  // Higher priority for components with multiple wallet patterns
  priority += matches.length;
  
  // Higher priority for components with state management
  if (content.includes('useState')) priority += 2;
  if (content.includes('useEffect')) priority += 2;
  
  // Higher priority for components with wallet connection logic
  if (content.includes('eth_requestAccounts')) priority += 3;
  if (content.includes('personal_sign')) priority += 3;
  
  // Higher priority for components in key directories
  if (content.includes('Header') || content.includes('TopBar') || content.includes('Navbar')) {
    priority += 5;
  }
  
  return priority;
}

function generateReport(results) {
  console.log('🔍 Wallet Component Analysis Report');
  console.log('=====================================\n');
  
  if (results.length === 0) {
    console.log('✅ No wallet-related components found.');
    return;
  }
  
  // Sort by priority
  results.sort((a, b) => b.priority - a.priority);
  
  console.log(`Found ${results.length} files with wallet-related code:\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${path.relative(process.cwd(), result.file)}`);
    console.log(`   Priority: ${result.priority} | Component: ${result.isComponent ? 'Yes' : 'No'} | Has Hooks: ${result.hasHooks ? 'Yes' : 'No'}`);
    
    result.matches.forEach(match => {
      console.log(`   📍 Line ${match.line}: ${match.match} (${match.pattern})`);
    });
    console.log('');
  });
  
  // Generate recommendations
  console.log('💡 Recommendations:');
  console.log('==================');
  
  const highPriority = results.filter(r => r.priority >= 5);
  const components = results.filter(r => r.isComponent);
  const hookComponents = results.filter(r => r.hasHooks);
  
  if (highPriority.length > 0) {
    console.log(`\n🔴 High Priority (${highPriority.length} files):`);
    console.log('These files should be updated first:');
    highPriority.slice(0, 5).forEach(r => {
      console.log(`   • ${path.relative(process.cwd(), r.file)}`);
    });
  }
  
  if (components.length > 0) {
    console.log(`\n🟡 React Components (${components.length} files):`);
    console.log('These can use the useWalletStatus hook:');
    components.slice(0, 5).forEach(r => {
      console.log(`   • ${path.relative(process.cwd(), r.file)}`);
    });
  }
  
  if (hookComponents.length > 0) {
    console.log(`\n🟢 Components with Hooks (${hookComponents.length} files):`);
    console.log('These already use hooks and can easily migrate:');
    hookComponents.slice(0, 5).forEach(r => {
      console.log(`   • ${path.relative(process.cwd(), r.file)}`);
    });
  }
  
  console.log('\n📚 Migration Steps:');
  console.log('1. Install @johnqh/lib with wallet status hook');
  console.log('2. Replace manual wallet state with useWalletStatus()');
  console.log('3. Update wallet connection/verification logic');
  console.log('4. Test wallet operations in each component');
  console.log('\nSee docs/TOP_BAR_WALLET_INTEGRATION.md for detailed guide.');
}

// CLI usage
if (require.main === module) {
  const targetDir = process.argv[2] || process.cwd();
  
  console.log(`🔍 Searching for wallet components in: ${targetDir}\n`);
  
  const results = findWalletComponents(targetDir);
  generateReport(results);
}

module.exports = { findWalletComponents, generateReport };