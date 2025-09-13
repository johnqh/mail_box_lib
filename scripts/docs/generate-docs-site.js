#!/usr/bin/env node

/**
 * Documentation Site Generator
 * Creates comprehensive documentation website with interactive examples
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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

class DocumentationSiteGenerator {
  constructor() {
    this.outputDir = 'docs-site';
    this.templateDir = 'templates/docs';
    this.sourceFiles = new Map();
    this.apiDocumentation = new Map();
    this.examples = new Map();
  }

  async generateSite() {
    log(colors.cyan, '📚 Generating comprehensive documentation site...\n');

    await this.createDirectoryStructure();
    await this.analyzeSourceCode();
    await this.generateApiDocumentation();
    await this.generateInteractiveExamples();
    await this.generateGuidesAndTutorials();
    await this.generateSiteConfiguration();
    await this.createIndexPages();

    log(colors.green, '✅ Documentation site generated successfully!');
    log(colors.cyan, `📁 Site location: ${this.outputDir}/`);
  }

  async createDirectoryStructure() {
    const dirs = [
      this.outputDir,
      `${this.outputDir}/api`,
      `${this.outputDir}/guides`,
      `${this.outputDir}/examples`,
      `${this.outputDir}/tutorials`,
      `${this.outputDir}/assets`,
      `${this.outputDir}/assets/css`,
      `${this.outputDir}/assets/js`,
      `${this.outputDir}/components`,
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    log(colors.blue, '📁 Created directory structure');
  }

  async analyzeSourceCode() {
    log(colors.blue, '🔍 Analyzing source code...');

    const srcDir = 'src';
    await this.scanDirectory(srcDir);

    log(colors.green, `✅ Analyzed ${this.sourceFiles.size} source files`);
  }

  async scanDirectory(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory() && !item.name.startsWith('.')) {
          await this.scanDirectory(itemPath);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          await this.analyzeSourceFile(itemPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
    }
  }

  async analyzeSourceFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const analysis = this.extractDocumentationInfo(content, filePath);
      
      if (analysis) {
        this.sourceFiles.set(filePath, analysis);
      }
    } catch (error) {
      log(colors.red, `❌ Error analyzing ${filePath}: ${error.message}`);
    }
  }

  extractDocumentationInfo(content, filePath) {
    const info = {
      filePath,
      exports: [],
      interfaces: [],
      functions: [],
      classes: [],
      hooks: [],
      comments: [],
    };

    // Extract exports
    const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
    if (exportMatches) {
      info.exports = exportMatches.map(match => {
        const name = match.match(/(\w+)$/)[1];
        return { name, type: this.getExportType(match) };
      });
    }

    // Extract interfaces
    const interfaceMatches = content.match(/(?:export\s+)?interface\s+(\w+)[\s\S]*?(?=\n(?:export|interface|class|function|const|$))/g);
    if (interfaceMatches) {
      info.interfaces = interfaceMatches.map(match => this.parseInterface(match));
    }

    // Extract functions
    const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)[\s\S]*?(?=\n(?:export|interface|class|function|const|$))/g);
    if (functionMatches) {
      info.functions = functionMatches.map(match => this.parseFunction(match));
    }

    // Extract React hooks
    const hookMatches = content.match(/(?:export\s+)?(?:const|function)\s+(use\w+)/g);
    if (hookMatches) {
      info.hooks = hookMatches.map(match => {
        const name = match.match(/(use\w+)/)[1];
        return { name, type: 'hook' };
      });
    }

    // Extract JSDoc comments
    const commentMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
    if (commentMatches) {
      info.comments = commentMatches.map(comment => this.parseJSDoc(comment));
    }

    return Object.values(info).some(arr => Array.isArray(arr) ? arr.length > 0 : arr) ? info : null;
  }

  getExportType(exportStatement) {
    if (exportStatement.includes('interface')) return 'interface';
    if (exportStatement.includes('type')) return 'type';
    if (exportStatement.includes('class')) return 'class';
    if (exportStatement.includes('function')) return 'function';
    if (exportStatement.includes('const')) return 'const';
    return 'unknown';
  }

  parseInterface(interfaceString) {
    const nameMatch = interfaceString.match(/interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : 'Unknown';
    
    // Extract properties (simplified)
    const properties = [];
    const propertyMatches = interfaceString.match(/(\w+)(?:\?)?\s*:\s*([^;]+);/g);
    
    if (propertyMatches) {
      propertyMatches.forEach(prop => {
        const propMatch = prop.match(/(\w+)(\?)?\s*:\s*([^;]+);/);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: propMatch[3].trim(),
          });
        }
      });
    }

    return { name, properties };
  }

  parseFunction(functionString) {
    const nameMatch = functionString.match(/function\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : 'Unknown';
    
    // Extract parameters (simplified)
    const paramMatch = functionString.match(/\(([^)]*)\)/);
    const parameters = [];
    
    if (paramMatch && paramMatch[1]) {
      const params = paramMatch[1].split(',').map(p => p.trim());
      parameters.push(...params.filter(p => p).map(param => {
        const [name, type] = param.split(':').map(s => s.trim());
        return { name, type: type || 'any' };
      }));
    }

    return { name, parameters };
  }

  parseJSDoc(comment) {
    const description = comment.match(/\/\*\*\s*\n?\s*\*?\s*([^@]*)/);
    const tags = comment.match(/@\w+[^\n]*\n?/g);

    return {
      description: description ? description[1].trim() : '',
      tags: tags || [],
    };
  }

  async generateApiDocumentation() {
    log(colors.blue, '📖 Generating API documentation...');

    const apiIndex = {
      title: '@johnqh/lib API Documentation',
      sections: [],
    };

    // Group files by category
    const categories = new Map();
    
    for (const [filePath, info] of this.sourceFiles) {
      const category = this.getCategoryFromPath(filePath);
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push({ filePath, ...info });
    }

    // Generate documentation for each category
    for (const [category, files] of categories) {
      const categoryDoc = await this.generateCategoryDocumentation(category, files);
      
      await fs.writeFile(
        path.join(this.outputDir, 'api', `${category}.md`),
        categoryDoc
      );

      apiIndex.sections.push({
        name: category,
        file: `${category}.md`,
        itemCount: files.length,
      });
    }

    // Generate API index
    await fs.writeFile(
      path.join(this.outputDir, 'api', 'index.md'),
      this.generateApiIndex(apiIndex)
    );

    log(colors.green, `✅ Generated API docs for ${categories.size} categories`);
  }

  getCategoryFromPath(filePath) {
    const parts = filePath.split('/');
    if (parts.includes('business')) return 'business';
    if (parts.includes('network')) return 'network';
    if (parts.includes('storage')) return 'storage';
    if (parts.includes('utils')) return 'utils';
    if (parts.includes('types')) return 'types';
    return 'core';
  }

  async generateCategoryDocumentation(category, files) {
    let doc = `# ${category.charAt(0).toUpperCase() + category.slice(1)} API\n\n`;
    doc += `Documentation for the ${category} module.\n\n`;

    for (const file of files) {
      doc += `## ${path.basename(file.filePath, '.ts')}\n\n`;
      doc += `**File:** \`${file.filePath}\`\n\n`;

      // Document interfaces
      if (file.interfaces.length > 0) {
        doc += '### Interfaces\n\n';
        for (const iface of file.interfaces) {
          doc += `#### ${iface.name}\n\n`;
          doc += '```typescript\n';
          doc += `interface ${iface.name} {\n`;
          for (const prop of iface.properties) {
            doc += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};\n`;
          }
          doc += '}\n```\n\n';
        }
      }

      // Document functions
      if (file.functions.length > 0) {
        doc += '### Functions\n\n';
        for (const func of file.functions) {
          doc += `#### ${func.name}\n\n`;
          doc += '```typescript\n';
          doc += `function ${func.name}(`;
          doc += func.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
          doc += ')\n```\n\n';
        }
      }

      // Document hooks
      if (file.hooks.length > 0) {
        doc += '### React Hooks\n\n';
        for (const hook of file.hooks) {
          doc += `#### ${hook.name}\n\n`;
          doc += 'React hook for enhanced functionality.\n\n';
        }
      }

      doc += '---\n\n';
    }

    return doc;
  }

  generateApiIndex(apiIndex) {
    let index = `# ${apiIndex.title}\n\n`;
    index += 'Complete API reference for @johnqh/lib.\n\n';
    index += '## Categories\n\n';

    for (const section of apiIndex.sections) {
      index += `- [${section.name.charAt(0).toUpperCase() + section.name.slice(1)}](./${section.file}) (${section.itemCount} items)\n`;
    }

    index += '\n## Overview\n\n';
    index += '@johnqh/lib is a React Native-compatible shared utilities library for 0xmail.box projects.\n\n';
    index += '### Key Features\n\n';
    index += '- Platform-agnostic business logic\n';
    index += '- Email management services (WildDuck integration)\n';
    index += '- Blockchain integration (Solana & EVM)\n';
    index += '- Authentication services (Firebase Auth)\n';
    index += '- AI-powered features\n';
    index += '- Points/rewards system\n\n';

    return index;
  }

  async generateInteractiveExamples() {
    log(colors.blue, '⚡ Generating interactive examples...');

    const examples = [
      {
        name: 'email-management',
        title: 'Email Management',
        description: 'Learn how to use email services and hooks',
        code: this.generateEmailExample(),
      },
      {
        name: 'wallet-integration',
        title: 'Wallet Integration',
        description: 'Connect and interact with blockchain wallets',
        code: this.generateWalletExample(),
      },
      {
        name: 'points-system',
        title: 'Points & Rewards',
        description: 'Implement points and rewards functionality',
        code: this.generatePointsExample(),
      },
      {
        name: 'ai-features',
        title: 'AI Features',
        description: 'Integrate AI-powered email assistance',
        code: this.generateAIExample(),
      },
    ];

    for (const example of examples) {
      const examplePage = this.generateExamplePage(example);
      await fs.writeFile(
        path.join(this.outputDir, 'examples', `${example.name}.md`),
        examplePage
      );
    }

    // Generate examples index
    const examplesIndex = this.generateExamplesIndex(examples);
    await fs.writeFile(
      path.join(this.outputDir, 'examples', 'index.md'),
      examplesIndex
    );

    log(colors.green, `✅ Generated ${examples.length} interactive examples`);
  }

  generateEmailExample() {
    return `import { useEmails, useEmail } from '@johnqh/lib';

function EmailComponent() {
  const { emails, loading, error } = useEmails(config);
  const { sendEmail } = useEmail(config);

  const handleSendEmail = async () => {
    try {
      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello from 0xmail.box',
        text: 'This is a test email',
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  if (loading) return <div>Loading emails...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleSendEmail}>Send Email</button>
      {emails.map(email => (
        <div key={email.id}>
          <h3>{email.subject}</h3>
          <p>{email.from}</p>
        </div>
      ))}
    </div>
  );
}`;
  }

  generateWalletExample() {
    return `import { useMultiChainWallet, useAuth } from '@johnqh/lib';

function WalletComponent() {
  const { connect, disconnect, address, isConnected } = useMultiChainWallet();
  const { login, logout, user } = useAuth();

  const handleConnect = async () => {
    try {
      await connect();
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <p>User: {user?.email}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}`;
  }

  generatePointsExample() {
    return `import { useIndexerPoints } from '@johnqh/lib';

function PointsComponent() {
  const { getPointsBalance, isLoading, error } = useIndexerPoints(
    'https://api.example.com',
    false
  );

  const [points, setPoints] = useState(null);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const balance = await getPointsBalance('wallet-address');
        setPoints(balance);
      } catch (error) {
        console.error('Failed to load points:', error);
      }
    };
    
    loadPoints();
  }, [getPointsBalance]);

  if (isLoading) return <div>Loading points...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Points Balance</h2>
      <p>{points ? points.balance : 'No points'}</p>
    </div>
  );
}`;
  }

  generateAIExample() {
    return `import { useAIEmailAssistance } from '@johnqh/lib';

function AIAssistantComponent() {
  const { generateResponse, isGenerating, error } = useAIEmailAssistance(config);

  const handleGenerateReply = async (emailContent) => {
    try {
      const reply = await generateResponse({
        type: 'reply',
        context: emailContent,
        tone: 'professional',
      });
      
      console.log('Generated reply:', reply);
    } catch (error) {
      console.error('Failed to generate reply:', error);
    }
  };

  return (
    <div>
      <h2>AI Email Assistant</h2>
      <button 
        onClick={() => handleGenerateReply('Original email content...')}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Reply'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}`;
  }

  generateExamplePage(example) {
    return `# ${example.title}

${example.description}

## Code Example

\`\`\`tsx
${example.code}
\`\`\`

## Key Features

- Comprehensive error handling
- TypeScript support
- React hooks integration
- Platform compatibility (Web & React Native)

## Usage Notes

This example demonstrates best practices for integrating with @johnqh/lib. 
Make sure to:

1. Import the required hooks and utilities
2. Handle loading and error states
3. Use proper TypeScript types
4. Follow the established patterns

## Related Documentation

- [API Reference](../api/index.md)
- [Getting Started Guide](../guides/getting-started.md)
- [Best Practices](../guides/best-practices.md)
`;
  }

  generateExamplesIndex(examples) {
    let index = '# Interactive Examples\n\n';
    index += 'Practical examples showing how to use @johnqh/lib in real applications.\n\n';

    for (const example of examples) {
      index += `## [${example.title}](./${example.name}.md)\n\n`;
      index += `${example.description}\n\n`;
    }

    index += '\n## Running Examples\n\n';
    index += 'To run these examples in your project:\n\n';
    index += '1. Install @johnqh/lib: `npm install @johnqh/lib`\n';
    index += '2. Copy the example code\n';
    index += '3. Configure your environment variables\n';
    index += '4. Import and use in your React components\n\n';

    return index;
  }

  async generateGuidesAndTutorials() {
    log(colors.blue, '📚 Generating guides and tutorials...');

    const guides = [
      {
        name: 'getting-started',
        title: 'Getting Started',
        content: this.generateGettingStartedGuide(),
      },
      {
        name: 'configuration',
        title: 'Configuration Guide',
        content: this.generateConfigurationGuide(),
      },
      {
        name: 'best-practices',
        title: 'Best Practices',
        content: this.generateBestPracticesGuide(),
      },
      {
        name: 'troubleshooting',
        title: 'Troubleshooting',
        content: this.generateTroubleshootingGuide(),
      },
    ];

    for (const guide of guides) {
      await fs.writeFile(
        path.join(this.outputDir, 'guides', `${guide.name}.md`),
        guide.content
      );
    }

    const guidesIndex = this.generateGuidesIndex(guides);
    await fs.writeFile(
      path.join(this.outputDir, 'guides', 'index.md'),
      guidesIndex
    );

    log(colors.green, `✅ Generated ${guides.length} guides`);
  }

  generateGettingStartedGuide() {
    return `# Getting Started with @johnqh/lib

Welcome to @johnqh/lib, the comprehensive shared utilities library for 0xmail.box projects.

## Installation

\`\`\`bash
npm install @johnqh/lib
\`\`\`

## Quick Setup

### 1. Basic Configuration

\`\`\`typescript
import { createWildDuckConfig, createIndexerConfig } from '@johnqh/lib';

const wildDuckConfig = createWildDuckConfig({
  backendUrl: 'https://api.0xmail.box',
  apiToken: 'your-api-token',
});

const indexerConfig = createIndexerConfig({
  endpointUrl: 'https://indexer.0xmail.box',
  dev: false,
});
\`\`\`

### 2. Using Email Services

\`\`\`typescript
import { useEmails } from '@johnqh/lib';

function MyEmailApp() {
  const { emails, loading, error } = useEmails(wildDuckConfig);
  
  // Your email UI here
}
\`\`\`

### 3. Wallet Integration

\`\`\`typescript
import { useMultiChainWallet } from '@johnqh/lib';

function WalletConnection() {
  const { connect, address, isConnected } = useMultiChainWallet();
  
  // Your wallet UI here
}
\`\`\`

## Next Steps

- [Configuration Guide](./configuration.md)
- [API Reference](../api/index.md)
- [Interactive Examples](../examples/index.md)
`;
  }

  generateConfigurationGuide() {
    return `# Configuration Guide

This guide covers all configuration options for @johnqh/lib.

## WildDuck Configuration

\`\`\`typescript
interface WildDuckConfig {
  backendUrl: string;
  cloudflareWorkerUrl?: string;
  apiToken: string;
  userId?: string;
  timeout?: number;
}
\`\`\`

### Environment Variables

\`\`\`bash
WILDDUCK_API_TOKEN=your_token_here
WILDDUCK_BACKEND_URL=https://api.0xmail.box
\`\`\`

## Indexer Configuration

\`\`\`typescript
interface IndexerConfig {
  endpointUrl: string;
  dev: boolean;
  timeout?: number;
}
\`\`\`

## Firebase Configuration

For authentication services:

\`\`\`typescript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  // ... other Firebase config
}
\`\`\`

## Platform Detection

The library automatically detects platform (web vs React Native):

\`\`\`typescript
import { Platform } from '@johnqh/lib';

if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // React Native specific code
}
\`\`\`
`;
  }

  generateBestPracticesGuide() {
    return `# Best Practices

Follow these best practices when using @johnqh/lib.

## Error Handling

Always handle errors in your hooks:

\`\`\`typescript
const { data, loading, error } = useEmails(config);

if (error) {
  // Handle error appropriately
  console.error('Email loading failed:', error);
  return <ErrorComponent message={error.message} />;
}
\`\`\`

## Configuration Management

Create configuration objects outside components:

\`\`\`typescript
// config.ts
export const wildDuckConfig = {
  backendUrl: process.env.REACT_APP_WILDDUCK_URL,
  apiToken: process.env.REACT_APP_WILDDUCK_TOKEN,
};

// Component.tsx
const { emails } = useEmails(wildDuckConfig);
\`\`\`

## Type Safety

Always use proper TypeScript types:

\`\`\`typescript
import { EmailMessage, WalletUserData } from '@johnqh/lib';

const handleEmail = (email: EmailMessage) => {
  // Type-safe email handling
};
\`\`\`

## Performance

- Use React.memo for expensive components
- Implement proper loading states
- Handle cleanup in useEffect

## Security

- Never expose API tokens in client code
- Use environment variables for sensitive data
- Validate user input before API calls
`;
  }

  generateTroubleshootingGuide() {
    return `# Troubleshooting

Common issues and solutions when using @johnqh/lib.

## Build Issues

### TypeScript Errors

**Error:** \`Cannot find module '@johnqh/lib'\`

**Solution:**
\`\`\`bash
npm install @johnqh/lib
# or
npm install --legacy-peer-deps
\`\`\`

### Import Issues

**Error:** \`Module not found\`

**Solution:** Check your import paths:
\`\`\`typescript
// Correct
import { useEmails } from '@johnqh/lib';

// Incorrect
import { useEmails } from '@johnqh/lib/src/business/hooks';
\`\`\`

## Runtime Issues

### API Connection Failures

**Symptoms:** API calls failing, timeout errors

**Solutions:**
1. Check API endpoint URLs in configuration
2. Verify API tokens are correct
3. Check network connectivity
4. Review CORS settings

### Hook Errors

**Error:** \`useEmails is not a function\`

**Solution:**
\`\`\`typescript
// Make sure you're importing from the correct location
import { useEmails } from '@johnqh/lib';

// Verify the hook exists in the current version
console.log(typeof useEmails); // should be 'function'
\`\`\`

## Platform Issues

### React Native Compatibility

If you encounter platform-specific issues:

1. Check that you're using the correct platform exports
2. Verify React Native dependencies are installed
3. Check Metro bundler configuration

### Web Bundle Issues

For web applications:

1. Check Webpack/Vite configuration
2. Verify tree-shaking is working correctly
3. Check for duplicate dependencies

## Getting Help

If you're still having issues:

1. Check the [API Documentation](../api/index.md)
2. Review [Examples](../examples/index.md)
3. Check the GitHub issues page
4. Contact the development team
`;
  }

  generateGuidesIndex(guides) {
    let index = '# Documentation Guides\n\n';
    index += 'Comprehensive guides for using @johnqh/lib effectively.\n\n';

    for (const guide of guides) {
      index += `## [${guide.title}](./${guide.name}.md)\n\n`;
    }

    return index;
  }

  async generateSiteConfiguration() {
    log(colors.blue, '⚙️ Generating site configuration...');

    // Generate CSS
    const css = this.generateSiteCSS();
    await fs.writeFile(path.join(this.outputDir, 'assets', 'css', 'docs.css'), css);

    // Generate JavaScript
    const js = this.generateSiteJS();
    await fs.writeFile(path.join(this.outputDir, 'assets', 'js', 'docs.js'), js);

    // Generate navigation component
    const nav = this.generateNavigation();
    await fs.writeFile(path.join(this.outputDir, 'components', 'navigation.md'), nav);
  }

  generateSiteCSS() {
    return `/* Documentation Site Styles */

