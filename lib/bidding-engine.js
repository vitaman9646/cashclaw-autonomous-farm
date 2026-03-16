const fs = require('fs');
const path = require('path');

/**
 * Bidding Engine - стратегия ставок
 */

class BiddingEngine {
  constructor(agentConfig, strategiesConfig) {
    this.agent = agentConfig;
    this.strategies = strategiesConfig.strategies;
    this.quoteStyles = strategiesConfig.quoteStyles;
  }

  async evaluateTask(task) {
    if (!this.matchesSpecialty(task)) {
      return { shouldBid: false, reason: 'specialty_mismatch' };
    }

    const profitability = this.calculateProfitability(task);
    if (profitability < this.agent.bidding.minProfitMargin) {
      return { shouldBid: false, reason: 'low_profit' };
    }

    const competitorCount = task.quotesCount || 0;
    if (competitorCount > this.agent.bidding.maxCompetitors) {
      return { shouldBid: false, reason: 'high_competition' };
    }

    const winProbability = this.estimateWinProbability(task);
    if (winProbability < 0.2) {
      return { shouldBid: false, reason: 'low_win_chance' };
    }

    return {
      shouldBid: true,
      winProbability,
      profitability,
      recommendedPrice: this.calculateOptimalPrice(task),
      strategy: this.selectStrategy(task),
      estimatedCost: this.estimateCost(task)
    };
  }

  matchesSpecialty(task) {
    const taskTags = (task.tags || []).map(t => t.toLowerCase());
    const taskDesc = (task.description || '').toLowerCase();
    const taskCategory = (task.category || '').toLowerCase();

    return this.agent.specialties.some(specialty => {
      const specLower = specialty.toLowerCase();
      return taskTags.includes(specLower) || taskDesc.includes(specLower) || taskCategory.includes(specLower);
    });
  }

  calculateProfitability(task) {
    const estimatedCost = this.estimateCost(task);
    const taskBudget = task.budget || this.estimateMarketPrice(task);
    return taskBudget / estimatedCost;
  }

  estimateCost(task) {
    const complexity = this.estimateComplexity(task);
    const baseCosts = { 1: 0.0003, 2: 0.0005, 3: 0.0008, 4: 0.0012, 5: 0.0018, 6: 0.0025, 7: 0.0035, 8: 0.0050, 9: 0.0070, 10: 0.0100 };
    return baseCosts[complexity] || 0.002;
  }

  estimateComplexity(task) {
    const description = (task.description || '').toLowerCase();
    let complexity = 5;
    if (['simple', 'basic', 'quick'].some(kw => description.includes(kw))) complexity -= 2;
    if (['complex', 'advanced', 'detailed'].some(kw => description.includes(kw))) complexity += 2;
    return Math.max(1, Math.min(10, complexity));
  }

  estimateMarketPrice(task) {
    const complexity = this.estimateComplexity(task);
    const basePrices = { 'content writing': 0.01, 'code review': 0.02, 'typescript': 0.025, 'research': 0.015, 'general': 0.012 };
    const basePrice = basePrices[(task.category || '').toLowerCase()] || 0.012;
    return basePrice * (0.5 + complexity / 10);
  }

  estimateWinProbability(task) {
    let probability = 0.5;
    const competitorCount = task.quotesCount || 0;
    if (competitorCount === 0) probability *= 1.3;
    else if (competitorCount < 3) probability *= 1.1;
    else if (competitorCount > 7) probability *= 0.7;
    return Math.min(0.95, Math.max(0.05, probability));
  }

  selectStrategy(task) {
    const competitorCount = task.quotesCount || 0;
    if (competitorCount > 7) return 'aggressive';
    return this.agent.pricing.strategy || 'competitive';
  }

  calculateOptimalPrice(task) {
    const strategy = this.selectStrategy(task);
    const strategyConfig = this.strategies[strategy];
    const basePrice = task.budget || this.estimateMarketPrice(task);
    let finalPrice = basePrice * strategyConfig.priceMultiplier;
    finalPrice = Math.max(this.agent.pricing.minPrice, finalPrice);
    finalPrice = Math.min(this.agent.pricing.maxPrice, finalPrice);
    return parseFloat(finalPrice.toFixed(4));
  }

  trackQuote(taskId, quote, task) {
    console.log(`📊 Quote tracked: ${taskId}`);
  }

  trackWin(taskId, quote, task) {
    console.log(`🎉 Win tracked: ${taskId}`);
  }

  getWinRate() {
    return 0;
  }

  getAnalytics() {
    return { quotesSubmitted: 0, tasksWon: 0, winRate: 0 };
  }
}

module.exports = BiddingEngine;
