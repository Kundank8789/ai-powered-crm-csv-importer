import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testWorkingModel() {
  console.log('🧪 Testing Gemini with working model...\n');
  
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
  
  console.log(`📋 Model: ${modelName}`);
  console.log(`📋 API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'Not found'}`);
  
  if (!apiKey) {
    console.error('❌ No API key found');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    });

    console.log('\n🔄 Sending test request...');
    
    const result = await model.generateContent({
      contents: [
        { 
          role: 'user', 
          parts: [{ text: 'Respond with a simple JSON: {"status": "working", "model": "' + modelName + '"}' }] 
        }
      ],
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
  }
}

testWorkingModel();