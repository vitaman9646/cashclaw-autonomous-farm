const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * MARKET EXPANDER
 * 
 * Автоматически расширяется на новые маркетплейсы
 * Анализирует прибыльность и интегрирует новые источники задач
 */

class MarketExpander {
  constructor() {
    this.configPath = path.join(__dirname, '../config/marketplaces.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig = {
        marketplaces: [
          {
            name: 'Moltlaunch',
            enabled: true,
            type: 'web3',
            api: 'https://api.moltlaunch.com',
            commission: 0,
            paymentMethod: 'ETH',
            trustless: true,
            estimatedVolume: 'medium',
            priority: 1
          },
          {
            name: 'Upwork API',
            enabled: false,
            type: 'traditional',
            api: 'https://www.upwork.com/api',
            commission: 20,
            paymentMethod: 'USD',
            trustless: false,
            estimatedVolume: 'high',
            priority: 2,
            requiresApproval: true,
            risks: [
              'Account suspension risk',
              'Manual verification required',
              'TOS violation potential'
            ]
          },
          {
            name: 'Fiverr API',
            enabled: false,
            type: 'traditional',
            api: 'https://api.fiverr.com',
            commission: 20,
            paymentMethod: 'USD',
            trustless: false,
            estimatedVolume: 'high',
            priority: 3,
            requiresApproval: true,
            risks: [
              'Account suspension risk',
              'Bot detection',
              'TOS violation'
            ]
          },
          {
            name: 'Gitcoin Bounties',
            enabled: false,
            type: 'web3',
            api: 'https://gitcoin.co/api',
            commission: 0,
            paymentMethod: 'ETH/USDC',
            trustless: true,
            estimatedVolume: 'low',
            priority: 4
          },
          {
            name: 'Dework',
            enabled: false,
            type: 'web3',
            api: 'https://api.dework.xyz',
            commission: 0,
            paymentMethod: 'Crypto',
            trustless: true,
            estimatedVolume: 'low',
            priority: 5
          },
          {
            name: 'Layer3',
            enabled: false,
            type: 'web3',
            api: 'https://layer3.xyz/api',
            commission: 0,
            paymentMethod: 'Crypto',
            trustless: true,
            estimatedVolume: 'low',
            priority: 6
          }
        ]
      };

      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }

    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  saveConfig() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  // ============================================
  // GET AVAILABLE MARKETS
  // ============================================
  
