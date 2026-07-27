'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, AlertCircle, Mail, Phone, AlertTriangle } from 'lucide-react';

interface SkippedRow {
  row: Record<string, any>;
  reason: string;
}

interface SkippedRowsTableProps {
  data: SkippedRow[];
}

export default function SkippedRowsTable({ data }: SkippedRowsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <span className="text-4xl block mb-3">✅</span>
        <p className="text-lg font-medium">No skipped records</p>
        <p className="text-sm text-gray-400">Every row was imported successfully</p>
      </div>
    );
  }

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const searchLower = searchTerm.toLowerCase();
    return data.filter(item =>
      item.reason.toLowerCase().includes(searchLower) ||
      Object.values(item.row).some(value =>
        String(value).toLowerCase().includes(searchLower)
      )
    );
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const getSkipReasonIcon = (reason: string) => {
    const lower = reason.toLowerCase();
    if (lower.includes('email')) {
      return <Mail className="w-4 h-4 text-red-500" />;
    } else if (lower.includes('phone') || lower.includes('mobile')) {
      return <Phone className="w-4 h-4 text-orange-500" />;
    } else if (lower.includes('duplicate')) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSkipReasonColor = (reason: string): string => {
    const lower = reason.toLowerCase();
    if (lower.includes('email')) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else if (lower.includes('phone') || lower.includes('mobile')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (lower.includes('duplicate')) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            ⚠️ Skipped Records
          </span>
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
            {data.length} skipped
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search skipped records..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none w-40 sm:w-56 transition-all"
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
      <div className="overflow-x-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[200px]">
                Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[300px]">
                Row Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedData.map((item, index) => {
              const globalIndex = startIndex + index + 1;
              return (
                <tr key={globalIndex} className="hover:bg-red-50/30 transition-colors duration-150">
                  <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                    {globalIndex}
                  </td>
                  <td className="px-4 py-2.5 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getSkipReasonIcon(item.reason)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSkipReasonColor(item.reason)}`}>
                        {item.reason}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1 max-w-[500px]">
                      {Object.entries(item.row).slice(0, 4).map(([key, value]) => (
                        <span key={key} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 truncate max-w-[150px]">
                          {key}: {String(value) || '—'}
                        </span>
                      ))}
                      {Object.keys(item.row).length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{Object.keys(item.row).length - 4} more
                        </span>
                      )}
                    </div>
                  </td>
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
          {filteredData.length} skipped records
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}