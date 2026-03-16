#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');
const TelegramNotifier = require('../lib/telegram-notifier');
const fs = require('fs');
const path = require('path');

/**
 * EMERGENCY STOP
 * 
 * Аварийная остановка всей системы
 * Отправляет уведомление и логирует причину
 */

class EmergencyStop {
  constructor() {
    this.telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );
    this.logPath = path.join(__dirname, '../logs/emergency-stops.log');
  }

  async execute(reason = 'Manual emergency stop') {
    console.log('🚨 EMERGENCY STOP INITIATED');
    console.log('===========================\n');
    console.log(`Reason: ${reason}\n`);

    const timestamp = new Date().toISOString();

    // Log emergency stop
    this.log({
      timestamp,
      reason,
      triggeredBy: process.env.USER || 'system'
    });

    // Stop all PM2 processes
    console.log('🛑 Stopping all agents...');
    
    try {
      execSync('pm2 stop all', { stdio: 'inherit' });
      console.log('✅ All agents stopped\n');
    } catch (error) {
      console.error('❌ Failed to stop agents:', error.message);
    }

    // Disable autonomous mode
    console.log('⏸️  Disabling autonomous mode...');
    
    try {
      const configPath = path.join(__dirname, '../config/autonomous.json');
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.enabled = false;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ Autonomous mode disabled\n');
      }
    } catch (error) {
      console.error('⚠️  Could not disable autonomous mode:', error.message);
    }

    // Send Telegram notification
    console.log('📱 Sending notification...');
    
    try {
      await this.telegram.send(`
🚨 *EMERGENCY STOP*

Time: ${new Date().toLocaleString()}
Reason: ${reason}

All agents have been stopped.
Autonomous mode disabled.

To restart:
1. Review logs
2. Fix issues
3. Run: npm start
      `);
      console.log('✅ Notification sent\n');
    } catch (error) {
      console.error('⚠️  Could not send notification:', error.message);
    }

    // Final status
    console.log('===========================');
    console.log('🛑 SYSTEM STOPPED');
    console.log('===========================\n');
    console.log('Next steps:');
    console.log('  1. Review logs: npm run logs');
    console.log('  2. Check status: pm2 status');
    console.log('  3. Restart when ready: npm start\n');
  }

  log(entry) {
    const logEntry = `[${entry.timestamp}] ${entry.reason} (by ${entry.triggeredBy})\n`;
    
    try {
      fs.appendFileSync(this.logPath, logEntry);
    } catch (error) {
      console.error('Could not write to log:', error.message);
    }
  }

  async checkSafetyAndStop() {
    console.log('🔍 Running safety checks...\n');

    const Analytics = require('../lib/analytics');
    const analytics = new Analytics();
    const summary = analytics.getSummary();

    // Check for critical issues
    const issues = [];

    // Check recent profit
    const recentProfit = this.calculateRecentProfit(analytics);
    if (recentProfit < -0.05) {
      issues.push(`Large recent loss: ${recentProfit.toFixed(4)} ETH`);
    }

    // Check win rate
    const winRate = parseFloat(summary.overview.winRate || 0);
    if (winRate < 15) {
      issues.push(`Very low win rate: ${winRate.toFixed(1)}%`);
    }

    if (issues.length > 0) {
      console.log('⚠️  Critical issues detected:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      console.log();

      const reason = `Automatic stop: ${issues.join('; ')}`;
      await this.execute(reason);
    } else {
      console.log('✅ No critical issues detected');
      console.log('System is healthy - emergency stop not needed\n');
    }
  }

  calculateRecentProfit(analytics) {
    const timeline = analytics.stats.timeline || [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const recentCompletions = timeline.filter(e => 
      e.type === 'completion' && e.timestamp > oneDayAgo
    );

    return recentCompletions.reduce((sum, e) => sum + (e.profit || 0), 0);
  }
}

// ============================================
// MAIN
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const reason = args.join(' ') || 'Manual emergency stop';

  const emergencyStop = new EmergencyStop();

  if (reason.toLowerCase() === 'check') {
    // Check safety and conditionally stop
    emergencyStop.checkSafetyAndStop().catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  } else {
    // Immediate stop
    emergencyStop.execute(reason).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  }
}

module.exports = EmergencyStop;
