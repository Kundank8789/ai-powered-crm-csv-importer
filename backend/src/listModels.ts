import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  console.log('🔍 Fetching available Gemini models...\n');
  
  const apiKey = process.env.AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found in .env');
    return;
  }

  try {
    // Make a direct API call to list models
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Available models:');
    console.log('─────────────────────');
    
    if (!data.models || data.models.length === 0) {
      console.log('No models found');
      return;
    }

    // Filter for Gemini models that support generateContent
    const geminiModels = data.models.filter((model: any) => 
      model.name?.includes('gemini') && 
      model.supportedGenerationMethods?.includes('generateContent')
    );

    if (geminiModels.length === 0) {
      console.log('No Gemini models found that support generateContent');
      console.log('All available models:');
      data.models.forEach((model: any) => {
        console.log(`- ${model.name}`);
      });
    } else {
      geminiModels.forEach((model: any) => {
        const modelName = model.name.replace('models/', '');
        console.log(`📦 ${modelName}`);
        console.log(`   Display Name: ${model.displayName || modelName}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('─────────────────────────────────────');
      });

      console.log('\n💡 Suggested models to try:');
      console.log('   - gemini-1.5-flash (fastest, recommended)');
      console.log('   - gemini-1.5-pro (most capable)');
      console.log('   - gemini-1.0-pro (older version)');
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching models:');
    console.error(`   Message: ${error.message || 'Unknown error'}`);
    
    if (error.message?.includes('403')) {
      console.log('\n🔑 Your API key might be invalid or expired.');
      console.log('Get a new key from: https://makersuite.google.com/app/apikey');
    }
  }
}

listModels();