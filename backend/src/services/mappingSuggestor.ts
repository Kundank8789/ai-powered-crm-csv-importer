import { GoogleGenerativeAI } from '@google/generative-ai';

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
    // Build a prompt for Gemini
    const prompt = buildMappingPrompt(columns, sampleData);
    
    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent({
      contents: [
        { 
          role: 'user', 
          parts: [{ text: prompt }] 
        }
      ],
    });

    const response = result.response;
    const text = response.text();
    
    // Parse the response
    return parseSuggestions(text, columns, sampleData);
    
  } catch (error) {
    console.error('Mapping suggestion error:', error);
    // Fallback: use rule-based mapping
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
- Confidence 80-100: Strong match (exact match, clear semantic match)
- Confidence 50-79: Partial match (related concept, could be a match)
- Confidence 0-49: Weak match (no clear relationship)

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
- Be careful with ambiguous fields
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
    // Clean the response
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

    // Map to our format with sample values
    return parsed.suggestions.map((s: any) => ({
      csvColumn: s.csvColumn,
      suggestedField: s.suggestedField || null,
      confidence: s.confidence || 0,
      sampleValues: sampleData.map(row => String(row[s.csvColumn] || '')).slice(0, 5)
    }));
    
  } catch (error) {
    console.error('Failed to parse suggestions:', error);
    // Fallback to rule-based
    return fallbackMapping(columns, sampleData);
  }
}

function fallbackMapping(columns: string[], sampleData: any[]): MappingSuggestion[] {
  const sampleValues = sampleData.map(row => 
    columns.map(col => String(row[col] || '')).slice(0, 3)
  );

  return columns.map((col, index) => {
    const lower = col.toLowerCase();
    let suggestedField: string | null = null;
    let confidence = 0;

    // Rule-based mapping
    if (lower.includes('name') || lower.includes('full') || lower.includes('person')) {
      suggestedField = 'name';
      confidence = 85;
    } else if (lower.includes('email') || lower.includes('mail')) {
      suggestedField = 'email';
      confidence = 90;
    } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
      suggestedField = 'mobile_without_country_code';
      confidence = 80;
    } else if (lower.includes('company') || lower.includes('organization') || lower.includes('org')) {
      suggestedField = 'company';
      confidence = 85;
    } else if (lower.includes('city') || lower.includes('location')) {
      suggestedField = 'city';
      confidence = 80;
    } else if (lower.includes('state') || lower.includes('region') || lower.includes('province')) {
      suggestedField = 'state';
      confidence = 80;
    } else if (lower.includes('country')) {
      suggestedField = 'country';
      confidence = 85;
    } else if (lower.includes('status') || lower.includes('stage')) {
      suggestedField = 'crm_status';
      confidence = 75;
    } else if (lower.includes('note') || lower.includes('remark') || lower.includes('comment')) {
      suggestedField = 'crm_note';
      confidence = 80;
    } else if (lower.includes('date') || lower.includes('created') || lower.includes('timestamp')) {
      suggestedField = 'created_at';
      confidence = 85;
    } else if (lower.includes('source')) {
      suggestedField = 'data_source';
      confidence = 70;
    }

    return {
      csvColumn: col,
      suggestedField,
      confidence,
      sampleValues: sampleData.map(row => String(row[col] || '')).slice(0, 5)
    };
  });
}