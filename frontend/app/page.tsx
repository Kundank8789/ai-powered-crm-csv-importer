'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import ResultsTable from '@/components/ResultsTable';
import SkippedRowsTable from '@/components/SkippedRowsTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import MappingReview from '@/components/MappingReview';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  History,
  Database,
  Zap,
  Eye,
  Shield,
  FileSpreadsheet,
  ArrowLeft,
  RefreshCw,
  X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-powered-crm-csv-importer.onrender.com';
interface ImportHistory {
  id: string;
  filename: string;
  timestamp: string;
  totalImported: number;
  totalSkipped: number;
  totalProcessed: number;
}

interface MappingSuggestion {
  csvColumn: string;
  suggestedField: string | null;
  confidence: number;
  sampleValues: string[];
}

export default function Home() {
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'processing' | 'results'>('upload');
  const [csvData, setCsvData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'imported' | 'skipped'>('imported');
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestion[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('importHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 100) {
          setHistory(parsed.slice(0, 100));
        } else {
          setHistory(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse import history:', e);
      }
    }
  }, []);

  // Save to localStorage when history updates
  useEffect(() => {
    if (history.length > 0) {
      const capped = history.length > 100 ? history.slice(0, 100) : history;
      localStorage.setItem('importHistory', JSON.stringify(capped));
    }
  }, [history]);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all upload history?')) {
      setHistory([]);
      localStorage.removeItem('importHistory');
    }
  };

  const handleUploadSuccess = (data: any) => {
    setCsvData(data);
    setStep('preview');
    setError(null);
  };

  const handleMappingConfirm = async (mappings: Record<string, string>) => {
    setStep('processing');
    setError(null);
    setIsProcessing(true);

    try {
      const fullRecords = csvData.fullData || csvData.preview;

      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: fullRecords,
          mappings: mappings
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      const newEntry: ImportHistory = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        filename: csvData.filename || 'Unknown file',
        timestamp: new Date().toLocaleString(),
        totalImported: result.totalImported || 0,
        totalSkipped: result.totalSkipped || 0,
        totalProcessed: result.totalProcessed || 0,
      };
      setHistory(prev => [newEntry, ...prev]);

      setResults(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewMapping = () => {
    console.log('🔍 handleReviewMapping called');
    console.log('📊 csvData:', csvData);

    if (!csvData?.preview || csvData.preview.length === 0) {
      setError('No data to import. The CSV file appears to be empty.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    console.log('📝 Generating fallback suggestions...');

    const fallbackSuggestions = csvData.columns.map((col: string) => {
      const lower = col.toLowerCase();
      let suggestedField: string | null = null;
      let confidence = 0;

      if (lower.includes('name') || lower.includes('full')) {
        suggestedField = 'name';
        confidence = 85;
      } else if (lower.includes('email') || lower.includes('mail')) {
        suggestedField = 'email';
        confidence = 90;
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) {
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
      } else if (lower.includes('country') || lower.includes('nation')) {
        suggestedField = 'country';
        confidence = 85;
      } else if (lower.includes('status') || lower.includes('stage') || lower.includes('phase')) {
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
      } else if (lower.includes('owner') || lower.includes('assigned')) {
        suggestedField = 'lead_owner';
        confidence = 75;
      }

      return {
        csvColumn: col,
        suggestedField,
        confidence,
        sampleValues: csvData.preview.slice(0, 3).map((row: any) => String(row[col] || ''))
      };
    });

    console.log('📝 Fallback suggestions:', fallbackSuggestions);
    setMappingSuggestions(fallbackSuggestions);
    setStep('mapping');
    setIsProcessing(false);
  };

  const handleCancelProcessing = () => {
    if (isProcessing) {
      setStep('preview');
      setIsProcessing(false);
      setError('Import cancelled by user');
    }
  };

  const displayHistory = isHistoryExpanded ? history : history.slice(0, 5);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <FileSpreadsheet className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-gray-900">
              AI-Powered CSV Importer
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload any CSV and let AI map it to CRM format
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-blue-500" /> AI-Powered Mapping</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-blue-500" /> Instant Preview</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /> Secure Processing</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <>
            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {history.length > 0 && (
              <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    Upload History
                    <span className="text-sm text-gray-500 font-normal">
                      ({history.length} imports)
                    </span>
                  </h3>
                  <div className="flex items-center gap-3">
                    {history.length > 5 && (
                      <button
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {isHistoryExpanded ? 'Show less' : 'View all'}
                      </button>
                    )}
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear all
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-600">File</th>
                        <th className="text-left py-2 px-3 text-gray-600">Date</th>
                        <th className="text-center py-2 px-3 text-gray-600">Imported</th>
                        <th className="text-center py-2 px-3 text-gray-600">Skipped</th>
                        <th className="text-center py-2 px-3 text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayHistory.map((entry) => {
                        const total = entry.totalProcessed || 0;
                        const importRate = total > 0 ? Math.round((entry.totalImported / total) * 100) : 0;
                        return (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-800">{entry.filename}</td>
                            <td className="py-2 px-3 text-gray-500">{entry.timestamp}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="text-green-600 font-medium">{entry.totalImported}</span>
                              <span className="text-xs text-gray-400 ml-1">({importRate}%)</span>
                            </td>
                            <td className="py-2 px-3 text-center text-red-500">{entry.totalSkipped}</td>
                            <td className="py-2 px-3 text-center text-gray-700">{entry.totalProcessed}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview Step */}
        {step === 'preview' && csvData && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600" />
                    Preview Data
                  </h2>
                  <p className="text-sm text-gray-500">
                    Total rows: <span className="font-medium text-gray-700">{csvData.totalRows}</span> |
                    Showing first <span className="font-medium text-gray-700">{csvData.preview.length}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {error && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleReviewMapping}
                    disabled={!csvData.preview || csvData.preview.length === 0 || isProcessing}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2
                      ${csvData.preview && csvData.preview.length > 0 && !isProcessing
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    {isProcessing ? (
                      <>⏳ Analyzing...</>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Review Mapping
                      </>
                    )}
                  </button>
                </div>
              </div>
              {csvData.preview && csvData.preview.length > 0 ? (
                <DataPreview
                  data={csvData.preview}
                  columns={csvData.columns}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-lg">📭 No data to preview</p>
                  <p className="text-sm text-gray-400">The CSV file appears to be empty</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setStep('upload')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Upload different file
            </button>
          </div>
        )}

        {/* Mapping Review Step */}
        {step === 'mapping' && csvData && mappingSuggestions && mappingSuggestions.length > 0 && (
          <MappingReview
            csvColumns={csvData.columns}
            suggestions={mappingSuggestions}
            onBack={() => setStep('preview')}
            onConfirm={handleMappingConfirm}
            isProcessing={isProcessing}
          />
        )}

        {step === 'mapping' && (!mappingSuggestions || mappingSuggestions.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading mapping suggestions...</p>
              <button
                onClick={() => setStep('preview')}
                className="mt-4 px-6 py-2 text-blue-600 hover:text-blue-800"
              >
                ← Go Back
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 relative">
            <LoadingSpinner
              message="Processing CSV with AI..."
              subMessage="This may take a few moments depending on file size"
            />
            <button
              onClick={handleCancelProcessing}
              className="mt-6 mx-auto block px-6 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Cancel
            </button>
          </div>
        )}

        {/* Results Step with Tab Toggle */}
        {step === 'results' && results && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Import Results
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Imported
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {results.totalImported}
                    {results.totalProcessed > 0 && (
                      <span className="text-sm font-normal text-green-500 ml-2">
                        ({Math.round((results.totalImported / results.totalProcessed) * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Skipped
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {results.totalSkipped}
                    {results.totalProcessed > 0 && (
                      <span className="text-sm font-normal text-red-500 ml-2">
                        ({Math.round((results.totalSkipped / results.totalProcessed) * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium flex items-center gap-1">
                    <Database className="w-4 h-4" /> Total Processed
                  </p>
                  <p className="text-3xl font-bold text-blue-600">{results.totalProcessed}</p>
                </div>
              </div>
            </div>

            {/* ✅ Tab Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setResultsTab('imported')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  resultsTab === 'imported' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✅ Imported ({results.totalImported || 0})
              </button>
              <button
                onClick={() => setResultsTab('skipped')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  resultsTab === 'skipped' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⚠️ Skipped ({results.totalSkipped || 0})
              </button>
            </div>

            {/* ✅ Results Table or Skipped Rows Table */}
            {resultsTab === 'imported' ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <ResultsTable 
                  data={results.records || []}
                  skippedRows={results.skippedRows || []}
                />
              </div>
            ) : (
              <SkippedRowsTable data={results.skippedRows || []} />
            )}

            <button
              onClick={() => {
                setStep('upload');
                setCsvData(null);
                setResults(null);
                setError(null);
                setMappingSuggestions([]);
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 inline-flex items-center gap-1"
            >
              <Upload className="w-4 h-4" /> Import another file
            </button>
          </div>
        )}
      </div>
    </main>
  );
}