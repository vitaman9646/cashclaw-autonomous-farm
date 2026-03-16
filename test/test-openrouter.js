#!/usr/bin/env node

require('dotenv').config();
const OpenRouterClient = require('../lib/openrouter-client');

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter connection...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in .env');
    process.exit(1);
  }

  const client = new OpenRouterClient(apiKey);

  try {
    const health = await client.healthCheck();
    
    if (health.healthy) {
      console.log('✅ OpenRouter connection successful');
      console.log(`   Model: ${health.model}`);
      process.exit(0);
    } else {
      console.log('❌ OpenRouter unhealthy:', health.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testOpenRouter();
