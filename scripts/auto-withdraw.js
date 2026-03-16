#!/usr/bin/env node

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const TelegramNotifier = require('../lib/telegram-notifier');

/**
 * AUTO WITHDRAW
 * 
 * Автоматически выводит прибыль когда достигнут порог
 */

class AutoWithdraw {
  constructor() {
    this.telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );
    
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://mainnet.base.org'
    );
    
    this.targetWallet = process.env.MAIN_WALLET_ADDRESS;
    this.threshold = parseFloat(process.env.WITHDRAWAL_THRESHOLD || '0.1');
    this.keepReserve = parseFloat(process.env.WITHDRAWAL_RESERVE || '0.005');
  }

  // ============================================
  // CHECK AND WITHDRAW ALL AGENTS
  // ============================================
  
  async checkAndWithdrawAll() {
    console.log('💰 AUTO WITHDRAW');
    console.log('================\n');
    console.log(`Threshold: ${this.threshold} ETH`);
    console.log(`Reserve: ${this.keepReserve} ETH`);
    console.log(`Target: ${this.targetWallet}\n`);

    if (!this.targetWallet) {
      console.error('❌ MAIN_WALLET_ADDRESS not set in .env');
      return;
    }

    const agentsDir = path.join(__dirname, '../agents');
    
    if (!fs.existsSync(agentsDir)) {
      console.log('No agents directory found');
      return;
    }

    const agentDirs = fs.readdirSync(agentsDir)
      .filter(name => fs.statSync(path.join(agentsDir, name)).isDirectory());

    const withdrawals = [];

    for (const agentName of agentDirs) {
      const result = await this.checkAndWithdraw(agentName);
      if (result) {
        withdrawals.push(result);
      }
    }

    // Summary
    if (withdrawals.length > 0) {
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      console.log('\n================');
      console.log(`✅ Withdrew ${totalWithdrawn.toFixed(4)} ETH from ${withdrawals.length} agents`);
      console.log('================\n');

      // Notify
      await this.notifyWithdrawals(withdrawals, totalWithdrawn);
    } else {
      console.log('\n================');
      console.log('ℹ️  No withdrawals needed');
      console.log('================\n');
    }
  }

  // ============================================
  // CHECK AND WITHDRAW SINGLE AGENT
  // ============================================
  
  async checkAndWithdraw(agentName) {
    const walletPath = path.join(__dirname, `../agents/${agentName}/.wallet.json`);

    if (!fs.existsSync(walletPath)) {
      return null;
    }

    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      const wallet = new ethers.Wallet(walletData.privateKey, this.provider);

      // Check balance
      const balance = await this.provider.getBalance(wallet.address);
      const balanceETH = parseFloat(ethers.formatEther(balance));

      console.log(`${agentName}:`);
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Balance: ${balanceETH.toFixed(4)} ETH`);

      if (balanceETH < this.threshold) {
        console.log(`  ℹ️  Below threshold (${this.threshold} ETH)\n`);
        return null;
      }

      // Calculate withdrawal amount
      const reserveWei = ethers.parseEther(this.keepReserve.toString());
      const amountToWithdraw = balance - reserveWei;

      if (amountToWithdraw <= 0n) {
        console.log(`  ⚠️  Not enough to withdraw after reserve\n`);
        return null;
      }

      const amountETH = parseFloat(ethers.formatEther(amountToWithdraw));

      console.log(`  💸 Withdrawing ${amountETH.toFixed(4)} ETH...`);

      // Execute withdrawal
      const tx = await wallet.sendTransaction({
        to: this.targetWallet,
        value: amountToWithdraw
      });

      console.log(`  📤 TX: ${tx.hash}`);
      console.log(`  ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`  ✅ Confirmed in block ${receipt.blockNumber}\n`);

      return {
        agent: agentName,
        amount: amountETH,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      return null;
    }
  }

  // ============================================
  // MANUAL WITHDRAW
  // ============================================
  
  async withdraw(agentName, amountETH) {
    console.log(`💸 Manual withdrawal from ${agentName}`);
    console.log(`   Amount: ${amountETH} ETH\n`);

    const walletPath = path.join(__dirname, `../agents/${agentName}/.wallet.json`);

    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet not found for ${agentName}`);
    }

    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const wallet = new ethers.Wallet(walletData.privateKey, this.provider);

    const balance = await this.provider.getBalance(wallet.address);
    const balanceETH = parseFloat(ethers.formatEther(balance));

    console.log(`Current balance: ${balanceETH.toFixed(4)} ETH`);

    if (amountETH > balanceETH - this.keepReserve) {
      throw new Error(`Insufficient balance (need ${this.keepReserve} ETH reserve)`);
    }

    const amountWei = ethers.parseEther(amountETH.toString());

    const tx = await wallet.sendTransaction({
      to: this.targetWallet,
      value: amountWei
    });

    console.log(`TX: ${tx.hash}`);
    console.log(`Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

    return {
      agent: agentName,
      amount: amountETH,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  
  async notifyWithdrawals(withdrawals, totalAmount) {
    let message = `💰 *AUTO-WITHDRAWAL EXECUTED*\n\n`;
    message += `Total: ${totalAmount.toFixed(4)} ETH\n`;
    message += `To: ${this.targetWallet.substring(0, 10)}...${this.targetWallet.substring(38)}\n\n`;

    withdrawals.forEach(w => {
      message += `• ${w.agent}: ${w.amount.toFixed(4)} ETH\n`;
      message += `  TX: \`${w.txHash}\`\n`;
    });

    await this.telegram.send(message);
  }

  // ============================================
  // VIEW BALANCES
  // ============================================
  
  async viewBalances() {
    console.log('💰 AGENT BALANCES');
    console.log('=================\n');

    const agentsDir = path.join(__dirname, '../agents');
    
    if (!fs.existsSync(agentsDir)) {
      console.log('No agents directory found');
      return;
    }

    const agentDirs = fs.readdirSync(agentsDir)
      .filter(name => fs.statSync(path.join(agentsDir, name)).isDirectory());

    let totalBalance = 0;

    for (const agentName of agentDirs) {
      const walletPath = path.join(agentsDir, agentName, '.wallet.json');

      if (!fs.existsSync(walletPath)) {
        continue;
      }

      try {
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        const balance = await this.provider.getBalance(walletData.address);
        const balanceETH = parseFloat(ethers.formatEther(balance));

        totalBalance += balanceETH;

        console.log(`${agentName}:`);
        console.log(`  Address: ${walletData.address}`);
        console.log(`  Balance: ${balanceETH.toFixed(4)} ETH`);
        
        if (balanceETH >= this.threshold) {
          console.log(`  ✅ Ready for withdrawal`);
        }
        console.log();

      } catch (error) {
        console.error(`${agentName}: Error - ${error.message}\n`);
      }
    }

    console.log('=================');
    console.log(`Total: ${totalBalance.toFixed(4)} ETH`);
    console.log('=================\n');
  }
}

// ============================================
// MAIN
// ============================================

if (require.main === module) {
  const autoWithdraw = new AutoWithdraw();
  const command = process.argv[2];

  (async () => {
    try {
      if (command === 'check') {
        await autoWithdraw.checkAndWithdrawAll();
      } else if (command === 'view') {
        await autoWithdraw.viewBalances();
      } else if (command === 'withdraw') {
        const agentName = process.argv[3];
        const amount = parseFloat(process.argv[4]);

        if (!agentName || !amount) {
          console.error('Usage: auto-withdraw.js withdraw <agent-name> <amount>');
          process.exit(1);
        }

        await autoWithdraw.withdraw(agentName, amount);
      } else {
        console.log('Usage:');
        console.log('  auto-withdraw.js check           - Check and auto-withdraw');
        console.log('  auto-withdraw.js view            - View all balances');
        console.log('  auto-withdraw.js withdraw <agent> <amount> - Manual withdraw');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = AutoWithdraw;
