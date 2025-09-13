#!/usr/bin/env node

/**
 * Live Development Environment Manager
 * Orchestrates hot reloading across the entire 0xmail.box ecosystem
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import chokidar from 'chokidar';

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
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`${colors.cyan}[${timestamp}]${colors.reset}`, color, ...args, colors.reset);
}

const ECOSYSTEM_CONFIG = {
  di: {
    path: '../di',
    watchPattern: 'src/**/*.ts',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: null,
    dependents: ['mail_box_lib', 'mail_box_components'],
  },
  mail_box_contracts: {
    path: '../mail_box_contracts',
    watchPattern: 'src/**/*.ts',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: null,
    dependents: ['mail_box_lib'],
  },
  design_system: {
    path: '../design_system',
    watchPattern: 'src/**/*',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: null,
    dependents: ['mail_box_components'],
  },
  mail_box_lib: {
    path: '.',
    watchPattern: 'src/**/*.ts',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: null,
    dependents: ['mail_box_components', 'mail_box'],
  },
  mail_box_components: {
    path: '../mail_box_components',
    watchPattern: 'src/**/*',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: null,
    dependents: ['mail_box'],
  },
  mail_box: {
    path: '../mail_box',
    watchPattern: 'src/**/*',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    port: 5173,
    dependents: [],
  },
};

class LiveDevEnvironment {
  constructor() {
    this.processes = new Map();
    this.watchers = new Map();
    this.buildQueue = new Set();
    this.isBuilding = new Map();
    this.buildPromises = new Map();
    this.dependencyGraph = this.buildDependencyGraph();
  }

  buildDependencyGraph() {
    const graph = new Map();
    
    for (const [name, config] of Object.entries(ECOSYSTEM_CONFIG)) {
      graph.set(name, {
        config,
        dependents: config.dependents,
        dependencies: [],
      });
    }
    
    // Build reverse dependencies
    for (const [name, node] of graph) {
      for (const dependent of node.dependents) {
        if (graph.has(dependent)) {
          graph.get(dependent).dependencies.push(name);
        }
      }
    }
    
    return graph;
  }

