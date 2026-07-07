import { AIExtractor } from './services/aiExtractor';
import dotenv from 'dotenv';

dotenv.config();

async function testFullFlow() {
  console.log('🧪 Testing Full CSV Import Flow\n');
  console.log('=' .repeat(50));
  
  const extractor = new AIExtractor();
  
  // Sample CSV data (simulating what would come from a CSV file)
  const testRecords = [
    {
      'Name': 'John Doe',
      'Email': 'john.doe@example.com',
      'Phone': '+91 9876543210',
      'Company': 'Tech Solutions Pvt Ltd',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Country': 'India',
      'Notes': 'Interested in product demo',
      'Status': 'Hot Lead'
    },
    {
      'Name': 'Sarah Johnson',
      'Email': 'sarah.j@company.com',
      'Phone': '9876543211',
      'Company': 'Business Corp',
      'City': 'Bangalore',
      'State': 'Karnataka',
      'Country': 'India',
      'Notes': 'Follow up next week',
      'Status': 'New'
    },
    {
      'Name': 'Raj Patel',
      'Company': 'Startup Inc',
      'City': 'Delhi',
      'State': 'Delhi',
      'Country': 'India'
      // No email or phone - should be skipped
    },
    {
      'Name': 'Priya Singh',
      'Email': 'priya.singh@enterprise.com',
      'Phone': '9876543212',
      'Company': 'Enterprise Corp',
      'City': 'Pune',
      'State': 'Maharashtra',
      'Country': 'India',
      'Status': 'Closed Won'
    },
    {
      'Name': 'Mike Wilson',
      'Email': 'mike.w@tech.com',
      'Phone': '+1 555-123-4567',
      'Company': 'Global Tech',
      'City': 'New York',
      'State': 'NY',
      'Country': 'USA',
      'Notes': 'Interested in enterprise plan'
    }
  ];

  console.log(`📊 Input Records: ${testRecords.length}`);
  console.log('Sample Input:', JSON.stringify(testRecords[0], null, 2));
  console.log('\n🔄 Processing with Gemini 2.5 Flash...\n');

  try {
    const result = await extractor.extractFields(testRecords);
    
    console.log('=' .repeat(50));
    console.log('📊 Results:');
    console.log(`   ✅ Imported: ${result.records.length}`);
    console.log(`   ⏭️  Skipped: ${result.skipped}`);
    
    if (result.records.length > 0) {
      console.log('\n📝 Sample Imported Record:');
      console.log(JSON.stringify(result.records[0], null, 2));
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Errors:', result.errors);
    }
    
    console.log('\n✅ Full flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFullFlow();