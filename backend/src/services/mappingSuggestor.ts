import Groq from 'groq-sdk';

const CRM_FIELDS = [
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description'
];

interface MappingSuggestion {
  csvColumn: string;
  suggestedField: string | null;
  confidence: number;
  sampleValues: string[];
}

export async function suggestMappings(
  columns: string[],
  sampleData: any[],
  apiKey: string
): Promise<MappingSuggestion[]> {
  try {
    console.log('🤖 Calling Groq for mapping suggestions...');
    
    const groq = new Groq({ apiKey });
    
    const prompt = buildMappingPrompt(columns, sampleData);
    
    const response = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama3-8b-8192',
      messages: [
        { 
          role: 'system', 
          content: 'You are a CSV field mapping expert. Return ONLY valid JSON. Do not add any text before or after the JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const text = response.choices[0]?.message?.content || '';
    console.log('✅ Groq response received');
    
    return parseSuggestions(text, columns, sampleData);
    
  } catch (error) {
    console.error('❌ Groq error:', error);
    return fallbackMapping(columns, sampleData);
  }
}

function buildMappingPrompt(columns: string[], sampleData: any[]): string {
  const sampleValues = sampleData.map(row => 
    columns.map(col => `${col}: ${row[col] || ''}`).join(', ')
  ).join('\n');

  return `You are a CSV field mapping expert. Your task is to map CSV columns to CRM fields.

Available CRM fields:
${CRM_FIELDS.map(f => `- ${f}`).join('\n')}

CSV Columns to map:
${columns.map(c => `- ${c}`).join('\n')}

Sample data from each column:
${sampleValues}

For each CSV column, suggest the best matching CRM field and provide a confidence score (0-100).
- Confidence 80-100: Strong match
- Confidence 50-79: Partial match
- Confidence 0-49: Weak match

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "csvColumn": "Full Name",
      "suggestedField": "name",
      "confidence": 95
    }
  ]
}

Important: 
- If no field matches, set suggestedField to null and confidence to 0
- Consider data types and formats
- Pay attention to date fields, email fields, phone fields
- For status fields, consider mapping to crm_status if it looks like lead status`;
}

function parseSuggestions(
  response: string,
  columns: string[],
  sampleData: any[]
): MappingSuggestion[] {
  try {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```(?:json)?\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleaned);
    
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format');
    }

    return parsed.suggestions.map((s: any) => ({
      csvColumn: s.csvColumn,
      suggestedField: s.suggestedField || null,
      confidence: s.confidence || 0,
      sampleValues: sampleData.map(row => String(row[s.csvColumn] || '')).slice(0, 5)
    }));
    
  } catch (error) {
    console.error('Failed to parse suggestions:', error);
    return fallbackMapping(columns, sampleData);
  }
}

export function fallbackMapping(columns: string[], sampleData: any[]): MappingSuggestion[] {
  return columns.map((col) => {
    const lower = col.toLowerCase();
    let suggestedField: string | null = null;
    let confidence = 0;

    if (lower.includes('name') || lower.includes('full') || lower.includes('person')) {
      suggestedField = 'name';
      confidence = 85;
    } else if (lower.includes('email') || lower.includes('mail')) {
      suggestedField = 'email';
      confidence = 90;
    } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('tel')) {
      suggestedField = 'mobile_without_country_code';
      confidence = 80;
    } else if (lower.includes('company') || lower.includes('organization') || lower.includes('org') || lower.includes('business')) {
      suggestedField = 'company';
      confidence = 85;
    } else if (lower.includes('city') || lower.includes('location') || lower.includes('town')) {
      suggestedField = 'city';
      confidence = 80;
    } else if (lower.includes('state') || lower.includes('region') || lower.includes('province') || lower.includes('district')) {
      suggestedField = 'state';
      confidence = 80;
    } else if (lower.includes('country') || lower.includes('nation')) {
      suggestedField = 'country';
      confidence = 85;
    } else if (lower.includes('status') || lower.includes('stage') || lower.includes('phase')) {
      suggestedField = 'crm_status';
      confidence = 75;
    } else if (lower.includes('note') || lower.includes('remark') || lower.includes('comment') || lower.includes('description')) {
      suggestedField = 'crm_note';
      confidence = 80;
    } else if (lower.includes('date') || lower.includes('created') || lower.includes('timestamp') || lower.includes('time')) {
      suggestedField = 'created_at';
      confidence = 85;
    } else if (lower.includes('source')) {
      suggestedField = 'data_source';
      confidence = 70;
    } else if (lower.includes('owner') || lower.includes('assigned') || lower.includes('agent')) {
      suggestedField = 'lead_owner';
      confidence = 75;
    }

    return {
      csvColumn: col,
      suggestedField,
      confidence,
      sampleValues: sampleData.map(row => String(row[col] || '')).slice(0, 5)
    };
  });
}