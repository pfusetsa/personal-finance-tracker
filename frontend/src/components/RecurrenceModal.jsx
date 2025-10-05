import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import DatePicker from './DatePicker';

function RecurrenceModal({ transaction, onSave, onCancel }) {

  const { language, t } = useAppContext();
  
  const [recurrenceNum, setRecurrenceNum] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState('months');
  const [endDate, setEndDate] = useState(''); // Default to empty for "never"

  const handleSave = () => {
    onSave({
      recurrence_num: parseInt(recurrenceNum, 10),
      recurrence_unit: recurrenceUnit,
      recurrence_end_date: endDate || null, // Send null if empty
    });
  };

  const numberOptions = useMemo(() => {
    let max = 12;
    if (recurrenceUnit === 'days') max = 31;
    if (recurrenceUnit === 'weeks') max = 52;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [recurrenceUnit]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        { t('recurrenceRuleFor')} <strong className="font-semibold">{transaction.description}</strong>
      </p>
      
      {/* Frequency Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700">{ t('frequency')}</label>
        <div className="flex items-center space-x-2 mt-1">
          <select
            value={recurrenceNum}
            onChange={(e) => setRecurrenceNum(e.target.value)}
            className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm"
          >
            {numberOptions.map(num => <option key={num} value={num}>{num}</option>)}
          </select>
          <select
            value={recurrenceUnit}
            onChange={(e) => setRecurrenceUnit(e.target.value)}
            className="w-2/3 p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="days">{ t('days')}</option>
            <option value="weeks">{ t('weeks')}</option>
            <option value="months">{ t('months')}</option>
            <option value="years">{ t('years')}</option>
          </select>
        </div>
      </div>

      {/* End Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700">{ t('endDate')} ({ t('optional').toLowerCase()})</label>
        <DatePicker
          selectedDate={endDate}
          onChange={(date) => setEndDate(date.toISOString().split('T')[0])}
          language={language}
          placeholder={ t('never')}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          { t('cancel')}
        </button>
        <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          { t('setRecurrence')}
        </button>
      </div>
    </div>
  );
}

export default RecurrenceModal;