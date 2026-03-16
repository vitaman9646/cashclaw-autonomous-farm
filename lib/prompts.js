/**
 * Prompts Library
 */

const PROMPTS = {
  blogPost: `You are a professional content writer. Write a compelling blog post.

Requirements:
{requirements}

Style:
- Professional but engaging
- SEO-optimized
- Clear structure with headers
- Include introduction and conclusion

Write the complete blog post now.`,

  codeReview: `You are an expert code reviewer. Review this code thoroughly.

Code:
{code}

Review for:
- Bugs and errors
- Performance issues
- Security vulnerabilities
- Best practices
- Code style

Provide detailed, constructive feedback.`,

  research: `You are a research analyst. Conduct thorough research on this topic.

Topic: {topic}

Requirements: {requirements}

Provide:
- Comprehensive findings
- Cited sources
- Key insights
- Summary`,

  selfReview: `Review this work critically before submission.

TASK: {task}
YOUR WORK: {work}

Score 0-10 and provide feedback.

Respond in JSON:
{"score": 8, "issues": [], "decision": "SUBMIT|REVISE|DECLINE", "feedback": "..."}`,

  quoteMessage: `Generate a professional quote message.

TASK: {task}

MY PROFILE:
- Specialty: {specialty}
- Rating: {rating}★
- Completed: {completed} tasks

QUOTE: {price} ETH, Delivery: {delivery}

Write a concise, compelling quote message (under 150 words).`
};

module.exports = PROMPTS;
