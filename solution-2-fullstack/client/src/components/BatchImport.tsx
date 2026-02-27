import { useRef, useState } from 'react';
import type { SignalStates, SavedCompany } from '../lib/types';
import { ALL_SIGNALS } from '../lib/signals';
import { createEmptyStates, triangulate } from '../lib/scoring';

interface Props {
  onImport: (companies: SavedCompany[]) => void;
}

export function BatchImport({ onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; count: number }[] | null>(null);
  const [parsed, setParsed] = useState<SavedCompany[]>([]);

  function parseCSV(text: string): SavedCompany[] {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const companyIdx = headers.findIndex(h => h === 'company' || h === 'name' || h === 'company_name');
    if (companyIdx === -1) throw new Error('CSV must have a "Company" or "Name" column');

    const signalMap: Record<number, string> = {};
    for (let i = 0; i < headers.length; i++) {
      if (i === companyIdx) continue;
      const sig = ALL_SIGNALS.find(s =>
        s.id === headers[i] ||
        s.name.toLowerCase() === headers[i] ||
        headers[i] === `signal_${s.num}` ||
        headers[i] === `signal${s.num}` ||
        headers[i] === `s${s.num}`
      );
      if (sig) signalMap[i] = sig.id;
    }

    const companies: SavedCompany[] = [];
    for (let row = 1; row < lines.length; row++) {
      const cols = lines[row].split(',').map(c => c.trim());
      const name = cols[companyIdx];
      if (!name) continue;

      const signals: SignalStates = createEmptyStates();
      for (const [idxStr, sigId] of Object.entries(signalMap)) {
        const val = (cols[Number(idxStr)] || '').toLowerCase();
        if (val === 'present' || val === 'p' || val === '1' || val === 'yes' || val === 'true') {
          signals[sigId] = 'present';
        } else if (val === 'inferred' || val === 'i' || val === '0.5' || val === 'maybe') {
          signals[sigId] = 'inferred';
        }
      }

      const now = new Date().toISOString();
      companies.push({
        id: crypto.randomUUID(),
        name,
        signals,
        scoring: triangulate(signals),
        createdAt: now,
        updatedAt: now,
      });
    }
    return companies;
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const results = parseCSV(text);
        setParsed(results);
        setPreview(results.map(r => ({
          name: r.name,
          count: Object.values(r.signals).filter(s => s !== 'absent').length,
        })));
      } catch (err) {
        alert(`CSV parse error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    onImport(parsed);
    setPreview(null);
    setParsed([]);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Batch Import (CSV)</h3>
      <p className="text-xs text-gray-400 mb-3">
        CSV format: <code className="bg-gray-100 px-1 rounded">Company, signal_1, signal_2, ..., signal_18</code> with values: present, inferred, or absent
      </p>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Upload CSV
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {preview && (
        <div className="mt-4 border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview: {preview.length} companies found</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {preview.map((p, i) => (
              <div key={i} className="text-xs text-gray-600 flex justify-between">
                <span>{p.name}</span>
                <span className="text-gray-400">{p.count} signals set</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={confirmImport} className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer">
              Import All
            </button>
            <button onClick={() => { setPreview(null); setParsed([]); }} className="px-3 py-1.5 border border-gray-200 text-sm rounded-md hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
