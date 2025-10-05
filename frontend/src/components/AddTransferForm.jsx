import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import DatePicker from './DatePicker';

// 2. Remove global props
function AddTransferForm({ onFormSubmit, onCancel }) {
  // 3. Get global data from context
  const { accounts, t, language } = useAppContext();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    from_account_id: '',
    to_account_id: '',
  });

  // Set default accounts once they are loaded from the context
  useEffect(() => {
    if (accounts.length > 0) {
      setFormData(prev => ({
        ...prev,
        from_account_id: accounts[0]?.id || '',
        to_account_id: accounts[1]?.id || '',
      }));
    }
  }, [accounts]);

  // Filter available accounts for the "To" dropdown
  const toAccountsOptions = accounts.filter(acc => acc.id.toString() !== formData.from_account_id.toString());

  // Effect to automatically update the 'to_account_id' if needed
  useEffect(() => {
    const isToAccountValid = toAccountsOptions.some(acc => acc.id.toString() === formData.to_account_id.toString());
    if ((!isToAccountValid || formData.from_account_id === formData.to_account_id) && toAccountsOptions.length > 0) {
      setFormData(prev => ({ ...prev, to_account_id: toAccountsOptions[0].id }));
    }
  }, [formData.from_account_id, accounts, toAccountsOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  // The JSX is the same, but uses variables from the context
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
      <input type="number" name="amount" placeholder={t('amount')} value={formData.amount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+'].includes(e.key) && e.preventDefault()} className="w-full p-2 border rounded" required step="0.01" />
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
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={toAccountsOptions.length === 0}>{t('add')}</button>
      </div>
    </form>
  );
}

export default AddTransferForm;