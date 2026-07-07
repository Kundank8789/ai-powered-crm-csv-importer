import { mapCSVToCRM } from './services/csvMapper.js';
import dotenv from 'dotenv';

dotenv.config();

async function testMapper() {
  console.log('🧪 Testing CSV Mapper\n');
  console.log('=' .repeat(50));
  
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
  console.log('\n🔄 Mapping records...\n');

  const result = mapCSVToCRM(testRecords);
  
  console.log('=' .repeat(50));
  console.log('📊 Results:');
  console.log(`   ✅ Imported: ${result.records.length}`);
  console.log(`   ⏭️  Skipped: ${result.skipped}`);
  
  if (result.records.length > 0) {
    console.log('\n📝 Sample Imported Record:');
    console.log(JSON.stringify(result.records[0], null, 2));
  }
  
  console.log('\n✅ Mapping test completed!');
}

testMapper().catch(console.error);