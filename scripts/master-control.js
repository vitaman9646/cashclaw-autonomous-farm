#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const { execSync } = require('child_process');
const Analytics = require('../lib/analytics');
const AutonomousOrchestrator = require('../lib/autonomous-orchestrator');
const AutoScaler = require('../lib/auto-scaler');
const NicheDiscovery = require('../lib/niche-discovery');
const MarketExpander = require('../lib/market-expander');

/**
 * MASTER CONTROL PANEL
 * 
 * Интерактивная панель управления всей системой
 */

class MasterControl {
  constructor() {
    this.analytics = new Analytics();
    this.orchestrator = new AutonomousOrchestrator();
    this.scaler = new AutoScaler();
    this.nicheDiscovery = new NicheDiscovery();
    this.marketExpander = new MarketExpander();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // ============================================
  // MAIN MENU
  // ============================================
  
  async showMainMenu() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🎛️  MASTER CONTROL PANEL               ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const summary = this.analytics.getSummary();

    // Quick stats
    console.log('📊 Quick Stats:');
    console.log(`   Win Rate:  ${summary.overview.winRate}`);
    console.log(`   Profit:    ${summary.overview.profit}`);
    console.log(`   ROI:       ${summary.overview.roi}`);
    console.log(`   Agents:    ${summary.byAgent.length} active\n`);

    console.log('Main Menu:\n');
    console.log('  1. 📊 View Analytics');
    console.log('  2. 🤖 Manage Agents');
    console.log('  3. ⚡ Run Optimization');
    console.log('  4. 📈 Auto-Scaling');
    console.log('  5. 🔍 Niche Discovery');
    console.log('  6. 🌐 Market Expansion');
    console.log('  7. 💰 Profit Optimization');
    console.log('  8. 🛡️  System Health');
    console.log('  9. ⚙️  Configuration');
    console.log('  0. 🚨 Emergency Stop');
    console.log('  q. Exit\n');

    const choice = await this.prompt('Select option: ');

    switch (choice.trim()) {
      case '1':
        await this.showAnalytics();
        break;
      case '2':
        await this.manageAgents();
        break;
      case '3':
        await this.runOptimization();
        break;
      case '4':
        await this.autoScaling();
        break;
      case '5':
        await this.nicheDiscoveryMenu();
        break;
      case '6':
        await this.marketExpansionMenu();
        break;
      case '7':
        await this.profitOptimizationMenu();
        break;
      case '8':
        await this.systemHealth();
        break;
      case '9':
        await this.configurationMenu();
        break;
      case '0':
        await this.emergencyStop();
        break;
      case 'q':
      case 'Q':
        this.exit();
        return;
      default:
        console.log('Invalid option');
        await this.pause();
    }

    await this.showMainMenu();
  }

  // ============================================
  // 1. ANALYTICS
  // ============================================
  
  async showAnalytics() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     📊 ANALYTICS                           ║');
    console.log('╚════════════════════════════════════════════╝\n');

    this.analytics.printSummary();

    console.log('\nOptions:');
    console.log('  1. Detailed report');
    console.log('  2. Export CSV');
    console.log('  3. View timeline');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    switch (choice.trim()) {
      case '1':
        // Detailed report would go here
        break;
      case '2':
        console.log('Exporting to CSV...');
        // Export logic
        break;
    }

