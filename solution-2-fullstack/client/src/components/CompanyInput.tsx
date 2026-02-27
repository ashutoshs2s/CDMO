import { useRef } from 'react';

interface Props {
  companyName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onReset: () => void;
  onImportJSON: (file: File) => void;
  onExportJSON: () => void;
  isSaved: boolean;
}

export function CompanyInput({ companyName, onNameChange, onSave, onReset, onImportJSON, onExportJSON, isSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex-wrap">
      <input
        type="text"
        value={companyName}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Enter company name (e.g., Acme Therapeutics)"
        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-400 transition-colors"
      />
      <button
        onClick={onSave}
        disabled={!companyName.trim()}
        className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSaved ? 'Update' : 'Save'}
      </button>
      <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
        Import JSON
      </button>
      <button onClick={onExportJSON} className="px-3 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
        Export JSON
      </button>
      <button onClick={onReset} className="px-3 py-2 border border-gray-200 rounded-md text-sm text-red-500 font-medium hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer">
        Reset
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onImportJSON(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
