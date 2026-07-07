'use client';

import { useRef } from 'react';

interface ResultsTableProps {
  data: any[];
}

export default function ResultsTable({ data }: ResultsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No records imported
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-hidden">
      <div 
        ref={tableRef}
        className="overflow-x-auto overflow-y-auto max-h-[600px]"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                >
                  {column.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => {
                  const value = row[column];
                  let displayValue = value;
                  
                  // Format special fields
                  if (column === 'crm_status' && value) {
                    const statusColors: Record<string, string> = {
                      'GOOD_LEAD_FOLLOW_UP': 'bg-green-100 text-green-800',
                      'DID_NOT_CONNECT': 'bg-yellow-100 text-yellow-800',
                      'BAD_LEAD': 'bg-red-100 text-red-800',
                      'SALE_DONE': 'bg-blue-100 text-blue-800'
                    };
                    return (
                      <td key={colIndex} className="px-4 py-2 text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[value] || 'bg-gray-100'}`}>
                          {value}
                        </span>
                      </td>
                    );
                  }
                  
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap max-w-[200px] truncate"
                      title={value}
                    >
                      {value || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
        Showing {data.length} records
      </div>
    </div>
  );
}