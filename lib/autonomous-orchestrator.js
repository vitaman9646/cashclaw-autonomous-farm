#!/usr/bin/env node

const Analytics = require('./analytics');
const TelegramNotifier = require('./telegram-notifier');
const AutoScaler = require('./auto-scaler');
const NicheDiscovery = require('./niche-discovery');
const MarketExpander = require('./market-expander');
const ProfitOptimizer = require('./profit-optimizer');
const fs = require('fs');
const path = require('path');

/**
 * AUTONOMOUS ORCHESTRATOR
 * 
 * Главный мозг системы. Принимает все решения автоматически.
 * 
 * Запускается раз в день (или чаще) и:
 * - Анализирует производительность
 * - Принимает решения о масштабировании
 * - Клонирует успешных агентов
 * - Отключает убыточных
 * - Ищет новые ниши
 * - Расширяется на новые маркетплейсы
 * - Оптимизирует прибыль
 * - Отправляет отчёты в Telegram
 */

class AutonomousOrchestrator {
  constructor() {
    this.analytics = new Analytics();
    this.telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );
    this.scaler = new AutoScaler();
    this.nicheDiscovery = new NicheDiscovery();
    this.marketExpander = new MarketExpander();
    this.profitOptimizer = new ProfitOptimizer();
    
