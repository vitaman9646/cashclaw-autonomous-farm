const fs = require('fs');
const path = require('path');

/**
 * AUTO SCALER
 * 
 * Автоматически клонирует успешных агентов
 * Использует интеллектуальную дифференциацию
 */

class AutoScaler {
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

  // ============================================
  // CLONE AGENT
  // ============================================
  
  async cloneAgent(originalName, strategy = 'adaptive') {
    const config = this.loadConfig();
    const strategies = this.loadStrategies();
    
    const original = config.agents.find(a => a.name === originalName);
    
    if (!original) {
      throw new Error(`Agent ${originalName} not found`);
    }

    // Generate clone name
    const existingClones = config.agents.filter(a => 
      a.name.startsWith(originalName)
    ).length;
    
    const cloneName = `${originalName}-${existingClones}`;
    
    console.log(`🤖 Cloning ${originalName} → ${cloneName}`);
    console.log(`   Strategy: ${strategy}`);

    // Create clone
    const clone = JSON.parse(JSON.stringify(original));
    clone.name = cloneName;
    clone.enabled = true;

    // Apply differentiation strategy
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
        console.log('   Using default clone (exact copy)');
    }

    // Add to config
    config.agents.push(clone);
    this.saveConfig(config);

    // Create agent directory
    this.createAgentDirectory(cloneName);

    console.log(`✅ Clone created: ${cloneName}`);
    
