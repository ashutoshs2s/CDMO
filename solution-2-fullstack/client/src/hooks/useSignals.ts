import { useState, useCallback } from 'react';
import type { SignalState, SignalStates, SavedCompany, ExampleScenario } from '../lib/types';
import { createEmptyStates, triangulate } from '../lib/scoring';
import { loadCompanies, saveCompany, updateCompany, deleteCompany } from '../lib/storage';

function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // In production, call the API server directly (static site rewrites don't reliably proxy POST)
  if (import.meta.env.PROD) return 'https://cdmo-api.onrender.com';
  return '';
}
const API_BASE = getApiBase();

export interface AnalysisResult {
  companyName: string;
  signals: Record<string, SignalState>;
  reasoning: Record<string, string>;
  summary: string;
  websiteUrl: string;
}

export function useSignals() {
  const [companyName, setCompanyName] = useState('');
  const [signals, setSignals] = useState<SignalStates>(createEmptyStates);
  const [companies, setCompanies] = useState<SavedCompany[]>(loadCompanies);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const scoring = triangulate(signals);

  const setSignal = useCallback((id: string, state: SignalState) => {
    setSignals(prev => ({ ...prev, [id]: state }));
  }, []);

  const reset = useCallback(() => {
    setSignals(createEmptyStates());
    setCompanyName('');
    setSelectedId(null);
  }, []);

  const save = useCallback(() => {
    if (!companyName.trim()) return;
    if (selectedId) {
      const updated = updateCompany(selectedId, companyName, signals);
      if (updated) setCompanies(loadCompanies());
    } else {
      const saved = saveCompany(companyName, signals);
      setSelectedId(saved.id);
      setCompanies(loadCompanies());
    }
  }, [companyName, signals, selectedId]);

  const selectCompany = useCallback((co: SavedCompany) => {
    setSelectedId(co.id);
    setCompanyName(co.name);
    setSignals({ ...co.signals });
  }, []);

  const removeCompany = useCallback((id: string) => {
    deleteCompany(id);
    setCompanies(loadCompanies());
    if (selectedId === id) {
      setSelectedId(null);
      setCompanyName('');
      setSignals(createEmptyStates());
    }
    setCompareIds(prev => prev.filter(cid => cid !== id));
  }, [selectedId]);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }, []);

  const loadExample = useCallback((ex: ExampleScenario) => {
    const fresh = createEmptyStates();
    for (const [id, val] of Object.entries(ex.signals)) {
      if (id in fresh) fresh[id] = val!;
    }
    setSignals(fresh);
    setCompanyName(ex.company);
    setSelectedId(null);
  }, []);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.signals) {
          const fresh = createEmptyStates();
          for (const [id, val] of Object.entries(data.signals as Record<string, string>)) {
            if (id in fresh && ['absent', 'inferred', 'present'].includes(val)) {
              fresh[id] = val as SignalState;
            }
          }
          setSignals(fresh);
        }
        if (data.company) setCompanyName(data.company);
        setSelectedId(null);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }, []);

  const exportJSON = useCallback(() => {
    const data = {
      company: companyName || 'Unnamed',
      signals,
      scores: scoring.categories,
      intent: scoring.intent,
      totalScore: scoring.total,
      confidence: scoring.confidence,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdmo-signals-${(companyName || 'unnamed').replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [companyName, signals, scoring]);

  const batchImport = useCallback((imported: SavedCompany[]) => {
    const existing = loadCompanies();
    const all = [...imported, ...existing];
    localStorage.setItem('cdmo-companies', JSON.stringify(all));
    setCompanies(all);
  }, []);

  const analyzeWebsite = useCallback(async (websiteUrl?: string) => {
    if (!companyName.trim() && !websiteUrl?.trim()) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/companies/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), websiteUrl: websiteUrl?.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result: AnalysisResult = await res.json();

      // Apply detected signals
      const fresh = createEmptyStates();
      for (const [id, val] of Object.entries(result.signals)) {
        if (id in fresh && (val === 'present' || val === 'inferred')) {
          fresh[id] = val;
        }
      }
      setSignals(fresh);
      if (result.companyName) setCompanyName(result.companyName);
      setSelectedId(null);
      setAnalysisResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(message);
    } finally {
      setAnalyzing(false);
    }
  }, [companyName]);

  return {
    companyName, setCompanyName,
    signals, setSignal, scoring,
    companies, selectedId,
    compareIds, toggleCompare,
    save, reset, selectCompany, removeCompany,
    loadExample, importJSON, exportJSON, batchImport,
    analyzeWebsite, analyzing, analysisError, analysisResult,
  };
}