    this.config = this.loadConfig();
    this.decisions = [];
    this.executedActions = [];
  }

  loadConfig() {
    const configPath = path.join(__dirname, '../config/autonomous.json');
    
    if (!fs.existsSync(configPath)) {
      // Create default autonomous config
      const defaultConfig = {
        enabled: true,
        
        // Масштабирование
        autoScaling: {
          enabled: true,
          minProfit: 0.05,              // Min profit to clone (ETH)
          minWinRate: 60,                // Min win rate to clone (%)
          maxAgentsPerVPS: 8,            // Max agents per VPS
          profitPerAgent: 0.02,          // Expected profit per agent
          scaleInterval: 'weekly'        // How often to check
        },
        
        // Оптимизация
        autoOptimization: {
          enabled: true,
          removeUnprofitable: true,      // Auto-disable losing agents
          unprofitableThreshold: -0.005, // Negative profit threshold (ETH)
          lowWinRateThreshold: 25,       // Disable if WR < 25%
          minSampleSize: 20              // Min tasks before decision
        },
        
        // Поиск ниш
        nicheDiscovery: {
          enabled: true,
          checkInterval: 'weekly',
          minMarketSize: 50,             // Min tasks per week
          maxCompetition: 5,             // Max avg competitors
          testBudget: 0.01               // ETH to spend on testing
        },
        
        // Расширение на новые рынки
        marketExpansion: {
          enabled: false,                 // Осторожно с этим!
          upworkAPI: false,
          fiverrAPI: false,
          bounties: true
        },
        
        // Вывод средств
        autoWithdrawal: {
          enabled: true,
          threshold: 0.1,                // Auto-withdraw when > 0.1 ETH
          targetWallet: process.env.MAIN_WALLET_ADDRESS,
          keepReserve: 0.005             // Keep for gas
        },
        
        // Уведомления
        notifications: {
          dailyReport: true,
          weeklyReport: true,
          actionAlerts: true,            // Alert when action taken
          approvalRequired: {            // Require approval for:
            newVPS: true,                // Adding new VPS
            marketExpansion: true,       // New marketplaces
            largeWithdrawal: true        // Withdrawal > 1 ETH
          }
        },
        
        // Безопасность
        safety: {
          maxDailySpend: 10,             // USD
          maxAgents: 50,                 // Total limit
          emergencyStop: {
            enabled: true,
            profitDropThreshold: -0.1,   // Stop if -0.1 ETH in 24h
            winRateDropThreshold: 20     // Stop if WR drops to 20%
          }
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log('✅ Created default autonomous.json');
      
      return defaultConfig;
    }
    
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // ============================================
  // MAIN ORCHESTRATION LOOP
  // ============================================
  
  async run() {
    console.log('🤖 AUTONOMOUS ORCHESTRATOR');
    console.log('==========================\n');
    console.log(`Started: ${new Date().toISOString()}\n`);

    if (!this.config.enabled) {
      console.log('⏸️  Autonomous mode disabled');
      return;
    }

    // 1. Collect data
    console.log('📊 Step 1: Analyzing performance...');
    const analysis = await this.analyzePerformance();
    
    // 2. Check safety limits
    console.log('\n🛡️  Step 2: Safety checks...');
    const safetyStatus = await this.checkSafety(analysis);
    
    if (!safetyStatus.safe) {
      await this.handleEmergency(safetyStatus);
      return;
    }
    
    // 3. Optimize existing agents
    console.log('\n⚡ Step 3: Optimizing existing agents...');
    await this.optimizeAgents(analysis);
    
    // 4. Scale successful agents
    console.log('\n📈 Step 4: Auto-scaling...');
    await this.scaleAgents(analysis);
    
    // 5. Discover new niches
    console.log('\n🔍 Step 5: Niche discovery...');
    await this.discoverNiches();
    
    // 6. Expand to new markets
    console.log('\n🌐 Step 6: Market expansion...');
    await this.expandMarkets();
    
    // 7. Optimize profit
    console.log('\n💰 Step 7: Profit optimization...');
    await this.optimizeProfit(analysis);
    
    // 8. Auto-withdrawal
    console.log('\n💸 Step 8: Auto-withdrawal...');
    await this.handleWithdrawals();
    
    // 9. Generate report
    console.log('\n📋 Step 9: Generating report...');
    await this.generateReport(analysis);
    
    // 10. Execute pending actions
    console.log('\n✅ Step 10: Executing actions...');
    await this.executeActions();
    
    console.log('\n==========================');
    console.log('✅ Orchestration complete\n');
    
    this.saveLog();
  }

  // ============================================
  // STEP 1: ANALYZE PERFORMANCE
  // ============================================
  
  async analyzePerformance() {
    const summary = this.analytics.getSummary();
    const timeline = this.analytics.stats.timeline || [];
    
    // Recent performance (last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentEvents = timeline.filter(e => e.timestamp > weekAgo);
    
    const recentQuotes = recentEvents.filter(e => e.type === 'quote').length;
    const recentWins = recentEvents.filter(e => e.type === 'win').length;
    const recentCompletions = recentEvents.filter(e => e.type === 'completion');
    
    const recentProfit = recentCompletions.reduce((sum, e) => sum + (e.profit || 0), 0);
    const recentWinRate = recentQuotes > 0 ? (recentWins / recentQuotes) * 100 : 0;
    
    return {
      overall: summary,
      recent: {
        quotes: recentQuotes,
        wins: recentWins,
        winRate: recentWinRate,
        profit: recentProfit,
        completions: recentCompletions.length
      },
      agents: summary.byAgent,
      categories: summary.topCategories
    };
  }

  // ============================================
  // STEP 2: SAFETY CHECKS
  // ============================================
  
  async checkSafety(analysis) {
    const issues = [];
    
    // Check profit drop
    if (analysis.recent.profit < this.config.safety.emergencyStop.profitDropThreshold) {
      issues.push({
        severity: 'critical',
        type: 'profit_drop',
        message: `Recent profit: ${analysis.recent.profit.toFixed(4)} ETH (threshold: ${this.config.safety.emergencyStop.profitDropThreshold})`
      });
    }
    
    // Check win rate drop
    if (analysis.recent.winRate < this.config.safety.emergencyStop.winRateDropThreshold) {
      issues.push({
        severity: 'critical',
        type: 'winrate_drop',
        message: `Recent win rate: ${analysis.recent.winRate.toFixed(1)}% (threshold: ${this.config.safety.emergencyStop.winRateDropThreshold}%)`
      });
    }
    
    // Check total agents
    const totalAgents = analysis.agents.length;
    if (totalAgents >= this.config.safety.maxAgents) {
      issues.push({
        severity: 'warning',
        type: 'max_agents',
        message: `Total agents: ${totalAgents} (limit: ${this.config.safety.maxAgents})`
      });
    }
    
    const safe = issues.filter(i => i.severity === 'critical').length === 0;
    
    return { safe, issues };
  }

  async handleEmergency(safetyStatus) {
    console.log('\n🚨 EMERGENCY MODE ACTIVATED');
    console.log('===========================\n');
    
    safetyStatus.issues.forEach(issue => {
      console.log(`${issue.severity === 'critical' ? '🚨' : '⚠️'} ${issue.type}: ${issue.message}`);
    });
    
    if (this.config.safety.emergencyStop.enabled) {
      console.log('\n🛑 Stopping all agents...');
      
      // Notify immediately
      await this.telegram.send(`
🚨 *EMERGENCY STOP ACTIVATED*

Critical issues detected:
${safetyStatus.issues.map(i => `• ${i.message}`).join('\n')}

All agents have been stopped.
Manual intervention required.

Check logs: ssh your_vps "pm2 logs"
      `);
      
      // Execute emergency stop
      const { execSync } = require('child_process');
      try {
        execSync('pm2 stop all');
        console.log('✅ All agents stopped');
      } catch (error) {
        console.error('❌ Failed to stop agents:', error.message);
      }
    } else {
      await this.telegram.send(`
⚠️ *SAFETY ALERT*

Issues detected but emergency stop disabled:
${safetyStatus.issues.map(i => `• ${i.message}`).join('\n')}

Please review system status.
      `);
    }
  }

  // ============================================
  // STEP 3: OPTIMIZE AGENTS
  // ============================================
  
  async optimizeAgents(analysis) {
    if (!this.config.autoOptimization.enabled) {
      console.log('Auto-optimization disabled');
      return;
    }

    const agentsConfig = JSON.parse(
      fs.readFileSync('./config/agents.json', 'utf8')
    );

    for (const agentStats of analysis.agents) {
      const agent = agentsConfig.agents.find(a => a.name === agentStats.name);
      
      if (!agent) continue;

      const profit = parseFloat(agentStats.profit);
      const winRate = parseFloat(agentStats.winRate);
      const completed = agentStats.tasksCompleted;

      // Skip if not enough data
      if (completed < this.config.autoOptimization.minSampleSize) {
        console.log(`  ⏭️  ${agentStats.name}: Insufficient data (${completed} tasks)`);
        continue;
      }

      // Check if unprofitable
      if (this.config.autoOptimization.removeUnprofitable) {
        if (profit < this.config.autoOptimization.unprofitableThreshold) {
          console.log(`  ❌ ${agentStats.name}: Unprofitable (${profit.toFixed(4)} ETH)`);
          
          agent.enabled = false;
          
          this.decisions.push({
            type: 'disable_agent',
            agent: agentStats.name,
            reason: 'unprofitable',
            profit: profit
          });
          
          continue;
        }
      }

      // Check if low win rate
      if (winRate < this.config.autoOptimization.lowWinRateThreshold) {
        console.log(`  ⚠️  ${agentStats.name}: Low win rate (${winRate.toFixed(1)}%)`);
        
        agent.enabled = false;
        
        this.decisions.push({
          type: 'disable_agent',
          agent: agentStats.name,
          reason: 'low_winrate',
          winRate: winRate
        });
        
        continue;
      }

      console.log(`  ✅ ${agentStats.name}: Performing well`);
    }

    // Save config
    fs.writeFileSync(
      './config/agents.json',
      JSON.stringify(agentsConfig, null, 2)
    );
  }

  // ============================================
  // STEP 4: AUTO-SCALING
  // ============================================
  
  async scaleAgents(analysis) {
    if (!this.config.autoScaling.enabled) {
      console.log('Auto-scaling disabled');
      return;
    }

    const agentsConfig = JSON.parse(
      fs.readFileSync('./config/agents.json', 'utf8')
    );

    const currentAgents = agentsConfig.agents.filter(a => a.enabled).length;

    if (currentAgents >= this.config.safety.maxAgents) {
      console.log(`Max agents limit reached (${currentAgents}/${this.config.safety.maxAgents})`);
      return;
    }

    // Find high performers
    const highPerformers = analysis.agents.filter(agent => {
      const profit = parseFloat(agent.profit);
      const winRate = parseFloat(agent.winRate);
      
      return profit >= this.config.autoScaling.minProfit &&
             winRate >= this.config.autoScaling.minWinRate &&
             agent.tasksCompleted >= 10;
    });

    if (highPerformers.length === 0) {
      console.log('No agents meet scaling criteria');
      return;
    }

    console.log(`Found ${highPerformers.length} high performers:`);
    highPerformers.forEach(agent => {
      console.log(`  • ${agent.name}: ${agent.winRate} WR, ${agent.profit} profit`);
    });

    // Clone top performer
    const topPerformer = highPerformers.sort((a, b) => 
      parseFloat(b.profit) - parseFloat(a.profit)
    )[0];

    console.log(`\n🎯 Cloning top performer: ${topPerformer.name}`);

    const cloneName = await this.scaler.cloneAgent(
      topPerformer.name,
      'adaptive' // Let scaler decide best strategy
    );

    this.decisions.push({
      type: 'clone_agent',
      original: topPerformer.name,
      clone: cloneName,
      profit: parseFloat(topPerformer.profit),
      winRate: parseFloat(topPerformer.winRate)
    });

    console.log(`✅ Created: ${cloneName}`);
  }

  // ============================================
  // STEP 5: NICHE DISCOVERY
  // ============================================
  
  async discoverNiches() {
    if (!this.config.nicheDiscovery.enabled) {
      console.log('Niche discovery disabled');
      return;
    }

    const niches = await this.nicheDiscovery.findProfitableNiches({
      minMarketSize: this.config.nicheDiscovery.minMarketSize,
      maxCompetition: this.config.nicheDiscovery.maxCompetition
    });

    if (niches.length === 0) {
      console.log('No new profitable niches found');
      return;
    }

    console.log(`Found ${niches.length} potential niches:`);
    niches.slice(0, 3).forEach(niche => {
      console.log(`  • ${niche.name}: ${niche.taskCount} tasks/week, ${niche.avgCompetitors} avg competitors`);
    });

    // Test top niche
    const topNiche = niches[0];
    
    this.decisions.push({
      type: 'test_niche',
      niche: topNiche.name,
      marketSize: topNiche.taskCount,
      competition: topNiche.avgCompetitors
    });

    console.log(`\n🧪 Will test: ${topNiche.name}`);
  }

  // ============================================
  // STEP 6: MARKET EXPANSION
  // ============================================
  
  async expandMarkets() {
    if (!this.config.marketExpansion.enabled) {
      console.log('Market expansion disabled');
      return;
    }

    console.log('Checking available markets...');

    const markets = await this.marketExpander.getAvailableMarkets();

    markets.forEach(market => {
      console.log(`  • ${market.name}: ${market.enabled ? '✅' : '❌'}`);
    });

    // Auto-enable profitable markets (requires approval)
    const profitableMarkets = markets.filter(m => 
      m.estimatedProfit > 100 && !m.enabled
    );

    if (profitableMarkets.length > 0 && this.config.notifications.approvalRequired.marketExpansion) {
      this.decisions.push({
        type: 'expand_market',
        markets: profitableMarkets.map(m => m.name),
        requiresApproval: true
      });

      console.log(`\n📬 ${profitableMarkets.length} markets require approval`);
    }
  }

  // ============================================
  // STEP 7: PROFIT OPTIMIZATION
  // ============================================
  
  async optimizeProfit(analysis) {
    const optimizations = await this.profitOptimizer.analyze(analysis);

    console.log(`Found ${optimizations.length} optimization opportunities:`);

    optimizations.forEach(opt => {
      console.log(`  • ${opt.type}: ${opt.description} (impact: +${opt.estimatedProfit.toFixed(4)} ETH/month)`);
    });

    // Auto-apply low-risk optimizations
    const autoApply = optimizations.filter(opt => opt.risk === 'low');

    if (autoApply.length > 0) {
      console.log(`\nAuto-applying ${autoApply.length} low-risk optimizations...`);
      
      for (const opt of autoApply) {
        await this.profitOptimizer.apply(opt);
        
        this.decisions.push({
          type: 'optimization',
          optimization: opt.type,
          impact: opt.estimatedProfit
        });
      }
    }
  }

  // ============================================
  // STEP 8: AUTO-WITHDRAWAL
  // ============================================
  
  async handleWithdrawals() {
    if (!this.config.autoWithdrawal.enabled) {
      console.log('Auto-withdrawal disabled');
      return;
    }

    const agentsConfig = JSON.parse(
      fs.readFileSync('./config/agents.json', 'utf8')
    );

    for (const agent of agentsConfig.agents.filter(a => a.enabled)) {
      const walletPath = `./agents/${agent.name}/.wallet.json`;
      
      if (!fs.existsSync(walletPath)) continue;

      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      
      // Check balance (would need actual blockchain query)
      // For now, use analytics estimate
      const agentStats = this.analytics.stats.byAgent[agent.name];
      if (!agentStats) continue;

      const estimatedBalance = agentStats.totalEarned;

      if (estimatedBalance >= this.config.autoWithdrawal.threshold) {
        console.log(`  💰 ${agent.name}: ${estimatedBalance.toFixed(4)} ETH (threshold reached)`);
        
        const amount = estimatedBalance - this.config.autoWithdrawal.keepReserve;
        
        if (amount > 1 && this.config.notifications.approvalRequired.largeWithdrawal) {
          this.decisions.push({
            type: 'withdrawal',
            agent: agent.name,
            amount: amount,
            requiresApproval: true
          });
          
          console.log(`    📬 Large withdrawal - requires approval`);
        } else {
          this.decisions.push({
            type: 'withdrawal',
            agent: agent.name,
            amount: amount,
            autoExecute: true
          });
          
          console.log(`    ✅ Will auto-withdraw ${amount.toFixed(4)} ETH`);
        }
      } else {
        console.log(`  💰 ${agent.name}: ${estimatedBalance.toFixed(4)} ETH (below threshold)`);
      }
    }
  }

  // ============================================
  // STEP 9: GENERATE REPORT
  // ============================================
  
  async generateReport(analysis) {
    let report = `
🤖 *AUTONOMOUS ORCHESTRATOR REPORT*
${new Date().toLocaleDateString()}

📊 *Performance (Last 7 Days)*
Quotes: ${analysis.recent.quotes}
Wins: ${analysis.recent.wins} (${analysis.recent.winRate.toFixed(1)}%)
Completed: ${analysis.recent.completions}
Profit: ${analysis.recent.profit.toFixed(4)} ETH

💰 *Overall*
Total Profit: ${analysis.overall.overview.profit}
ROI: ${analysis.overall.overview.roi}
Win Rate: ${analysis.overall.overview.winRate}

🎯 *Decisions Made*
`;

    if (this.decisions.length === 0) {
      report += 'No actions taken - system running optimally\n';
    } else {
      const byType = {};
      this.decisions.forEach(d => {
        byType[d.type] = (byType[d.type] || 0) + 1;
      });

      Object.entries(byType).forEach(([type, count]) => {
        const icon = {
          'clone_agent': '🤖',
          'disable_agent': '❌',
          'optimization': '⚡',
          'withdrawal': '💸',
          'test_niche': '🧪',
          'expand_market': '🌐'
        }[type] || '•';
        
        report += `${icon} ${type}: ${count}\n`;
      });
    }

    // Approvals required
    const needsApproval = this.decisions.filter(d => d.requiresApproval);
    
    if (needsApproval.length > 0) {
      report += `\n📬 *Requires Your Approval*\n`;
      
      needsApproval.forEach(decision => {
        if (decision.type === 'withdrawal') {
          report += `💸 Withdraw ${decision.amount.toFixed(4)} ETH from ${decision.agent}\n`;
        } else if (decision.type === 'expand_market') {
          report += `🌐 Expand to: ${decision.markets.join(', ')}\n`;
        }
      });
      
      report += `\nReply with /approve to execute\n`;
    }

    // Top performers
    if (analysis.agents.length > 0) {
      const top3 = analysis.agents
        .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit))
        .slice(0, 3);
      
      report += `\n⭐ *Top Performers*\n`;
      top3.forEach((agent, i) => {
        report += `${i + 1}. ${agent.name}: ${agent.profit}\n`;
      });
    }

    report += `\n✅ Next run: ${this.getNextRunTime()}`;

    await this.telegram.send(report);
    
    console.log('Report sent to Telegram');
  }

  getNextRunTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(3, 0, 0, 0);
    
    return tomorrow.toLocaleString();
  }

  // ============================================
  // STEP 10: EXECUTE ACTIONS
  // ============================================
  
  async executeActions() {
    const autoExecute = this.decisions.filter(d => !d.requiresApproval && d.autoExecute !== false);

    if (autoExecute.length === 0) {
      console.log('No actions to execute');
      return;
    }

    console.log(`Executing ${autoExecute.length} actions...`);

    for (const action of autoExecute) {
      try {
        await this.executeAction(action);
        this.executedActions.push({ ...action, status: 'success', timestamp: Date.now() });
      } catch (error) {
        console.error(`Failed to execute ${action.type}:`, error.message);
        this.executedActions.push({ ...action, status: 'failed', error: error.message, timestamp: Date.now() });
      }
    }

    console.log(`✅ Executed ${this.executedActions.filter(a => a.status === 'success').length}/${autoExecute.length} actions`);
  }

  async executeAction(action) {
    const { execSync } = require('child_process');

    switch (action.type) {
      case 'clone_agent':
        // Clone is already done by scaler
        console.log(`  ✅ ${action.type}: ${action.clone}`);
        execSync('pm2 restart all');
        break;

      case 'disable_agent':
        console.log(`  ❌ ${action.type}: ${action.agent}`);
        execSync('pm2 restart all');
        break;

      case 'withdrawal':
        console.log(`  💸 ${action.type}: ${action.amount.toFixed(4)} ETH from ${action.agent}`);
        // Execute withdrawal (implement in auto-withdraw.js)
        const AutoWithdraw = require('../scripts/auto-withdraw');
        await AutoWithdraw.withdraw(action.agent, action.amount);
        break;

      case 'optimization':
        console.log(`  ⚡ ${action.type}: ${action.optimization}`);
        break;

      default:
        console.log(`  ℹ️  ${action.type}: queued`);
    }
  }

  saveLog() {
    const log = {
      timestamp: new Date().toISOString(),
      decisions: this.decisions,
      executed: this.executedActions
    };

    const logPath = './analytics/orchestrator-log.json';
    let logs = [];
    
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (e) {}
    
    logs.push(log);
    
    // Keep last 30 runs
    if (logs.length > 30) {
      logs = logs.slice(-30);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
}

// ============================================
// MAIN
// ============================================

if (require.main === module) {
  const orchestrator = new AutonomousOrchestrator();
  
  orchestrator.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AutonomousOrchestrator;
