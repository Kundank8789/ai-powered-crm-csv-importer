'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  AlertCircle, 
  File, 
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  Sparkles  // ✅ Added for sample button
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-powered-crm-csv-importer.onrender.com';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
}

// ✅ Sample CSV data
const SAMPLE_CSV_DATA = [
  ['Name', 'Email', 'Phone', 'Company', 'City', 'State', 'Country', 'Notes', 'Status'],
  ['John Doe', 'john.doe@sample.com', '+1 555-123-4567', 'Sample Corp', 'New York', 'NY', 'USA', 'Interested in demo', 'Hot'],
  ['Jane Smith', 'jane.smith@sample.com', '+91 9876543210', 'Sample Inc', 'Bangalore', 'Karnataka', 'India', 'Follow up next week', 'New'],
  ['Bob Wilson', 'bob.wilson@sample.com', '+44 20 7946 0958', 'Wilson & Co', 'London', 'England', 'UK', 'Enterprise plan interest', 'Qualified'],
  ['Alice Brown', 'alice.brown@sample.com', '+1 555-987-6543', 'Creative Studio', 'Los Angeles', 'CA', 'USA', 'Needs product demo', 'Interested'],
  ['Charlie Davis', 'charlie.davis@sample.com', '+61 2 9000 1000', 'Data Systems', 'Sydney', 'NSW', 'Australia', 'Implementation questions', 'New'],
  ['Sarah Lee', 'sarah.lee@sample.com', '+1 555-444-3333', 'Design Haus', 'San Francisco', 'CA', 'USA', 'Ready to onboard', 'SALE_DONE']
];

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false); // ✅ New state
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploading(false);
    setSelectedFile(null);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (isUploading) {
      handleCancelUpload();
    }
    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
  }, [isUploading, handleCancelUpload]);

  // ✅ Load sample CSV
  const loadSampleCSV = useCallback(async () => {
    setIsSampleLoading(true);
    setUploadError(null);
    
    try {
      // Convert sample data to CSV string
      const csvContent = SAMPLE_CSV_DATA.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'sample_leads.csv', { type: 'text/csv' });
      
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      data.filename = file.name;
      onUploadSuccess(data);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to load sample CSV');
    } finally {
      setIsSampleLoading(false);
    }
  }, [onUploadSuccess]);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    // Handle file rejections
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setUploadError('Only CSV files are supported. Please upload a .csv file.');
      } else if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setUploadError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      } else {
        setUploadError(rejection.errors[0]?.message || 'Invalid file');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Empty file check
    if (file.size === 0) {
      setUploadError('File is empty. Please select a valid CSV file.');
      return;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setIsUploading(true);
    setUploading(true);
    setUploadProgress(0);

    // Create AbortController for cancel
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use XMLHttpRequest for real progress tracking
      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Server error: ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error. Please check your connection.'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);
      });

      const data = await uploadPromise as any;

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);
      data.filename = file.name;
      onUploadSuccess(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      if (errorMessage === 'Upload cancelled') {
        setUploadError('Upload cancelled');
      } else {
        setUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [onUploadSuccess]);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive, 
    isDragReject,
    isDragAccept 
  } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isUploading,
    noClick: isUploading,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Determine dropzone border color
  const getBorderColor = () => {
    if (isDragReject) return 'border-red-500 bg-red-50/30';
    if (isDragActive) return 'border-blue-500 bg-blue-50';
    if (uploadError) return 'border-red-300 bg-red-50/20';
    return 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ✅ Sample CSV Button */}
      <div className="mb-4 text-center">
        <button
          onClick={loadSampleCSV}
          disabled={isSampleLoading || isUploading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSampleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Try with Sample CSV
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-1">
          Instantly test with sample lead data
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${getBorderColor()}
          ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}
          ${isDragActive ? 'scale-[1.02] shadow-lg' : ''}
          ${isDragReject ? 'shake' : ''}`}
        aria-label="Drop zone for CSV file upload"
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        <div className="space-y-4">
          {/* Icon */}
          <div className={`flex justify-center transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
            {isUploading ? (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" strokeWidth={1.5} />
            ) : isDragReject ? (
              <AlertCircle className="h-16 w-16 text-red-500" strokeWidth={1.5} />
            ) : (
              <Upload className={`h-16 w-16 transition-colors duration-300 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} strokeWidth={1.5} />
            )}
          </div>
          
          {/* Text */}
          <div>
            <p className={`text-xl font-medium transition-colors duration-300 ${isDragActive ? 'text-blue-600' : 'text-gray-700'}`}>
              {isDragReject ? '❌ Invalid file type' :
               isDragActive ? 'Drop your CSV here' : 
               isUploading ? 'Uploading...' : 'Drag & drop your CSV file'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isDragReject ? 'Only .csv files are accepted' : 
               isUploading ? 'Please wait while your file uploads' : 
               'or click to browse files'}
            </p>
          </div>
          
          {/* File info with remove button */}
          {selectedFile && !isUploading && !uploadError && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-green-600">({formatFileSize(selectedFile.size)})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-green-100"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload progress with real percentage */}
          {isUploading && (
            <div className="mt-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Uploading {selectedFile?.name}
                </span>
                <span className="text-blue-600 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress < 100 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelUpload();
                  }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Cancel upload
                </button>
              )}
            </div>
          )}

          {/* Supported formats */}
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <FileSpreadsheet className="w-3 h-3" />
            Supports: .csv files only
            <span className="mx-1">•</span>
            Max {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      </div>

      {/* Error message with dismiss */}
      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-fadeIn flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Upload failed</p>
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
          <button 
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
        <span>💡 CSV files only</span>
        <span>•</span>
        <span>📊 Any column structure</span>
        <span>•</span>
        <span>🤖 AI-powered mapping</span>
      </div>
    </div>
  );
}