'use client';

import { useRef } from 'react';

interface DataPreviewProps {
  data: any[];
  columns: string[];
}

export default function DataPreview({ data, columns }: DataPreviewProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to preview
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div 
        ref={tableRef}
        className="overflow-x-auto overflow-y-auto max-h-[500px]"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {row[column] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
        Showing {data.length} rows
      </div>
    </div>
  );
}