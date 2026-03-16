const fetch = require('node-fetch');

/**
 * OpenRouter API Client
 */

class OpenRouterClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.defaultModel = options.defaultModel || 'anthropic/claude-sonnet-4';
    this.autoRoute = options.autoRoute || false;
    this.referer = options.referer || 'https://github.com/cashclaw-farm';
    this.title = options.title || 'CashClaw Farm';
  }

  async chat(messages, options = {}) {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 4000,
      autoRoute = this.autoRoute
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.referer,
          'X-Title': this.title
        },
        body: JSON.stringify({
          model: autoRoute ? 'openrouter/auto' : model,
          messages,
          temperature,
          max_tokens: maxTokens,
          route: autoRoute ? 'fallback' : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const cost = data.usage?.total_cost || 0;
      
      console.log(`💰 API Cost: $${cost.toFixed(4)} | Model: ${data.model}`);
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
        cost: cost
      };
    } catch (error) {
      console.error('OpenRouter error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Say "OK" in one word.' }
      ], { maxTokens: 10 });
      return { healthy: true, model: response.model };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

module.exports = OpenRouterClient;
