#!/usr/bin/env node

/**
 * AI-Friendly Type Generator
 * Creates new TypeScript interface files with proper patterns
 */

const fs = require('fs');
const path = require('path');

const typeTemplate = (typeName, typeKind, hasValidation) => {
  const interfaceName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
  
  const validationCode = hasValidation ? `
/**
 * Validation utilities for ${interfaceName}
 */
export const validate${interfaceName} = (data: unknown): data is ${interfaceName} => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  // Add validation logic here
  // Example: return typeof obj.requiredField === 'string';
  return true; // TODO: Implement actual validation
};

export const is${interfaceName} = (data: unknown): data is ${interfaceName} => {
  try {
    return validate${interfaceName}(data);
  } catch {
    return false;
  }
};

export const assert${interfaceName} = (data: unknown, context = '${interfaceName}'): asserts data is ${interfaceName} => {
  if (!validate${interfaceName}(data)) {
    throw new Error(\`Invalid \${context}: expected ${interfaceName}\`);
  }
};
` : '';

  if (typeKind === 'service') {
    return `/**
 * ${interfaceName} service interface
 * 
 * This service handles [describe functionality here]
 */

export interface ${interfaceName} {
  /**
   * Example method - replace with actual service methods
   */
  method(param: string): Promise<${interfaceName}Result>;
}

export interface ${interfaceName}Result {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ${interfaceName}Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Configuration for ${interfaceName}
 */
export interface ${interfaceName}Config {
  // Add configuration properties here
  endpoint?: string;
  timeout?: number;
}
${validationCode}`;
  }

  if (typeKind === 'data') {
    return `/**
 * ${interfaceName} data types
 * 
 * Represents [describe data structure here]
 */

export interface ${interfaceName} {
  id: string;
  // Add properties here
  createdAt: string;
  updatedAt: string;
}

export interface Create${interfaceName}Params {
  // Add creation parameters here
}

export interface Update${interfaceName}Params {
  // Add update parameters here (all optional)
}

export interface ${interfaceName}Query {
  // Add query parameters here
  limit?: number;
  offset?: number;
}

export interface ${interfaceName}Response {
  success: boolean;
  data: ${interfaceName}[];
  count: number;
}
${validationCode}`;
  }

  if (typeKind === 'api') {
    return `/**
 * ${interfaceName} API types
 * 
 * Request/response types for ${interfaceName} API endpoints
 */

export interface ${interfaceName}Request {
  // Add request properties here
}

export interface ${interfaceName}Response {
  success: boolean;
  data?: ${interfaceName}Data;
  error?: string;
  message?: string;
}

export interface ${interfaceName}Data {
  // Add response data properties here
}

export interface ${interfaceName}ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ${interfaceName}ApiResponse = ${interfaceName}Response | ${interfaceName}ErrorResponse;
${validationCode}`;
  }

  return `/**
 * ${interfaceName} types
 * 
 * [Add description here]
 */

export interface ${interfaceName} {
  // Add properties here
}

export type ${interfaceName}Status = 'pending' | 'completed' | 'failed';

export interface ${interfaceName}Options {
  // Add options here
}
${validationCode}`;
};

function generateType() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run create:type <typeName> <service|data|api|interface> [--validation]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run create:type UserProfile data --validation');
    console.log('  npm run create:type EmailService service');
    console.log('  npm run create:type AuthApi api --validation');
    console.log('  npm run create:type MyInterface interface');
    console.log('');
    console.log('Type kinds:');
    console.log('  service - Service interface with methods and config');
    console.log('  data - Data model with CRUD operations');
    console.log('  api - API request/response types');
    console.log('  interface - Generic interface');
    process.exit(1);
  }

  const [typeName, typeKind] = args;
  const hasValidation = args.includes('--validation');
  
  if (!['service', 'data', 'api', 'interface'].includes(typeKind)) {
    console.log('Type kind must be one of: service, data, api, interface');
    process.exit(1);
  }

  // Determine target directory based on type kind
  const typeDir = typeKind === 'service' ? 'services' : 
                  typeKind === 'data' ? 'data' :
                  typeKind === 'api' ? 'api' : 'common';
  
  const targetDir = path.join(__dirname, `../src/types/${typeDir}`);
  const fileName = `${typeName.toLowerCase()}.interface.ts`;
  const filePath = path.join(targetDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`❌ Type ${typeName} already exists at ${filePath}`);
    process.exit(1);
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate type file
  const content = typeTemplate(typeName, typeKind, hasValidation);
  fs.writeFileSync(filePath, content);

  // Update index.ts to export the new type
  const indexPath = path.join(targetDir, 'index.ts');
  let indexContent = '';
  
  if (fs.existsSync(indexPath)) {
    indexContent = fs.readFileSync(indexPath, 'utf8');
  }
  
  const exportLine = `export * from './${fileName.replace('.ts', '')}';`;
  
  if (!indexContent.includes(exportLine)) {
    const updatedIndex = indexContent.trim() + (indexContent ? '\n' : '') + exportLine + '\n';
    fs.writeFileSync(indexPath, updatedIndex);
  }

  console.log('✅ Type interface created successfully!');
  console.log(`📁 File: ${filePath}`);
  console.log(`📦 Export added to: ${indexPath}`);
  
  if (hasValidation) {
    console.log('🛡️  Validation helpers included');
  }
  
  console.log('');
  console.log('🔧 Next steps:');
  console.log('1. Replace placeholder properties with actual interface definition');
  console.log('2. Update validation logic if --validation was used');
  console.log('3. Add JSDoc comments for all properties');
  console.log('4. Run npm run check-all to validate');
  console.log('');
  console.log(`🎯 Interface: ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`);
  
  if (typeKind === 'service') {
    console.log('💡 Consider creating corresponding operations class in src/business/core/');
  }
}

generateType();