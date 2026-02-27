import type { SignalStates, CategoryKey, Strength, ScoringResult, IntentLevel } from './types';
import { SIGNALS } from './signals';

function calcCategoryScore(category: CategoryKey, states: SignalStates): number {
  return SIGNALS[category].reduce((sum, sig) => {
    const st = states[sig.id];
    if (st === 'present') return sum + 1;
    if (st === 'inferred') return sum + 0.5;
    return sum;
  }, 0);
}

function getStrength(score: number): Strength {
  if (score >= 3) return 'strong';
  if (score >= 1.5) return 'confirmed';
  if (score >= 0.5) return 'moderate';
  if (score > 0) return 'weak';
  return 'none';
}

export function triangulate(states: SignalStates): ScoringResult {
  const cats: CategoryKey[] = ['need', 'timing', 'behavior'];

  const categories = {} as ScoringResult['categories'];
  for (const cat of cats) {
    const score = calcCategoryScore(cat, states);
    categories[cat] = {
      score,
      strength: getStrength(score),
      pct: Math.round((score / 6) * 100),
    };
  }

  const strengths = cats.map(c => categories[c].strength);
  const confirmedPlus = strengths.filter(s => s === 'strong' || s === 'confirmed').length;
  const moderatePlus  = strengths.filter(s => s !== 'none' && s !== 'weak').length;
  const anyEvidence   = strengths.filter(s => s !== 'none').length;

  let intent: IntentLevel;
  if (confirmedPlus === 3) intent = 'high';
  else if (confirmedPlus >= 2 && anyEvidence === 3) intent = 'high';
  else if (confirmedPlus >= 2) intent = 'medium-high';
  else if (confirmedPlus >= 1 && moderatePlus >= 2) intent = 'medium-high';
  else if (confirmedPlus >= 1 || moderatePlus >= 2) intent = 'medium';
  else if (anyEvidence >= 1) intent = 'medium';
  else intent = 'low';

  const total = cats.reduce((s, c) => s + categories[c].score, 0);
  const assessed = Object.values(states).filter(v => v !== 'absent').length;
  const confidence = Math.round((assessed / 18) * 100);

  return { categories, intent, total, confidence };
}

export function createEmptyStates(): SignalStates {
  const states: SignalStates = {};
  for (const cat of Object.values(SIGNALS)) {
    for (const sig of cat) {
      states[sig.id] = 'absent';
    }
  }
  return states;
}

export const INTENT_CONFIG: Record<IntentLevel, { label: string; bg: string; border: string; text: string }> = {
  'high':        { label: 'High',     bg: 'bg-green-50',  border: 'border-green-500', text: 'text-green-600' },
  'medium-high': { label: 'Med-High', bg: 'bg-teal-50',   border: 'border-teal-500',  text: 'text-teal-600' },
  'medium':      { label: 'Medium',   bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600' },
  'low':         { label: 'Low',      bg: 'bg-gray-50',   border: 'border-gray-400',  text: 'text-gray-500' },
};

export const STRENGTH_CONFIG: Record<Strength, { bg: string; text: string }> = {
  strong:    { bg: 'bg-green-100',  text: 'text-green-800' },
  confirmed: { bg: 'bg-blue-100',   text: 'text-blue-800' },
  moderate:  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  weak:      { bg: 'bg-red-100',    text: 'text-red-800' },
  none:      { bg: 'bg-gray-100',   text: 'text-gray-500' },
};
