import { Request, Response } from 'express';
import { parseCSV } from '../services/csvParser.js';
import { mapCSVToCRM } from '../services/csvMapper.js';

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
    
    // Use the improved mapper
    const result = mapCSVToCRM(records);

    res.json({
      success: true,
      records: result.records,
      totalProcessed: records.length,
      totalImported: result.records.length,
      totalSkipped: result.skipped,
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