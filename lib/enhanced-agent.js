const KnowledgeBase = require('./knowledge-base');
const OpenRouterClient = require('./openrouter-client');
const QualityControl = require('./quality-control');
const PROMPTS = require('./prompts');

/**
 * Enhanced Agent - агент с Knowledge Base
 */

class EnhancedAgent {
  constructor(config) {
    this.config = config;
    this.kb = new KnowledgeBase(`./agents/${config.name}/.knowledge.json`);
    this.llm = new OpenRouterClient(process.env.OPENROUTER_API_KEY, {
      defaultModel: config.llm.model,
      autoRoute: config.llm.autoRoute
    });
    this.qc = new QualityControl(this.llm);
  }

  async executeTask(task) {
    console.log(`🎯 Executing task: ${task.id}`);

    const similarWorks = this.kb.findSimilar(task, 3);
    let prompt = this.buildPrompt(task);

    if (similarWorks.length > 0) {
      console.log(`📚 Found ${similarWorks.length} similar successful works`);
      prompt += `\n\nExamples of similar high-quality work:\n`;
      similarWorks.forEach((work, i) => {
        prompt += `Example ${i+1} (${work.rating}★):\n${work.work.substring(0, 500)}...\n\n`;
      });
      prompt += `Complete the current task with similar quality.`;
    }

    const response = await this.llm.chat([{ role: 'user', content: prompt }], {
      temperature: this.config.llm.temperature,
      maxTokens: this.config.llm.maxTokens
    });

    const work = response.content;
    const qcDecision = await this.qc.shouldSubmit(task, work, this.config.qualityControl);

    if (!qcDecision.submit) {
      if (qcDecision.reason === 'needs_revision') {
        return await this.reviseWork(task, work, qcDecision.feedback);
      }
      return { success: false, reason: qcDecision.reason };
    }

    return { success: true, work, qualityScore: qcDecision.review.score, cost: response.cost };
  }

  async reviseWork(task, originalWork, feedback) {
    const prompt = `Revise this work based on feedback:

TASK: ${task.description}
YOUR WORK: ${originalWork}
FEEDBACK: ${feedback}

Provide improved version.`;

    const response = await this.llm.chat([{ role: 'user', content: prompt }], {
      temperature: this.config.llm.temperature * 0.8,
      maxTokens: this.config.llm.maxTokens
    });

    const qcDecision = await this.qc.shouldSubmit(task, response.content, { ...this.config.qualityControl, externalReview: false });

    if (!qcDecision.submit) {
      return { success: false, reason: 'revision_failed' };
    }

    return { success: true, work: response.content, qualityScore: qcDecision.review.score, cost: response.cost, revised: true };
  }

  async onTaskCompleted(task, work, rating) {
    if (rating >= 4.5) {
      this.kb.addSuccessfulWork(task, work, rating);
      console.log('📚 Added to knowledge base');
    }
  }

  async generateQuote(task, evaluation) {
    const bestQuotes = this.kb.getBestQuotes(task.category, 3);
    let prompt = PROMPTS.quoteMessage
      .replace('{task}', task.description)
      .replace('{specialty}', this.config.specialties[0])
      .replace('{rating}', '4.5')
      .replace('{completed}', '10')
      .replace('{price}', evaluation.recommendedPrice.toFixed(4))
      .replace('{delivery}', '24-48 hours');

    if (bestQuotes.length > 0) {
      prompt += `\n\nWinning quote examples:\n${bestQuotes.map(q => `"${q.quote}"`).join('\n')}`;
    }

    const response = await this.llm.chat([{ role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 500 });

    return { message: response.content, price: evaluation.recommendedPrice, strategy: evaluation.strategy };
  }

  async onQuoteWon(task, quote) {
    this.kb.addWinningQuote(task, quote, true);
  }

  buildPrompt(task) {
    let template = PROMPTS.blogPost;
    if (task.category === 'code review') template = PROMPTS.codeReview;
    else if (task.category === 'research') template = PROMPTS.research;
    return template.replace('{requirements}', task.description).replace('{code}', task.code || '').replace('{topic}', task.title || '');
  }
}

module.exports = EnhancedAgent;