    await this.pause();
  }

  // ============================================
  // 2. MANAGE AGENTS
  // ============================================
  
  async manageAgents() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🤖 MANAGE AGENTS                       ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Show agent status
    try {
      const status = execSync('pm2 jlist', { encoding: 'utf8' });
      const processes = JSON.parse(status);

      console.log('Active Agents:\n');
      processes.forEach(proc => {
        const statusIcon = proc.pm2_env.status === 'online' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${proc.name}`);
        console.log(`     Status: ${proc.pm2_env.status}`);
        console.log(`     Uptime: ${this.formatUptime(proc.pm2_env.pm_uptime)}`);
        console.log(`     CPU: ${proc.monit.cpu}%`);
        console.log(`     Memory: ${(proc.monit.memory / 1024 / 1024).toFixed(0)} MB\n`);
      });
    } catch (error) {
      console.log('No agents running');
    }

    console.log('Options:');
    console.log('  1. Start all agents');
    console.log('  2. Stop all agents');
    console.log('  3. Restart all agents');
    console.log('  4. Clone agent');
    console.log('  5. Enable/Disable agent');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    switch (choice.trim()) {
      case '1':
        console.log('Starting all agents...');
        execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });
        break;
      case '2':
        console.log('Stopping all agents...');
        execSync('pm2 stop all', { stdio: 'inherit' });
        break;
      case '3':
        console.log('Restarting all agents...');
        execSync('pm2 restart all', { stdio: 'inherit' });
        break;
      case '4':
        await this.cloneAgentInteractive();
        break;
    }

    await this.pause();
  }

  // ============================================
  // 3. RUN OPTIMIZATION
  // ============================================
  
  async runOptimization() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     ⚡ OPTIMIZATION                        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('Running full system optimization...\n');

    await this.orchestrator.run();

    await this.pause();
  }

  // ============================================
  // 4. AUTO-SCALING
  // ============================================
  
  async autoScaling() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     📈 AUTO-SCALING                        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const summary = this.analytics.getSummary();

    console.log('Agent Performance:\n');
    summary.byAgent.forEach(agent => {
      const profit = parseFloat(agent.profit);
      const winRate = parseFloat(agent.winRate);
      
      console.log(`${agent.name}:`);
      console.log(`  Win Rate: ${agent.winRate}`);
      console.log(`  Profit: ${agent.profit}`);
      
      const shouldScale = this.scaler.shouldScale(agent, { agents: summary.byAgent });
      if (shouldScale.should) {
        console.log(`  ✅ Ready to scale: ${shouldScale.reason}`);
      } else {
        console.log(`  ℹ️  ${shouldScale.reason}`);
      }
      console.log();
    });

    console.log('Options:');
    console.log('  1. Clone top performer');
    console.log('  2. View scaling recommendations');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    if (choice.trim() === '1') {
      const topPerformer = summary.byAgent.sort((a, b) => 
        parseFloat(b.profit) - parseFloat(a.profit)
      )[0];

      if (topPerformer) {
        console.log(`\nCloning ${topPerformer.name}...`);
        const cloneName = await this.scaler.cloneAgent(topPerformer.name, 'adaptive');
        console.log(`✅ Created: ${cloneName}`);
        console.log('\nRestart agents to activate: npm restart');
      }
    }

    await this.pause();
  }

  // ============================================
  // 5. NICHE DISCOVERY
  // ============================================
  
  async nicheDiscoveryMenu() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🔍 NICHE DISCOVERY                     ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('Discovering profitable niches...\n');

    const niches = await this.nicheDiscovery.findProfitableNiches();

    if (niches.length === 0) {
      console.log('No profitable niches found.\n');
      await this.pause();
      return;
    }

    console.log(`Found ${niches.length} profitable niches:\n`);

    niches.slice(0, 10).forEach((niche, i) => {
      console.log(`${i + 1}. ${niche.name}`);
      console.log(`   Tasks: ${niche.taskCount}`);
      console.log(`   Avg Price: ${niche.avgPrice} ETH`);
      console.log(`   Competition: ${niche.avgCompetitors}`);
      console.log(`   Score: ${this.nicheDiscovery.calculateProfitabilityScore(niche)}/100\n`);
    });

    console.log('Options:');
    console.log('  1. Test a niche');
    console.log('  2. View full report');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    if (choice.trim() === '1') {
      const nicheIndex = await this.prompt('Enter niche number to test: ');
      const niche = niches[parseInt(nicheIndex) - 1];
      
      if (niche) {
        console.log(`\nCreating test agent for: ${niche.name}...`);
        await this.nicheDiscovery.createTestAgent(niche.name);
        console.log('✅ Test agent created');
        console.log('Restart agents to activate: npm restart');
      }
    }

    await this.pause();
  }

  // ============================================
  // 6. MARKET EXPANSION
  // ============================================
  
  async marketExpansionMenu() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🌐 MARKET EXPANSION                    ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const markets = await this.marketExpander.getAvailableMarkets();

    console.log('Active Marketplaces:\n');
    markets.filter(m => m.enabled).forEach(m => {
      console.log(`  ✅ ${m.name}`);
      console.log(`     Type: ${m.type}`);
      console.log(`     Est. Profit: $${m.estimatedProfit}/month\n`);
    });

    console.log('Available Marketplaces:\n');
    markets.filter(m => !m.enabled).forEach(m => {
      const icon = m.recommended ? '⭐' : '○';
      console.log(`  ${icon} ${m.name}`);
      console.log(`     Type: ${m.type}`);
      console.log(`     Est. Profit: $${m.estimatedProfit}/month`);
      if (m.requiresApproval) {
        console.log(`     ⚠️  Requires approval`);
      }
      if (m.risks) {
        console.log(`     ⚠️  Risks: ${m.risks.join(', ')}`);
      }
      console.log();
    });

    console.log('Options:');
    console.log('  1. Enable marketplace');
    console.log('  2. View recommendations');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    if (choice.trim() === '1') {
      const marketName = await this.prompt('Enter marketplace name: ');
      
      const evaluation = await this.marketExpander.evaluateExpansion(marketName);
      
      console.log(`\n${evaluation.reason}`);
      
      if (evaluation.requiresApproval) {
        console.log('\n⚠️  This marketplace requires manual approval.');
        console.log('Risks:', evaluation.risks?.join(', '));
        
        const confirm = await this.prompt('Enable anyway? (yes/no): ');
        if (confirm.toLowerCase() === 'yes') {
          await this.marketExpander.expandToMarket(marketName);
          console.log('✅ Marketplace enabled');
        }
      } else if (evaluation.shouldExpand) {
        await this.marketExpander.expandToMarket(marketName);
        console.log('✅ Marketplace enabled');
      }
    }

    await this.pause();
  }

  // ============================================
  // 7. PROFIT OPTIMIZATION
  // ============================================
  
  async profitOptimizationMenu() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     💰 PROFIT OPTIMIZATION                 ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('Analyzing optimization opportunities...\n');

    const ProfitOptimizer = require('../lib/profit-optimizer');
    const optimizer = new ProfitOptimizer();
    
    const analysis = await this.orchestrator.analyzePerformance();
    const optimizations = await optimizer.analyze(analysis);

    if (optimizations.length === 0) {
      console.log('✅ System is already optimized!\n');
      await this.pause();
      return;
    }

    console.log(`Found ${optimizations.length} opportunities:\n`);

    optimizations.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.description}`);
      console.log(`   Impact: +${(opt.estimatedProfit || 0).toFixed(4)} ETH/month`);
      console.log(`   Risk: ${opt.risk}`);
      console.log(`   Effort: ${opt.effort}\n`);
    });

    console.log('Options:');
    console.log('  1. Apply all low-risk optimizations');
    console.log('  2. Apply specific optimization');
    console.log('  0. Back\n');

    const choice = await this.prompt('Select option: ');

    if (choice.trim() === '1') {
      const lowRisk = optimizations.filter(o => o.risk === 'low');
      
      console.log(`\nApplying ${lowRisk.length} low-risk optimizations...`);
      
      for (const opt of lowRisk) {
        await optimizer.apply(opt);
      }
      
      console.log('\n✅ Optimizations applied');
      console.log('Restart agents: npm restart');
    }

    await this.pause();
  }

  // ============================================
  // 8. SYSTEM HEALTH
  // ============================================
  
  async systemHealth() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🛡️  SYSTEM HEALTH                      ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // PM2 status
    try {
      const status = execSync('pm2 jlist', { encoding: 'utf8' });
      const processes = JSON.parse(status);
      
      const online = processes.filter(p => p.pm2_env.status === 'online').length;
      const total = processes.length;
      
      console.log(`Agents: ${online}/${total} online`);
      
      if (online === total) {
        console.log('✅ All agents running\n');
      } else {
        console.log('⚠️  Some agents offline\n');
      }
    } catch (error) {
      console.log('❌ PM2 not running\n');
    }

    // System resources
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;

    console.log(`Memory: ${memUsage.toFixed(1)}% used (${(usedMem / 1024 / 1024 / 1024).toFixed(1)}/${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB)`);
    
    if (memUsage > 85) {
      console.log('⚠️  High memory usage!');
    } else {
      console.log('✅ Memory OK');
    }
    console.log();

    // Recent errors
    console.log('Recent Errors: (checking logs...)\n');
    
    // Check for errors in logs
    try {
      const errors = execSync('tail -n 100 logs/*-error.log 2>/dev/null | grep -i error | tail -n 5', { encoding: 'utf8' });
      if (errors) {
        console.log(errors);
      } else {
        console.log('✅ No recent errors\n');
      }
    } catch (error) {
      console.log('✅ No recent errors\n');
    }

    await this.pause();
  }

  // ============================================
  // HELPERS
  // ============================================
  
  formatUptime(timestamp) {
    const uptime = Date.now() - timestamp;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  async cloneAgentInteractive() {
    const agentName = await this.prompt('Enter agent name to clone: ');
    const strategy = await this.prompt('Strategy (adaptive/niche/pricing/aggressive/premium): ');
    
    console.log(`\nCloning ${agentName} with ${strategy || 'adaptive'} strategy...`);
    
    try {
      const cloneName = await this.scaler.cloneAgent(agentName, strategy || 'adaptive');
      console.log(`✅ Created: ${cloneName}`);
      console.log('\nRestart agents to activate: npm restart');
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  async emergencyStop() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🚨 EMERGENCY STOP                      ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('⚠️  WARNING: This will stop ALL agents immediately.\n');
    
    const confirm = await this.prompt('Are you sure? Type "STOP" to confirm: ');
    
    if (confirm === 'STOP') {
      console.log('\n🛑 Stopping all agents...');
      execSync('pm2 stop all', { stdio: 'inherit' });
      console.log('\n✅ All agents stopped');
    } else {
      console.log('\n❌ Cancelled');
    }

    await this.pause();
  }

  async configurationMenu() {
    console.log('\n⚙️  Configuration menu coming soon...\n');
    await this.pause();
  }

  // ============================================
  // UTILITY
  // ============================================
  
  prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }

  async pause() {
    await this.prompt('\nPress Enter to continue...');
  }

  exit() {
    console.log('\n👋 Goodbye!\n');
    this.rl.close();
    process.exit(0);
  }
}

// ============================================
// MAIN
// ============================================

const control = new MasterControl();
control.showMainMenu().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
