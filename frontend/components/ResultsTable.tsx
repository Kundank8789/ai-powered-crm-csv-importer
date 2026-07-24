'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download,
  FileSpreadsheet,
  Mail,
  Phone,
  Calendar,
  User,
  Building,
  MapPin,
  Globe,
  Tag,
  FileText,
  AlertCircle
} from 'lucide-react';

interface ResultsTableProps {
  data: any[];
  title?: string;
  skippedRows?: Array<{ row: any; reason: string }>;
  columnTypes?: Record<string, 'date' | 'number' | 'string' | 'email' | 'phone' | 'status'>;
}

export default function ResultsTable({ 
  data, 
  title = 'Imported Records',
  skippedRows = [],
  columnTypes: providedColumnTypes
}: ResultsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSkipped, setShowSkipped] = useState(false);
  const rowsPerPage = 20;

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
  }, [debouncedSearchTerm, showSkipped]);

  // Safely get all unique columns from all rows (not just first row)
  const allColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const keys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => keys.add(key));
    });
    return Array.from(keys);
  }, [data]);

  // Infer column types from data and column names
  const columnTypes = useMemo(() => {
    const types: Record<string, 'date' | 'number' | 'string' | 'email' | 'phone' | 'status'> = {};
    
    if (providedColumnTypes) {
      return providedColumnTypes;
    }

    for (const col of allColumns) {
      const lower = col.toLowerCase();
      // Check if it's a status column
      if (lower.includes('status') || lower.includes('crm_status')) {
        types[col] = 'status';
      } else if (lower.includes('email') || lower.includes('mail')) {
        types[col] = 'email';
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) {
        types[col] = 'phone';
      } else if (lower.includes('date') || lower.includes('created_at') || lower.includes('timestamp')) {
        types[col] = 'date';
      } else if (lower.includes('id') || lower.includes('code') || lower.includes('number') || lower.includes('count')) {
        types[col] = 'number';
      } else if (lower.includes('name')) {
        types[col] = 'string';
      } else if (lower.includes('company') || lower.includes('org')) {
        types[col] = 'string';
      } else if (lower.includes('city') || lower.includes('state') || lower.includes('country')) {
        types[col] = 'string';
      } else {
        types[col] = 'string';
      }
    }
    return types;
  }, [allColumns, providedColumnTypes]);

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

  // Sort data with type-aware comparator
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const type = columnTypes[sortColumn] || 'string';
      
      let aCompare: any = aVal;
      let bCompare: any = bVal;

      // Type-aware comparison
      if (type === 'date') {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        aCompare = isNaN(aDate.getTime()) ? aVal : aDate.getTime();
        bCompare = isNaN(bDate.getTime()) ? bVal : bDate.getTime();
      } else if (type === 'number') {
        aCompare = parseFloat(String(aVal).replace(/[^0-9.-]/g, ''));
        bCompare = parseFloat(String(bVal).replace(/[^0-9.-]/g, ''));
        if (isNaN(aCompare)) aCompare = aVal;
        if (isNaN(bCompare)) bCompare = bVal;
      } else {
        aCompare = String(aVal || '').toLowerCase();
        bCompare = String(bVal || '').toLowerCase();
      }

      if (aCompare < bCompare) return sortDirection === 'asc' ? -1 : 1;
      if (aCompare > bCompare) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columnTypes]);

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

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'GOOD_LEAD_FOLLOW_UP': 'bg-green-100 text-green-800 border-green-200',
      'DID_NOT_CONNECT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'BAD_LEAD': 'bg-red-100 text-red-800 border-red-200',
      'SALE_DONE': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get column icon
  const getColumnIcon = (column: string): React.ReactNode => {
    const type = columnTypes[column] || 'string';
    const iconMap: Record<string, React.ReactNode> = {
      'email': <Mail className="w-3.5 h-3.5" />,
      'phone': <Phone className="w-3.5 h-3.5" />,
      'date': <Calendar className="w-3.5 h-3.5" />,
      'status': <Tag className="w-3.5 h-3.5" />,
      'number': <Hash className="w-3.5 h-3.5" />,
    };
    return iconMap[type] || <FileText className="w-3.5 h-3.5" />;
  };

  // Format column name for display
  const formatColumnName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Export filtered/sorted data
  const handleExport = useCallback(() => {
    const exportData = showSkipped ? skippedRows.map(r => r.row) : sortedData;
    if (exportData.length === 0) return;

    const headers = allColumns.join(',');
    const rows = exportData.map(row => 
      allColumns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_records_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Safe revoke after download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [sortedData, skippedRows, allColumns, showSkipped]);

  // Format display value based on type
  const formatDisplayValue = (value: any, column: string): string => {
    if (value === undefined || value === null || value === '') {
      return '—';
    }

    const type = columnTypes[column] || 'string';
    
    if (type === 'date') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
      } catch (e) {}
    }
    
    return String(value);
  };

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-lg font-medium">No records imported</p>
        <p className="text-sm text-gray-400">Upload a CSV file to see results here</p>
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
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{data.length} records</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search records..."
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
            {sortedData.length} records
          </span>
          {filteredData.length !== data.length && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Filtered: {filteredData.length}
            </span>
          )}
          {skippedRows.length > 0 && (
            <button
              onClick={() => setShowSkipped(!showSkipped)}
              className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1
                ${showSkipped ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <AlertCircle className="w-3 h-3" />
              Skipped: {skippedRows.length}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search records..."
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
          <button
            onClick={handleExport}
            disabled={sortedData.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors
              ${sortedData.length > 0 
                ? 'text-blue-600 hover:bg-blue-50 border border-blue-200' 
                : 'text-gray-400 cursor-not-allowed'}`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
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
              {allColumns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(column)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group min-w-[80px]"
                  title={`Click to sort by ${column}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">
                      {getColumnIcon(column)}
                    </span>
                    <span className="truncate max-w-[100px]">{formatColumnName(column)}</span>
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
            {(showSkipped ? skippedRows : paginatedData).map((item, rowIndex) => {
              const row = showSkipped ? item.row : item;
              const skipReason = showSkipped ? (item as any).reason : null;
              const globalIndex = showSkipped ? rowIndex + 1 : startIndex + rowIndex + 1;
              
              return (
                <tr 
                  key={`row-${globalIndex}`} 
                  className={`hover:bg-blue-50/30 transition-colors duration-150 group
                    ${skipReason ? 'bg-red-50/30 hover:bg-red-50/50' : ''}`}
                >
                  <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                    {globalIndex}
                  </td>
                  {allColumns.map((column, colIndex) => {
                    const value = row[column];
                    const displayValue = formatDisplayValue(value, column);
                    const isStatus = columnTypes[column] === 'status';
                    const isEmail = columnTypes[column] === 'email' && displayValue !== '—';
                    
                    if (isStatus && value) {
                      return (
                        <td key={`${globalIndex}-${colIndex}`} className="px-4 py-2.5 text-sm whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(value)}`}>
                            {value}
                          </span>
                        </td>
                      );
                    }

                    if (isEmail && displayValue !== '—') {
                      return (
                        <td key={`${globalIndex}-${colIndex}`} className="px-4 py-2.5 text-sm whitespace-nowrap">
                          <a href={`mailto:${displayValue}`} className="hover:underline text-blue-600">
                            {displayValue}
                          </a>
                        </td>
                      );
                    }

                    // Show skip reason badge in first cell of skipped row
                    if (skipReason && colIndex === 0) {
                      return (
                        <td key={`${globalIndex}-${colIndex}`} className="px-4 py-2.5 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {skipReason}
                          </span>
                        </td>
                      );
                    }
                    
                    return (
                      <td
                        key={`${globalIndex}-${colIndex}`}
                        className={`px-4 py-2.5 text-sm whitespace-nowrap max-w-[200px] truncate
                          ${displayValue !== '—' ? 'text-gray-800' : 'text-gray-400 italic'}`}
                        title={displayValue !== '—' ? displayValue : 'Empty'}
                      >
                        {displayValue}
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
          {showSkipped ? (
            `Showing ${skippedRows.length} skipped records`
          ) : (
            `Showing ${paginatedData.length > 0 ? startIndex + 1 : 0} to ${
              Math.min(startIndex + rowsPerPage, sortedData.length)
            } of ${sortedData.length} records`
          )}
        </div>
        {!showSkipped && (
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
        )}
      </div>
    </div>
  );
}