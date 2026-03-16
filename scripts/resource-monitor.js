#!/usr/bin/env node

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * RESOURCE MONITOR
 * 
 * Real-time мониторинг ресурсов системы и агентов
 */

class ResourceMonitor {
  constructor() {
    this.updateInterval = 3000; // 3 seconds
    this.history = {
      cpu: [],
      memory: [],
      timestamps: []
    };
    this.maxHistory = 60; // Keep last 60 readings (3 minutes)
  }

  // ============================================
  // SYSTEM STATS
  // ============================================
  
  getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;
    
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Disk usage
    let diskUsage = 0;
    try {
      const df = execSync('df -h . | tail -n 1', { encoding: 'utf8' });
      const match = df.match(/(\d+)%/);
      if (match) {
        diskUsage = parseInt(match[1]);
      }
    } catch (e) {
      // Disk stats not available
    }

    // Update history
    this.history.cpu.push(cpuUsage);
    this.history.memory.push(memUsage);
    this.history.timestamps.push(Date.now());

    // Keep only last N readings
    if (this.history.cpu.length > this.maxHistory) {
      this.history.cpu.shift();
      this.history.memory.shift();
      this.history.timestamps.shift();
    }

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usage: memUsage
      },
      disk: {
        usage: diskUsage
      },
      uptime: os.uptime()
    };
  }

  // ============================================
  // PM2 STATS
  // ============================================
  
  getPM2Stats() {
    try {
      const output = execSync('pm2 jlist', { encoding: 'utf8' });
      const processes = JSON.parse(output);
      
      return processes.map(proc => ({
        name: proc.name,
        status: proc.pm2_env.status,
        cpu: proc.monit.cpu,
        memory: proc.monit.memory,
        uptime: proc.pm2_env.pm_uptime,
        restarts: proc.pm2_env.restart_time,
        pid: proc.pid
      }));
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // ANALYTICS STATS
  // ============================================
  
  getAnalyticsStats() {
    try {
      const Analytics = require('../lib/analytics');
      const analytics = new Analytics();
      const summary = analytics.getSummary();

      return {
        winRate: summary.overview.winRate,
        profit: summary.overview.profit,
        tasksCompleted: summary.overview.tasksCompleted,
        activeAgents: summary.byAgent.length
      };
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // RENDER DASHBOARD
  // ============================================
  
  render() {
    console.clear();

    const system = this.getSystemStats();
    const pm2Stats = this.getPM2Stats();
    const analytics = this.getAnalyticsStats();

    // Header
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              🎛️  RESOURCE MONITOR                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    // System Resources
    console.log('📊 SYSTEM RESOURCES');
    console.log('───────────────────────────────────────────────────────────────');
    
    const cpuBar = this.renderBar(system.cpu.usage, 100, 40);
    const cpuColor = this.getColorForUsage(system.cpu.usage);
    console.log(`CPU:    ${cpuColor}${cpuBar}${this.colors.reset} ${system.cpu.usage.toFixed(1)}%`);
    
    const memBar = this.renderBar(system.memory.usage, 100, 40);
    const memColor = this.getColorForUsage(system.memory.usage);
    console.log(`Memory: ${memColor}${memBar}${this.colors.reset} ${system.memory.usage.toFixed(1)}% (${this.formatBytes(system.memory.used)}/${this.formatBytes(system.memory.total)})`);
    
    const diskBar = this.renderBar(system.disk.usage, 100, 40);
    const diskColor = this.getColorForUsage(system.disk.usage);
    console.log(`Disk:   ${diskColor}${diskBar}${this.colors.reset} ${system.disk.usage}%`);
    
    console.log(`Uptime: ${this.formatUptime(system.uptime)}`);
    console.log('');

    // Trends
    if (this.history.cpu.length > 10) {
      console.log('📈 TRENDS (last 3 min)');
      console.log('───────────────────────────────────────────────────────────────');
      console.log('CPU:    ' + this.renderSparkline(this.history.cpu));
      console.log('Memory: ' + this.renderSparkline(this.history.memory));
      console.log('');
    }

    // PM2 Processes
    console.log('🤖 AGENTS');
    console.log('───────────────────────────────────────────────────────────────');
    
    if (pm2Stats.length === 0) {
      console.log('No agents running');
    } else {
      pm2Stats.forEach(proc => {
        const statusIcon = proc.status === 'online' ? '✅' : '❌';
        const statusColor = proc.status === 'online' ? this.colors.green : this.colors.red;
        
        console.log(`${statusIcon} ${proc.name.padEnd(20)} ${statusColor}${proc.status.padEnd(8)}${this.colors.reset} CPU: ${proc.cpu}%  MEM: ${this.formatBytes(proc.memory)}`);
      });
    }
    console.log('');

    // Analytics
    if (analytics) {
      console.log('💰 PERFORMANCE');
      console.log('───────────────────────────────────────────────────────────────');
      console.log(`Win Rate:  ${analytics.winRate}`);
      console.log(`Profit:    ${analytics.profit}`);
      console.log(`Completed: ${analytics.tasksCompleted} tasks`);
      console.log(`Agents:    ${analytics.activeAgents} active`);
      console.log('');
    }

    // Warnings
    const warnings = this.getWarnings(system, pm2Stats);
    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS');
      console.log('───────────────────────────────────────────────────────────────');
      warnings.forEach(w => console.log(`  ${w}`));
      console.log('');
    }

    // Footer
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Last update: ${new Date().toLocaleTimeString()}  |  Press Ctrl+C to exit`);
  }

  // ============================================
  // HELPERS
  // ============================================
  
  renderBar(value, max, width) {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  renderSparkline(data) {
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return data.map(value => {
      const normalized = (value - min) / range;
      const index = Math.floor(normalized * (chars.length - 1));
      return chars[index];
    }).join('');
  }

  getColorForUsage(usage) {
    if (usage > 90) return this.colors.red;
    if (usage > 75) return this.colors.yellow;
    return this.colors.green;
  }

  formatBytes(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getWarnings(system, pm2Stats) {
    const warnings = [];

    if (system.cpu.usage > 90) {
      warnings.push('CPU usage critical (>90%)');
    }
    if (system.memory.usage > 90) {
      warnings.push('Memory usage critical (>90%)');
    }
    if (system.disk.usage > 90) {
      warnings.push('Disk space critical (>90%)');
    }

    const offlineAgents = pm2Stats.filter(p => p.status !== 'online');
    if (offlineAgents.length > 0) {
      warnings.push(`${offlineAgents.length} agents offline: ${offlineAgents.map(a => a.name).join(', ')}`);
    }

    const highMemAgents = pm2Stats.filter(p => p.memory > 500 * 1024 * 1024); // 500MB
    if (highMemAgents.length > 0) {
      warnings.push(`High memory usage: ${highMemAgents.map(a => `${a.name} (${this.formatBytes(a.memory)})`).join(', ')}`);
    }

    return warnings;
  }

  // Colors
  colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
  };

  // ============================================
  // START MONITORING
  // ============================================
  
  start() {
    // Initial render
    this.render();

    // Update loop
    this.interval = setInterval(() => {
      this.render();
    }, this.updateInterval);

    // Handle exit
    process.on('SIGINT', () => {
      clearInterval(this.interval);
      console.clear();
      console.log('\n👋 Resource monitor stopped\n');
      process.exit(0);
    });
  }
}

// ============================================
// MAIN
// ============================================

if (require.main === module) {
  const monitor = new ResourceMonitor();
  monitor.start();
}

module.exports = ResourceMonitor;
