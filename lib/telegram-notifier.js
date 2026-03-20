const axios = require('axios');

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = !!(this.botToken && this.chatId);
  }

  escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async send(message, priority = 'info') {
    if (!this.enabled) {
      console.log(`[Telegram] Disabled: ${message}`);
      return;
    }

    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      money: '💰',
      robot: '🤖'
    };

    const prefix = emoji[priority] || emoji.info;
    const safeMessage = this.escapeHtml(message);

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: `${prefix} ${safeMessage}`,
          parse_mode: 'HTML'
        },
        { timeout: 10000 }
      );
      console.log('[Telegram] Sent:', message);
    } catch (error) {
      console.error('[Telegram] Error:', error.response?.data || error.message);
    }
  }

  async sendMetrics(metrics) {
    const message = `
<b>📊 Metrics Update</b>

💼 Bids: ${metrics.bidsSubmitted || 0}
✅ Wins: ${metrics.jobsWon || 0} (${((metrics.winRate || 0) * 100).toFixed(1)}%)
📝 Completed: ${metrics.jobsCompleted || 0}
💰 Revenue: $${(metrics.totalRevenue || 0).toFixed(2)}
📈 Profit: $${(metrics.profit || 0).toFixed(2)}

🎯 Win Rate: ${((metrics.winRate || 0) * 100).toFixed(1)}%
💵 Avg Bid: $${(metrics.avgBid || 0).toFixed(2)}
    `.trim();

    await this.send(message, 'info');
  }

  async sendAlert(title, details) {
    const safeTitle = this.escapeHtml(title);
    const safeDetails = this.escapeHtml(details);
    
    const message = `
<b>⚠️ ${safeTitle}</b>

${safeDetails}
    `.trim();

    await this.send(message, 'warning');
  }

  async sendDailyReport(report) {
    const message = `
<b>📅 Daily Report</b>

💼 Bids: ${report.bidsSubmitted || 0}
✅ Wins: ${report.jobsWon || 0}
📝 Completed: ${report.jobsCompleted || 0}
💰 Revenue: $${(report.revenue || 0).toFixed(2)}
📉 Costs: $${(report.costs || 0).toFixed(2)}
💵 Profit: $${(report.profit || 0).toFixed(2)}

🔥 Top Agent: ${report.topAgent || 'N/A'}
🎯 Best Niche: ${report.bestNiche || 'N/A'}
    `.trim();

    await this.send(message, 'money');
  }
}

module.exports = new TelegramNotifier();
