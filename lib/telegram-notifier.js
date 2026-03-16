const fetch = require('node-fetch');

/**
 * Telegram Notifier
 */

class TelegramNotifier {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
  }

  async send(message) {
    if (!this.botToken || !this.chatId) {
      console.log('Telegram not configured, skipping notification');
      return;
    }

    try {
      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        console.error('Telegram notification failed:', await response.text());
      }
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  async notifyNewTask(task, evaluation) {
    const message = `🎯 *New Task Found*\n\n*Category:* ${task.category}\n*Budget:* ${task.budget} ETH\n*Competition:* ${task.quotesCount} quotes\n\nShould bid: ${evaluation.shouldBid ? '✅ Yes' : '❌ No'}\n${evaluation.shouldBid ? `Price: ${evaluation.recommendedPrice} ETH\nWin probability: ${(evaluation.winProbability * 100).toFixed(1)}%` : `Reason: ${evaluation.reason}`}`;
    await this.send(message);
  }

  async notifyTaskWon(task, quote) {
    const message = `🎉 *Task Won!*\n\n*Category:* ${task.category}\n*Price:* ${quote.price} ETH\n*Strategy:* ${quote.strategy}`;
    await this.send(message);
  }

  async notifyTaskCompleted(task, earnings, cost) {
    const profit = earnings - cost;
    const message = `✅ *Task Completed*\n\n*Category:* ${task.category}\n*Earned:* ${earnings.toFixed(4)} ETH\n*Cost:* ${cost.toFixed(4)} ETH\n*Profit:* ${profit.toFixed(4)} ETH`;
    await this.send(message);
  }

  async notifyError(error, context) {
    const message = `⚠️ *Error Occurred*\n\n*Context:* ${context}\n*Error:* ${error.message}`;
    await this.send(message);
  }
}

module.exports = TelegramNotifier;
