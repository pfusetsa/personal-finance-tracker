import React from 'react';
import { useAppContext } from '../context/AppContext';
import DatePicker from './DatePicker';

function ChartFilters({ period, setChartPeriod, customDates, setCustomDates }) { 
  const { language, t } = useAppContext();

  // Use translation keys instead of hardcoded labels
  const timePeriods = [
    { key: '1m', labelKey: 'oneMonth' },
    { key: '6m', labelKey: 'sixMonths' },
    { key: '1y', labelKey: 'oneYear' },
    { key: 'all', labelKey: 'allTime' },
    { key: 'custom', labelKey: 'custom' },
  ];
  
  const handleDateChange = (date, field) => {
    const formattedDate = date.toISOString().split('T')[0];
    setCustomDates(d => ({ ...d, [field]: formattedDate }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">{t('Filters')}</h3>
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {timePeriods.map(p => (
            <button 
              key={p.key} 
              onClick={() => setChartPeriod(p.key)} 
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${period === p.key ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:bg-gray-300'}`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>
      {period === 'custom' && (
        <div className="flex items-center space-x-2 mt-4">
          <DatePicker selectedDate={customDates.start} onChange={(date) => handleDateChange(date, 'start')} language={language} placeholderText={t('datePickerFromPlaceholder')} />
          <DatePicker selectedDate={customDates.end} onChange={(date) => handleDateChange(date, 'end')} language={language} placeholderText={t('datePickerToPlaceholder')}/>
        </div>
      )}
    </div>
  );
}

export default ChartFilters;