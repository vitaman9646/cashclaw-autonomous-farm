const OpenRouterClient = require('./openrouter-client');

/**
 * Quality Control - проверка качества работы
 */

class QualityControl {
  constructor(llmClient) {
    this.llm = llmClient;
  }

  async selfReview(task, result) {
    const prompt = `You have completed a task. Review your own work critically.

TASK DESCRIPTION:
${task.description}

YOUR WORK:
${result}

EVALUATION:
□ All requirements met?
□ Quality is professional?
□ No errors?
□ Client will be satisfied?

Respond in JSON:
{"score": 8, "issues": [], "decision": "SUBMIT", "feedback": "explanation"}

decision must be: SUBMIT, REVISE, or DECLINE`;

    try {
      const response = await this.llm.chat([{ role: 'user', content: prompt }], { temperature: 0.3, maxTokens: 500 });
      return JSON.parse(response.content);
    } catch (error) {
      return { score: 5, issues: ['Failed to self-review'], decision: 'SUBMIT', feedback: 'Auto-approved' };
    }
  }

  async shouldSubmit(task, result, config) {
    const selfReview = await this.selfReview(task, result);
    
    if (selfReview.decision === 'DECLINE') {
      return { submit: false, reason: 'self_declined', review: selfReview };
    }

    if (selfReview.score < config.minQualityScore) {
      if (selfReview.decision === 'REVISE') {
        return { submit: false, reason: 'needs_revision', review: selfReview, feedback: selfReview.feedback };
      }
    }

    return { submit: true, reason: 'quality_approved', review: selfReview };
  }
}

module.exports = QualityControl;
