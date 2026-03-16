#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CLONE AGENT
 * 
 * Утилита для клонирования агентов
 */

class AgentCloner {
  constructor() {
    this.configPath = path.join(__dirname, '../config/agents.json');
    this.strategiesPath = path.join(__dirname, '../config/bidding-strategies.json');
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  loadStrategies() {
    return JSON.parse(fs.readFileSync(this.strategiesPath, 'utf8'));
  }

  saveConfig(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  cloneAgent(originalName, strategy = 'adaptive') {
    const config = this.loadConfig();
    const strategies = this.loadStrategies();
    
    const original = config.agents.find(a => a.name === originalName);
    
    if (!original) {
      throw new Error(`Agent ${originalName} not found`);
    }

    // Генерация имени клона
    const existingClones = config.agents.filter(a => 
      a.name.startsWith(originalName)
    ).length;
    
    const cloneName = `${originalName}-${existingClones}`;
    
    console.log(`🤖 Cloning ${originalName} → ${cloneName}`);
    console.log(`   Strategy: ${strategy}`);

    // Создание клона
    const clone = JSON.parse(JSON.stringify(original));
    clone.name = cloneName;
    clone.enabled = true;

    // Применение стратегии дифференциации
    switch (strategy) {
      case 'adaptive':
        this.applyAdaptiveStrategy(clone, original, config);
        break;
      
      case 'niche':
        this.applyNicheStrategy(clone, original);
        break;
      
      case 'pricing':
        this.applyPricingStrategy(clone, original);
        break;
      
      case 'aggressive':
        this.applyAggressiveStrategy(clone, original);
        break;
      
      case 'premium':
        this.applyPremiumStrategy(clone, original);
        break;
      
      default:
        console.log('Using default clone (exact copy)');
    }

    // Добавление в конфиг
    config.agents.push(clone);
    this.saveConfig(config);

    // Создание директории агента
    this.createAgentDirectory(cloneName);

    console.log(`✅ Clone created: ${cloneName}`);
    this.printCloneDiff(original, clone);
    
    return cloneName;
  }

  applyAdaptiveStrategy(clone, original, config) {
    console.log('🧠 Applying ADAPTIVE strategy');
    
    const agentsByStrategy = {};
    config.agents.forEach(a => {
      const strategy = a.pricing?.strategy || 'competitive';
      agentsByStrategy[strategy] = (agentsByStrategy[strategy] || 0) + 1;
    });

    const strategies = ['aggressive', 'competitive', 'premium'];
    const leastUsed = strategies.reduce((min, strategy) => {
      const count = agentsByStrategy[strategy] || 0;
      return count < (agentsByStrategy[min] || 0) ? strategy : min;
    }, strategies[0]);

    console.log(`   Least used strategy: ${leastUsed}`);

    if (leastUsed === 'aggressive') {
      this.applyAggressiveStrategy(clone, original);
    } else if (leastUsed === 'premium') {
      this.applyPremiumStrategy(clone, original);
    } else {
      this.applyPricingStrategy(clone, original);
    }
  }

  applyNicheStrategy(clone, original) {
    console.log('📍 Applying NICHE strategy');
    
    if (original.specialties.length > 2) {
      const mid = Math.ceil(original.specialties.length / 2);
      clone.specialties = original.specialties.slice(mid);
      
      console.log(`   Original: ${original.specialties.join(', ')}`);
      console.log(`   Clone: ${clone.specialties.join(', ')}`);
    }
    
    clone.bidding.maxCompetitors = Math.max(3, original.bidding.maxCompetitors - 2);
  }

  applyPricingStrategy(clone, original) {
    console.log('💰 Applying PRICING strategy');
    
    const strategies = ['aggressive', 'competitive', 'premium'];
    const currentStrategy = original.pricing.strategy;
    const currentIndex = strategies.indexOf(currentStrategy);
    const newStrategy = strategies[(currentIndex + 1) % strategies.length];
    
    clone.pricing.strategy = newStrategy;
    
    console.log(`   Strategy: ${currentStrategy} → ${newStrategy}`);
    
    if (newStrategy === 'aggressive') {
      clone.pricing.minPrice = original.pricing.minPrice * 0.75;
      clone.pricing.maxPrice = original.pricing.maxPrice * 0.85;
    } else if (newStrategy === 'premium') {
      clone.pricing.minPrice = original.pricing.minPrice * 1.25;
      clone.pricing.maxPrice = original.pricing.maxPrice * 1.5;
    }
  }

  applyAggressiveStrategy(clone, original) {
    console.log('⚡ Applying AGGRESSIVE strategy');
    
    clone.pricing.strategy = 'aggressive';
    clone.pricing.minPrice = original.pricing.minPrice * 0.7;
    clone.pricing.maxPrice = original.pricing.maxPrice * 0.8;
    clone.bidding.maxCompetitors = 12;
    clone.bidding.maxConcurrentBids = 6;
    clone.bidding.minProfitMargin = 2.0;
    
    console.log('   Optimized for: HIGH VOLUME');
  }

  applyPremiumStrategy(clone, original) {
    console.log('💎 Applying PREMIUM strategy');
    
    clone.pricing.strategy = 'premium';
    clone.pricing.minPrice = original.pricing.minPrice * 1.5;
    clone.pricing.maxPrice = original.pricing.maxPrice * 2.0;
    clone.bidding.maxCompetitors = 3;
    clone.bidding.maxConcurrentBids = 2;
    clone.bidding.minProfitMargin = 4.0;
    clone.qualityControl.minQualityScore = 9;
    clone.qualityControl.externalReview = true;
    
    console.log('   Optimized for: HIGH MARGIN');
  }

  createAgentDirectory(name) {
    const dir = path.join(__dirname, `../agents/${name}`);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: agents/${name}/`);
    }
  }

  printCloneDiff(original, clone) {
    console.log('\n📋 Clone Configuration:');
    console.log('─'.repeat(50));
    console.log(`Name:              ${clone.name}`);
    console.log(`Specialties:       ${clone.specialties.join(', ')}`);
    console.log(`Pricing strategy:  ${clone.pricing.strategy}`);
    console.log(`Price range:       ${clone.pricing.minPrice.toFixed(4)} - ${clone.pricing.maxPrice.toFixed(4)} ETH`);
    console.log(`Max competitors:   ${clone.bidding.maxCompetitors}`);
    console.log(`Min profit margin: ${clone.bidding.minProfitMargin}x`);
    console.log(`Quality threshold: ${clone.qualityControl.minQualityScore}/10`);
    console.log('─'.repeat(50));
  }

  listClones(originalName) {
    const config = this.loadConfig();
    const clones = config.agents.filter(a => 
      a.name.startsWith(originalName) && a.name !== originalName
    );
    
    console.log(`\n🤖 Clones of ${originalName}: ${clones.length}`);
    clones.forEach(clone => {
      console.log(`   • ${clone.name} (${clone.pricing.strategy})`);
    });
  }
}

// ============================================
// CLI
// ============================================

if (require.main === module) {
  const [,, command, agentName, strategy] = process.argv;
  
  const cloner = new AgentCloner();
  
  if (command === 'clone') {
    if (!agentName) {
      console.error('Usage: node clone-agent.js clone <agent-name> [strategy]');
      console.log('\nStrategies:');
      console.log('  adaptive   - Auto-select best strategy');
      console.log('  niche      - Specialize in subset of categories');
      console.log('  pricing    - Different pricing strategy');
      console.log('  aggressive - High volume, low margin');
      console.log('  premium    - High margin, low volume');
      process.exit(1);
    }
    
    try {
      cloner.cloneAgent(agentName, strategy || 'adaptive');
      
      console.log('\n✅ Done! Next steps:');
      console.log('   1. Review config/agents.json');
      console.log('   2. Restart agents: pm2 restart all');
      console.log('   3. Monitor: npm run monitor');
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    
  } else if (command === 'list') {
    if (!agentName) {
      console.error('Usage: node clone-agent.js list <agent-name>');
      process.exit(1);
    }
    
    cloner.listClones(agentName);
    
  } else {
    console.log('CashClaw Agent Cloner\n');
    console.log('Usage:');
    console.log('  node clone-agent.js clone <agent-name> [strategy]');
    console.log('  node clone-agent.js list <agent-name>');
    console.log('\nExamples:');
    console.log('  node clone-agent.js clone agent-writer adaptive');
    console.log('  node clone-agent.js clone agent-coder premium');
    console.log('  node clone-agent.js list agent-writer');
  }
}

module.exports = AgentCloner;
