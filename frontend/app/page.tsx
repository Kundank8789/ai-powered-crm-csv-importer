'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import ResultsTable from '@/components/ResultsTable';
import LoadingSpinner from '@/components/LoadingSpinner';

// ✅ Use environment variable or fallback to deployed backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-powered-crm-csv-importer.onrender.com';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const [csvData, setCsvData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (data: any) => {
    setCsvData(data);
    setStep('preview');
  };

  const handleConfirmImport = async () => {
    setStep('processing');
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: csvData.preview }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setResults(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('preview');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI-Powered CSV Importer
          </h1>
          <p className="text-gray-600">
            Upload any CSV and let AI map it to CRM format
          </p>
        </div>

        {step === 'upload' && (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        )}

        {step === 'preview' && csvData && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Preview Data</h2>
                  <p className="text-sm text-gray-600">
                    Total rows: {csvData.totalRows} | Showing first {csvData.preview.length}
                  </p>
                </div>
                <button
                  onClick={handleConfirmImport}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Confirm Import
                </button>
              </div>
              <DataPreview 
                data={csvData.preview} 
                columns={csvData.columns}
              />
            </div>
            <button
              onClick={() => setStep('upload')}
              className="text-blue-600 hover:underline"
            >
              ← Upload different file
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow p-8">
            <LoadingSpinner message="Processing CSV with AI..." />
          </div>
        )}

        {step === 'results' && results && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Import Results</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Imported</p>
                  <p className="text-2xl font-bold text-green-600">{results.totalImported}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-red-600">{results.totalSkipped}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Processed</p>
                  <p className="text-2xl font-bold text-blue-600">{results.totalProcessed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ResultsTable data={results.records} />
            </div>
            
            <button
              onClick={() => {
                setStep('upload');
                setCsvData(null);
                setResults(null);
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← Import another file
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}