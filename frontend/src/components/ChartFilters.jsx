import React from 'react';
import DatePicker from './DatePicker'; // Import our new component

function ChartFilters({ period, setPeriod, customDates, setCustomDates, t, language }) { // Add language prop
  const timePeriods = [
    { key: '6m', label: '6 Months' },
    { key: '1y', label: '1 Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];
  
  // Handler for when the date picker changes the date
  const handleDateChange = (date, field) => {
    // Format the date back to a 'yyyy-MM-dd' string
    const formattedDate = date.toISOString().split('T')[0];
    setCustomDates(d => ({ ...d, [field]: formattedDate }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">{t.Filters}</h3>
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {timePeriods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${period === p.key ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:bg-gray-300'}`}>
              {t[p.label]}
            </button>
          ))}
        </div>
      </div>
      {period === 'custom' && (
        <div className="flex items-center space-x-2 mt-4">
          <DatePicker selectedDate={customDates.start} onChange={(date) => handleDateChange(date, 'start')} language={language} />
          <DatePicker selectedDate={customDates.end} onChange={(date) => handleDateChange(date, 'end')} language={language} />
        </div>
      )}
    </div>
  );
}

export default ChartFilters;