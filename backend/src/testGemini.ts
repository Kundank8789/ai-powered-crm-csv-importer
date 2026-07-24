import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
  console.log('🧪 Testing Gemini API Connection...\n');
  
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-pro';
  const provider = process.env.AI_PROVIDER || 'gemini';
  
  console.log(`📋 Provider: ${provider}`);
  console.log(`📋 API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'Not found'}`);
  console.log(`📋 Model: ${modelName}`);
  
  if (!apiKey) {
    console.error('❌ No API key found in .env');
    console.log('Please add: AI_API_KEY=your_gemini_api_key');
    return;
  }

  if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️ This doesn\'t look like a Gemini API key (should start with "AIza")');
  }

  if (modelName.includes('gpt')) {
    console.error('❌ ERROR: You\'re using a GPT model with Gemini API!');
    console.log('Please change AI_MODEL to: gemini-pro');
    console.log('Your current .env should have:');
    console.log('  AI_PROVIDER=gemini');
    console.log('  AI_MODEL=gemini-pro');
    return;
  }

  try {
    console.log('\n🔄 Connecting to Gemini API...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [
        { 
          role: 'user', 
          parts: [{ text: 'Hello! Please respond with a simple JSON: {"status": "working"}' }] 
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    });

    const response = result.response;
    const text = response.text();
    
    console.log('✅ Connection successful!');
    console.log('📥 Response:', text);
    console.log('\n🎉 Your Gemini API is working correctly!');
    
  } catch (error: any) {
    console.error('❌ Error:');
    console.error(`   Status: ${error.status || 'unknown'}`);
    console.error(`   Message: ${error.message || 'Unknown error'}`);
    
    if (error.status === 404) {
      console.log('\n🔍 This usually means:');
      console.log(`   - Model "${modelName}" is not available`);
      console.log('   - You need to use a valid Gemini model name');
      console.log('\n✅ Valid model names:');
      console.log('   - gemini-pro');
      console.log('   - gemini-1.5-pro');
      console.log('   - gemini-1.5-flash');
      console.log('\n📝 Update your .env file:');
      console.log('   AI_MODEL=gemini-pro');
    }
    
    if (error.status === 403) {
      console.log('\n🔑 This usually means:');
      console.log('   - Your API key is invalid or expired');
      console.log('   - Your account doesn\'t have access to this model');
      console.log('\n📝 Get a new key: https://ai.google.dev/');
    }
  }
}

testGemini();