import type { SignalDef, SignalState } from '../lib/types';

interface Props {
  signal: SignalDef;
  state: SignalState;
  onChange: (id: string, state: SignalState) => void;
}

const TOGGLE_OPTS: { value: SignalState; label: string; activeClass: string }[] = [
  { value: 'absent',   label: 'Absent',   activeClass: 'bg-gray-100 text-gray-700' },
  { value: 'inferred', label: 'Inferred', activeClass: 'bg-yellow-100 text-yellow-800' },
  { value: 'present',  label: 'Present',  activeClass: 'bg-green-100 text-green-800' },
];

export function SignalCard({ signal, state, onChange }: Props) {
  const borderClass = state === 'present' ? 'border-l-green-400'
    : state === 'inferred' ? 'border-l-yellow-400'
    : 'border-l-transparent';

  return (
    <div className={`bg-white border border-gray-200 border-l-[3px] ${borderClass} rounded-lg p-3.5 shadow-sm transition-colors`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-gray-400 mt-0.5 shrink-0">#{signal.num}</span>
          <span className="text-sm font-semibold text-gray-800 leading-tight">{signal.name}</span>
        </div>
        <div className="flex border border-gray-200 rounded-md overflow-hidden shrink-0">
          {TOGGLE_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(signal.id, opt.value)}
              className={`px-2.5 py-1 text-[11px] font-medium border-r border-gray-200 last:border-r-0 transition-colors cursor-pointer ${
                state === opt.value ? opt.activeClass : 'bg-white text-gray-400 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 pl-5 mb-1">{signal.desc}</p>
      <p className="text-[11px] text-gray-300 pl-5" title="AI sourcing methods">AI: {signal.sources}</p>
    </div>
  );
}
