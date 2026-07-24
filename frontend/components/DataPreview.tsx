'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Hash
} from 'lucide-react';

interface DataPreviewProps {
  data: any[];
  columns: string[];
  title?: string;
  // Optional schema info from backend to know which columns are dates
  columnTypes?: Record<string, 'date' | 'string' | 'number' | 'email' | 'phone'>;
}

export default function DataPreview({ 
  data, 
  columns, 
  title = 'Data Preview',
  columnTypes 
}: DataPreviewProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const rowsPerPage = 50;

  // Debounce search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Pre-compute column types for performance
  const columnTypeMap = useMemo(() => {
    const types: Record<string, 'date' | 'string' | 'number' | 'email' | 'phone'> = {};
    
    // Use provided schema if available
    if (columnTypes) {
      return columnTypes;
    }

    // Otherwise, infer from column names
    for (const col of columns) {
      const lower = col.toLowerCase();
      if (lower.includes('date') || lower.includes('created_at') || lower.includes('timestamp')) {
        types[col] = 'date';
      } else if (lower.includes('email')) {
        types[col] = 'email';
      } else if (lower.includes('phone') || lower.includes('mobile')) {
        types[col] = 'phone';
      } else if (lower.includes('id') || lower.includes('code') || lower.includes('number')) {
        types[col] = 'number';
      } else {
        types[col] = 'string';
      }
    }
    return types;
  }, [columns, columnTypes]);

  // Strict date validation - only for columns we know are dates
  const isValidDate = useCallback((value: string, column: string): boolean => {
    // Only check if column is known to be a date
    if (columnTypeMap[column] !== 'date') {
      return false;
    }

    if (!value || typeof value !== 'string') return false;

    // Strict format check: YYYY-MM-DD or ISO format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoDateRegex.test(value)) return false;

    const date = new Date(value);
    return !isNaN(date.getTime());
  }, [columnTypeMap]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchLower)
      )
    );
  }, [data, debouncedSearchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = String(a[sortColumn] || '').toLowerCase();
      const bVal = String(b[sortColumn] || '').toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const formatDisplayValue = (value: any, column: string): { display: string; isDate: boolean } => {
    if (value === undefined || value === null || value === '') {
      return { display: '—', isDate: false };
    }

    const strValue = String(value);
    
    // Only format as date if it's a valid date column and passes strict check
    if (isValidDate(strValue, column)) {
      try {
        const date = new Date(strValue);
        if (!isNaN(date.getTime())) {
          return { 
            display: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
            isDate: true 
          };
        }
      } catch (e) {
        // Fall through to string display
      }
    }

    return { display: strValue, isDate: false };
  };

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-lg font-medium">No data to preview</p>
        <p className="text-sm text-gray-400">Upload a CSV file to see data here</p>
      </div>
    );
  }

  // No search results state
  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">📊 {title}</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{data.length} rows</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-40 sm:w-56 transition-all"
            />
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-lg font-medium">No matching records</p>
          <p className="text-sm text-gray-400">Try adjusting your search terms</p>
          <button
            onClick={clearSearch}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with search and stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            📊 {title}
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {filteredData.length} rows
          </span>
          {filteredData.length !== data.length && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Filtered: {filteredData.length} of {data.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-40 sm:w-56 transition-all"
            />
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div 
        ref={tableRef}
        className="overflow-x-auto overflow-y-auto max-h-[500px]"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 w-12">
                #
              </th>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(column)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                  title={`Click to sort by ${column}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>
                      {columnTypeMap[column] === 'date' ? '📅' : 
                       columnTypeMap[column] === 'email' ? '📧' :
                       columnTypeMap[column] === 'phone' ? '📱' : '📋'}
                    </span>
                    <span>{column}</span>
                    {sortColumn === column && (
                      <span className="text-blue-500 ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    {sortColumn !== column && (
                      <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        ↕
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedData.map((row, rowIndex) => {
              const globalIndex = startIndex + rowIndex + 1;
              return (
                <tr 
                  key={`row-${globalIndex}`} 
                  className="hover:bg-blue-50/30 transition-colors duration-150 group"
                >
                  <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap">
                    {globalIndex}
                  </td>
                  {columns.map((column, colIndex) => {
                    const value = row[column];
                    const { display, isDate } = formatDisplayValue(value, column);
                    const isEmail = columnTypeMap[column] === 'email' && display !== '—';
                    
                    return (
                      <td
                        key={`${globalIndex}-${colIndex}`}
                        className={`px-4 py-2 text-sm whitespace-nowrap max-w-[200px] truncate
                          ${display !== '—' ? 'text-gray-800' : 'text-gray-400 italic'}
                          ${isDate ? 'text-blue-600' : ''}`}
                        title={display !== '—' ? display : 'Empty'}
                      >
                        {isEmail && display !== '—' ? (
                          <a href={`mailto:${display}`} className="hover:underline text-blue-600">
                            {display}
                          </a>
                        ) : display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Showing {paginatedData.length > 0 ? startIndex + 1 : 0} to{' '}
          {Math.min(startIndex + rowsPerPage, filteredData.length)} of{' '}
          {filteredData.length} rows
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-3">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}