:root {
  --primary-color: #0066cc;
  --secondary-color: #f8f9fa;
  --text-color: #333;
  --border-color: #e1e5e9;
  --code-bg: #f6f8fa;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--primary-color);
  margin-top: 2rem;
  margin-bottom: 1rem;
}

code {
  background: var(--code-bg);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  border: 1px solid var(--border-color);
}

.nav-menu {
  background: var(--secondary-color);
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 2rem;
}

.nav-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  margin: 0.5rem 0;
}

.nav-menu a {
  color: var(--primary-color);
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.nav-menu a:hover {
  background: rgba(0, 102, 204, 0.1);
}

.example-code {
  margin: 1rem 0;
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.example-code .code-header {
  background: var(--secondary-color);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
}

.api-section {
  margin: 2rem 0;
  padding: 1rem;
  border-left: 4px solid var(--primary-color);
  background: rgba(0, 102, 204, 0.02);
}

@media (max-width: 768px) {
  body {
    padding: 0 10px;
  }
  
  .nav-menu {
    padding: 0.5rem;
  }
}`;
  }

  generateSiteJS() {
    return `// Documentation Site JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Add copy buttons to code blocks
  addCopyButtons();
  
  // Add smooth scrolling
  addSmoothScrolling();
  
  // Add search functionality
  addSearch();
});

