import { useRef, useState } from 'react';
import type { AnalysisResult } from '../hooks/useSignals';

interface Props {
  companyName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onReset: () => void;
  onImportJSON: (file: File) => void;
  onExportJSON: () => void;
  isSaved: boolean;
  onAnalyze: (websiteUrl?: string) => void;
  analyzing: boolean;
  analysisError: string | null;
  analysisResult: AnalysisResult | null;
}

export function CompanyInput({ companyName, onNameChange, onSave, onReset, onImportJSON, onExportJSON, isSaved, onAnalyze, analyzing, analysisError, analysisResult }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = () => {
    // Auto-derive company name from URL if not provided
    if (!companyName.trim() && websiteUrl.trim()) {
      try {
        const hostname = new URL(websiteUrl.trim()).hostname;
        const derived = hostname.replace(/^www\./, '').split('.')[0];
        const capitalized = derived.charAt(0).toUpperCase() + derived.slice(1);
        onNameChange(capitalized);
      } catch {
        // URL parsing failed, let the server handle it
      }
    }
    onAnalyze(websiteUrl || undefined);
    setShowAnalysis(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex-wrap">
        <input
          type="text"
          value={companyName}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Enter company name (e.g., Acme Therapeutics)"
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-400 transition-colors"
        />
        <button
          onClick={onSave}
          disabled={!companyName.trim()}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaved ? 'Update' : 'Save'}
        </button>
        <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
          Import JSON
        </button>
        <button onClick={onExportJSON} className="px-3 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
          Export JSON
        </button>
        <button onClick={onReset} className="px-3 py-2 border border-gray-200 rounded-md text-sm text-red-500 font-medium hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer">
          Reset
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onImportJSON(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Website Analysis Section */}
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl px-4 py-3 shadow-sm flex-wrap">
        <div className="flex items-center gap-1.5 text-purple-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-semibold whitespace-nowrap">AI Analysis</span>
        </div>
        <input
          type="text"
          value={websiteUrl}
          onChange={e => setWebsiteUrl(e.target.value)}
          placeholder="Company website URL (optional — AI will search if blank)"
          className="flex-1 min-w-[250px] px-3 py-2 border border-purple-200 rounded-md text-sm outline-none focus:border-purple-400 transition-colors bg-white"
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || (!companyName.trim() && !websiteUrl.trim())}
          className="px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-md hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze Website'
          )}
        </button>
      </div>

      {/* Analysis Error */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <strong>Analysis failed:</strong> {analysisError}
        </div>
      )}

      {/* Analysis Result Summary */}
      {showAnalysis && analysisResult && !analyzing && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-700 font-semibold text-sm">AI Analysis Complete</span>
                {analysisResult.websiteUrl && (
                  <a href={analysisResult.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {analysisResult.websiteUrl}
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-700">{analysisResult.summary}</p>
              {Object.keys(analysisResult.reasoning).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-purple-600 cursor-pointer font-medium">View signal reasoning</summary>
                  <ul className="mt-1 space-y-1">
                    {Object.entries(analysisResult.reasoning).map(([signalId, reason]) => (
                      <li key={signalId} className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">{signalId}:</span> {reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <button onClick={() => setShowAnalysis(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
