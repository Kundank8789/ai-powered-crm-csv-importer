import { ParsedRecord } from './csvParser.js';
import { CRMRecord } from '../types/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIExtractionResult {
  success: boolean;
  records: CRMRecord[];
  skipped: number;
  errors?: string[];
}

export class AIExtractor {
  private model: any = null;
  private useAI: boolean = false;
  private modelName: string = '';

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    this.modelName = process.env.AI_MODEL || 'gemini-2.5-flash';
    
    console.log(`🔧 Initializing AI Extractor...`);
    console.log(`   Provider: Gemini`);
    console.log(`   Model: ${this.modelName}`);
    
    if (apiKey && apiKey.startsWith('AIza') && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ 
          model: this.modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096, // Increased from 2048
          },
        });
        this.useAI = true;
        console.log(`✅ Gemini AI initialized successfully!`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize Gemini AI:', error);
        this.useAI = false;
      }
    } else {
      console.warn('⚠️ No valid Gemini API key found, using fallback mapping');
      this.useAI = false;
    }
  }

  async extractFields(records: ParsedRecord[]): Promise<AIExtractionResult> {
    try {
      if (!records || records.length === 0) {
        return {
          success: true,
          records: [],
          skipped: 0
        };
      }

      if (!this.useAI || !this.model) {
        console.log('📊 Using fallback field mapping...');
        return this.basicFieldMapping(records);
      }

      console.log(`🤖 Processing ${records.length} records with Gemini AI...`);
      
      // Process in smaller batches to avoid token limits
      const batchSize = 2;
      const batches = this.chunkArray(records, batchSize);
      const allResults: CRMRecord[] = [];
      let skippedCount = 0;

      for (let i = 0; i < batches.length; i++) {
        console.log(`📦 Batch ${i + 1}/${batches.length} (${batches[i].length} records)...`);
        
        try {
          const batchResult = await this.processBatchWithGemini(batches[i]);
          if (batchResult.records && batchResult.records.length > 0) {
            allResults.push(...batchResult.records);
          }
          skippedCount += batchResult.skipped || 0;
          
          if (i < batches.length - 1) {
            console.log('⏳ Waiting 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Batch ${i + 1} failed, using fallback:`, error);
          const fallback = this.basicFieldMapping(batches[i]);
          allResults.push(...fallback.records);
          skippedCount += fallback.skipped;
        }
      }

      console.log(`✅ Complete: ${allResults.length} imported, ${skippedCount} skipped`);
      
      return {
        success: true,
        records: allResults,
        skipped: skippedCount
      };
    } catch (error) {
      console.error('❌ AI extraction error:', error);
      const fallbackResult = this.basicFieldMapping(records);
      return {
        success: true,
        records: fallbackResult.records,
        skipped: fallbackResult.skipped,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async processBatchWithGemini(records: ParsedRecord[]): Promise<{ records: CRMRecord[]; skipped: number }> {
    try {
      const prompt = this.buildPrompt(records);
      
      const result = await this.model.generateContent({
        contents: [
          { 
            role: 'user', 
            parts: [{ text: prompt }] 
          }
        ],
      });

      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      
      return this.parseAIResponse(text);
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  }

  private buildPrompt(records: ParsedRecord[]): string {
    return `Convert these CSV records to CRM format. Return ONLY valid JSON.

Use these field mappings:
- Name → name
- Email → email  
- Phone/Mobile → mobile_without_country_code
- Company → company
- City → city
- State → state
- Country → country
- Notes/Remarks → crm_note
- Status → crm_status (map: "Hot Lead","New","Interested" → GOOD_LEAD_FOLLOW_UP, "Closed Won","Done" → SALE_DONE, "Not Interested" → BAD_LEAD)

Rules:
- If no email AND no mobile, skip the record (add to skipped count)
- created_at: use current date if not available
- country_code: extract from phone (e.g., "+91" from "+91 9876543210")
- For crm_status, use the mapped value or default to GOOD_LEAD_FOLLOW_UP

CSV Records:
${JSON.stringify(records, null, 2)}

Return JSON:
{
  "records": [
    {
      "created_at": "2024-01-01T00:00:00.000Z",
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "Tech Corp",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Notes here",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": 0
}`;
  }

  private parseAIResponse(response: string): { records: CRMRecord[]; skipped: number } {
    try {
      // Clean the response
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```(?:json)?\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      
      // Extract JSON between braces
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }
      
      // Try to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (e) {
        // If parsing fails, try to fix common issues
        console.log('⚠️ First parse failed, trying to fix...');
        // Try to find and parse just the records array
        const recordsMatch = cleanedResponse.match(/"records"\s*:\s*(\[[\s\S]*?\])/);
        const skippedMatch = cleanedResponse.match(/"skipped"\s*:\s*(\d+)/);
        
        if (recordsMatch) {
          try {
            const records = JSON.parse(recordsMatch[1]);
            const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
            return { records, skipped };
          } catch (e2) {
            console.error('❌ Failed to parse records array');
          }
        }
        return { records: [], skipped: 0 };
      }
      
      if (!parsed.records || !Array.isArray(parsed.records)) {
        console.warn('⚠️ Invalid response format - missing records array');
        return { records: [], skipped: 0 };
      }

      console.log(`📊 Parsed: ${parsed.records.length} records, ${parsed.skipped || 0} skipped`);
      
      return {
        records: parsed.records,
        skipped: parsed.skipped || 0
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('📄 Raw response preview:', response.substring(0, 300) + '...');
      return { records: [], skipped: 0 };
    }
  }

  private basicFieldMapping(records: ParsedRecord[]): { records: CRMRecord[]; skipped: number } {
    console.log('🔧 Using basic field mapping...');
    const results: CRMRecord[] = [];
    let skipped = 0;

    for (const record of records) {
      try {
        const mapped = this.mapRecordBasic(record);
        if (mapped) {
          results.push(mapped);
        } else {
          skipped++;
        }
      } catch (error) {
        console.warn('⚠️ Failed to map record:', error);
        skipped++;
      }
    }

    return { records: results, skipped };
  }

  private mapRecordBasic(record: ParsedRecord): CRMRecord | null {
    const findValue = (keys: string[]): string => {
      for (const key of keys) {
        if (record[key] && String(record[key]).trim()) {
          return String(record[key]).trim();
        }
        for (const recordKey of Object.keys(record)) {
          if (recordKey.toLowerCase() === key.toLowerCase()) {
            if (record[recordKey] && String(record[recordKey]).trim()) {
              return String(record[recordKey]).trim();
            }
          }
        }
      }
      return '';
    };

    // Find email
    let email = findValue(['email', 'Email', 'EMAIL', 'email address', 'mail', 'Mail']);
    if (!email) {
      for (const key of Object.keys(record)) {
        const value = String(record[key]);
        if (value.includes('@') && value.includes('.')) {
          email = value;
          break;
        }
      }
    }

    // Find mobile
    let mobile = findValue(['phone', 'Phone', 'mobile', 'Mobile', 'phone number', 'mobile number']);
    if (!mobile) {
      for (const key of Object.keys(record)) {
        const value = String(record[key]);
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length >= 10) {
          mobile = value;
          break;
        }
      }
    }

    // Skip if no email and no mobile
    if (!email && !mobile) {
      return null;
    }

    // Extract country code
    let countryCode = '';
    let cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (mobile) {
      const match = mobile.match(/(\+\d{1,3})/);
      if (match) {
        countryCode = match[1];
        cleanMobile = mobile.replace(/[^0-9]/g, '');
      } else if (mobile.startsWith('0')) {
        cleanMobile = mobile.replace(/^0+/, '');
      }
    }

    // Map status
    let crmStatus: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' = 'GOOD_LEAD_FOLLOW_UP';
    const status = findValue(['status', 'Status', 'lead status']);
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('sale') || statusLower.includes('closed') || statusLower.includes('won') || statusLower.includes('done')) {
        crmStatus = 'SALE_DONE';
      } else if (statusLower.includes('bad') || statusLower.includes('not interest') || statusLower.includes('reject')) {
        crmStatus = 'BAD_LEAD';
      } else if (statusLower.includes('not connect') || statusLower.includes('no answer') || statusLower.includes('busy')) {
        crmStatus = 'DID_NOT_CONNECT';
      }
    }

    // Get notes
    let notes = findValue(['notes', 'Notes', 'remarks', 'Remarks', 'comment', 'Comment']);

    // Create CRM record
    const crmRecord: CRMRecord = {
      created_at: new Date().toISOString(),
      name: findValue(['name', 'Name', 'full name', 'lead name']),
      email: email || '',
      country_code: countryCode,
      mobile_without_country_code: cleanMobile,
      company: findValue(['company', 'Company', 'organization']),
      city: findValue(['city', 'City', 'location']),
      state: findValue(['state', 'State', 'region']),
      country: findValue(['country', 'Country']),
      lead_owner: findValue(['lead owner', 'owner']),
      crm_status: crmStatus,
      crm_note: notes,
      data_source: '',
      possession_time: '',
      description: findValue(['description'])
    };

    return crmRecord;
  }
}