import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../apiClient';
import DatePicker from './DatePicker';

function AddTransactionForm({ onFormSubmit, onCancel, initialData }) {
  const { accounts, categories, t, language } = useAppContext();

  const [isRecurrent, setIsRecurrent] = useState(initialData?.is_recurrent || false);
  const [recurrenceMode, setRecurrenceMode] = useState('new');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', amount: '', currency: 'EUR', account_id: '', category_id: '',
    recurrence_num: 1, recurrence_unit: 'months', recurrence_end_date: '',
  });
  const [transactionType, setTransactionType] = useState('expense');
  const [existingSeries, setExistingSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [pendingTx, setPendingTx] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState('');

  // --- DATA FETCHING ---
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

  // --- INITIAL DATA & DEFAULTS ---
  useEffect(() => {
    // Handles pre-filling the form for the "Cancel" workflow
    if (initialData) {
      setFormData({
        date: initialData.date,
        description: initialData.description,
        amount: Math.abs(initialData.amount),
        currency: initialData.currency || 'EUR',
        is_recurrent: initialData.is_recurrent,
        account_id: initialData.account_id,
        category_id: initialData.category_id,
        // Reset recurrence fields
        recurrence_num: 1, recurrence_unit: 'months', recurrence_end_date: '',
      });
      setIsRecurrent(initialData.is_recurrent);
      setTransactionType(initialData.amount >= 0 ? 'income' : 'expense');
    } else if (accounts.length > 0 && categories.length > 0) {
      // Set default account/category for a new form
      setFormData(prev => ({ ...prev, account_id: accounts[0].id, category_id: categories[0].id }));
    }
  }, [initialData, accounts, categories]);

  // When a user selects a pending transaction, pre-fill the form
  useEffect(() => {
    if (selectedPendingId) {
      const tx = pendingTx.find(p => p.id === parseInt(selectedPendingId));
      if (tx) {
        setFormData(prev => ({
          ...prev,
          date: tx.date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          currency: tx.currency,
          account_id: tx.account_id,
          category_id: tx.category_id,
        }));
        setTransactionType(tx.amount >= 0 ? 'income' : 'expense');
      }
    }
  }, [selectedPendingId, pendingTx]);

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
    if (isNaN(amountValue) || !formData.account_id || !formData.category_id) {
      console.error("Invalid form data before submission:", formData);
      return; 
    }

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
        submissionData.update_pending_id = selectedPendingId ? parseInt(selectedPendingId, 10) : null;
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
      {/* --- Main Transaction Type Toggle --- */}
      <div className="flex rounded-lg text-sm font-semibold">
        <button type="button" onClick={() => setIsRecurrent(false)} className={`w-1/2 py-2 rounded-l-lg transition-colors ${!isRecurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{t('singleTransaction')}</button>
        <button type="button" onClick={() => setIsRecurrent(true)} className={`w-1/2 py-2 rounded-r-lg transition-colors ${isRecurrent ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{t('recurrentTransaction')}</button>
      </div>
      {/* --- CONDITIONAL RECURRENCE UI --- */}
      {isRecurrent && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-500">{t('recurrenceDetails')}</h3>
          <div className="flex border border-gray-300 rounded-lg p-1 bg-gray-100 text-sm">
            <button type="button" onClick={() => setRecurrenceMode('new')} className={`w-1/2 py-1 rounded-md ${recurrenceMode === 'new' ? 'bg-white shadow' : ''}`}>{t('createNewSeries')}</button>
            <button 
              type="button" 
              onClick={() => setRecurrenceMode('link')} 
              className={`w-1/2 py-1 rounded-md ${recurrenceMode === 'link' ? 'bg-white shadow' : ''}`} 
              disabled={existingSeries.length === 0}
              title={existingSeries.length === 0 ? t('noExistingSeriesTooltip') : ''}
            >
              {t('linkToExisting')}
            </button>
          </div>

          {recurrenceMode === 'new' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('frequency')}</label>
                <div className="flex items-center space-x-2 mt-1">
                  <select name="recurrence_num" value={formData.recurrence_num} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    {numberOptions.map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                  <select name="recurrence_unit" value={formData.recurrence_unit} onChange={handleChange} className="w-2/3 p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    <option value="days">{t('days')}</option>
                    <option value="weeks">{t('weeks')}</option>
                    <option value="months">{t('months')}</option>
                    <option value="years">{t('years')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('endDate')} ({t('optional').toLowerCase()})</label>
                <DatePicker selectedDate={formData.recurrence_end_date} onChange={(date) => setFormData(f => ({...f, recurrence_end_date: date.toISOString().split('T')[0]}))} language={language} placeholder={t('never')} />
              </div>
            </div>
          ) : (
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
        </div>
      )}

      {/* --- Shared Form Fields --- */}
      <div className="space-y-4 border-t pt-4">
        <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
        <input type="text" name="description" placeholder={t('description')} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
        <div>
          <div className="flex rounded-md shadow-sm">
              <button type="button" onClick={() => setTransactionType('expense')} className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('expenses')}</button>
              <button type="button" onClick={() => setTransactionType('income')} className={`-ml-px px-4 py-2 border border-gray-300 rounded-r-md text-sm font-medium ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('income')}</button>
          </div>
          <div className="flex space-x-2 mt-2">
              <input type="text" name="amount" placeholder={t('amount')} value={formData.amount} onChange={handleChange} pattern="[0-9]*\.?[0-9]*" inputMode="decimal" className="w-2/3 p-2 border rounded" required />
              <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/fs-3 p-2 border rounded">
                  <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
          </div>
        </div>
        <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
        <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded">{categories.map(cat => (<option key={cat.id} value={cat.id}>{t(cat.i18n_key) || cat.name}</option>))}</select>
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{initialData ? t('save') : t('add')}</button>
      </div>
    </form>
  );
}

export default AddTransactionForm;