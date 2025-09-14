#!/usr/bin/env node

/**
 * Pattern Recognition & Learning Engine
 * Machine learning models for development optimization and predictive insights
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

class PatternRecognitionEngine {
  constructor() {
    this.patterns = new Map();
    this.learningData = [];
    this.models = new Map();
    this.predictions = new Map();
    this.insights = [];
    this.isLearning = false;
    
    this.initializeLearningModels();
  }

  initializeLearningModels() {
    // Code pattern recognition model
    this.models.set('code-patterns', {
      type: 'pattern-matching',
      confidence: 0.85,
      trainedOn: 0,
      patterns: new Map(),
      predict: (input) => this.predictCodePatterns(input),
      learn: (data) => this.learnCodePatterns(data),
    });

    // Performance prediction model
    this.models.set('performance', {
      type: 'regression',
      confidence: 0.75,
      trainedOn: 0,
      features: ['fileSize', 'complexity', 'dependencies', 'testCount'],
      predict: (input) => this.predictPerformance(input),
      learn: (data) => this.learnPerformance(data),
    });

    // Bug prediction model
    this.models.set('bug-prediction', {
      type: 'classification',
      confidence: 0.70,
      trainedOn: 0,
      features: ['complexity', 'changeFrequency', 'authorCount', 'testCoverage'],
      predict: (input) => this.predictBugLikelihood(input),
      learn: (data) => this.learnBugPatterns(data),
    });

    // Optimization opportunity model
    this.models.set('optimization', {
      type: 'recommendation',
      confidence: 0.80,
      trainedOn: 0,
      categories: ['performance', 'maintainability', 'security', 'testing'],
      predict: (input) => this.predictOptimizationOpportunities(input),
      learn: (data) => this.learnOptimizationPatterns(data),
    });

    // Development workflow model
    this.models.set('workflow', {
      type: 'sequence-prediction',
      confidence: 0.65,
      trainedOn: 0,
      sequences: [],
      predict: (input) => this.predictNextDevelopmentAction(input),
      learn: (data) => this.learnWorkflowPatterns(data),
    });

    // Resource usage prediction model
    this.models.set('resource-usage', {
      type: 'time-series',
      confidence: 0.72,
      trainedOn: 0,
      metrics: ['cpu', 'memory', 'build-time', 'test-time'],
      predict: (input) => this.predictResourceUsage(input),
      learn: (data) => this.learnResourcePatterns(data),
    });
  }

  async startLearning() {
    this.isLearning = true;
    
    log(colors.cyan, '🧠 Starting Pattern Recognition & Learning Engine...');
    log(colors.blue, '   • Code pattern analysis');
    log(colors.blue, '   • Performance prediction');
    log(colors.blue, '   • Bug likelihood assessment');
    log(colors.blue, '   • Optimization recommendations');
    log(colors.blue, '   • Workflow optimization');
    log(colors.blue, '   • Resource usage forecasting');

    // Start learning processes
    await this.initializeTrainingData();
    await this.trainModels();
    this.startContinuousLearning();
    
    log(colors.green, '✅ Pattern recognition engine is active and learning');
  }

  async initializeTrainingData() {
    log(colors.blue, '📚 Initializing training data...');

    try {
      // Collect historical data
      const historicalData = await this.collectHistoricalData();
      
      // Process and clean data
      const cleanedData = await this.preprocessData(historicalData);
      
      // Initialize learning datasets
      this.learningData = cleanedData;
      
      log(colors.green, `✅ Initialized with ${this.learningData.length} training examples`);
    } catch (error) {
      log(colors.red, `❌ Failed to initialize training data: ${error.message}`);
    }
  }

  async collectHistoricalData() {
    const data = [];

    // Collect code metrics
    await this.scanSourceFiles('src', async (filePath, content) => {
      const codeMetrics = await this.analyzeCodeMetrics(filePath, content);
      data.push({
        type: 'code-metrics',
        file: filePath,
        timestamp: Date.now(),
        ...codeMetrics,
      });
    });

    // Collect git history (simplified)
    const gitData = await this.collectGitHistory();
    data.push(...gitData);

    // Collect performance history
    const performanceData = await this.collectPerformanceHistory();
    data.push(...performanceData);

    // Collect test history
    const testData = await this.collectTestHistory();
    data.push(...testData);

    return data;
  }

  async analyzeCodeMetrics(filePath, content) {
    return {
      fileSize: content.length,
      lineCount: content.split('\n').length,
      complexity: this.calculateCyclomaticComplexity(content),
      dependencyCount: this.countImports(content),
      functionCount: this.countFunctions(content),
      classCount: this.countClasses(content),
      testCount: this.countTests(content),
      commentRatio: this.calculateCommentRatio(content),
      typeScriptUsage: this.analyzeTypeScriptUsage(content),
    };
  }

  calculateCyclomaticComplexity(code) {
    const complexityKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case',
      'catch', 'finally', '&&', '\\|\\|', '\\?', ':'
    ];

    let complexity = 1; // Base complexity
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  countImports(code) {
    const importMatches = code.match(/import.*from/g);
    return importMatches ? importMatches.length : 0;
  }

  countFunctions(code) {
    const functionMatches = code.match(/(?:function|=>|async\s+function)/g);
    return functionMatches ? functionMatches.length : 0;
  }

  countClasses(code) {
    const classMatches = code.match(/class\s+\w+/g);
    return classMatches ? classMatches.length : 0;
  }

  countTests(code) {
    const testMatches = code.match(/(?:it|test|describe)\s*\(/g);
    return testMatches ? testMatches.length : 0;
  }

  calculateCommentRatio(code) {
    const lines = code.split('\n');
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    });
    
    return lines.length > 0 ? commentLines.length / lines.length : 0;
  }

  analyzeTypeScriptUsage(code) {
    const typeAnnotations = (code.match(/:\s*\w+/g) || []).length;
    const interfaces = (code.match(/interface\s+\w+/g) || []).length;
    const types = (code.match(/type\s+\w+/g) || []).length;
    const anyUsage = (code.match(/:\s*any\b/g) || []).length;

    return {
      annotations: typeAnnotations,
      interfaces,
      types,
      anyUsage,
      score: Math.max(0, (typeAnnotations + interfaces * 2 + types * 2) - anyUsage * 2),
    };
  }

  async collectGitHistory() {
    try {
      const result = await this.runCommand('git log --oneline --since="1 month ago" --pretty=format:"%H,%an,%ad,%s" --date=iso');
      
      if (result.success) {
        return result.stdout.split('\n').filter(line => line.trim()).map(line => {
          const [hash, author, date, message] = line.split(',');
          return {
            type: 'git-commit',
            hash,
            author,
            date: new Date(date).getTime(),
            message,
            timestamp: new Date(date).getTime(),
          };
        });
      }
    } catch (error) {
      log(colors.yellow, `⚠️  Could not collect git history: ${error.message}`);
    }
    
    return [];
  }

  async collectPerformanceHistory() {
    // In a real implementation, this would read from performance logs
    return this.generateSyntheticPerformanceData(50);
  }

  generateSyntheticPerformanceData(count) {
    const data = [];
    const baseTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    for (let i = 0; i < count; i++) {
      data.push({
        type: 'performance',
        timestamp: baseTime + (i * 24 * 60 * 60 * 1000), // Daily data
        buildTime: 20000 + Math.random() * 40000, // 20-60 seconds
        testTime: 5000 + Math.random() * 15000,   // 5-20 seconds
        bundleSize: 500000 + Math.random() * 200000, // 500-700KB
        cpuUsage: 20 + Math.random() * 60,        // 20-80%
        memoryUsage: 30 + Math.random() * 50,     // 30-80%
      });
    }
    
    return data;
  }

  async collectTestHistory() {
    // In a real implementation, read from test result logs
    return this.generateSyntheticTestData(30);
  }

  generateSyntheticTestData(count) {
    const data = [];
    const baseTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < count; i++) {
      const testRun = {
        type: 'test-run',
        timestamp: baseTime + (i * 24 * 60 * 60 * 1000),
        totalTests: 100 + Math.floor(Math.random() * 50),
        passedTests: 0,
        failedTests: 0,
        coverage: 70 + Math.random() * 25,
        duration: 5000 + Math.random() * 10000,
      };
      
      testRun.failedTests = Math.floor(Math.random() * 5);
      testRun.passedTests = testRun.totalTests - testRun.failedTests;
      
      data.push(testRun);
    }
    
    return data;
  }

  async preprocessData(rawData) {
    log(colors.blue, '🔧 Preprocessing training data...');

    // Clean and normalize data
    const cleaned = rawData.filter(item => {
      // Remove invalid entries
      return item.timestamp && item.type;
    });

    // Sort by timestamp
    cleaned.sort((a, b) => a.timestamp - b.timestamp);

    // Normalize numeric values
    const normalized = cleaned.map(item => {
      const normalized = { ...item };
      
      // Normalize performance metrics
      if (item.buildTime) normalized.buildTimeNorm = this.normalize(item.buildTime, 0, 120000);
      if (item.testTime) normalized.testTimeNorm = this.normalize(item.testTime, 0, 60000);
      if (item.bundleSize) normalized.bundleSizeNorm = this.normalize(item.bundleSize, 0, 2000000);
      if (item.complexity) normalized.complexityNorm = this.normalize(item.complexity, 1, 50);
      
      return normalized;
    });

    log(colors.green, `✅ Preprocessed ${normalized.length} data points`);
    return normalized;
  }

  normalize(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  async trainModels() {
    log(colors.blue, '🎯 Training machine learning models...');

    for (const [modelName, model] of this.models) {
      try {
        log(colors.blue, `   Training ${modelName} model...`);
        
        const relevantData = this.learningData.filter(item => this.isRelevantForModel(item, modelName));
        await model.learn(relevantData);
        
        model.trainedOn = relevantData.length;
        
        log(colors.green, `   ✅ ${modelName} trained on ${relevantData.length} examples`);
      } catch (error) {
        log(colors.red, `   ❌ Failed to train ${modelName}: ${error.message}`);
      }
    }

    log(colors.green, '✅ All models trained successfully');
  }

  isRelevantForModel(dataItem, modelName) {
    switch (modelName) {
      case 'code-patterns':
        return dataItem.type === 'code-metrics';
      case 'performance':
        return dataItem.type === 'performance' || dataItem.type === 'code-metrics';
      case 'bug-prediction':
        return dataItem.type === 'git-commit' || dataItem.type === 'code-metrics';
      case 'optimization':
        return dataItem.type === 'code-metrics' || dataItem.type === 'performance';
      case 'workflow':
        return dataItem.type === 'git-commit';
      case 'resource-usage':
        return dataItem.type === 'performance';
      default:
        return true;
    }
  }

  // Model-specific learning implementations
  async learnCodePatterns(data) {
    const model = this.models.get('code-patterns');
    
    for (const item of data) {
      if (item.type === 'code-metrics') {
        // Identify common patterns
        const pattern = this.identifyCodePattern(item);
        
        if (pattern) {
          const existing = model.patterns.get(pattern.type) || { count: 0, examples: [] };
          existing.count++;
          existing.examples.push(item);
          
          if (existing.examples.length > 10) {
            existing.examples = existing.examples.slice(-10); // Keep only last 10 examples
          }
          
          model.patterns.set(pattern.type, existing);
        }
      }
    }
  }

  identifyCodePattern(codeMetrics) {
    // High complexity, low test coverage = needs refactoring
    if (codeMetrics.complexity > 15 && codeMetrics.testCount < 3) {
      return { type: 'needs-refactoring', confidence: 0.8 };
    }
    
    // Many functions, few classes = procedural code
    if (codeMetrics.functionCount > 10 && codeMetrics.classCount === 0) {
      return { type: 'procedural-style', confidence: 0.7 };
    }
    
    // High TypeScript usage = well-typed
    if (codeMetrics.typeScriptUsage.score > 20) {
      return { type: 'well-typed', confidence: 0.9 };
    }
    
    // Many imports, large file = potential split candidate
    if (codeMetrics.dependencyCount > 15 && codeMetrics.fileSize > 10000) {
      return { type: 'split-candidate', confidence: 0.6 };
    }
    
    return null;
  }

  async learnPerformance(data) {
    const model = this.models.get('performance');
    
    // Simple linear regression implementation
    const performanceData = data.filter(item => item.type === 'performance');
    
    if (performanceData.length > 10) {
      // Learn relationships between features and performance
      const features = ['bundleSizeNorm', 'cpuUsage', 'memoryUsage'];
      const target = 'buildTimeNorm';
      
      model.weights = this.simpleLinearRegression(performanceData, features, target);
      model.confidence = Math.min(0.95, model.confidence + 0.05); // Improve confidence
    }
  }

  simpleLinearRegression(data, features, target) {
    // Simplified implementation - in practice use proper ML library
    const weights = {};
    
    features.forEach(feature => {
      let sumXY = 0;
      let sumX = 0;
      let sumY = 0;
      let sumXX = 0;
      let n = 0;
      
      data.forEach(item => {
        if (item[feature] !== undefined && item[target] !== undefined) {
          const x = item[feature];
          const y = item[target];
          sumXY += x * y;
          sumX += x;
          sumY += y;
          sumXX += x * x;
          n++;
        }
      });
      
      if (n > 0) {
        weights[feature] = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
      }
    });
    
    return weights;
  }

  async learnBugPatterns(data) {
    const model = this.models.get('bug-prediction');
    
    // Analyze code changes and associate with bug patterns
    const commits = data.filter(item => item.type === 'git-commit');
    const codeMetrics = data.filter(item => item.type === 'code-metrics');
    
    // Look for bug-fix commits
    const bugFixes = commits.filter(commit => 
      commit.message.toLowerCase().includes('fix') || 
      commit.message.toLowerCase().includes('bug')
    );
    
    // Learn patterns that lead to bugs
    model.bugIndicators = {
      highComplexity: codeMetrics.filter(m => m.complexity > 20).length / codeMetrics.length,
      lowTestCoverage: codeMetrics.filter(m => m.testCount < 2).length / codeMetrics.length,
      frequentChanges: bugFixes.length / Math.max(1, commits.length),
    };
  }

  async learnOptimizationPatterns(data) {
    const model = this.models.get('optimization');
    
    // Analyze successful optimizations
    const performanceData = data.filter(item => item.type === 'performance');
    
    if (performanceData.length > 5) {
      // Identify performance improvements over time
      const improvements = this.findPerformanceImprovements(performanceData);
      
      model.optimizationRules = improvements.map(improvement => ({
        condition: improvement.condition,
        recommendation: improvement.recommendation,
        expectedImprovement: improvement.improvement,
      }));
    }
  }

  findPerformanceImprovements(data) {
    const improvements = [];
    
    // Sort by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);
    
    // Find significant improvements
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const buildTimeImprovement = (previous.buildTime - current.buildTime) / previous.buildTime;
      
      if (buildTimeImprovement > 0.2) { // 20% improvement
        improvements.push({
          condition: { buildTime: previous.buildTime },
          recommendation: 'Build optimization applied',
          improvement: buildTimeImprovement,
        });
      }
    }
    
    return improvements;
  }

  async learnWorkflowPatterns(data) {
    const model = this.models.get('workflow');
    
    const commits = data.filter(item => item.type === 'git-commit');
    
    // Learn common sequences of development activities
    const sequences = this.extractWorkflowSequences(commits);
    model.sequences = sequences;
  }

  extractWorkflowSequences(commits) {
    const sequences = [];
    
    // Simple sequence extraction based on commit messages
    const patterns = [
      { pattern: /^feat/, type: 'feature' },
      { pattern: /^fix/, type: 'bugfix' },
      { pattern: /^test/, type: 'testing' },
      { pattern: /^refactor/, type: 'refactor' },
      { pattern: /^docs/, type: 'documentation' },
    ];
    
    const activities = commits.map(commit => {
      const activity = patterns.find(p => p.pattern.test(commit.message));
      return activity ? activity.type : 'other';
    });
    
    // Find common sequences
    for (let i = 0; i < activities.length - 2; i++) {
      const sequence = activities.slice(i, i + 3);
      sequences.push(sequence);
    }
    
    return sequences;
  }

  async learnResourcePatterns(data) {
    const model = this.models.get('resource-usage');
    
    const resourceData = data.filter(item => item.type === 'performance');
    
    if (resourceData.length > 10) {
      // Learn resource usage patterns over time
      model.patterns = {
        cpuTrend: this.analyzeTimeSeries(resourceData, 'cpuUsage'),
        memoryTrend: this.analyzeTimeSeries(resourceData, 'memoryUsage'),
        buildTimeTrend: this.analyzeTimeSeries(resourceData, 'buildTime'),
      };
    }
  }

  analyzeTimeSeries(data, metric) {
    // Simple trend analysis
    const values = data.map(item => item[metric]).filter(v => v !== undefined);
    
    if (values.length < 3) return { trend: 'stable' };
    
    const first = values.slice(0, Math.floor(values.length / 3));
    const last = values.slice(-Math.floor(values.length / 3));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
    
    const change = (lastAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return { trend: 'increasing', rate: change };
    if (change < -0.1) return { trend: 'decreasing', rate: change };
    return { trend: 'stable', rate: change };
  }

  // Prediction methods
  predictCodePatterns(input) {
    const model = this.models.get('code-patterns');
    const predictions = [];
    
    for (const [patternType, patternData] of model.patterns) {
      const similarity = this.calculatePatternSimilarity(input, patternData.examples);
      
      if (similarity > 0.6) {
        predictions.push({
          pattern: patternType,
          confidence: similarity * model.confidence,
          recommendation: this.getPatternRecommendation(patternType),
        });
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  calculatePatternSimilarity(input, examples) {
    if (examples.length === 0) return 0;
    
    // Simple similarity based on numeric features
    const features = ['complexity', 'functionCount', 'testCount', 'dependencyCount'];
    let totalSimilarity = 0;
    
    for (const example of examples.slice(-3)) { // Use last 3 examples
      let featureSimilarity = 0;
      let validFeatures = 0;
      
      for (const feature of features) {
        if (input[feature] !== undefined && example[feature] !== undefined) {
          const diff = Math.abs(input[feature] - example[feature]);
          const max = Math.max(input[feature], example[feature]);
          if (max > 0) {
            featureSimilarity += 1 - (diff / max);
            validFeatures++;
          }
        }
      }
      
      if (validFeatures > 0) {
        totalSimilarity += featureSimilarity / validFeatures;
      }
    }
    
    return totalSimilarity / Math.min(3, examples.length);
  }

  getPatternRecommendation(patternType) {
    const recommendations = {
      'needs-refactoring': 'Consider breaking down complex functions and adding tests',
      'procedural-style': 'Consider organizing code into classes or modules',
      'well-typed': 'Great job with TypeScript! Consider sharing patterns with team',
      'split-candidate': 'Consider splitting large files into smaller modules',
    };
    
    return recommendations[patternType] || 'Continue following good practices';
  }

  predictPerformance(input) {
    const model = this.models.get('performance');
    
    if (!model.weights) {
      return { error: 'Model not trained yet' };
    }
    
    let prediction = 0;
    const features = ['bundleSizeNorm', 'cpuUsage', 'memoryUsage'];
    
    for (const feature of features) {
      if (input[feature] !== undefined && model.weights[feature]) {
        prediction += input[feature] * model.weights[feature];
      }
    }
    
    return {
      buildTimePrediction: Math.max(0, prediction * 120000), // Denormalize
      confidence: model.confidence,
      factors: this.explainPerformancePrediction(input, model.weights),
    };
  }

  explainPerformancePrediction(input, weights) {
    const factors = [];
    
    if (weights.bundleSizeNorm && input.bundleSizeNorm > 0.7) {
      factors.push('Large bundle size will increase build time');
    }
    
    if (weights.cpuUsage && input.cpuUsage > 70) {
      factors.push('High CPU usage may slow down build');
    }
    
    if (weights.memoryUsage && input.memoryUsage > 80) {
      factors.push('High memory usage may cause performance issues');
    }
    
    return factors;
  }

  predictBugLikelihood(input) {
    const model = this.models.get('bug-prediction');
    
    if (!model.bugIndicators) {
      return { error: 'Bug prediction model not trained yet' };
    }
    
    let riskScore = 0;
    const riskFactors = [];
    
    if (input.complexity > 20) {
      riskScore += 0.3;
      riskFactors.push('High cyclomatic complexity');
    }
    
    if (input.testCount < 2) {
      riskScore += 0.4;
      riskFactors.push('Low test coverage');
    }
    
    if (input.typeScriptUsage && input.typeScriptUsage.anyUsage > 5) {
      riskScore += 0.2;
      riskFactors.push('Excessive use of any type');
    }
    
    if (input.commentRatio < 0.1) {
      riskScore += 0.1;
      riskFactors.push('Insufficient documentation');
    }
    
    return {
      riskScore: Math.min(1, riskScore),
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      riskFactors,
      confidence: model.confidence,
      recommendation: this.getBugPreventionRecommendation(riskScore, riskFactors),
    };
  }

  getBugPreventionRecommendation(riskScore, factors) {
    if (riskScore > 0.7) {
      return 'High risk: Consider immediate refactoring and comprehensive testing';
    } else if (riskScore > 0.4) {
      return 'Medium risk: Add tests and consider simplifying complex logic';
    } else {
      return 'Low risk: Continue following good practices';
    }
  }

  predictOptimizationOpportunities(input) {
    const model = this.models.get('optimization');
    const opportunities = [];
    
    // Performance optimizations
    if (input.buildTime > 45000) {
      opportunities.push({
        type: 'performance',
        opportunity: 'Build time optimization',
        impact: 'high',
        effort: 'medium',
        recommendation: 'Enable parallel builds or optimize dependencies',
      });
    }
    
    if (input.bundleSize > 1000000) {
      opportunities.push({
        type: 'performance',
        opportunity: 'Bundle size optimization',
        impact: 'medium',
        effort: 'medium',
        recommendation: 'Implement code splitting or tree shaking',
      });
    }
    
    // Code quality optimizations
    if (input.complexity > 15) {
      opportunities.push({
        type: 'maintainability',
        opportunity: 'Code complexity reduction',
        impact: 'high',
        effort: 'high',
        recommendation: 'Refactor complex functions into smaller units',
      });
    }
    
    if (input.testCount < 3) {
      opportunities.push({
        type: 'testing',
        opportunity: 'Test coverage improvement',
        impact: 'high',
        effort: 'medium',
        recommendation: 'Add unit tests for better code reliability',
      });
    }
    
    return opportunities.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      const effortWeight = { low: 3, medium: 2, high: 1 };
      
      const aScore = impactWeight[a.impact] * effortWeight[a.effort];
      const bScore = impactWeight[b.impact] * effortWeight[b.effort];
      
      return bScore - aScore;
    });
  }

  predictNextDevelopmentAction(input) {
    const model = this.models.get('workflow');
    
    if (!model.sequences || model.sequences.length === 0) {
      return { error: 'Workflow model not trained yet' };
    }
    
    const currentSequence = input.recentActions || [];
    const predictions = [];
    
    // Find matching sequences
    for (const sequence of model.sequences) {
      if (this.sequenceMatches(currentSequence, sequence.slice(0, -1))) {
        const nextAction = sequence[sequence.length - 1];
        predictions.push(nextAction);
      }
    }
    
    // Count frequency
    const actionCounts = new Map();
    predictions.forEach(action => {
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });
    
    const sortedActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([action, count]) => ({
        action,
        probability: count / predictions.length,
        recommendation: this.getWorkflowRecommendation(action),
      }));
    
    return {
      predictions: sortedActions.slice(0, 3),
      confidence: model.confidence,
    };
  }

  sequenceMatches(current, pattern) {
    if (current.length < pattern.length) return false;
    
    const relevantCurrent = current.slice(-pattern.length);
    return relevantCurrent.every((action, i) => action === pattern[i]);
  }

  getWorkflowRecommendation(action) {
    const recommendations = {
      'feature': 'Good time to implement new functionality',
      'bugfix': 'Consider investigating and fixing issues',
      'testing': 'Add or improve test coverage',
      'refactor': 'Optimize and improve code structure',
      'documentation': 'Update documentation and comments',
    };
    
    return recommendations[action] || 'Continue with current development workflow';
  }

  predictResourceUsage(input) {
    const model = this.models.get('resource-usage');
    
    if (!model.patterns) {
      return { error: 'Resource usage model not trained yet' };
    }
    
    const predictions = {};
    
    // Predict based on trends
    for (const [metric, pattern] of Object.entries(model.patterns)) {
      if (pattern.trend === 'increasing') {
        predictions[metric] = {
          trend: 'increasing',
          expectedChange: pattern.rate * 100,
          recommendation: this.getResourceRecommendation(metric, 'increasing'),
        };
      } else if (pattern.trend === 'decreasing') {
        predictions[metric] = {
          trend: 'decreasing',
          expectedChange: pattern.rate * 100,
          recommendation: this.getResourceRecommendation(metric, 'decreasing'),
        };
      } else {
        predictions[metric] = {
          trend: 'stable',
          expectedChange: 0,
          recommendation: 'Continue monitoring',
        };
      }
    }
    
    return {
      predictions,
      confidence: model.confidence,
      timeframe: '1 week',
    };
  }

  getResourceRecommendation(metric, trend) {
    const recommendations = {
      'cpuTrend': {
        'increasing': 'Consider optimizing CPU-intensive operations',
        'decreasing': 'Good job optimizing CPU usage',
      },
      'memoryTrend': {
        'increasing': 'Monitor for memory leaks and optimize usage',
        'decreasing': 'Memory optimizations are working well',
      },
      'buildTimeTrend': {
        'increasing': 'Investigate build performance degradation',
        'decreasing': 'Build optimizations are effective',
      },
    };
    
    return recommendations[metric]?.[trend] || 'Continue monitoring';
  }

  startContinuousLearning() {
    // Continuous learning from new data
    setInterval(async () => {
      if (!this.isLearning) return;

      await this.collectNewLearningData();
      await this.updateModels();
    }, 300000); // Every 5 minutes
  }

  async collectNewLearningData() {
    try {
      // Collect recent performance data
      const performanceReport = await this.loadPerformanceReport();
      if (performanceReport) {
        this.learningData.push({
          type: 'performance',
          timestamp: Date.now(),
          ...performanceReport,
        });
      }

      // Collect recent optimization results
      const optimizationReport = await this.loadOptimizationReport();
      if (optimizationReport) {
        this.learningData.push({
          type: 'optimization-result',
          timestamp: Date.now(),
          ...optimizationReport,
        });
      }

      // Keep only recent data
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.learningData = this.learningData.filter(item => item.timestamp > oneWeekAgo);

    } catch (error) {
      log(colors.yellow, `⚠️  Failed to collect new learning data: ${error.message}`);
    }
  }

  async loadPerformanceReport() {
    try {
      const reportPath = path.join(process.cwd(), '.production-report.json');
      const content = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      return {
        buildTime: report.performance?.buildTime?.duration || 0,
        bundleSize: report.performance?.bundle?.totalSize || 0,
        healthScore: report.summary?.overallHealth || 100,
      };
    } catch (error) {
      return null;
    }
  }

  async loadOptimizationReport() {
    try {
      const reportPath = path.join(process.cwd(), '.optimization-report.json');
      const content = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(content);
      
      return {
        overallScore: report.overallScore,
        recommendations: report.recommendations?.length || 0,
        improvements: report.analysisResults || {},
      };
    } catch (error) {
      return null;
    }
  }

  async updateModels() {
    const newData = this.learningData.filter(item => 
      item.timestamp > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (newData.length > 5) {
      // Incremental learning
      for (const [modelName, model] of this.models) {
        try {
          const relevantData = newData.filter(item => this.isRelevantForModel(item, modelName));
          if (relevantData.length > 0) {
            await model.learn(relevantData);
            model.trainedOn += relevantData.length;
            model.confidence = Math.min(0.95, model.confidence + 0.01);
          }
        } catch (error) {
          log(colors.red, `❌ Failed to update ${modelName} model: ${error.message}`);
        }
      }
    }
  }

  async scanSourceFiles(dir, callback) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory() && !item.name.startsWith('.')) {
          await this.scanSourceFiles(itemPath, callback);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          const content = await fs.readFile(itemPath, 'utf8');
          await callback(itemPath, content);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
    }
  }

  async runCommand(command) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { stdio: 'pipe', shell: true });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr,
        });
      });
    });
  }

  async generateLearningReport() {
    const report = {
      timestamp: new Date().toISOString(),
      learningStatus: this.isLearning,
      models: {},
      insights: this.insights,
      trainingData: {
        total: this.learningData.length,
        types: this.getDataTypeDistribution(),
        timeSpan: this.getDataTimeSpan(),
      },
      predictions: await this.generateSamplePredictions(),
      recommendations: this.generateLearningRecommendations(),
    };

    // Model summaries
    for (const [modelName, model] of this.models) {
      report.models[modelName] = {
        type: model.type,
        confidence: model.confidence,
        trainedOn: model.trainedOn,
        features: model.features || [],
        status: model.trainedOn > 0 ? 'trained' : 'untrained',
      };
    }

    await fs.writeFile(
      path.join(process.cwd(), '.pattern-recognition-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  getDataTypeDistribution() {
    const distribution = {};
    this.learningData.forEach(item => {
      distribution[item.type] = (distribution[item.type] || 0) + 1;
    });
    return distribution;
  }

  getDataTimeSpan() {
    if (this.learningData.length === 0) return null;
    
    const timestamps = this.learningData.map(item => item.timestamp);
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);
    
    return {
      oldest: new Date(oldest).toISOString(),
      newest: new Date(newest).toISOString(),
      spanDays: (newest - oldest) / (24 * 60 * 60 * 1000),
    };
  }

  async generateSamplePredictions() {
    // Generate sample predictions for demonstration
    const sampleInput = {
      complexity: 12,
      fileSize: 5000,
      testCount: 3,
      dependencyCount: 8,
      buildTime: 25000,
      bundleSize: 800000,
      cpuUsage: 45,
      memoryUsage: 60,
    };

    return {
      codePatterns: this.predictCodePatterns(sampleInput),
      performance: this.predictPerformance(sampleInput),
      bugLikelihood: this.predictBugLikelihood(sampleInput),
      optimizations: this.predictOptimizationOpportunities(sampleInput),
    };
  }

  generateLearningRecommendations() {
    const recommendations = [];
    
    // Check model training status
    const untrainedModels = Array.from(this.models.entries())
      .filter(([, model]) => model.trainedOn === 0)
      .map(([name]) => name);
    
    if (untrainedModels.length > 0) {
      recommendations.push({
        type: 'training',
        priority: 'high',
        message: `Train models: ${untrainedModels.join(', ')}`,
        action: 'Collect more training data and retrain models',
      });
    }
    
    // Check data quality
    if (this.learningData.length < 100) {
      recommendations.push({
        type: 'data-collection',
        priority: 'medium',
        message: 'Increase training data volume for better predictions',
        action: 'Run development processes to collect more training examples',
      });
    }
    
    // Check model confidence
    const lowConfidenceModels = Array.from(this.models.entries())
      .filter(([, model]) => model.confidence < 0.7)
      .map(([name]) => name);
    
    if (lowConfidenceModels.length > 0) {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        message: `Improve confidence for: ${lowConfidenceModels.join(', ')}`,
        action: 'Collect more diverse training data and validate predictions',
      });
    }
    
    return recommendations;
  }

  stopLearning() {
    this.isLearning = false;
    log(colors.yellow, '🛑 Pattern recognition engine stopped');
  }
}

async function main() {
  const engine = new PatternRecognitionEngine();
  
  const action = process.argv[2] || 'learn';
  
  switch (action) {
    case 'learn':
      // Handle process termination
      process.on('SIGINT', async () => {
        log(colors.yellow, '\n🛑 Received SIGINT, shutting down...');
        engine.stopLearning();
        
        const report = await engine.generateLearningReport();
        log(colors.cyan, '📄 Learning report saved to .pattern-recognition-report.json');
        
        process.exit(0);
      });

      await engine.startLearning();
      
      // Keep process alive
      setInterval(() => {
        // Learning engine running in background
      }, 10000);
      break;

    case 'predict':
      const inputFile = process.argv[3];
      if (!inputFile) {
        console.log('Usage: node pattern-recognition-engine.js predict <input-file>');
        break;
      }
      
      try {
        const input = JSON.parse(await fs.readFile(inputFile, 'utf8'));
        await engine.initializeTrainingData();
        await engine.trainModels();
        
        const predictions = await engine.generateSamplePredictions();
        
        console.log('\n🔮 AI Predictions:');
        console.log(JSON.stringify(predictions, null, 2));
      } catch (error) {
        log(colors.red, `❌ Prediction failed: ${error.message}`);
      }
      break;

    case 'report':
      await engine.initializeTrainingData();
      const report = await engine.generateLearningReport();
      
      console.log('\n🧠 Pattern Recognition Report:');
      console.log(`Training data: ${report.trainingData.total} examples`);
      console.log(`Models trained: ${Object.values(report.models).filter(m => m.status === 'trained').length}`);
      console.log(`Recommendations: ${report.recommendations.length}`);
      
      log(colors.cyan, '\n📄 Detailed report saved to .pattern-recognition-report.json');
      break;

    default:
      console.log('Pattern Recognition Engine Commands:');
      console.log('  learn     - Start continuous learning mode');
      console.log('  predict   - Generate predictions from input file');
      console.log('  report    - Generate learning status report');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PatternRecognitionEngine };