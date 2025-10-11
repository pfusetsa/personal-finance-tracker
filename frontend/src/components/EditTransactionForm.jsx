import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../apiClient';
import DatePicker from './DatePicker';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

function EditTransactionForm({ transaction, onFormSubmit, onCancel }) {
  const { accounts, categories, t, language } = useAppContext();

  // --- FORM MODE STATE ---
  const [isRecurrent, setIsRecurrent] = useState(transaction.is_recurrent);
  const [recurrenceMode, setRecurrenceMode] = useState(transaction.recurrence_id ? 'link' : 'new');
  const [canEditRule, setCanEditRule] = useState(true);
  
  // --- FORM DATA STATE ---
  const [formData, setFormData] = useState({});
  const [transactionType, setTransactionType] = useState(transaction.amount >= 0 ? 'income' : 'expense');
  
  // --- LINKING STATE ---
  const [existingSeries, setExistingSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(transaction.recurrence_id || '');
  const [pendingTx, setPendingTx] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState('');

  // --- Effects ---
  useEffect(() => {
    setFormData({
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      currency: transaction.currency || 'EUR',
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      recurrence_num: transaction.recurrence_num || 1,
      recurrence_unit: transaction.recurrence_unit || 'months',
      recurrence_end_date: transaction.recurrence_end_date || '',
    });
    
    if (transaction.recurrence_id) {
      apiFetch(`/recurrences/${transaction.recurrence_id}/confirmed_count`)
        .then(data => {
          if (data.count > 1) { setCanEditRule(false); }
        });
    }
  }, [transaction]);

  useEffect(() => {
    if (isRecurrent) { apiFetch('/recurrences/').then(setExistingSeries); }
  }, [isRecurrent]);

  useEffect(() => {
    if (recurrenceMode === 'link' && selectedSeriesId) {
      apiFetch(`/recurrences/${selectedSeriesId}/pending`).then(setPendingTx);
    } else {
      setPendingTx([]);
    }
  }, [recurrenceMode, selectedSeriesId]);
  
  // --- Handlers & Memoized values ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleDateChange = (date, field) => {
    setFormData(prev => ({ ...prev, [field]: date.toISOString().split('T')[0] }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || !formData.account_id || !formData.category_id) { return; }
    const finalAmount = transactionType === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);
    
    let submissionData = {
      date: formData.date,
      description: formData.description,
      amount: finalAmount,
      currency: formData.currency,
      is_recurrent: isRecurrent,
      account_id: parseInt(formData.account_id, 10),
      category_id: parseInt(formData.category_id, 10),
    };

    if (isRecurrent) {
      if (recurrenceMode === 'new') {
        submissionData.recurrence_num = parseInt(formData.recurrence_num, 10);
        submissionData.recurrence_unit = formData.recurrence_unit;
        submissionData.recurrence_end_date = formData.recurrence_end_date || null;
      }
      if (recurrenceMode === 'link') {
        submissionData.recurrence_id = selectedSeriesId;
      }
    }
    onFormSubmit(submissionData);
  };
  const numberOptions = useMemo(() => {
    let max = 12;
    if (formData.recurrence_unit === 'days') max = 31;
    if (formData.recurrence_unit === 'weeks') max = 52;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [formData.recurrence_unit]);

   return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-lg text-sm font-semibold">
        <button type="button" onClick={() => setIsRecurrent(false)} className={`w-1/2 py-2 rounded-l-lg transition-colors ${!isRecurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{t('singleTransaction')}</button>
        <button type="button" onClick={() => setIsRecurrent(true)} className={`w-1/2 py-2 rounded-r-lg transition-colors ${isRecurrent ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{t('recurrentTransaction')}</button>
      </div>
      
      {isRecurrent ? (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-500">{t('recurrenceDetails')}</h3>
          <fieldset disabled={!canEditRule} className={!canEditRule ? 'opacity-60' : ''}>
            {existingSeries.length > 0 && (
              <div className="flex border border-gray-300 rounded-lg p-1 bg-gray-100 text-sm">
                <button type="button" onClick={() => setRecurrenceMode('new')} className={`w-1/2 py-1 rounded-md ${recurrenceMode === 'new' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>{t('createNewSeries')}</button>
                <button type="button" onClick={() => setRecurrenceMode('link')} className={`w-1/2 py-1 rounded-md ${recurrenceMode === 'link' ? 'bg-white shadow' : 'hover:bg-gray-200'}`} title={existingSeries.length === 0 ? t('noExistingSeriesTooltip') : ''}>{t('linkToExisting')}</button>
              </div>
            )}
            
            {recurrenceMode === 'new' && (
              <div className="space-y-4 p-2 border rounded-md">
                {!canEditRule && <p className="text-xs text-orange-600 bg-orange-100 p-2 rounded">This rule cannot be changed because other confirmed transactions exist in this series.</p>}
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('frequency')}</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <select name="recurrence_num" value={formData.recurrence_num} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                      {numberOptions.map(num => <option key={num} value={num}>{num}</option>)}
                    </select>
                    <select name="recurrence_unit" value={formData.recurrence_unit} onChange={handleChange} className="w-2/3 p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                      <option value="days">{t('days')}</option><option value="weeks">{t('weeks')}</option><option value="months">{t('months')}</option><option value="years">{t('years')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('endDate')}</label>
                  <DatePicker selectedDate={formData.recurrence_end_date} onChange={(date) => handleDateChange(date, 'recurrence_end_date')} placeholder={t('never')} language={language} />
                </div>
              </div>
            )}
            
            {recurrenceMode === 'link' && (
              <div className="space-y-4">
                <select value={selectedSeriesId} onChange={e => setSelectedSeriesId(e.target.value)} className="w-full p-2 border rounded bg-white">
                  <option value="">-- {t('chooseASeries')} --</option>
                  {existingSeries.map(series => ( <option key={series.recurrence_id} value={series.recurrence_id}>{series.description}</option> ))}
                </select>
                {selectedSeriesId && (
                  <select value={selectedPendingId} onChange={e => setSelectedPendingId(e.target.value)} className="w-full p-2 border rounded bg-white">
                    <option value="">-- {t('addNewOccurrence')} --</option>
                    {pendingTx.map(tx => ( <option key={tx.id} value={tx.id}>{t('claimPendingFor', {date: tx.date})}</option> ))}
                  </select>
                )}
              </div>
            )}
          </fieldset>
        </div>
      ): null}

      <div className="space-y-4 border-t pt-4">
        <DatePicker selectedDate={formData.date} onChange={(date) => handleDateChange(date, 'date')} />
        <input type="text" name="description" value={formData.description || ''} onChange={handleChange} placeholder={t('description')} className="w-full p-2 border rounded" required />
        <div>
          <div className="flex rounded-md shadow-sm">
            <button type="button" onClick={() => setTransactionType('expense')} className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('expenses')}</button>
            <button type="button" onClick={() => setTransactionType('income')} className={`-ml-px px-4 py-2 border border-gray-300 rounded-r-md text-sm font-medium ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('income')}</button>
          </div>
          <div className="flex space-x-2 mt-2">
            <input type="text" name="amount" value={formData.amount || ''} onChange={handleChange} placeholder={t('amount')} className="w-2/3 p-2 border rounded" required />
            <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 border rounded bg-white">
              <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded bg-white">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
        <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded bg-white">{categories.map(cat => (<option key={cat.id} value={cat.id}>{t(cat.i18n_key) || cat.name}</option>))}</select>
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('save')}</button>
      </div>
    </form>
  );
}

export default EditTransactionForm;