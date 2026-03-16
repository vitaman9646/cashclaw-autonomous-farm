const fs = require('fs');
const path = require('path');

/**
 * PROFIT OPTIMIZER
 * 
 * Анализирует систему и находит возможности увеличения прибыли
 * Предлагает конкретные оптимизации с оценкой эффекта
 */

class ProfitOptimizer {
  constructor() {
    this.analyticsPath = path.join(__dirname, '../analytics/stats.json');
    this.configPath = path.join(__dirname, '../config/agents.json');
  }

  loadAnalytics() {
    try {
      return JSON.parse(fs.readFileSync(this.analyticsPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  saveConfig(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  // ============================================
  // ANALYZE OPTIMIZATIONS
  // ============================================
  
  async analyze(analysis) {
    console.log('💰 Analyzing profit optimization opportunities...');

    const optimizations = [];

    // 1. API Cost Optimization
    const apiOptimizations = await this.analyzeAPICosts(analysis);
    optimizations.push(...apiOptimizations);

    // 2. Pricing Optimization
    const pricingOptimizations = await this.analyzePricing(analysis);
    optimizations.push(...pricingOptimizations);

    // 3. Resource Allocation
    const resourceOptimizations = await this.analyzeResources(analysis);
    optimizations.push(...resourceOptimizations);

    // 4. Quality vs Speed Tradeoff
    const qualityOptimizations = await this.analyzeQuality(analysis);
    optimizations.push(...qualityOptimizations);

    // 5. Market Focus
    const marketOptimizations = await this.analyzeMarketFocus(analysis);
    optimizations.push(...marketOptimizations);

    // Sort by estimated impact
    optimizations.sort((a, b) => b.estimatedProfit - a.estimatedProfit);

    return optimizations;
  }

  // ============================================
  // API COST OPTIMIZATION
  // ============================================
  
  async analyzeAPICosts(analysis) {
    const optimizations = [];
    const config = this.loadConfig();

    analysis.agents?.forEach(agentStats => {
      const agent = config.agents.find(a => a.name === agentStats.name);
      if (!agent) return;

      const avgCost = agentStats.totalSpent / Math.max(agentStats.tasksCompleted, 1);
      const avgEarnings = agentStats.totalEarned / Math.max(agentStats.tasksCompleted, 1);
      const costRatio = (avgCost / avgEarnings) * 100;

      // High API costs
      if (costRatio > 25 && !agent.llm.autoRoute) {
        const estimatedSavings = avgCost * 0.3 * agentStats.tasksCompleted; // 30% savings
        const monthlyImpact = (estimatedSavings / 30) * 30; // Extrapolate to month

        optimizations.push({
          type: 'api_cost_reduction',
          agent: agentStats.name,
          description: `Enable auto-routing for ${agentStats.name}`,
          currentCost: avgCost.toFixed(4),
          costRatio: costRatio.toFixed(1) + '%',
          action: {
            field: `agents.${agentStats.name}.llm.autoRoute`,
            value: true
          },
          estimatedProfit: monthlyImpact,
          risk: 'low',
          effort: 'low'
        });
      }

      // Using expensive model unnecessarily
      if (agent.llm.model.includes('gpt-4') && costRatio > 20) {
        const estimatedSavings = avgCost * 0.5;
        const monthlyImpact = (estimatedSavings / 30) * 30;

        optimizations.push({
          type: 'api_cost_reduction',
          agent: agentStats.name,
          description: `Switch ${agentStats.name} to Claude Sonnet (cheaper)`,
          currentModel: agent.llm.model,
          suggestedModel: 'anthropic/claude-sonnet-4',
          action: {
            field: `agents.${agentStats.name}.llm.model`,
            value: 'anthropic/claude-sonnet-4'
          },
          estimatedProfit: monthlyImpact,
          risk: 'low',
          effort: 'low'
        });
      }
    });

    return optimizations;
  }

  // ============================================
  // PRICING OPTIMIZATION
  // ============================================
  
  async analyzePricing(analysis) {
    const optimizations = [];
    const config = this.loadConfig();

    analysis.agents?.forEach(agentStats => {
      const agent = config.agents.find(a => a.name === agentStats.name);
      if (!agent) return;

      const winRate = parseFloat(agentStats.winRate || 0);

      // Win rate too high = underpriced
      if (winRate > 75 && agentStats.tasksWon > 10) {
        const currentAvgPrice = agentStats.totalEarned / agentStats.tasksWon;
        const suggestedIncrease = 1.15; // +15%
        const newPrice = currentAvgPrice * suggestedIncrease;
        
        const monthlyImpact = (newPrice - currentAvgPrice) * agentStats.tasksWon;

        optimizations.push({
          type: 'pricing_increase',
          agent: agentStats.name,
          description: `Increase prices for ${agentStats.name} (win rate ${winRate.toFixed(1)}% too high)`,
          currentWinRate: winRate.toFixed(1) + '%',
          suggestedIncrease: '+15%',
          action: {
            field: `agents.${agentStats.name}.pricing.minPrice`,
            multiply: suggestedIncrease
          },
          estimatedProfit: monthlyImpact,
          risk: 'low',
          effort: 'low'
        });
      }

      // Win rate too low = overpriced
      if (winRate < 35 && agentStats.quotesSubmitted > 20) {
        optimizations.push({
          type: 'pricing_decrease',
          agent: agentStats.name,
          description: `Lower prices for ${agentStats.name} (win rate ${winRate.toFixed(1)}% too low)`,
          currentWinRate: winRate.toFixed(1) + '%',
          suggestedDecrease: '-10%',
          action: {
            field: `agents.${agentStats.name}.pricing.strategy`,
            value: 'aggressive'
          },
          estimatedProfit: 0, // Revenue neutral but improves volume
          risk: 'low',
          effort: 'low',
          note: 'Will increase task volume'
        });
      }
    });

    return optimizations;
  }

  // ============================================
  // RESOURCE ALLOCATION
  // ============================================
  
  async analyzeResources(analysis) {
    const optimizations = [];

    // Find top and bottom performers
    const sortedAgents = (analysis.agents || [])
      .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit));

    if (sortedAgents.length < 2) return optimizations;

    const topPerformer = sortedAgents[0];
    const bottomPerformers = sortedAgents.filter(a => parseFloat(a.profit) < 0);

    // Reallocate resources from losers to winners
    if (bottomPerformers.length > 0 && parseFloat(topPerformer.profit) > 0.02) {
      const totalSavings = bottomPerformers.reduce((sum, a) => 
        sum + Math.abs(parseFloat(a.profit)), 0
      );

      optimizations.push({
        type: 'resource_reallocation',
        description: `Disable ${bottomPerformers.length} unprofitable agents, clone top performer`,
        disableAgents: bottomPerformers.map(a => a.name),
        cloneAgent: topPerformer.name,
        action: 'bulk_agent_management',
        estimatedProfit: totalSavings + (parseFloat(topPerformer.profit) * 0.8),
        risk: 'medium',
        effort: 'medium'
      });
    }

    return optimizations;
  }

  // ============================================
  // QUALITY VS SPEED
  // ============================================
  
  async analyzeQuality(analysis) {
    const optimizations = [];
    const config = this.loadConfig();

    analysis.agents?.forEach(agentStats => {
      const agent = config.agents.find(a => a.name === agentStats.name);
      if (!agent) return;

      const winRate = parseFloat(agentStats.winRate || 0);

      // Very high win rate + high quality threshold = overkill
      if (winRate > 80 && agent.qualityControl.minQualityScore >= 8) {
        optimizations.push({
          type: 'quality_optimization',
          agent: agentStats.name,
          description: `Lower quality threshold for ${agentStats.name} to increase speed`,
          currentThreshold: agent.qualityControl.minQualityScore,
          suggestedThreshold: 7,
          action: {
            field: `agents.${agentStats.name}.qualityControl.minQualityScore`,
            value: 7
          },
          estimatedProfit: 0.01, // Slight profit from faster turnaround
          risk: 'low',
          effort: 'low',
          note: 'Win rate is high enough to tolerate slightly lower quality gate'
        });
      }
    });

    return optimizations;
  }

  // ============================================
  // MARKET FOCUS
  // ============================================
  
  async analyzeMarketFocus(analysis) {
    const optimizations = [];

    if (!analysis.categories || analysis.categories.length === 0) {
      return optimizations;
    }

    // Find highly profitable categories
    const profitableCategories = analysis.categories.filter(cat => 
      parseFloat(cat.winRate) > 65
    );

    if (profitableCategories.length > 0) {
      const topCategory = profitableCategories[0];

      optimizations.push({
        type: 'market_focus',
        description: `Focus more on "${topCategory.name}" category (${topCategory.winRate} win rate)`,
        category: topCategory.name,
        winRate: topCategory.winRate,
        action: 'create_specialist_agent',
        estimatedProfit: 0.05, // Estimate based on category performance
        risk: 'low',
        effort: 'medium',
        note: `Create dedicated agent for ${topCategory.name}`
      });
    }

    // Find unprofitable categories
    const unprofitableCategories = analysis.categories.filter(cat =>
      parseFloat(cat.winRate) < 30 && cat.quotesSubmitted > 10
    );

    if (unprofitableCategories.length > 0) {
      unprofitableCategories.forEach(cat => {
        optimizations.push({
          type: 'market_focus',
          description: `Stop bidding on "${cat.name}" (${cat.winRate} win rate)`,
          category: cat.name,
          winRate: cat.winRate,
          action: 'remove_specialty',
          estimatedProfit: 0.005, // Small savings from not wasting API calls
          risk: 'low',
          effort: 'low'
        });
      });
    }

    return optimizations;
  }

  // ============================================
  // APPLY OPTIMIZATION
  // ============================================
  
  async apply(optimization) {
    console.log(`⚡ Applying optimization: ${optimization.type}`);

    const config = this.loadConfig();

    switch (optimization.type) {
      case 'api_cost_reduction':
        await this.applyAPICostReduction(config, optimization);
        break;

      case 'pricing_increase':
        await this.applyPricingIncrease(config, optimization);
        break;

      case 'pricing_decrease':
        await this.applyPricingDecrease(config, optimization);
        break;

      case 'quality_optimization':
        await this.applyQualityOptimization(config, optimization);
        break;

      case 'resource_reallocation':
        await this.applyResourceReallocation(config, optimization);
        break;

      case 'market_focus':
        await this.applyMarketFocus(config, optimization);
        break;

      default:
        console.log(`   Unknown optimization type: ${optimization.type}`);
    }

    this.saveConfig(config);
    console.log(`   ✅ Applied`);
  }

  async applyAPICostReduction(config, opt) {
    const agent = config.agents.find(a => a.name === opt.agent);
    if (!agent) return;

    if (opt.action.field.includes('autoRoute')) {
      agent.llm.autoRoute = opt.action.value;
      console.log(`   Enabled auto-routing for ${opt.agent}`);
    } else if (opt.action.field.includes('model')) {
      agent.llm.model = opt.action.value;
      console.log(`   Changed model to ${opt.action.value} for ${opt.agent}`);
    }
  }

  async applyPricingIncrease(config, opt) {
    const agent = config.agents.find(a => a.name === opt.agent);
    if (!agent) return;

    agent.pricing.minPrice *= opt.action.multiply;
    agent.pricing.maxPrice *= opt.action.multiply;

    console.log(`   Increased prices by ${((opt.action.multiply - 1) * 100).toFixed(0)}% for ${opt.agent}`);
  }

  async applyPricingDecrease(config, opt) {
    const agent = config.agents.find(a => a.name === opt.agent);
    if (!agent) return;

    agent.pricing.strategy = opt.action.value;

    console.log(`   Changed strategy to ${opt.action.value} for ${opt.agent}`);
  }

  async applyQualityOptimization(config, opt) {
    const agent = config.agents.find(a => a.name === opt.agent);
    if (!agent) return;

    agent.qualityControl.minQualityScore = opt.action.value;

    console.log(`   Lowered quality threshold to ${opt.action.value} for ${opt.agent}`);
  }

  async applyResourceReallocation(config, opt) {
    // Disable unprofitable agents
    opt.disableAgents.forEach(agentName => {
      const agent = config.agents.find(a => a.name === agentName);
      if (agent) {
        agent.enabled = false;
        console.log(`   Disabled ${agentName}`);
      }
    });

    // Clone top performer (handled by AutoScaler)
    console.log(`   Will clone ${opt.cloneAgent} (requires restart)`);
  }

  async applyMarketFocus(config, opt) {
    if (opt.action === 'remove_specialty') {
      // Remove unprofitable category from all agents
      config.agents.forEach(agent => {
        agent.specialties = agent.specialties.filter(s => 
          !s.toLowerCase().includes(opt.category.toLowerCase())
        );
      });

      console.log(`   Removed "${opt.category}" from all agents`);
    } else if (opt.action === 'create_specialist_agent') {
      console.log(`   Recommendation: Create specialist for ${opt.category}`);
      // This would be handled by AutoScaler
    }
  }

  // ============================================
  // GENERATE REPORT
  // ============================================
  
  async generateOptimizationReport(optimizations) {
    let report = `💰 PROFIT OPTIMIZATION REPORT\n\n`;

    if (optimizations.length === 0) {
      report += `✅ System is already optimized. No improvements found.\n`;
      return report;
    }

    const totalPotentialProfit = optimizations.reduce((sum, opt) => 
      sum + (opt.estimatedProfit || 0), 0
    );

    report += `Found ${optimizations.length} optimization opportunities\n`;
    report += `Total potential impact: +${totalPotentialProfit.toFixed(4)} ETH/month\n\n`;

    // Group by type
    const byType = {};
    optimizations.forEach(opt => {
      if (!byType[opt.type]) byType[opt.type] = [];
      byType[opt.type].push(opt);
    });

    Object.entries(byType).forEach(([type, opts]) => {
      report += `\n${type.toUpperCase().replace(/_/g, ' ')}:\n`;
      
      opts.forEach(opt => {
        report += `  • ${opt.description}\n`;
        report += `    Impact: +${(opt.estimatedProfit || 0).toFixed(4)} ETH/month\n`;
        report += `    Risk: ${opt.risk}\n`;
        report += `    Effort: ${opt.effort}\n`;
        if (opt.note) {
          report += `    Note: ${opt.note}\n`;
        }
      });
    });

    return report;
  }
}

module.exports = ProfitOptimizer;
