import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../apiClient';
import DatePicker from './DatePicker';

// 3. Remove global props
function EditTransferForm({ transferId, onFormSubmit, onCancel }) {
  // 4. Get global data from context
  const { accounts, t, language } = useAppContext();

  const [formData, setFormData] = useState(null); // Default to null while loading

  useEffect(() => {
    // 5. Use apiFetch to ensure user ID is sent correctly
    apiFetch(`/transfers/${transferId}`)
      .then(data => {
        setFormData({
          date: data.date,
          amount: data.amount,
          from_account_id: data.from_account_id,
          to_account_id: data.to_account_id,
        });
      });
  }, [transferId]);

  const toAccountsOptions = formData ? accounts.filter(acc => acc.id.toString() !== formData.from_account_id.toString()) : [];
  
  useEffect(() => {
    if (!formData) return;
    const isToAccountValid = toAccountsOptions.some(acc => acc.id.toString() === formData.to_account_id.toString());
    if ((!isToAccountValid || formData.from_account_id === formData.to_account_id) && toAccountsOptions.length > 0) {
      setFormData(prev => ({ ...prev, to_account_id: toAccountsOptions[0].id }));
    }
  }, [formData?.from_account_id, accounts]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(transferId, formData);
  };

  if (!formData) {
    return <div>Loading transfer details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
      <input type="number" name="amount" placeholder={t('amount')} value={formData.amount} onChange={handleChange} className="w-full p-2 border rounded" required step="0.01" />
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fromAccount')}</label>
        <select name="from_account_id" value={formData.from_account_id} onChange={handleChange} className="w-full p-2 border rounded">
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('toAccount')}</label>
        <select name="to_account_id" value={formData.to_account_id} onChange={handleChange} className="w-full p-2 border rounded" disabled={toAccountsOptions.length === 0}>
          {toAccountsOptions.length > 0 ? (
            toAccountsOptions.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
          ) : (
            <option>{t('noOtherAccounts')}</option>
          )}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('save')}</button>
      </div>
    </form>
  );
}

export default EditTransferForm;