  async checkProjectExists(projectPath) {
    try {
      await fs.access(path.join(projectPath, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }

  async startProcess(name, command, cwd, color = colors.blue) {
    if (this.processes.has(name)) {
      this.killProcess(name);
    }

    log(color, `🚀 Starting ${name}: ${command}`);

    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    // Add color coding to output
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        log(color, `[${name}]`, line);
      });
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        log(colors.red, `[${name}]`, line);
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(color, `✅ ${name} process completed successfully`);
      } else {
        log(colors.red, `❌ ${name} process exited with code ${code}`);
      }
      this.processes.delete(name);
    });

    this.processes.set(name, child);
    return child;
  }

  killProcess(name) {
    const process = this.processes.get(name);
    if (process && !process.killed) {
      log(colors.yellow, `🛑 Stopping ${name}...`);
      process.kill('SIGTERM');
      this.processes.delete(name);
    }
  }

  async buildProject(name, force = false) {
    if (this.isBuilding.get(name) && !force) {
      return this.buildPromises.get(name);
    }

    const node = this.dependencyGraph.get(name);
    if (!node) return false;

    const projectPath = path.resolve(node.config.path);
    const exists = await this.checkProjectExists(projectPath);
    
    if (!exists) {
      log(colors.yellow, `⚠️  Skipping ${name} - project not found`);
      return false;
    }

    this.isBuilding.set(name, true);
    
    const buildPromise = new Promise(async (resolve) => {
      try {
        log(colors.cyan, `🔨 Building ${name}...`);
        
        await this.startProcess(
          `${name}-build`, 
          node.config.buildCommand, 
          projectPath,
          colors.cyan
        );

        // Wait for build to complete
        const buildProcess = this.processes.get(`${name}-build`);
        if (buildProcess) {
          buildProcess.on('close', (code) => {
            this.isBuilding.set(name, false);
            resolve(code === 0);
          });
        } else {
          this.isBuilding.set(name, false);
          resolve(false);
        }
      } catch (error) {
        log(colors.red, `❌ Build failed for ${name}:`, error.message);
        this.isBuilding.set(name, false);
        resolve(false);
      }
    });

    this.buildPromises.set(name, buildPromise);
    return buildPromise;
  }

  async cascadeBuild(changedProject) {
    log(colors.magenta, `🔄 Cascading build from ${changedProject}...`);
    
    const visited = new Set();
    const toBuild = [changedProject];
    
    while (toBuild.length > 0) {
      const current = toBuild.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      // Build current project
      await this.buildProject(current);
      
      // Add dependents to build queue
      const node = this.dependencyGraph.get(current);
      if (node) {
        toBuild.push(...node.dependents.filter(dep => !visited.has(dep)));
      }
    }
    
    log(colors.green, `✅ Cascade build completed for ${Array.from(visited).join(', ')}`);
  }

  setupFileWatcher(name) {
    const node = this.dependencyGraph.get(name);
    if (!node) return;

    const projectPath = path.resolve(node.config.path);
    const watchPath = path.join(projectPath, node.config.watchPattern);
    
    log(colors.blue, `👁️  Watching ${name}: ${watchPath}`);

    const watcher = chokidar.watch(watchPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async (filePath) => {
      const relativePath = path.relative(projectPath, filePath);
      log(colors.yellow, `📝 ${name} changed: ${relativePath}`);
      
      // Debounce builds
      clearTimeout(this.buildTimeout);
      this.buildTimeout = setTimeout(async () => {
        await this.cascadeBuild(name);
      }, 500);
    });

    watcher.on('error', (error) => {
      log(colors.red, `❌ Watcher error for ${name}:`, error.message);
    });

    this.watchers.set(name, watcher);
  }

  async startDevServers() {
    log(colors.cyan, '\n🌐 Starting development servers...\n');

    for (const [name, node] of this.dependencyGraph) {
      const projectPath = path.resolve(node.config.path);
      const exists = await this.checkProjectExists(projectPath);
      
      if (!exists) {
        log(colors.yellow, `⚠️  Skipping ${name} - project not found`);
        continue;
      }

      // Start dev server if it has one
      if (node.config.devCommand) {
        const color = this.getProjectColor(name);
        await this.startProcess(
          `${name}-dev`, 
          node.config.devCommand, 
          projectPath,
          color
        );
        
        // Add small delay between starts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Setup file watching
      this.setupFileWatcher(name);
    }

    // Show server URLs
    log(colors.cyan, '\n🌟 Development Environment Ready!\n');
    
    for (const [name, node] of this.dependencyGraph) {
      if (node.config.port) {
        log(colors.bright, `📱 ${name}: http://localhost:${node.config.port}`);
      }
    }
    
    log(colors.cyan, '\n👁️  File watching active - changes will trigger rebuilds\n');
  }

  getProjectColor(name) {
    const colorMap = {
      di: colors.magenta,
      mail_box_contracts: colors.blue,
      design_system: colors.cyan,
      mail_box_lib: colors.green,
      mail_box_components: colors.yellow,
      mail_box: colors.bright,
    };
    return colorMap[name] || colors.blue;
  }

  async stop() {
    log(colors.yellow, '🛑 Shutting down live development environment...');

    // Stop all watchers
    for (const [name, watcher] of this.watchers) {
      watcher.close();
      log(colors.yellow, `👁️  Stopped watching ${name}`);
    }

    // Kill all processes
    for (const [name] of this.processes) {
      this.killProcess(name);
    }

    log(colors.green, '✅ Live development environment stopped');
  }
}

async function main() {
  const liveEnv = new LiveDevEnvironment();
  
  log(colors.cyan, '🚀 0xmail.box Live Development Environment\n');
  
  // Handle process termination
  process.on('SIGINT', async () => {
    log(colors.yellow, '\n🛑 Received SIGINT, shutting down...');
    await liveEnv.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log(colors.yellow, '\n🛑 Received SIGTERM, shutting down...');
    await liveEnv.stop();
    process.exit(0);
  });

  try {
    await liveEnv.startDevServers();
    
    // Keep process alive
    setInterval(() => {
      // Heartbeat
    }, 10000);
    
  } catch (error) {
    log(colors.red, '💥 Failed to start live development environment:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { LiveDevEnvironment };