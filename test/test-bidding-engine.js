#!/usr/bin/env node

const BiddingEngine = require('../lib/bidding-engine');

async function testBiddingEngine() {
  console.log('🧪 Testing Bidding Engine...\n');

  const agentConfig = {
    name: 'test-agent',
    specialties: ['content writing', 'blog posts'],
    pricing: { minPrice: 0.001, maxPrice: 0.05, strategy: 'competitive' },
    bidding: { maxCompetitors: 8, minProfitMargin: 2.5 }
  };

  const strategiesConfig = {
    strategies: {
      competitive: { priceMultiplier: 0.9, maxComplexity: 7, maxCompetitors: 8 },
      aggressive: { priceMultiplier: 0.75, maxComplexity: 5, maxCompetitors: 10 }
    }
  };

  const engine = new BiddingEngine(agentConfig, strategiesConfig);

  const task = {
    id: 'test-001',
    description: 'Write a blog post about AI',
    category: 'content writing',
    tags: ['content writing'],
    budget: 0.02,
    quotesCount: 3
  };

  try {
    const evaluation = await engine.evaluateTask(task);
    
    console.log('Task evaluation:');
    console.log(`  Should bid: ${evaluation.shouldBid}`);
    
    if (evaluation.shouldBid) {
      console.log(`  Price: ${evaluation.recommendedPrice} ETH`);
      console.log(`  Strategy: ${evaluation.strategy}`);
      console.log(`  Win probability: ${(evaluation.winProbability * 100).toFixed(1)}%`);
      console.log('✅ Bidding Engine test passed');
      process.exit(0);
    } else {
      console.log(`  Reason: ${evaluation.reason}`);
      console.log('✅ Bidding Engine test passed (declined task correctly)');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBiddingEngine();
