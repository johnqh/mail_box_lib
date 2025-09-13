#!/usr/bin/env node

/**
 * AI-Friendly Hook Generator
 * Creates a new React hook with proper TypeScript patterns
 */

const fs = require('fs');
const path = require('path');

const hookTemplate = (hookName, hookType, params) => `import { useCallback, useState } from 'react';
${hookType === 'indexer' ? "import { IndexerClient } from '../../../network/clients/indexer';" : ''}
${hookType === 'wildduck' ? "import { WildDuckConfig } from '../../../network/clients/wildduck';\nimport axios from 'axios';" : ''}

interface ${hookName.charAt(0).toUpperCase() + hookName.slice(1)}Return {
  isLoading: boolean;
  error: string | null;
  fetchData: (param: string) => Promise<any>;
  clearError: () => void;
}

/**
 * ${hookName} hook for ${hookType} operations
 */
export const ${hookName} = (${params}): ${hookName.charAt(0).toUpperCase() + hookName.slice(1)}Return => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
${hookType === 'indexer' ? '  const client = new IndexerClient(endpointUrl, dev);' : ''}

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchData = useCallback(async (param: string) => {
    setIsLoading(true);
    setError(null);

    try {
${hookType === 'indexer' ? 
`      const result = await client.someEndpoint(param);
      return result;` :
`      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (config.cloudflareWorkerUrl) {
        headers['Authorization'] = \`Bearer \${config.apiToken}\`;
        headers['X-App-Source'] = '0xmail-box';
      } else {
        headers['X-Access-Token'] = config.apiToken;
      }

      const response = await axios.get(\`\${apiUrl}/your-endpoint/\${param}\`, { headers });
      return response.data;`}
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [${hookType === 'indexer' ? 'client' : 'config'}]);

  return {
    isLoading,
    error,
    fetchData,
    clearError,
  };
};

export type { ${hookName.charAt(0).toUpperCase() + hookName.slice(1)}Return };
`;

function generateHook() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run create:hook <hookName> <indexer|wildduck>');
    console.log('Example: npm run create:hook useIndexerNewFeature indexer');
    console.log('Example: npm run create:hook useWildduckNewFeature wildduck');
    process.exit(1);
  }

  const [hookName, hookType] = args;
  
  if (!['indexer', 'wildduck'].includes(hookType)) {
    console.log('Hook type must be either "indexer" or "wildduck"');
    process.exit(1);
  }

  const params = hookType === 'indexer' 
    ? 'endpointUrl: string, dev: boolean'
    : 'config: WildDuckConfig';

  const targetDir = path.join(__dirname, `../src/business/hooks/${hookType}`);
  const fileName = `${hookName}.ts`;
  const filePath = path.join(targetDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`❌ Hook ${hookName} already exists at ${filePath}`);
    process.exit(1);
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate hook file
  const content = hookTemplate(hookName, hookType, params);
  fs.writeFileSync(filePath, content);

  // Update index.ts to export the new hook
  const indexPath = path.join(targetDir, 'index.ts');
  let indexContent = '';
  
  if (fs.existsSync(indexPath)) {
    indexContent = fs.readFileSync(indexPath, 'utf8');
  }
  
  const exportLine = `export { ${hookName} } from './${fileName.replace('.ts', '')}';`;
  
  if (!indexContent.includes(exportLine)) {
    const updatedIndex = indexContent.trim() + (indexContent ? '\n' : '') + exportLine + '\n';
    fs.writeFileSync(indexPath, updatedIndex);
  }

  console.log('✅ Hook created successfully!');
  console.log(`📁 File: ${filePath}`);
  console.log(`📦 Export added to: ${indexPath}`);
  console.log('');
  console.log('🔧 Next steps:');
  console.log('1. Update the API client with your new endpoint');
  console.log('2. Replace "someEndpoint" or "/your-endpoint/" with actual API call');
  console.log('3. Add proper TypeScript interfaces for request/response');
  console.log('4. Run npm run check-all to validate');
  console.log('');
  console.log(`🎯 Hook signature: ${hookName}(${params})`);
}

generateHook();