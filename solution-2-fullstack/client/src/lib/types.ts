export type SignalState = 'absent' | 'inferred' | 'present';

export type CategoryKey = 'need' | 'timing' | 'behavior';

export type IntentLevel = 'high' | 'medium-high' | 'medium' | 'low';

export type Strength = 'strong' | 'confirmed' | 'moderate' | 'weak' | 'none';

export interface SignalDef {
  id: string;
  num: number;
  name: string;
  desc: string;
  sources: string;
  category: CategoryKey;
}

export interface SignalStates {
  [signalId: string]: SignalState;
}

export interface CategoryScore {
  score: number;
  strength: Strength;
  pct: number;
}

export interface ScoringResult {
  categories: Record<CategoryKey, CategoryScore>;
  intent: IntentLevel;
  total: number;
  confidence: number;
}

export interface SavedCompany {
  id: string;
  name: string;
  signals: SignalStates;
  scoring: ScoringResult;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleScenario {
  title: string;
  description: string;
  result: IntentLevel;
  company: string;
  signals: Partial<Record<string, SignalState>>;
}
