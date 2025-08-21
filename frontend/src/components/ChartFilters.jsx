import React from 'react';

function ChartFilters({ period, setPeriod, customDates, setCustomDates, t }) {
  const timePeriods = [
    { key: '6m', label: '6 Months' },
    { key: '1y', label: '1 Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">{t.Filters}</h3>
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {timePeriods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${period === p.key ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:bg-gray-300'}`}
            >
              {t[p.label]}
            </button>
          ))}
        </div>
      </div>
      {period === 'custom' && (
        <div className="flex space-x-2 mt-4">
          <input type="date" value={customDates.start} onChange={e => setCustomDates(d => ({ ...d, start: e.target.value }))} className="p-1 border rounded" />
          <input type="date" value={customDates.end} onChange={e => setCustomDates(d => ({ ...d, end: e.target.value }))} className="p-1 border rounded" />
        </div>
      )}
    </div>
  );
}

export default ChartFilters;