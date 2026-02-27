import type { CategoryScore } from '../lib/types';
import { STRENGTH_CONFIG } from '../lib/scoring';

interface Props {
  label: string;
  categoryScore: CategoryScore;
  color: string;
}

export function ScoreGauge({ label, categoryScore, color }: Props) {
  const { score, strength, pct } = categoryScore;
  const circumference = 2 * Math.PI * 15.9;
  const dashLen = (pct / 100) * circumference;
  const strCfg = STRENGTH_CONFIG[strength];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">{label}</h3>
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${dashLen} ${circumference}`}
            transform="rotate(-90 18 18)"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <span className="text-sm text-gray-500 block">{score} / 6 signals</span>
      <span className={`inline-block mt-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${strCfg.bg} ${strCfg.text}`}>
        {strength}
      </span>
    </div>
  );
}
