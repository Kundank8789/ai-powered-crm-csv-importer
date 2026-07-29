import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import csvRoutes from './routes/csvRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Check AI Configuration on startup
console.log('\n🔍 Checking AI Configuration...');
console.log('═'.repeat(50));

const apiKey = process.env.AI_API_KEY;
const aiProvider = process.env.AI_PROVIDER || 'groq';
const aiModel = process.env.AI_MODEL || 'llama3-8b-8192';

if (apiKey) {
  console.log(`✅ AI Provider: ${aiProvider}`);
  console.log(`✅ AI Model: ${aiModel}`);
  console.log(`✅ API Key: ${apiKey.substring(0, 10)}... (${apiKey.length} chars)`);
  console.log('🤖 AI will be used for intelligent field mapping');
} else {
  console.log('⚠️ AI API Key: Not found');
  console.log('📊 Using rule-based fallback mapping');
  console.log('💡 To enable AI, add AI_API_KEY to .env file');
  console.log('   Get your free Groq key at: https://console.groq.com');
}

console.log('═'.repeat(50));

app.use(cors());
app.use(express.json());
app.use('/api', csvRoutes);

app.listen(port, () => {
  console.log(`\n🚀 Server running on port ${port}`);
  console.log(`📋 API endpoints:`);
  console.log(`  POST /api/upload          - Upload CSV file`);
  console.log(`  POST /api/process         - Process CSV data`);
  console.log(`  POST /api/suggest-mappings - Get AI mapping suggestions`);
  console.log(`\n🌐 Local: http://localhost:${port}`);
  console.log(`📊 ${apiKey ? 'AI Mode: ON' : 'AI Mode: OFF (fallback)'}`);
  console.log('═'.repeat(50));
});