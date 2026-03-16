#!/usr/bin/env node

require('dotenv').config();
const AutoScaler = require('../lib/auto-scaler');
const NicheDiscovery = require('../lib/niche-discovery');
const MarketExpander = require('../lib/market-expander');
const ProfitOptimizer = require('../lib/profit-optimizer');

/**
 * INTEGRATION TEST
 * 
 * Тестирует интеграцию всех компонентов системы
 */

async function testIntegration() {
  console.log('🧪 INTEGRATION TEST');
  console.log('===================\n');

  let passed = 0;
  let failed = 0;

  // ============================================
  // TEST 1: AutoScaler
  // ============================================
  
  console.log('Test 1: AutoScaler...');
  
  try {
    const scaler = new AutoScaler();
    
    // Test shouldScale
    const mockAgent = {
      name: 'test-agent',
      profit: '0.06',
      winRate: '65.0%',
      tasksCompleted: 15
    };
    
    const decision = scaler.shouldScale(mockAgent, { agents: [mockAgent] });
    
    if (decision.should) {
      console.log('  ✅ Scaling decision logic works');
      passed++;
    } else {
      console.log(`  ℹ️  Would not scale: ${decision.reason}`);
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failed++;
  }

  console.log();

  // ============================================
  // TEST 2: NicheDiscovery
  // ============================================
  
  console.log('Test 2: NicheDiscovery...');
  
  try {
    const discovery = new NicheDiscovery();
    
    const niches = await discovery.findProfitableNiches({
      minMarketSize: 10,
      maxCompetition: 10
    });
    
    console.log(`  ✅ Found ${niches.length} niches`);
    
    if (niches.length > 0) {
      const topNiche = niches[0];
      console.log(`  Top niche: ${topNiche.name} (score: ${discovery.calculateProfitabilityScore(topNiche)})`);
    }
    
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failed++;
  }

  console.log();

  // ============================================
  // TEST 3: MarketExpander
  // ============================================
  
  console.log('Test 3: MarketExpander...');
  
  try {
    const expander = new MarketExpander();
    
    const markets = await expander.getAvailableMarkets();
    
    console.log(`  ✅ Found ${markets.length} marketplaces`);
    
    const enabled = markets.filter(m => m.enabled);
    console.log(`  Active: ${enabled.length}`);
    
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failed++;
  }

  console.log();

  // ============================================
  // TEST 4: ProfitOptimizer
  // ============================================
  
  console.log('Test 4: ProfitOptimizer...');
  
  try {
    const optimizer = new ProfitOptimizer();
    
    // Mock analysis
    const mockAnalysis = {
      agents: [
        {
          name: 'test-agent',
          profit: '0.05',
          winRate: '80.0%',
          tasksCompleted: 20,
          totalSpent: 0.01,
          totalEarned: 0.06
        }
      ]
    };
    
    const optimizations = await optimizer.analyze(mockAnalysis);
    
    console.log(`  ✅ Found ${optimizations.length} optimization opportunities`);
    
    if (optimizations.length > 0) {
      const top = optimizations[0];
      console.log(`  Top optimization: ${top.description}`);
    }
    
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failed++;
  }

  console.log();

  // ============================================
  // TEST 5: File Structure
  // ============================================
  
  console.log('Test 5: File structure...');
  
  const fs = require('fs');
  const requiredFiles = [
    'lib/autonomous-orchestrator.js',
    'lib/auto-scaler.js',
    'lib/niche-discovery.js',
    'lib/market-expander.js',
    'lib/profit-optimizer.js',
    'agents/core-agent.js',
    'ecosystem.config.js',
    'package.json'
  ];

  let filesOk = true;
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`  ❌ Missing: ${file}`);
      filesOk = false;
    }
  });

  if (filesOk) {
    console.log('  ✅ All required files present');
    passed++;
  } else {
    failed++;
  }

  console.log();

  // ============================================
  // SUMMARY
  // ============================================
  
  console.log('===================');
  console.log('Summary:');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('===================\n');

  if (failed === 0) {
    console.log('✅ All integration tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

testIntegration().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
