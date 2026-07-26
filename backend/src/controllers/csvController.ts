import { Request, Response } from 'express';
import { parseCSV } from '../services/csvParser.js';
import { mapCSVToCRM } from '../services/csvMapper.js';
import { suggestMappings } from '../services/mappingSuggestor.js';

export const uploadCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const records = await parseCSV(req.file.path);
    
    console.log(`📊 CSV Upload: ${records.length} records`);
    console.log(`📋 Columns: ${Object.keys(records[0] || {}).join(', ')}`);
    if (records.length > 0) {
      console.log(`📋 First record sample:`, JSON.stringify(records[0], null, 2));
    }
    
    // Return preview (first 100 rows)
    const preview = records.slice(0, 100);
    
    res.json({
      success: true,
      totalRows: records.length,
      preview: preview,
      columns: Object.keys(records[0] || {})
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process CSV' 
    });
  }
};

export const processCSV = async (req: Request, res: Response) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid records data' 
      });
    }

    console.log(`📊 Processing ${records.length} records...`);
    console.log(`📋 Sample record from frontend:`, JSON.stringify(records[0] || {}, null, 2));
    
    // Use the improved mapper (now returns skippedRows with reasons)
    const result = mapCSVToCRM(records);

    res.json({
      success: true,
      records: result.records,
      totalProcessed: records.length,
      totalImported: result.records.length,
      totalSkipped: result.skipped,
      skippedRows: result.skippedRows || [], // ✅ Now includes skipped rows with reasons
      errors: []
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process CSV data' 
    });
  }
};

// ✅ NEW: Suggest mappings endpoint
export const suggestMappingsController = async (req: Request, res: Response) => {
  try {
    const { columns, sampleData } = req.body;
    
    // Validate input
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Columns are required'
      });
    }

    if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sample data is required'
      });
    }

    console.log(`🔍 Generating mapping suggestions for ${columns.length} columns...`);
    console.log(`📋 Columns: ${columns.join(', ')}`);

    const apiKey = process.env.AI_API_KEY;
    
    let suggestions;
    let usingAI = false;

    if (apiKey && apiKey.startsWith('AIza')) {
      try {
        suggestions = await suggestMappings(columns, sampleData, apiKey);
        usingAI = true;
        console.log(`✅ AI suggestions generated successfully`);
      } catch (error) {
        console.error('AI suggestion failed, using fallback:', error);
        // Fallback to rule-based mapping
        const { fallbackMapping } = await import('../services/mappingSuggestor.js');
        suggestions = fallbackMapping(columns, sampleData);
        usingAI = false;
      }
    } else {
      console.warn('⚠️ No API key found, using fallback mapping');
      const { fallbackMapping } = await import('../services/mappingSuggestor.js');
      suggestions = fallbackMapping(columns, sampleData);
      usingAI = false;
    }

    res.json({
      success: true,
      suggestions,
      usingAI,
      message: usingAI ? 'AI-powered suggestions' : 'Rule-based suggestions (AI not available)'
    });
    
  } catch (error) {
    console.error('Mapping suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mapping suggestions'
    });
  }
};