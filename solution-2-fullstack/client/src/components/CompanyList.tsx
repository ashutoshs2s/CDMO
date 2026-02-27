import type { SavedCompany, IntentLevel } from '../lib/types';
import { INTENT_CONFIG } from '../lib/scoring';

interface Props {
  companies: SavedCompany[];
  selectedId: string | null;
  compareIds: string[];
  onSelect: (company: SavedCompany) => void;
  onDelete: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

const DOT_COLOR: Record<IntentLevel, string> = {
  'high': 'bg-green-500',
  'medium-high': 'bg-teal-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-gray-400',
};

export function CompanyList({ companies, selectedId, compareIds, onSelect, onDelete, onToggleCompare }: Props) {
  if (companies.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center text-gray-400 text-sm">
        No saved companies yet. Score a company and click Save to add it here.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Saved Companies ({companies.length})</h3>
        {compareIds.length > 0 && (
          <span className="text-xs text-teal-600 font-medium">{compareIds.length} selected for comparison</span>
        )}
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {companies.map(co => {
          const cfg = INTENT_CONFIG[co.scoring.intent];
          const isSelected = co.id === selectedId;
          const inCompare = compareIds.includes(co.id);
          return (
            <div
              key={co.id}
              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelect(co)}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[co.scoring.intent]}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{co.name}</div>
                <div className="text-xs text-gray-400">
                  {cfg.label} Intent &middot; {co.scoring.total}/18 &middot; {new Date(co.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onToggleCompare(co.id); }}
                className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                  inCompare ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {inCompare ? 'In Compare' : 'Compare'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(co.id); }}
                className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none cursor-pointer"
                title="Delete"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
