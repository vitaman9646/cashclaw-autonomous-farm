#!/usr/bin/env node

require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Импорт наших модулей
const BiddingEngine = require('../lib/bidding-engine');
const EnhancedAgent = require('../lib/enhanced-agent');
const Analytics = require('../lib/analytics');
const TelegramNotifier = require('../lib/telegram-notifier');

/**
 * CORE AGENT
 * 
 * Главный агент - автономный AI-фрилансер
 * Работает 24/7, выполняет задачи, зарабатывает ETH
 */

class CoreAgent {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    
    // Инициализация модулей
    this.bidding = new BiddingEngine(
      config,
      this.loadConfig('../config/bidding-strategies.json')
    );
    this.agent = new EnhancedAgent(config);
    this.analytics = new Analytics();
    this.telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );
    
    // Состояние
    this.wallet = this.loadOrCreateWallet();
    this.activeTasks = new Map();
    this.ws = null;
    this.heartbeatInterval = null;
    
    console.log(`🤖 ${this.name} initialized`);
    console.log(`   Wallet: ${this.wallet.address}`);
    console.log(`   Specialties: ${this.config.specialties.join(', ')}`);
  }

  loadConfig(relativePath) {
    const configPath = path.join(__dirname, relativePath);
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // ============================================
  // WALLET MANAGEMENT
  // ============================================
  
  loadOrCreateWallet() {
    const walletDir = path.join(__dirname, this.name);
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    
    const walletPath = path.join(walletDir, '.wallet.json');
    
    try {
      return JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    } catch (e) {
      // Создать новый кошелек
      const wallet = ethers.Wallet.createRandom();
      
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      };
      
      fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
      
      console.log('💳 New wallet created');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   ⚠️  SAVE MNEMONIC: ${wallet.mnemonic.phrase}`);
      
      return walletData;
    }
  }

  // ============================================
  // MOLTLAUNCH CONNECTION
  // ============================================
  
  async connectToMoltlaunch() {
    console.log('🔌 Connecting to Moltlaunch...');
    
    // В реальной версии это был бы WebSocket к Moltlaunch API
    // Сейчас симулируем подключение
    
    console.log('✅ Connected to Moltlaunch (mock mode)');
    console.log('📡 Listening for tasks...');
    
    // Симуляция heartbeat
    this.startHeartbeat();
    
    // Симуляция периодической проверки задач
    this.startTaskPolling();
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      console.log(`💓 ${this.name} heartbeat - ${new Date().toLocaleTimeString()}`);
    }, 60000); // Каждую минуту
  }

  startTaskPolling() {
    // Проверка новых задач каждые 30 секунд
    setInterval(async () => {
      await this.checkForNewTasks();
    }, 30000);
  }

  async checkForNewTasks() {
    // В реальной версии это был бы запрос к Moltlaunch API
    // Сейчас симулируем
    
    // Симуляция: создаем mock задачу с 5% вероятностью
    if (Math.random() < 0.05) {
      const mockTask = this.generateMockTask();
      await this.onNewTask(mockTask);
    }
  }

  generateMockTask() {
    const categories = this.config.specialties;
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      id: `task-${Date.now()}`,
      title: `Mock task: ${category}`,
      description: `Please complete a ${category} task. This is a mock task for testing.`,
      category: category,
      tags: [category],
      budget: 0.01 + Math.random() * 0.04,
      quotesCount: Math.floor(Math.random() * 10),
      createdAt: Date.now(),
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }

  // ============================================
  // TASK LIFECYCLE
  // ============================================
  
  async onNewTask(task) {
    console.log(`\n📋 New task: ${task.id}`);
    console.log(`   Category: ${task.category}`);
    console.log(`   Budget: ${task.budget.toFixed(4)} ETH`);
    console.log(`   Competition: ${task.quotesCount} quotes`);
    
    // Оценка задачи
    const evaluation = await this.bidding.evaluateTask(task);
    
    if (!evaluation.shouldBid) {
      console.log(`❌ Not bidding: ${evaluation.reason}`);
      return;
    }
    
    console.log(`✅ Should bid!`);
    console.log(`   Win probability: ${(evaluation.winProbability * 100).toFixed(1)}%`);
    console.log(`   Recommended price: ${evaluation.recommendedPrice} ETH`);
    console.log(`   Strategy: ${evaluation.strategy}`);
    
    // Генерация quote
    const quote = await this.agent.generateQuote(task, evaluation);
    
    console.log(`💬 Quote generated`);
    console.log(`   Price: ${quote.price} ETH`);
    
    // Проверка auto-quote
    if (!this.config.bidding.enabled) {
      console.log(`⏸️  Auto-quote disabled - skipping submission`);
      return;
    }
    
    // Отправка quote (симуляция)
    await this.submitQuote(task, quote);
    
    // Аналитика
    this.bidding.trackQuote(task.id, quote, task);
    this.analytics.trackQuote(this.name, task, quote);
    
    // Симуляция победы (20% шанс)
    if (Math.random() < 0.2) {
      setTimeout(() => this.onTaskAwarded({ taskId: task.id, quote }), 5000);
    }
  }

  async submitQuote(task, quote) {
    console.log(`📤 Submitting quote for ${task.id}...`);
    
    // В реальной версии это был бы POST запрос к Moltlaunch
    // Сейчас симулируем
    
    console.log(`✅ Quote submitted (mock)`);
  }

  async onTaskAwarded(data) {
    const { taskId, quote } = data;
    
    console.log(`\n🎉 Task awarded: ${taskId}`);
    
    // Найти задачу (в реальности получили бы с сервера)
    const task = { id: taskId, category: 'content writing', description: 'Test task' };
    
    // Сохранить winning quote
    await this.agent.onQuoteWon(task, quote);
    
    // Аналитика
    this.bidding.trackWin(taskId, quote, task);
    this.analytics.trackWin(this.name, task, quote);
    
    // Уведомление
    await this.telegram.notifyTaskWon(task, quote);
    
    // Проверка auto-work
    if (!this.config.autoWork) {
      console.log(`⏸️  Auto-work disabled - waiting for manual approval`);
      return;
    }
    
    // Выполнение задачи
    await this.executeTask(task);
  }

  async executeTask(task) {
    console.log(`\n🎯 Executing task: ${task.id}`);
    
    this.activeTasks.set(task.id, {
      task,
      startTime: Date.now(),
      status: 'in_progress'
    });
    
    try {
      // Выполнение через enhanced agent
      const result = await this.agent.executeTask(task);
      
      if (!result.success) {
        console.log(`❌ Task execution failed: ${result.reason}`);
        return;
      }
      
      console.log(`✅ Task completed`);
      console.log(`   Quality score: ${result.qualityScore}/10`);
      console.log(`   API cost: $${result.cost.toFixed(4)}`);
      
      // Отправка работы (симуляция)
      await this.submitWork(task, result.work);
      
      // Обновление состояния
      this.activeTasks.get(task.id).status = 'submitted';
      this.activeTasks.get(task.id).work = result.work;
      this.activeTasks.get(task.id).cost = result.cost;
      
      // Симуляция завершения (после 10 сек)
      setTimeout(() => {
        this.onTaskCompleted({
          taskId: task.id,
          rating: 4.5 + Math.random() * 0.5,
          earnings: 0.01
        });
      }, 10000);
      
    } catch (error) {
      console.error(`❌ Task execution error:`, error);
      this.activeTasks.get(task.id).status = 'failed';
    }
  }

  async submitWork(task, work) {
    console.log(`📤 Submitting work for ${task.id}...`);
    console.log(`✅ Work submitted (mock)`);
  }

  async onTaskCompleted(data) {
    const { taskId, rating, earnings } = data;
    
    console.log(`\n✅ Task completed: ${taskId}`);
    console.log(`   Rating: ${rating.toFixed(1)}★`);
    console.log(`   Earnings: ${earnings.toFixed(4)} ETH`);
    
    const taskData = this.activeTasks.get(taskId);
    
    if (!taskData) return;
    
    // Сохранить в knowledge base
    await this.agent.onTaskCompleted(taskData.task, taskData.work, rating);
    
    // Аналитика
    const profit = earnings - (taskData.cost || 0);
    this.analytics.trackCompletion(this.name, taskData.task, earnings, taskData.cost || 0);
    
    // Уведомление
    await this.telegram.notifyTaskCompleted(taskData.task, earnings, taskData.cost || 0);
    
    // Удалить из активных
    this.activeTasks.delete(taskId);
    
    console.log(`💰 Profit: ${profit.toFixed(4)} ETH`);
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  
  async start() {
    console.log(`\n🚀 Starting ${this.name}...`);
    
    await this.connectToMoltlaunch();
    
    console.log(`✅ ${this.name} running\n`);
  }

  async stop() {
    console.log(`\n🛑 Stopping ${this.name}...`);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.ws) {
      this.ws.close();
    }
    
    console.log(`✅ ${this.name} stopped`);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const agentName = process.env.AGENT_NAME || process.argv[2];
  
  if (!agentName) {
    console.error('Usage: node core-agent.js <agent-name>');
    console.error('Or set AGENT_NAME environment variable');
    process.exit(1);
  }
  
  // Загрузка конфигурации
  const agentsConfigPath = path.join(__dirname, '../config/agents.json');
  const agentsConfig = JSON.parse(fs.readFileSync(agentsConfigPath, 'utf8'));
  
  const config = agentsConfig.agents.find(a => a.name === agentName);
  
  if (!config) {
    console.error(`Agent ${agentName} not found in config/agents.json`);
    process.exit(1);
  }
  
  if (!config.enabled) {
    console.error(`Agent ${agentName} is disabled in config`);
    process.exit(1);
  }
  
  // Создание и запуск агента
  const agent = new CoreAgent(config);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n📴 Shutting down...');
    await agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });
  
  // Запуск
  await agent.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CoreAgent;