  async getAvailableMarkets() {
    const markets = this.config.marketplaces.map(market => {
      const estimatedProfit = this.estimateMarketProfit(market);
      
      return {
        ...market,
        estimatedProfit,
        recommended: estimatedProfit > 100 && market.type === 'web3'
      };
    });

    return markets.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  // ============================================
  // ESTIMATE MARKET PROFIT
  // ============================================
  
  estimateMarketProfit(market) {
    // Simple estimation based on volume and commission
    const volumeMultiplier = {
      'low': 100,
      'medium': 500,
      'high': 2000
    };

    const baseVolume = volumeMultiplier[market.estimatedVolume] || 500;
    const afterCommission = baseVolume * (1 - market.commission / 100);

    // Reduce for risky markets
    const riskPenalty = market.risks ? market.risks.length * 0.2 : 0;
    const adjustedProfit = afterCommission * (1 - riskPenalty);

    return Math.round(adjustedProfit);
  }

  // ============================================
  // EVALUATE EXPANSION
  // ============================================
  
  async evaluateExpansion(marketName) {
    console.log(`🌐 Evaluating expansion to: ${marketName}`);

    const market = this.config.marketplaces.find(m => m.name === marketName);

    if (!market) {
      return { shouldExpand: false, reason: 'Market not found' };
    }

    if (market.enabled) {
      return { shouldExpand: false, reason: 'Already enabled' };
    }

    // Check if requires approval
    if (market.requiresApproval) {
      console.log(`   📬 Requires manual approval`);
      return {
        shouldExpand: false,
        requiresApproval: true,
        reason: 'Manual approval required',
        risks: market.risks || []
      };
    }

    // Evaluate profitability
    const estimatedProfit = this.estimateMarketProfit(market);
    const minProfitThreshold = 200; // $200/month minimum

    if (estimatedProfit < minProfitThreshold) {
      return {
        shouldExpand: false,
        reason: `Estimated profit too low ($${estimatedProfit} < $${minProfitThreshold})`,
        estimatedProfit
      };
    }

    // Check if web3 (safer)
    if (market.type !== 'web3') {
      return {
        shouldExpand: false,
        requiresApproval: true,
        reason: 'Non-web3 marketplace requires approval',
        estimatedProfit
      };
    }

    return {
      shouldExpand: true,
      reason: `Profitable web3 marketplace (est. $${estimatedProfit}/month)`,
      estimatedProfit,
      autoEnable: true
    };
  }

  // ============================================
  // EXPAND TO MARKET
  // ============================================
  
  async expandToMarket(marketName) {
    console.log(`🚀 Expanding to: ${marketName}`);

    const market = this.config.marketplaces.find(m => m.name === marketName);

    if (!market) {
      throw new Error(`Market ${marketName} not found`);
    }

    // Enable market
    market.enabled = true;
    market.enabledAt = new Date().toISOString();

    this.saveConfig();

    console.log(`✅ ${marketName} enabled`);

    // Create integration adapter
    await this.createMarketAdapter(market);

    return {
      market: marketName,
      enabled: true,
      estimatedProfit: this.estimateMarketProfit(market)
    };
  }

  // ============================================
  // CREATE MARKET ADAPTER
  // ============================================
  
  async createMarketAdapter(market) {
    const adapterPath = path.join(__dirname, `../adapters/${market.name.toLowerCase().replace(/\s+/g, '-')}.js`);

    // Check if adapter already exists
    if (fs.existsSync(adapterPath)) {
      console.log(`   ✅ Adapter already exists: ${adapterPath}`);
      return;
    }

    // Create adapters directory if doesn't exist
    const adaptersDir = path.join(__dirname, '../adapters');
    if (!fs.existsSync(adaptersDir)) {
      fs.mkdirSync(adaptersDir, { recursive: true });
    }

    // Generate adapter template
    const adapterTemplate = this.generateAdapterTemplate(market);

    fs.writeFileSync(adapterPath, adapterTemplate);

    console.log(`   📝 Created adapter: ${adapterPath}`);
  }

  // ============================================
  // GENERATE ADAPTER TEMPLATE
  // ============================================
  
  generateAdapterTemplate(market) {
    return `/**
 * ${market.name} Adapter
 * 
 * Auto-generated marketplace adapter
 * Generated: ${new Date().toISOString()}
 */

const fetch = require('node-fetch');

class ${market.name.replace(/\s+/g, '')}Adapter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = '${market.api}';
    this.name = '${market.name}';
  }

  // ============================================
  // FETCH TASKS
  // ============================================
  
  async fetchTasks(filters = {}) {
    console.log(\`📡 Fetching tasks from \${this.name}...\`);

    try {
      // TODO: Implement actual API call
      const response = await fetch(\`\${this.baseURL}/tasks\`, {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(\`API error: \${response.status}\`);
      }

      const data = await response.json();
      
      // Normalize to standard format
      return this.normalizeTasks(data);
    } catch (error) {
      console.error(\`Failed to fetch from \${this.name}:\`, error.message);
      return [];
    }
  }

  // ============================================
  // NORMALIZE TASKS
  // ============================================
  
  normalizeTasks(rawTasks) {
    // Convert marketplace-specific format to standard format
    return rawTasks.map(task => ({
      id: task.id,
      title: task.title || task.name,
      description: task.description,
      category: task.category || 'general',
      tags: task.tags || task.skills || [],
      budget: this.convertBudget(task.budget),
      deadline: task.deadline,
      quotesCount: task.proposals || 0,
      createdAt: task.created_at || Date.now(),
      marketplace: '${market.name}'
    }));
  }

  // ============================================
  // CONVERT BUDGET
  // ============================================
  
  convertBudget(budget) {
    // Convert ${market.paymentMethod} to ETH
    ${market.paymentMethod === 'USD' ? `
    // Approximate USD to ETH conversion
    const ethPrice = 2500; // TODO: Fetch real-time price
    return budget / ethPrice;
    ` : `
    // Already in crypto
    return budget;
    `}
  }

  // ============================================
  // SUBMIT QUOTE
  // ============================================
  
  async submitQuote(taskId, quote) {
    console.log(\`📤 Submitting quote to \${this.name} for task \${taskId}...\`);

    try {
      const response = await fetch(\`\${this.baseURL}/tasks/\${taskId}/quotes\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: quote.price,
          message: quote.message,
          delivery_time: quote.estimatedDelivery
        })
      });

      if (!response.ok) {
        throw new Error(\`Failed to submit quote: \${response.status}\`);
      }

      const result = await response.json();
      
      console.log(\`✅ Quote submitted: \${result.id}\`);
      
      return result;
    } catch (error) {
      console.error(\`Quote submission failed:\`, error.message);
      throw error;
    }
  }

  // ============================================
  // SUBMIT WORK
  // ============================================
  
  async submitWork(taskId, work) {
    console.log(\`📤 Submitting work to \${this.name} for task \${taskId}...\`);

    try {
      const response = await fetch(\`\${this.baseURL}/tasks/\${taskId}/submit\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          work: work
        })
      });

      if (!response.ok) {
        throw new Error(\`Failed to submit work: \${response.status}\`);
      }

      console.log(\`✅ Work submitted\`);
      
      return await response.json();
    } catch (error) {
      console.error(\`Work submission failed:\`, error.message);
      throw error;
    }
  }
}

module.exports = ${market.name.replace(/\s+/g, '')}Adapter;
`;
  }

  // ============================================
  // RECOMMEND MARKETS
  // ============================================
  
  async recommendMarkets() {
    const markets = await this.getAvailableMarkets();

    const recommendations = markets
      .filter(m => !m.enabled && m.estimatedProfit > 100)
      .slice(0, 3)
      .map(m => ({
        name: m.name,
        estimatedProfit: m.estimatedProfit,
        type: m.type,
        commission: m.commission,
        requiresApproval: m.requiresApproval || false,
        risks: m.risks || [],
        reason: this.generateRecommendationReason(m)
      }));

    return recommendations;
  }

  generateRecommendationReason(market) {
    const reasons = [];

    if (market.estimatedProfit > 500) {
      reasons.push(`High profit potential ($${market.estimatedProfit}/month)`);
    }

    if (market.type === 'web3') {
      reasons.push('Web3 (trustless, no account risk)');
    }

    if (market.commission === 0) {
      reasons.push('Zero commission');
    }

    if (market.trustless) {
      reasons.push('Trustless escrow');
    }

    return reasons.join(', ') || 'Additional revenue stream';
  }

  // ============================================
  // MULTI-MARKETPLACE TASK AGGREGATOR
  // ============================================
  
  async aggregateTasks(filters = {}) {
    const enabledMarkets = this.config.marketplaces.filter(m => m.enabled);

    console.log(`📊 Aggregating tasks from ${enabledMarkets.length} marketplaces...`);

    const allTasks = [];

    for (const market of enabledMarkets) {
      try {
        // Load adapter
        const adapterPath = path.join(__dirname, `../adapters/${market.name.toLowerCase().replace(/\s+/g, '-')}.js`);
        
        if (!fs.existsSync(adapterPath)) {
          console.log(`   ⚠️  No adapter for ${market.name}, skipping`);
          continue;
        }

        const Adapter = require(adapterPath);
        const adapter = new Adapter(process.env[`${market.name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`]);

        const tasks = await adapter.fetchTasks(filters);
        
        console.log(`   ✅ ${market.name}: ${tasks.length} tasks`);
        
        allTasks.push(...tasks);
      } catch (error) {
        console.error(`   ❌ ${market.name} failed:`, error.message);
      }
    }

    console.log(`📊 Total: ${allTasks.length} tasks aggregated`);

    return allTasks;
  }

  // ============================================
  // GENERATE REPORT
  // ============================================
  
  async generateMarketReport() {
    const markets = await this.getAvailableMarkets();

    let report = `🌐 MARKETPLACE REPORT\n\n`;

    report += `Active Marketplaces:\n`;
    markets.filter(m => m.enabled).forEach(m => {
      report += `✅ ${m.name}\n`;
      report += `   Type: ${m.type}\n`;
      report += `   Commission: ${m.commission}%\n`;
      report += `   Est. profit: $${m.estimatedProfit}/month\n\n`;
    });

    report += `\nAvailable Marketplaces:\n`;
    markets.filter(m => !m.enabled).forEach(m => {
      report += `${m.recommended ? '⭐' : '○'} ${m.name}\n`;
      report += `   Est. profit: $${m.estimatedProfit}/month\n`;
      if (m.requiresApproval) {
        report += `   📬 Requires approval\n`;
      }
      if (m.risks && m.risks.length > 0) {
        report += `   ⚠️  Risks: ${m.risks.join(', ')}\n`;
      }
      report += `\n`;
    });

    return report;
  }
}

module.exports = MarketExpander;
