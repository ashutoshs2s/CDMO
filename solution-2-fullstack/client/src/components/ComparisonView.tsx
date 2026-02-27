import type { SavedCompany } from '../lib/types';
import { INTENT_CONFIG } from '../lib/scoring';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  companies: SavedCompany[];
  onClose: () => void;
}

const COLORS = ['#3182ce', '#805ad5', '#d69e2e', '#e53e3e'];

export function ComparisonView({ companies, onClose }: Props) {
  if (companies.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <p className="text-gray-500">Select at least 2 companies from the list to compare.</p>
      </div>
    );
  }

  const radarData = [
    { signal: 'Need',     fullMark: 6, ...Object.fromEntries(companies.map(c => [c.id, c.scoring.categories.need.score])) },
    { signal: 'Timing',   fullMark: 6, ...Object.fromEntries(companies.map(c => [c.id, c.scoring.categories.timing.score])) },
    { signal: 'Behavior', fullMark: 6, ...Object.fromEntries(companies.map(c => [c.id, c.scoring.categories.behavior.score])) },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Company Comparison</h2>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">&times; Close</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="signal" tick={{ fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 6]} tick={{ fontSize: 11 }} />
              {companies.map((co, i) => (
                <Radar
                  key={co.id}
                  name={co.name}
                  dataKey={co.id}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Metric</th>
                {companies.map((co, i) => (
                  <th key={co.id} className="text-center py-2 px-3 font-medium" style={{ color: COLORS[i % COLORS.length] }}>
                    {co.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 text-gray-600">Need Score</td>
                {companies.map(co => <td key={co.id} className="text-center py-2 px-3">{co.scoring.categories.need.score}/6</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600">Timing Score</td>
                {companies.map(co => <td key={co.id} className="text-center py-2 px-3">{co.scoring.categories.timing.score}/6</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600">Behavior Score</td>
                {companies.map(co => <td key={co.id} className="text-center py-2 px-3">{co.scoring.categories.behavior.score}/6</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600">Total</td>
                {companies.map(co => <td key={co.id} className="text-center py-2 px-3 font-semibold">{co.scoring.total}/18</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600">Intent</td>
                {companies.map(co => {
                  const cfg = INTENT_CONFIG[co.scoring.intent];
                  return <td key={co.id} className={`text-center py-2 px-3 font-bold ${cfg.text}`}>{cfg.label}</td>;
                })}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600">Confidence</td>
                {companies.map(co => <td key={co.id} className="text-center py-2 px-3">{co.scoring.confidence}%</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
