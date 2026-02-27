import type { ExampleScenario, IntentLevel } from '../lib/types';
import { EXAMPLES } from '../lib/signals';

interface Props {
  onLoad: (example: ExampleScenario) => void;
}

const INTENT_COLORS: Record<IntentLevel, string> = {
  'high': 'text-green-600',
  'medium-high': 'text-teal-600',
  'medium': 'text-yellow-600',
  'low': 'text-gray-500',
};

export function ExampleScenarios({ onLoad }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-base font-semibold text-blue-900 mb-3">Example Scenarios</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EXAMPLES.map((ex, i) => {
          const label = ex.result === 'medium-high' ? 'Medium-High Intent'
            : ex.result.charAt(0).toUpperCase() + ex.result.slice(1) + ' Intent';
          return (
            <div
              key={i}
              onClick={() => onLoad(ex)}
              className="border border-gray-200 rounded-lg p-3.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <div className="text-sm font-semibold text-gray-800 mb-1">{ex.title}</div>
              <div className="text-xs text-gray-500 mb-1.5">{ex.description}</div>
              <div className={`text-xs font-semibold ${INTENT_COLORS[ex.result]}`}>&rarr; {label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
