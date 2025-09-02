#!/usr/bin/env node

/**
 * AI Development Helper: Service Generator
 * 
 * This script creates a complete service implementation following the project patterns.
 * Usage: npm run create:service <serviceName>
 * Example: npm run create:service my-service
 */

const fs = require('fs');
const path = require('path');

const serviceName = process.argv[2];

if (!serviceName) {
  console.error('❌ Error: Service name is required');
  console.log('Usage: npm run create:service <serviceName>');
  console.log('Example: npm run create:service my-service');
  process.exit(1);
}

// Convert service name to different formats
const kebabName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
const camelName = kebabName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
const capitalName = kebabName.toUpperCase().replace(/-/g, '_');

console.log(`🚀 Creating service: ${kebabName}`);
console.log(`   - Pascal case: ${pascalName}`);
console.log(`   - Camel case: ${camelName}`);

// Define file structure
const files = [
  {
    path: `src/types/services/${kebabName}.interface.ts`,
    template: 'service-interface.ts'
  },
  {
    path: `src/business/core/${kebabName}/${kebabName}-operations.ts`,
    template: 'business-operations.ts'
  },
  {
    path: `src/business/core/${kebabName}/index.ts`,
    template: 'business-index.ts'
  },
  {
    path: `src/utils/${kebabName}/${kebabName}.web.ts`,
    template: 'platform-implementation.ts'
  },
  {
    path: `src/utils/${kebabName}/${kebabName}.reactnative.ts`,
    template: 'platform-reactnative.ts'
  },
  {
    path: `src/utils/${kebabName}/index.ts`,
    template: 'utils-index.ts'
  },
  {
    path: `src/business/hooks/${kebabName}/use${pascalName}.ts`,
    template: 'react-hook.ts'
  },
  {
    path: `src/business/hooks/${kebabName}/index.ts`,
    template: 'hooks-index.ts'
  },
  {
    path: `src/business/core/${kebabName}/__tests__/${kebabName}-operations.test.ts`,
    template: 'test-example.ts'
  }
];

// Template replacements
const replacements = {
  'MyService': pascalName + 'Service',
  'MyServiceOperations': pascalName + 'Operations',
  'MyServiceData': pascalName + 'Data',
  'MyServiceConfig': pascalName + 'Config',
  'MyServiceResult': pascalName + 'Result',
  'MyServiceError': pascalName + 'ServiceError',
  'my-service': kebabName,
  'myService': camelName,
  'MY_SERVICE': capitalName,
  'useMyService': `use${pascalName}`,
  'createMyService': `create${pascalName}Service`,
  'WebMyService': `Web${pascalName}Service`
};

// Helper function to create directories recursively
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper function to apply template replacements
function applyReplacements(content) {
  let result = content;
  for (const [find, replace] of Object.entries(replacements)) {
    result = result.replace(new RegExp(find, 'g'), replace);
  }
  return result;
}

// Helper function to load template
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../templates', templateName);
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template not found: ${templateName}`);
    return getDefaultTemplate(templateName);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

// Default templates for missing files
function getDefaultTemplate(templateName) {
  switch (templateName) {
    case 'business-index.ts':
      return `export { ${pascalName}Operations } from './${kebabName}-operations';\n`;
      
    case 'platform-reactnative.ts':
      return `/**
 * React Native implementation of ${pascalName}Service
 * Location: src/utils/${kebabName}/${kebabName}.reactnative.ts
 */

import { ${pascalName}Service } from '../../types/services/${kebabName}.interface';

export class ReactNative${pascalName}Service implements ${pascalName}Service {
  // TODO: Implement React Native-specific logic
  async initialize(config: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  // TODO: Implement other interface methods
}

export const createReactNative${pascalName}Service = (): ${pascalName}Service => {
  return new ReactNative${pascalName}Service();
};
`;

    case 'utils-index.ts':
      return `/**
 * Platform-agnostic ${pascalName}Service factory
 */
import { ${pascalName}Service } from '../../types/services/${kebabName}.interface';

let ${camelName}Service: ${pascalName}Service;

function create${pascalName}Service(): ${pascalName}Service {
  if (typeof window !== 'undefined') {
    // Web environment
    const { createWeb${pascalName}Service } = require('./${kebabName}.web');
    return createWeb${pascalName}Service();
  } else {
    // React Native environment
    const { createReactNative${pascalName}Service } = require('./${kebabName}.reactnative');
    return createReactNative${pascalName}Service();
  }
}

export function get${pascalName}Service(): ${pascalName}Service {
  if (!${camelName}Service) {
    ${camelName}Service = create${pascalName}Service();
  }
  return ${camelName}Service;
}

export { create${pascalName}Service };
`;

    case 'hooks-index.ts':
      return `export { use${pascalName} } from './use${pascalName}';\n`;
      
    default:
      return `// TODO: Implement ${templateName}\n`;
  }
}

// Create all files
let createdFiles = 0;
let skippedFiles = 0;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file.path);
  
  if (fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping existing file: ${file.path}`);
    skippedFiles++;
    continue;
  }
  
  try {
    ensureDir(fullPath);
    
    let content = loadTemplate(file.template);
    content = applyReplacements(content);
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${file.path}`);
    createdFiles++;
  } catch (error) {
    console.error(`❌ Error creating ${file.path}:`, error.message);
  }
}

// Update main index exports
const mainIndexPath = path.join(process.cwd(), 'src/index.ts');
if (fs.existsSync(mainIndexPath)) {
  const indexContent = fs.readFileSync(mainIndexPath, 'utf8');
  const serviceExport = `export * from './business/core/${kebabName}';`;
  const hookExport = `export * from './business/hooks/${kebabName}';`;
  const typeExport = `export * from './types/services/${kebabName}.interface';`;
  
  if (!indexContent.includes(serviceExport)) {
    fs.appendFileSync(mainIndexPath, `\n${serviceExport}`);
    console.log(`✅ Added service export to main index`);
  }
  
  if (!indexContent.includes(hookExport)) {
    fs.appendFileSync(mainIndexPath, `\n${hookExport}`);
    console.log(`✅ Added hook export to main index`);
  }
  
  if (!indexContent.includes(typeExport)) {
    fs.appendFileSync(mainIndexPath, `\n${typeExport}`);
    console.log(`✅ Added type export to main index`);
  }
}

console.log(`\n🎉 Service creation complete!`);
console.log(`   Created: ${createdFiles} files`);
console.log(`   Skipped: ${skippedFiles} files`);

console.log(`\n📝 Next steps:`);
console.log(`   1. Implement the interface in src/types/services/${kebabName}.interface.ts`);
console.log(`   2. Add business logic in src/business/core/${kebabName}/${kebabName}-operations.ts`);
console.log(`   3. Implement platform-specific code in src/utils/${kebabName}/`);
console.log(`   4. Create React hooks in src/business/hooks/${kebabName}/`);
console.log(`   5. Write comprehensive tests`);
console.log(`   6. Run: npm run check-all`);

console.log(`\n🔧 Useful commands:`);
console.log(`   npm run typecheck    - Check TypeScript types`);
console.log(`   npm run lint         - Check code quality`);
console.log(`   npm run test         - Run tests`);
console.log(`   npm run build        - Build the library`);