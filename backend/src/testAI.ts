import { AIExtractor } from './services/aiExtractor.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAI() {
  const extractor = new AIExtractor();
  
  const testRecords = [
    {
      'Name': 'John Doe',
      'Email': 'john@example.com',
      'Phone': '+91 9876543210',
      'Company': 'Tech Corp',
      'City': 'Mumbai'
    },
    {
      'Name': 'Jane Smith',
      'Email': 'jane@example.com',
      'Phone': '9876543211',
      'Company': 'Business Inc',
      'City': 'Delhi'
    }
  ];

  console.log('Testing AI extraction...');
  const result = await extractor.extractFields(testRecords);
  console.log('Result:', JSON.stringify(result, null, 2));
}

testAI().catch(console.error);