function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    const button = document.createElement('button');
    button.textContent = 'Copy';
    button.className = 'copy-button';
    button.style.cssText = \`
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    \`;
    
    const pre = block.parentElement;
    pre.style.position = 'relative';
    pre.appendChild(button);
    
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      });
    });
  });
}

function addSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function addSearch() {
  const searchContainer = document.createElement('div');
  searchContainer.innerHTML = \`
    <input type="search" placeholder="Search documentation..." id="docs-search">
    <div id="search-results"></div>
  \`;
  
  const nav = document.querySelector('.nav-menu');
  if (nav) {
    nav.appendChild(searchContainer);
  }
  
  const searchInput = document.getElementById('docs-search');
  const searchResults = document.getElementById('search-results');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      
      if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
      }
      
      // Simple search implementation
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const results = [];
      
      headings.forEach(heading => {
        if (heading.textContent.toLowerCase().includes(query)) {
          results.push({
            title: heading.textContent,
            element: heading
          });
        }
      });
      
      displaySearchResults(results, searchResults);
    });
  }
}

function displaySearchResults(results, container) {
  if (results.length === 0) {
    container.innerHTML = '<p>No results found</p>';
    return;
  }
  
  const html = results.map(result => \`
    <div class="search-result">
      <a href="#" onclick="scrollToElement(this)" data-target="\${result.element.id}">
        \${result.title}
      </a>
    </div>
  \`).join('');
  
  container.innerHTML = html;
}

function scrollToElement(link) {
  const targetId = link.getAttribute('data-target');
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}`;
  }

  generateNavigation() {
    return `# Navigation

## Main Sections

- [Home](../index.md)
- [API Reference](../api/index.md)
- [Guides](../guides/index.md)
- [Examples](../examples/index.md)

## Quick Links

### API Categories
- [Business Logic](../api/business.md)
- [Network Services](../api/network.md)
- [Storage](../api/storage.md)
- [Utilities](../api/utils.md)
- [Types](../api/types.md)

### Popular Guides
- [Getting Started](../guides/getting-started.md)
- [Configuration](../guides/configuration.md)
- [Best Practices](../guides/best-practices.md)

### Examples
- [Email Management](../examples/email-management.md)
- [Wallet Integration](../examples/wallet-integration.md)
- [Points System](../examples/points-system.md)
`;
  }

  async createIndexPages() {
    log(colors.blue, '🏠 Creating index pages...');

    // Main index page
    const mainIndex = this.generateMainIndex();
    await fs.writeFile(path.join(this.outputDir, 'index.md'), mainIndex);

    // README for the docs site
    const readme = this.generateDocsReadme();
    await fs.writeFile(path.join(this.outputDir, 'README.md'), readme);

    log(colors.green, '✅ Created index pages');
  }

  generateMainIndex() {
    return `# @johnqh/lib Documentation

Welcome to the comprehensive documentation for @johnqh/lib, the shared utilities library for 0xmail.box projects.

## Overview

@johnqh/lib provides platform-agnostic business logic, email management, blockchain integration, and AI-powered features for both web and React Native applications.

## Quick Start

\`\`\`bash
npm install @johnqh/lib
\`\`\`

\`\`\`typescript
import { useEmails, useMultiChainWallet } from '@johnqh/lib';
\`\`\`

## Documentation Sections

### 📖 [API Reference](./api/index.md)
Complete API documentation with interfaces, functions, and hooks.

### 📚 [Guides](./guides/index.md)
Step-by-step guides for configuration, best practices, and troubleshooting.

### ⚡ [Interactive Examples](./examples/index.md)
Practical examples showing real-world usage patterns.

## Key Features

- **Platform Abstraction**: Works seamlessly on web and React Native
- **Email Management**: WildDuck integration for email services
- **Blockchain Integration**: Support for Solana and EVM chains
- **AI Features**: Email assistance and smart replies
- **Points System**: Rewards and loyalty program integration
- **Type Safety**: Full TypeScript support with strict typing

## Architecture

The library follows a layered architecture:

- **Business Layer**: Core domain logic and operations
- **Network Layer**: API clients and service integrations
- **Storage Layer**: Data persistence and caching
- **Utils Layer**: Platform-specific implementations
- **Types Layer**: TypeScript definitions and interfaces

## Getting Help

- [Getting Started Guide](./guides/getting-started.md)
- [Configuration Guide](./guides/configuration.md)
- [Troubleshooting](./guides/troubleshooting.md)
- [GitHub Issues](https://github.com/0xmail/mail_box_lib/issues)

---

*Generated on ${new Date().toISOString()}*
`;
  }

  generateDocsReadme() {
    return `# Documentation Site

This directory contains the generated documentation site for @johnqh/lib.

## Structure

- \`api/\` - API reference documentation
- \`guides/\` - Step-by-step guides and tutorials
- \`examples/\` - Interactive code examples
- \`assets/\` - CSS, JavaScript, and other assets
- \`components/\` - Reusable documentation components

## Viewing the Documentation

Open \`index.md\` to start browsing the documentation.

## Regenerating Documentation

To regenerate this documentation:

\`\`\`bash
npm run docs:generate
\`\`\`

This will analyze the source code and create updated documentation.

## Contributing

To improve the documentation:

1. Update JSDoc comments in source code
2. Add examples to the examples directory
3. Update guides as needed
4. Regenerate the documentation

---

*Auto-generated documentation for @johnqh/lib*
`;
  }
}

async function main() {
  const generator = new DocumentationSiteGenerator();
  
  try {
    await generator.generateSite();
    
    log(colors.cyan, '\n📊 Documentation Site Summary:');
    log(colors.bright, '✅ API documentation generated');
    log(colors.bright, '✅ Interactive examples created');
    log(colors.bright, '✅ Guides and tutorials written');
    log(colors.bright, '✅ Site assets configured');
    log(colors.bright, '✅ Navigation structure built');
    
    log(colors.green, '\n🎉 Documentation site is ready!');
    log(colors.cyan, 'Open docs-site/index.md to view the documentation');
    
  } catch (error) {
    log(colors.red, '💥 Documentation generation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DocumentationSiteGenerator };