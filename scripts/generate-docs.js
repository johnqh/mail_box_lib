#!/usr/bin/env node

/**
 * Automated documentation generator for @johnqh/lib
 * Generates API documentation from TypeScript source files
 */

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

class DocumentationGenerator {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.docsDir = path.join(process.cwd(), 'docs');
    this.apiDocs = [];
  }

  async generate() {
    log(colors.cyan, '📚 Generating API documentation...\n');

    await this.ensureDocsDir();
    const files = await this.getTypeScriptFiles(this.srcDir);
    
    for (const file of files) {
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        await this.processFile(file);
      }
    }

    await this.generateApiIndex();
    await this.generateReadme();
    
    log(colors.green, `\n✅ Generated documentation for ${this.apiDocs.length} modules`);
    log(colors.blue, `📁 Documentation saved to: ${this.docsDir}`);
  }

  async ensureDocsDir() {
    try {
      await fs.access(this.docsDir);
    } catch {
      await fs.mkdir(this.docsDir, { recursive: true });
    }
  }

  async getTypeScriptFiles(dir) {
    const files = [];

    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          await scan(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  async processFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(this.srcDir, filePath);
    
    const module = {
      path: relativePath,
      name: path.basename(filePath, path.extname(filePath)),
      exports: this.extractExports(content),
      interfaces: this.extractInterfaces(content),
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      types: this.extractTypes(content),
      description: this.extractDescription(content),
    };

    // Only include modules that have exports
    if (module.exports.length > 0 || module.interfaces.length > 0 || 
        module.classes.length > 0 || module.functions.length > 0) {
      this.apiDocs.push(module);
      await this.generateModuleDoc(module);
    }
  }

  extractDescription(content) {
    // Look for file-level JSDoc comment
    const match = content.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
    }
    return '';
  }

  extractExports(content) {
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|interface|function|const|type|enum)\s+(\w+)|export\s*\{([^}]+)\}/g;
    
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      } else if (match[2]) {
        const namedExports = match[2]
          .split(',')
          .map(exp => exp.trim().split(/\s+as\s+/)[0])
          .filter(exp => exp && exp !== 'type');
        exports.push(...namedExports);
      }
    }
    
    return [...new Set(exports)]; // Remove duplicates
  }

  extractInterfaces(content) {
    const interfaces = [];
    const interfaceRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?interface\s+(\w+)(?:\s*<[^>]*>)?\s*\{([\s\S]*?)\}/g;
    
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const [fullMatch, name, body] = match;
      const comment = this.extractJSDocComment(fullMatch);
      const properties = this.extractProperties(body);
      
      interfaces.push({
        name,
        description: comment,
        properties,
      });
    }
    
    return interfaces;
  }

  extractClasses(content) {
    const classes = [];
    const classRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?class\s+(\w+)(?:\s*extends\s+\w+)?(?:\s*implements\s+[\w,\s]+)?\s*\{([\s\S]*?)\n\}/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const [fullMatch, name, body] = match;
      const comment = this.extractJSDocComment(fullMatch);
      const methods = this.extractMethods(body);
      const properties = this.extractProperties(body);
      
      classes.push({
        name,
        description: comment,
        methods,
        properties,
      });
    }
    
    return classes;
  }

  extractFunctions(content) {
    const functions = [];
    const functionRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)[^{]*\{|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2];
      const comment = this.extractJSDocComment(match[0]);
      
      functions.push({
        name,
        description: comment,
      });
    }
    
    return functions;
  }

  extractTypes(content) {
    const types = [];
    const typeRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:export\s+)?type\s+(\w+)(?:\s*<[^>]*>)?\s*=\s*([^;\n]+)/g;
    
    let match;
    while ((match = typeRegex.exec(content)) !== null) {
      const [fullMatch, name, definition] = match;
      const comment = this.extractJSDocComment(fullMatch);
      
      types.push({
        name,
        definition: definition.trim(),
        description: comment,
      });
    }
    
    return types;
  }

  extractProperties(body) {
    const properties = [];
    const propertyRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(\w+)(?:\?)?:\s*([^;,\n}]+)/g;
    
    let match;
    while ((match = propertyRegex.exec(body)) !== null) {
      const [fullMatch, name, type] = match;
      const comment = this.extractJSDocComment(fullMatch);
      const optional = fullMatch.includes('?:');
      
      properties.push({
        name,
        type: type.trim(),
        optional,
        description: comment,
      });
    }
    
    return properties;
  }

  extractMethods(body) {
    const methods = [];
    const methodRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?(?:private|public|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)[^{]*\{/g;
    
    let match;
    while ((match = methodRegex.exec(body)) !== null) {
      const [fullMatch, name] = match;
      const comment = this.extractJSDocComment(fullMatch);
      
      if (name !== 'constructor') {
        methods.push({
          name,
          description: comment,
        });
      }
    }
    
    return methods;
  }

  extractJSDocComment(text) {
    const match = text.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .filter(line => !line.startsWith('@'))
        .join(' ')
        .trim();
    }
    return '';
  }

  async generateModuleDoc(module) {
    let markdown = `# ${module.name}\n\n`;
    
    if (module.description) {
      markdown += `${module.description}\n\n`;
    }

    markdown += `**File:** \`${module.path}\`\n\n`;

    if (module.exports.length > 0) {
      markdown += `## Exports\n\n`;
      module.exports.forEach(exp => {
        markdown += `- \`${exp}\`\n`;
      });
      markdown += '\n';
    }

    if (module.interfaces.length > 0) {
      markdown += `## Interfaces\n\n`;
      module.interfaces.forEach(iface => {
        markdown += `### ${iface.name}\n\n`;
        if (iface.description) {
          markdown += `${iface.description}\n\n`;
        }
        
        if (iface.properties.length > 0) {
          markdown += `**Properties:**\n\n`;
          iface.properties.forEach(prop => {
            const optional = prop.optional ? '?' : '';
            markdown += `- \`${prop.name}${optional}: ${prop.type}\``;
            if (prop.description) {
              markdown += ` - ${prop.description}`;
            }
            markdown += '\n';
          });
          markdown += '\n';
        }
      });
    }

    if (module.classes.length > 0) {
      markdown += `## Classes\n\n`;
      module.classes.forEach(cls => {
        markdown += `### ${cls.name}\n\n`;
        if (cls.description) {
          markdown += `${cls.description}\n\n`;
        }
        
        if (cls.methods.length > 0) {
          markdown += `**Methods:**\n\n`;
          cls.methods.forEach(method => {
            markdown += `- \`${method.name}()\``;
            if (method.description) {
              markdown += ` - ${method.description}`;
            }
            markdown += '\n';
          });
          markdown += '\n';
        }
      });
    }

    if (module.functions.length > 0) {
      markdown += `## Functions\n\n`;
      module.functions.forEach(func => {
        markdown += `### ${func.name}\n\n`;
        if (func.description) {
          markdown += `${func.description}\n\n`;
        }
      });
    }

    if (module.types.length > 0) {
      markdown += `## Types\n\n`;
      module.types.forEach(type => {
        markdown += `### ${type.name}\n\n`;
        if (type.description) {
          markdown += `${type.description}\n\n`;
        }
        markdown += `\`\`\`typescript\ntype ${type.name} = ${type.definition}\n\`\`\`\n\n`;
      });
    }

    const docPath = path.join(this.docsDir, `${module.name}.md`);
    await fs.writeFile(docPath, markdown);
  }

  async generateApiIndex() {
    let markdown = `# API Documentation\n\n`;
    markdown += `*Generated on ${new Date().toISOString()}*\n\n`;
    markdown += `## Modules\n\n`;

    this.apiDocs
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(module => {
        markdown += `### [${module.name}](./${module.name}.md)\n\n`;
        if (module.description) {
          markdown += `${module.description}\n\n`;
        }
        
        markdown += `**Location:** \`${module.path}\`\n\n`;
        
        if (module.exports.length > 0) {
          markdown += `**Exports:** ${module.exports.map(exp => `\`${exp}\``).join(', ')}\n\n`;
        }
      });

    const indexPath = path.join(this.docsDir, 'API.md');
    await fs.writeFile(indexPath, markdown);
  }

  async generateReadme() {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
    );

    let markdown = `# ${packageJson.name}\n\n`;
    markdown += `${packageJson.description}\n\n`;
    markdown += `**Version:** ${packageJson.version}\n\n`;
    markdown += `## Documentation\n\n`;
    markdown += `- [API Documentation](./API.md)\n`;
    markdown += `- [Development Guide](../DEVELOPMENT.md)\n\n`;
    markdown += `## Quick Start\n\n`;
    markdown += `\`\`\`bash\nnpm install ${packageJson.name}\n\`\`\`\n\n`;
    markdown += `\`\`\`typescript\nimport { /* your imports */ } from '${packageJson.name}';\n\`\`\`\n\n`;
    
    if (packageJson.keywords && packageJson.keywords.length > 0) {
      markdown += `## Keywords\n\n`;
      packageJson.keywords.forEach(keyword => {
        markdown += `- ${keyword}\n`;
      });
      markdown += '\n';
    }

    markdown += `---\n\n*Documentation generated automatically from TypeScript source files.*\n`;

    const readmePath = path.join(this.docsDir, 'README.md');
    await fs.writeFile(readmePath, markdown);
  }
}

async function main() {
  const generator = new DocumentationGenerator();
  await generator.generate();
  log(colors.green, '\n🎉 Documentation generation completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, '💥 Documentation generation failed:', error.message);
    process.exit(1);
  });
}

export { DocumentationGenerator };