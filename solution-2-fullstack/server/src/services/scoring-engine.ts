export type SignalState = 'absent' | 'inferred' | 'present';
export type CategoryKey = 'need' | 'timing' | 'behavior';
export type Strength = 'strong' | 'confirmed' | 'moderate' | 'weak' | 'none';
export type IntentLevel = 'high' | 'medium-high' | 'medium' | 'low';

export interface ScoringResult {
  categories: Record<CategoryKey, { score: number; strength: Strength; pct: number }>;
  intent: IntentLevel;
  totalScore: number;
  confidence: number;
}

const SIGNAL_IDS: Record<CategoryKey, string[]> = {
  need: ['virtual_biotech', 'complex_modality', 'pipeline_depth', 'geographic_expansion', 'platform_technology', 'post_acquisition'],
  timing: ['phase1_transition', 'cmc_work', 'supply_timelines', 'regulatory_presub', 'contract_renewal', 'recent_funding'],
  behavior: ['tech_transfer_roles', 'cmc_leadership_hired', 'conference_attendance', 'competitor_cdmo_deal', 'linkedin_activity', 'earnings_mfg_mention'],
};

function getStrength(score: number): Strength {
  if (score >= 3) return 'strong';
  if (score >= 1.5) return 'confirmed';
  if (score >= 0.5) return 'moderate';
  if (score > 0) return 'weak';
  return 'none';
}

export function triangulate(signals: Record<string, SignalState>): ScoringResult {
  const cats: CategoryKey[] = ['need', 'timing', 'behavior'];
  const categories = {} as ScoringResult['categories'];

  for (const cat of cats) {
    const score = SIGNAL_IDS[cat].reduce((sum, id) => {
      const st = signals[id] || 'absent';
      if (st === 'present') return sum + 1;
      if (st === 'inferred') return sum + 0.5;
      return sum;
    }, 0);
    categories[cat] = { score, strength: getStrength(score), pct: Math.round((score / 6) * 100) };
  }

  const strengths = cats.map(c => categories[c].strength);
  const confirmedPlus = strengths.filter(s => s === 'strong' || s === 'confirmed').length;
  const moderatePlus = strengths.filter(s => s !== 'none' && s !== 'weak').length;
  const anyEvidence = strengths.filter(s => s !== 'none').length;

  let intent: IntentLevel;
  if (confirmedPlus === 3) intent = 'high';
  else if (confirmedPlus >= 2 && anyEvidence === 3) intent = 'high';
  else if (confirmedPlus >= 2) intent = 'medium-high';
  else if (confirmedPlus >= 1 && moderatePlus >= 2) intent = 'medium-high';
  else if (confirmedPlus >= 1 || moderatePlus >= 2) intent = 'medium';
  else if (anyEvidence >= 1) intent = 'medium';
  else intent = 'low';

  const totalScore = cats.reduce((s, c) => s + categories[c].score, 0);
  const assessed = Object.values(signals).filter(v => v !== 'absent').length;
  const confidence = Math.round((assessed / 18) * 100);

  return { categories, intent, totalScore, confidence };
}

export const ALL_SIGNAL_IDS = Object.values(SIGNAL_IDS).flat();
