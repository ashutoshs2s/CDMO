import type { ScoringResult } from '../lib/types';
import { INTENT_CONFIG } from '../lib/scoring';

interface Props {
  scoring: ScoringResult;
}

export function IntentBadge({ scoring }: Props) {
  const cfg = INTENT_CONFIG[scoring.intent];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center">
      <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">Triangulated Intent</h3>
      <div className={`w-28 h-28 rounded-full border-4 ${cfg.border} ${cfg.bg} flex flex-col items-center justify-center transition-all duration-500`}>
        <span className={`text-lg font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
        <span className={`text-[10px] uppercase tracking-wide ${cfg.text} opacity-80`}>Intent</span>
      </div>
      <span className="text-sm text-gray-500 mt-2">{scoring.total} / 18 total score</span>
      <span className="text-xs text-gray-400">{scoring.confidence}% signals assessed</span>
    </div>
  );
}
