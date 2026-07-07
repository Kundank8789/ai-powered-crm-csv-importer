import fs from 'fs';
import csv from 'csv-parser';

export interface ParsedRecord {
  [key: string]: string;
}

export const parseCSV = (filePath: string): Promise<ParsedRecord[]> => {
  return new Promise((resolve, reject) => {
    const results: ParsedRecord[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};