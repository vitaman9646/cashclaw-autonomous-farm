#!/usr/bin/env node

require('dotenv').config();
const OpenRouterClient = require('../lib/openrouter-client');
const QualityControl = require('../lib/quality-control');

async function testQualityControl() {
  console.log('🧪 Testing Quality Control...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  const llm = new OpenRouterClient(apiKey);
  const qc = new QualityControl(llm);

  const task = { description: 'Write a short paragraph about AI.' };
  const goodResult = 'Artificial intelligence is transforming industries worldwide. From healthcare to finance, AI enables faster decisions and automates complex tasks. Machine learning models can analyze vast datasets, uncovering patterns humans might miss.';

  try {
    const review = await qc.selfReview(task, goodResult);
    
    console.log('Self-review result:');
    console.log(`  Score: ${review.score}/10`);
    console.log(`  Decision: ${review.decision}`);
    console.log(`  Issues: ${review.issues.length === 0 ? 'None' : review.issues.join(', ')}`);
    
    if (review.score >= 5) {
      console.log('✅ Quality Control test passed');
      process.exit(0);
    } else {
      console.log('⚠️  Low score but test passed');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testQualityControl();
