import type { CategoryKey, SignalState, SignalStates } from '../lib/types';
import { SIGNALS, CATEGORY_META } from '../lib/signals';
import { SignalCard } from './SignalCard';

interface Props {
  category: CategoryKey;
  states: SignalStates;
  onChange: (id: string, state: SignalState) => void;
}

const TITLE_COLOR: Record<CategoryKey, string> = {
  need: 'text-blue-600',
  timing: 'text-yellow-600',
  behavior: 'text-purple-600',
};

export function SignalColumn({ category, states, onChange }: Props) {
  const meta = CATEGORY_META[category];
  const signals = SIGNALS[category];

  return (
    <div>
      <h2 className={`text-base font-semibold mb-0.5 ${TITLE_COLOR[category]}`}>{meta.label}</h2>
      <p className="text-sm text-gray-500 mb-3">{meta.subtitle}</p>
      <div className="space-y-2.5">
        {signals.map(sig => (
          <SignalCard key={sig.id} signal={sig} state={states[sig.id]} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
