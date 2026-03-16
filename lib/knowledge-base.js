const fs = require('fs');
const path = require('path');

/**
 * Knowledge Base - хранит успешные примеры работ
 */

class KnowledgeBase {
  constructor(dbPath = './analytics/knowledge.json') {
    this.dbPath = dbPath;
    this.knowledge = this.load();
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    } catch (e) {
      return { successfulWorks: [], winningQuotes: [], bestPractices: [] };
    }
  }

  save() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(this.knowledge, null, 2));
  }

  addSuccessfulWork(task, work, rating) {
    if (rating >= 4.5) {
      this.knowledge.successfulWorks.push({
        timestamp: Date.now(),
        category: task.category,
        tags: task.tags,
        description: task.description,
        work: work.substring(0, 2000),
        rating: rating
      });

      if (this.knowledge.successfulWorks.length > 50) {
        this.knowledge.successfulWorks = this.knowledge.successfulWorks.slice(-50);
      }

      this.save();
    }
  }

  addWinningQuote(task, quote, won) {
    if (won) {
      this.knowledge.winningQuotes.push({
        timestamp: Date.now(),
        category: task.category,
        budget: task.budget,
        competitors: task.quotesCount,
        quote: quote.message,
        price: quote.price,
        strategy: quote.strategy
      });

      if (this.knowledge.winningQuotes.length > 100) {
        this.knowledge.winningQuotes = this.knowledge.winningQuotes.slice(-100);
      }

      this.save();
    }
  }

  findSimilar(task, limit = 3) {
    return this.knowledge.successfulWorks
      .filter(work => 
        work.category === task.category ||
        work.tags?.some(tag => task.tags?.includes(tag))
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  getBestQuotes(category, limit = 5) {
    return this.knowledge.winningQuotes
      .filter(q => q.category === category)
      .slice(-limit);
  }
}

module.exports = KnowledgeBase;