    return cloneName;
  }

  // ============================================
  // ADAPTIVE STRATEGY
  // Automatically chooses best differentiation
  // ============================================
  
  applyAdaptiveStrategy(clone, original, config) {
    console.log('🧠 Applying ADAPTIVE strategy');

    // Analyze existing agents
    const agentsByStrategy = {};
    config.agents.forEach(a => {
      const strategy = a.pricing?.strategy || 'competitive';
      agentsByStrategy[strategy] = (agentsByStrategy[strategy] || 0) + 1;
    });

    // Find least used strategy
    const strategies = ['aggressive', 'competitive', 'premium'];
    const leastUsed = strategies.reduce((min, strategy) => {
      const count = agentsByStrategy[strategy] || 0;
      return count < (agentsByStrategy[min] || 0) ? strategy : min;
    }, strategies[0]);

    console.log(`   Least used strategy: ${leastUsed}`);
    console.log(`   Current distribution: ${JSON.stringify(agentsByStrategy)}`);

    // Apply that strategy
    if (leastUsed === 'aggressive') {
      this.applyAggressiveStrategy(clone, original);
    } else if (leastUsed === 'premium') {
      this.applyPremiumStrategy(clone, original);
    } else {
      this.applyPricingStrategy(clone, original);
    }
  }

  // ============================================
  // NICHE STRATEGY
  // Specialize in subset of categories
  // ============================================
  
  applyNicheStrategy(clone, original) {
    console.log('📍 Applying NICHE strategy');
    
    if (original.specialties.length > 2) {
      // Split specialties
      const mid = Math.ceil(original.specialties.length / 2);
      clone.specialties = original.specialties.slice(mid);
      
      console.log(`   Original: ${original.specialties.join(', ')}`);
      console.log(`   Clone: ${clone.specialties.join(', ')}`);
    }
    
    // Tighter focus = less competition
    clone.bidding.maxCompetitors = Math.max(3, original.bidding.maxCompetitors - 2);
    
    console.log(`   Max competitors: ${original.bidding.maxCompetitors} → ${clone.bidding.maxCompetitors}`);
  }

  // ============================================
  // PRICING STRATEGY
  // Different pricing approach
  // ============================================
  
  applyPricingStrategy(clone, original) {
    console.log('💰 Applying PRICING strategy');
    
    const strategies = ['aggressive', 'competitive', 'premium'];
    const currentStrategy = original.pricing.strategy;
    
    // Rotate to next strategy
    const currentIndex = strategies.indexOf(currentStrategy);
    const newStrategy = strategies[(currentIndex + 1) % strategies.length];
    
    clone.pricing.strategy = newStrategy;
    
    console.log(`   Strategy: ${currentStrategy} → ${newStrategy}`);
    
    // Adjust price limits
    if (newStrategy === 'aggressive') {
      clone.pricing.minPrice = original.pricing.minPrice * 0.75;
      clone.pricing.maxPrice = original.pricing.maxPrice * 0.85;
    } else if (newStrategy === 'premium') {
      clone.pricing.minPrice = original.pricing.minPrice * 1.25;
      clone.pricing.maxPrice = original.pricing.maxPrice * 1.5;
    }
    
    console.log(`   Price range: ${clone.pricing.minPrice.toFixed(4)}-${clone.pricing.maxPrice.toFixed(4)} ETH`);
  }

  // ============================================
  // AGGRESSIVE STRATEGY
  // High volume, low margin
  // ============================================
  
  applyAggressiveStrategy(clone, original) {
    console.log('⚡ Applying AGGRESSIVE strategy');
    
    clone.pricing.strategy = 'aggressive';
    clone.pricing.minPrice = original.pricing.minPrice * 0.7;
    clone.pricing.maxPrice = original.pricing.maxPrice * 0.8;
    
    clone.bidding.maxCompetitors = 12;
    clone.bidding.maxConcurrentBids = 6;
    clone.bidding.minProfitMargin = 2.0;
    
    console.log('   Optimized for: HIGH VOLUME');
    console.log(`   Max competitors: 12`);
    console.log(`   Price: -30%`);
    console.log(`   Min margin: 2.0x`);
  }

  // ============================================
  // PREMIUM STRATEGY
  // High margin, low volume
  // ============================================
  
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
    console.log(`   Max competitors: 3`);
    console.log(`   Price: +50-100%`);
    console.log(`   Quality: 9/10 + external review`);
  }

  // ============================================
  // HELPERS
  // ============================================
  
  createAgentDirectory(name) {
    const dir = path.join(__dirname, `../agents/${name}`);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: agents/${name}/`);
    }
  }

  // ============================================
  // SCALE DECISION
  // ============================================
  
  shouldScale(agentStats, config) {
    const profit = parseFloat(agentStats.profit || 0);
    const winRate = parseFloat(agentStats.winRate || 0);
    const completed = agentStats.tasksCompleted || 0;

    // Load autonomous config
    const autonomousConfig = this.loadAutonomousConfig();
    const scalingConfig = autonomousConfig.autoScaling;

    if (!scalingConfig.enabled) {
      return { should: false, reason: 'Auto-scaling disabled' };
    }

    // Check profit threshold
    if (profit < scalingConfig.minProfit) {
      return {
        should: false,
        reason: `Profit too low (${profit.toFixed(4)} < ${scalingConfig.minProfit})`
      };
    }

    // Check win rate threshold
    if (winRate < scalingConfig.minWinRate) {
      return {
        should: false,
        reason: `Win rate too low (${winRate.toFixed(1)}% < ${scalingConfig.minWinRate}%)`
      };
    }

    // Check minimum tasks
    if (completed < 10) {
      return {
        should: false,
        reason: `Not enough tasks completed (${completed} < 10)`
      };
    }

    // Check max agents limit
    const totalAgents = config.agents.filter(a => a.enabled).length;
    const maxAgents = autonomousConfig.safety?.maxAgents || 50;
    
    if (totalAgents >= maxAgents) {
      return {
        should: false,
        reason: `Max agents limit reached (${totalAgents}/${maxAgents})`
      };
    }

    return {
      should: true,
      reason: `High performer: ${winRate.toFixed(1)}% WR, ${profit.toFixed(4)} ETH profit`
    };
  }

  loadAutonomousConfig() {
    const configPath = path.join(__dirname, '../config/autonomous.json');
    
    if (!fs.existsSync(configPath)) {
      return {
        autoScaling: {
          enabled: true,
          minProfit: 0.05,
          minWinRate: 60
        },
        safety: {
          maxAgents: 50
        }
      };
    }
    
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // ============================================
  // BATCH SCALING
  // ============================================
  
  async scaleMultiple(agents, count = 1) {
    const clones = [];
    
    for (let i = 0; i < count; i++) {
      for (const agentName of agents) {
        const cloneName = await this.cloneAgent(agentName, 'adaptive');
        clones.push(cloneName);
      }
    }
    
    return clones;
  }
}

module.exports = AutoScaler;
