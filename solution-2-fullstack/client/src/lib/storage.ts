import type { SavedCompany, SignalStates } from './types';
import { triangulate } from './scoring';

const STORAGE_KEY = 'cdmo-companies';

export function loadCompanies(): SavedCompany[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(companies: SavedCompany[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

export function saveCompany(name: string, signals: SignalStates): SavedCompany {
  const companies = loadCompanies();
  const now = new Date().toISOString();
  const scoring = triangulate(signals);
  const company: SavedCompany = {
    id: crypto.randomUUID(),
    name,
    signals: { ...signals },
    scoring,
    createdAt: now,
    updatedAt: now,
  };
  companies.unshift(company);
  persist(companies);
  return company;
}

export function updateCompany(id: string, name: string, signals: SignalStates): SavedCompany | null {
  const companies = loadCompanies();
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) return null;
  companies[idx] = {
    ...companies[idx],
    name,
    signals: { ...signals },
    scoring: triangulate(signals),
    updatedAt: new Date().toISOString(),
  };
  persist(companies);
  return companies[idx];
}

export function deleteCompany(id: string) {
  const companies = loadCompanies().filter(c => c.id !== id);
  persist(companies);
}

export function exportCompaniesJSON(companies: SavedCompany[]): string {
  return JSON.stringify(companies, null, 2);
}

export function importCompaniesJSON(json: string): SavedCompany[] {
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('Expected array');
  return data;
}
