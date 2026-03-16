const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * NICHE DISCOVERY
 * 
 * Автоматически находит прибыльные ниши на маркетплейсе
 * Анализирует спрос, конкуренцию и прибыльность
 */

class NicheDiscovery {
  constructor() {
    this.cachePath = path.join(__dirname, '../analytics/niche-cache.json');
    this.cache = this.loadCache();
  }

  loadCache() {
    try {
      return JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
    } catch (e) {
      return {
        niches: [],
        lastUpdate: null
      };
    }
  }

  saveCache() {
    fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2));
  }

  // ============================================
  // FIND PROFITABLE NICHES
  // ============================================
  
  async findProfitableNiches(options = {}) {
    const {
      minMarketSize = 50,      // Min tasks per week
      maxCompetition = 5,      // Max avg competitors
      minAvgPrice = 0.01,      // Min average price (ETH)
      lookbackDays = 30
    } = options;

    console.log('🔍 Discovering profitable niches...');
    console.log(`   Min market size: ${minMarketSize} tasks/week`);
    console.log(`   Max competition: ${maxCompetition} competitors`);
    console.log(`   Min avg price: ${minAvgPrice} ETH`);

    // Fetch marketplace data
    const marketData = await this.fetchMarketplaceData(lookbackDays);

    if (!marketData || marketData.length === 0) {
      console.log('   ⚠️  No market data available');
      return [];
    }

    // Analyze categories
    const categoryStats = this.analyzeCategories(marketData);

    // Filter profitable niches
    const profitableNiches = categoryStats.filter(cat => {
      const tasksPerWeek = (cat.taskCount / lookbackDays) * 7;
      
      return (
        tasksPerWeek >= minMarketSize &&
        cat.avgCompetitors <= maxCompetition &&
        cat.avgPrice >= minAvgPrice
      );
    });

    // Sort by profitability score
    profitableNiches.sort((a, b) => {
      const scoreA = this.calculateProfitabilityScore(a);
      const scoreB = this.calculateProfitabilityScore(b);
      return scoreB - scoreA;
    });

    // Update cache
    this.cache.niches = profitableNiches;
    this.cache.lastUpdate = Date.now();
    this.saveCache();

    console.log(`   ✅ Found ${profitableNiches.length} profitable niches`);

    return profitableNiches;
  }

  // ============================================
  // FETCH MARKETPLACE DATA
  // ============================================
  
  async fetchMarketplaceData(days = 30) {
    // In production, this would call actual Moltlaunch API
    // For now, return mock data or read from cache
    
    console.log(`   📡 Fetching marketplace data (${days} days)...`);

    try {
      // Mock API call
      // const response = await fetch('https://api.moltlaunch.com/tasks/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ lookbackDays: days })
      // });
      // const data = await response.json();
      
      // For now, return mock data
      const mockData = this.generateMockMarketData(days);
      
      return mockData;
    } catch (error) {
      console.error('   ❌ Failed to fetch market data:', error.message);
      return [];
    }
  }

  generateMockMarketData(days) {
    // Generate realistic mock data for testing
    const categories = [
      'content writing',
      'blog posts',
      'technical writing',
      'social media content',
      'typescript',
      'javascript',
      'python',
      'code review',
      'bug fixing',
      'web scraping',
      'data analysis',
      'research',
      'seo optimization',
      'logo design',
      'ui/ux design',
      'video editing',
      'translation',
      'proofreading'
    ];

    const tasks = [];
    const tasksPerDay = 50;

    for (let day = 0; day < days; day++) {
      for (let i = 0; i < tasksPerDay; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const basePrice = Math.random() * 0.08 + 0.005;
        const competitors = Math.floor(Math.random() * 15);
        
        tasks.push({
          id: `task-${day}-${i}`,
          category: category,
          tags: [category],
          budget: parseFloat(basePrice.toFixed(4)),
          quotesCount: competitors,
          createdAt: Date.now() - (days - day) * 24 * 60 * 60 * 1000,
          completed: Math.random() > 0.3
        });
      }
    }

    return tasks;
  }

  // ============================================
  // ANALYZE CATEGORIES
  // ============================================
  
  analyzeCategories(tasks) {
    const categoryMap = {};

    tasks.forEach(task => {
      const category = task.category || 'uncategorized';
      
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          taskCount: 0,
          totalPrice: 0,
          totalCompetitors: 0,
          completedCount: 0,
          prices: [],
          competitors: []
        };
      }

      const cat = categoryMap[category];
      cat.taskCount++;
      cat.totalPrice += task.budget || 0;
      cat.totalCompetitors += task.quotesCount || 0;
      if (task.completed) cat.completedCount++;
      
      cat.prices.push(task.budget || 0);
      cat.competitors.push(task.quotesCount || 0);
    });

    // Calculate stats
    return Object.values(categoryMap).map(cat => {
      const avgPrice = cat.totalPrice / cat.taskCount;
      const avgCompetitors = cat.totalCompetitors / cat.taskCount;
      const completionRate = (cat.completedCount / cat.taskCount) * 100;
      
      // Calculate price variance
      const variance = cat.prices.reduce((sum, price) => {
        return sum + Math.pow(price - avgPrice, 2);
      }, 0) / cat.prices.length;
      const priceStdDev = Math.sqrt(variance);

      return {
        name: cat.name,
        taskCount: cat.taskCount,
        avgPrice: parseFloat(avgPrice.toFixed(4)),
        avgCompetitors: parseFloat(avgCompetitors.toFixed(1)),
        completionRate: parseFloat(completionRate.toFixed(1)),
        priceStdDev: parseFloat(priceStdDev.toFixed(4)),
        minPrice: Math.min(...cat.prices),
        maxPrice: Math.max(...cat.prices)
      };
    });
  }

  // ============================================
  // PROFITABILITY SCORE
  // ============================================
  
  calculateProfitabilityScore(niche) {
    // Score formula:
    // High market size = good
    // Low competition = good
    // High avg price = good
    // High completion rate = good
    // Low price variance = good (predictable)

    const marketSizeScore = Math.min(niche.taskCount / 100, 1) * 30;
    const competitionScore = Math.max(1 - (niche.avgCompetitors / 10), 0) * 25;
    const priceScore = Math.min(niche.avgPrice / 0.05, 1) * 25;
    const completionScore = (niche.completionRate / 100) * 10;
    const stabilityScore = Math.max(1 - (niche.priceStdDev / niche.avgPrice), 0) * 10;

    const totalScore = 
      marketSizeScore +
      competitionScore +
      priceScore +
      completionScore +
      stabilityScore;

    return parseFloat(totalScore.toFixed(2));
  }

  // ============================================
  // RECOMMEND SPECIALTIES
  // ============================================
  
  async recommendSpecialties(currentSpecialties = []) {
    const niches = await this.findProfitableNiches();

    // Filter out existing specialties
    const newNiches = niches.filter(niche => 
      !currentSpecialties.some(spec => 
        spec.toLowerCase().includes(niche.name.toLowerCase())
      )
    );

    // Top 5 recommendations
    const recommendations = newNiches.slice(0, 5).map(niche => ({
      specialty: niche.name,
      score: this.calculateProfitabilityScore(niche),
      marketSize: niche.taskCount,
      avgPrice: niche.avgPrice,
      competition: niche.avgCompetitors,
      reasoning: this.generateReasoning(niche)
    }));

    return recommendations;
  }

  generateReasoning(niche) {
    const reasons = [];

    const tasksPerWeek = (niche.taskCount / 30) * 7;
    
    if (tasksPerWeek > 100) {
      reasons.push(`High demand (${tasksPerWeek.toFixed(0)} tasks/week)`);
    }
    
    if (niche.avgCompetitors < 3) {
      reasons.push(`Low competition (${niche.avgCompetitors.toFixed(1)} avg)`);
    }
    
    if (niche.avgPrice > 0.03) {
      reasons.push(`High value (${niche.avgPrice.toFixed(4)} ETH avg)`);
    }
    
    if (niche.completionRate > 80) {
      reasons.push(`High completion rate (${niche.completionRate.toFixed(0)}%)`);
    }

    return reasons.join(', ');
  }

  // ============================================
  // TEST NICHE
  // ============================================
  
  async createTestAgent(nicheName, testBudget = 0.01) {
    console.log(`🧪 Creating test agent for niche: ${nicheName}`);
    console.log(`   Test budget: ${testBudget} ETH`);

    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../config/agents.json'), 'utf8')
    );

    const testAgent = {
      name: `test-${nicheName.replace(/\s+/g, '-')}`,
      enabled: true,
      description: `Test agent for ${nicheName} niche`,
      specialties: [nicheName],
      llm: {
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        autoRoute: true,
        maxTokens: 4000,
        temperature: 0.7
      },
      pricing: {
        minPrice: 0.005,
        maxPrice: 0.05,
        strategy: 'competitive'
      },
      bidding: {
        enabled: true,
        maxConcurrentBids: 2,
        maxCompetitors: 8,
        minProfitMargin: 2.5,
        responseTimeTarget: 30,
        testMode: true,
        testBudget: testBudget
      },
      qualityControl: {
        selfReview: true,
        externalReview: false,
        minQualityScore: 7
      }
    };

    config.agents.push(testAgent);

    fs.writeFileSync(
      path.join(__dirname, '../config/agents.json'),
      JSON.stringify(config, null, 2)
    );

    console.log(`✅ Test agent created: ${testAgent.name}`);
    console.log(`   Will auto-disable after spending ${testBudget} ETH`);

    return testAgent.name;
  }

  // ============================================
  // EVALUATE TEST RESULTS
  // ============================================
  
  async evaluateTestAgent(agentName) {
    const Analytics = require('./analytics');
    const analytics = new Analytics();
    
    const summary = analytics.getSummary();
    const agentStats = summary.byAgent.find(a => a.name === agentName);

    if (!agentStats) {
      return {
        success: false,
        reason: 'No data available'
      };
    }

    const profit = parseFloat(agentStats.profit || 0);
    const winRate = parseFloat(agentStats.winRate || 0);
    const completed = agentStats.tasksCompleted || 0;

    // Evaluation criteria
    const profitable = profit > 0;
    const goodWinRate = winRate > 50;
    const sufficientData = completed >= 5;

    const success = profitable && goodWinRate && sufficientData;

    return {
      success,
      profit,
      winRate,
      completed,
      recommendation: success 
        ? 'Niche is profitable - create permanent agent'
        : 'Niche underperforming - try different approach or abandon'
    };
  }

  // ============================================
  // REPORT
  // ============================================
  
  async generateNicheReport() {
    const niches = await this.findProfitableNiches();

    let report = `📊 NICHE DISCOVERY REPORT\n\n`;
    report += `Found ${niches.length} profitable niches:\n\n`;

    niches.slice(0, 10).forEach((niche, i) => {
      const score = this.calculateProfitabilityScore(niche);
      const tasksPerWeek = ((niche.taskCount / 30) * 7).toFixed(0);
      
      report += `${i + 1}. ${niche.name}\n`;
      report += `   Score: ${score}/100\n`;
      report += `   Market: ${tasksPerWeek} tasks/week\n`;
      report += `   Avg price: ${niche.avgPrice} ETH\n`;
      report += `   Competition: ${niche.avgCompetitors} avg\n`;
      report += `   Completion: ${niche.completionRate}%\n`;
      report += `\n`;
    });

    return report;
  }
}

module.exports = NicheDiscovery;
