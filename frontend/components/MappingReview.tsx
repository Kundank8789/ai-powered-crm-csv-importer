'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Check,
  RefreshCw,
  X,
  Info
} from 'lucide-react';

interface MappingSuggestion {
  csvColumn: string;
  suggestedField: string | null;
  confidence: number;
  sampleValues: string[];
}

interface MappingReviewProps {
  csvColumns: string[];
  suggestions: MappingSuggestion[];
  onBack: () => void;
  onConfirm: (mappings: Record<string, string>) => void;
  isProcessing?: boolean;
}

const CRM_FIELDS = [
  'name', 'email', 'country_code', 'mobile_without_country_code',
  'company', 'city', 'state', 'country', 'lead_owner',
  'crm_status', 'crm_note', 'data_source', 'possession_time', 'description'
];

export default function MappingReview({
  csvColumns = [],
  suggestions = [],
  onBack,
  onConfirm,
  isProcessing = false
}: MappingReviewProps) {
  const safeSuggestions = suggestions || [];
  
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    safeSuggestions.forEach(s => {
      if (s.suggestedField) {
        initial[s.csvColumn] = s.suggestedField;
      }
    });
    return initial;
  });

  const acceptAllSuggestions = () => {
    const allMapped: Record<string, string> = {};
    safeSuggestions.forEach(s => {
      if (s.suggestedField) {
        allMapped[s.csvColumn] = s.suggestedField;
      }
    });
    setMappings(allMapped);
  };

  const resetAllMappings = () => {
    setMappings({});
  };

  if (safeSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading mapping suggestions...</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 text-blue-600 hover:text-blue-800"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const getConfidenceBadge = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'High';
    if (confidence >= 50) return 'Medium';
    return 'Low';
  };

  const hasInconsistentData = (suggestion: MappingSuggestion): boolean => {
    const values = suggestion.sampleValues.filter(v => v && v !== '');
    if (values.length < 2) return false;
    const hasPlus = values.some(v => v.includes('+'));
    const hasNoPlus = values.some(v => v.match(/^\d{10,}$/));
    return hasPlus && hasNoPlus;
  };

  const getWarningMessage = (suggestion: MappingSuggestion): string => {
    const values = suggestion.sampleValues.filter(v => v && v !== '');
    const hasPlus = values.some(v => v.includes('+'));
    const hasNoPlus = values.some(v => v.match(/^\d{10,}$/));
    
    if (hasPlus && hasNoPlus) {
      return '⚠️ Inconsistent format: some values include country code (+91), others don\'t. We\'ll normalize by stripping non-numeric characters.';
    }
    return '';
  };

  const handleFieldChange = (csvColumn: string, field: string) => {
    setMappings(prev => ({ ...prev, [csvColumn]: field }));
  };

  const mappedCount = Object.keys(mappings).filter(key => mappings[key] && mappings[key] !== '').length;
  const totalColumns = csvColumns.length;
  const isComplete = mappedCount === totalColumns;

  const formatFieldName = (field: string): string => {
    return field.replace(/_/g, ' ');
  };

  const hasSuggestions = safeSuggestions.some(s => s.suggestedField);
  const allAccepted = safeSuggestions.every(s => {
    if (!s.suggestedField) return true;
    return mappings[s.csvColumn] === s.suggestedField;
  });

  const hasPhoneWarnings = safeSuggestions.some(s => 
    s.csvColumn.toLowerCase().includes('phone') && hasInconsistentData(s)
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            🤖 Review AI Mapping
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI has analyzed your CSV columns and suggested CRM field mappings.
            Review and adjust before importing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{mappedCount}/{totalColumns} mapped</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isComplete ? '✅ Complete' : '⚠️ Incomplete'}
          </span>
        </div>
      </div>

      {/* Phone format warning banner */}
      {hasPhoneWarnings && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Phone number formatting:</span>
            <span className="ml-1">We detected mixed formats (with/without country code).</span>
            <span className="block text-xs text-yellow-700 mt-1">
              📱 Numbers will be normalized: country codes extracted to "country_code", rest to "mobile_without_country_code".
            </span>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {hasSuggestions && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⚡ Bulk Actions:</span>
            <button
              onClick={acceptAllSuggestions}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All Suggestions
            </button>
            <button
              onClick={resetAllMappings}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {allAccepted ? '✅ All suggestions accepted' : `${safeSuggestions.filter(s => s.suggestedField && mappings[s.csvColumn] === s.suggestedField).length} of ${safeSuggestions.filter(s => s.suggestedField).length} suggestions accepted`}
          </div>
        </div>
      )}

      {/* Mapping Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                CSV Column
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                CRM Field
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                Confidence
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Sample Values
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safeSuggestions.map((suggestion) => {
              const currentField = mappings[suggestion.csvColumn] || '';
              const isMapped = Boolean(currentField);
              const isSuggested = suggestion.suggestedField && currentField === suggestion.suggestedField;
              const hasIssue = hasInconsistentData(suggestion);
              const warningMsg = getWarningMessage(suggestion);
              
              return (
                <tr key={suggestion.csvColumn} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {suggestion.csvColumn}
                    {hasIssue && (
                      <span 
                        className="ml-2 text-xs text-yellow-600 cursor-help"
                        title={warningMsg}
                      >
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={currentField}
                        onChange={(e) => handleFieldChange(suggestion.csvColumn, e.target.value)}
                        className={`px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-w-[200px] w-full max-w-[280px]
                          ${isMapped ? 'border-gray-300 bg-white text-gray-800' : 'border-red-300 bg-red-50 text-gray-800'}`}
                      >
                        <option value="">— Select CRM Field —</option>
                        {CRM_FIELDS.map((field) => (
                          <option key={field} value={field}>
                            {formatFieldName(field)}
                          </option>
                        ))}
                      </select>
                      {isSuggested && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          ✓ Accepted
                        </span>
                      )}
                      {suggestion.suggestedField && !isSuggested && isMapped && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          Custom
                        </span>
                      )}
                      {suggestion.suggestedField && !isMapped && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          Suggested
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {suggestion.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(suggestion.confidence)}`}>
                          {suggestion.confidence}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {getConfidenceLabel(suggestion.confidence)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {suggestion.sampleValues.slice(0, 3).map((value, i) => (
                        <span 
                          key={i} 
                          className={`text-xs px-2 py-0.5 rounded truncate max-w-[150px]
                            ${hasIssue && value && (value.includes('+') || value.match(/^\d{10,}$/)) 
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                              : 'bg-gray-100 text-gray-600'}`}
                          title={hasIssue && value ? warningMsg : ''}
                        >
                          {value || '—'}
                        </span>
                      ))}
                      {suggestion.sampleValues.length > 3 && (
                        <span className="text-xs text-gray-400">+{suggestion.sampleValues.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          💡 {isComplete 
            ? 'All columns mapped. Ready to import!' 
            : `${totalColumns - mappedCount} column${totalColumns - mappedCount > 1 ? 's' : ''} still need mapping`}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => onConfirm(mappings)}
            disabled={!isComplete || isProcessing}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
              ${isComplete && !isProcessing
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isProcessing ? (
              <>⏳ Processing...</>
            ) : (
              <>Confirm & Import <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}