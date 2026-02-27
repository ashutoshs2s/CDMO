import { useState } from 'react';
import { useSignals } from './hooks/useSignals';
import { CATEGORY_META } from './lib/signals';
import type { CategoryKey } from './lib/types';
import { CompanyInput } from './components/CompanyInput';
import { ScoreGauge } from './components/ScoreGauge';
import { IntentBadge } from './components/IntentBadge';
import { SignalColumn } from './components/SignalColumn';
import { CompanyList } from './components/CompanyList';
import { ComparisonView } from './components/ComparisonView';
import { BatchImport } from './components/BatchImport';
import { ExampleScenarios } from './components/ExampleScenarios';
import './index.css';

type Tab = 'dashboard' | 'companies' | 'compare';

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const s = useSignals();

  const compareCompanies = s.companies.filter(c => s.compareIds.includes(c.id));
  const categories: CategoryKey[] = ['need', 'timing', 'behavior'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-5 py-6">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">CDMO Signal Triangulation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Score companies across 18 intent signals to identify high-potential CDMO outsourcing prospects</p>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-white border border-gray-200 rounded-lg p-1 w-fit mx-auto shadow-sm">
          {([
            ['dashboard', 'Dashboard'],
            ['companies', 'Saved Companies'],
            ['compare', `Compare (${s.compareIds.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                tab === key ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <>
            <div className="mb-5">
              <CompanyInput
                companyName={s.companyName}
                onNameChange={s.setCompanyName}
                onSave={s.save}
                onReset={s.reset}
                onImportJSON={s.importJSON}
                onExportJSON={s.exportJSON}
                isSaved={!!s.selectedId}
                onAnalyze={s.analyzeWebsite}
                analyzing={s.analyzing}
                analysisError={s.analysisError}
                analysisResult={s.analysisResult}
              />
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {categories.map(cat => (
                <ScoreGauge
                  key={cat}
                  label={CATEGORY_META[cat].label}
                  categoryScore={s.scoring.categories[cat]}
                  color={CATEGORY_META[cat].color}
                />
              ))}
              <IntentBadge scoring={s.scoring} />
            </div>

            {/* Signals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {categories.map(cat => (
                <SignalColumn key={cat} category={cat} states={s.signals} onChange={s.setSignal} />
              ))}
            </div>

            {/* Examples */}
            <div className="mb-6">
              <ExampleScenarios onLoad={s.loadExample} />
            </div>
          </>
        )}

        {/* Companies Tab */}
        {tab === 'companies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CompanyList
                companies={s.companies}
                selectedId={s.selectedId}
                compareIds={s.compareIds}
                onSelect={co => { s.selectCompany(co); setTab('dashboard'); }}
                onDelete={s.removeCompany}
                onToggleCompare={s.toggleCompare}
              />
            </div>
            <div>
              <BatchImport onImport={s.batchImport} />
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {tab === 'compare' && (
          <ComparisonView
            companies={compareCompanies}
            onClose={() => setTab('dashboard')}
          />
        )}

        {/* Footer */}
        <footer className="text-center py-5 mt-6 border-t border-gray-200 text-xs text-gray-400">
          <strong className="text-blue-900">Solution 2 of 3</strong> &mdash; React + Tailwind + Recharts &bull; Client-side scoring with localStorage persistence
        </footer>
      </div>
    </div>
  );
}

export default App;
