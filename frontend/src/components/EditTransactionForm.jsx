import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext'; 
import DatePicker from './DatePicker';

function EditTransactionForm({ transaction, onFormSubmit, onCancel }) {

  const { accounts, categories, t, language } = useAppContext();

  const [formData, setFormData] = useState({
    date: transaction.date, description: transaction.description, amount: Math.abs(transaction.amount), currency: transaction.currency || 'EUR',
    is_recurrent: transaction.is_recurrent, account_id: transaction.account_id, category_id: transaction.category_id,
  });
  const [transactionType, setTransactionType] = useState(transaction.amount >= 0 ? 'income' : 'expense');

  const handleChange = (e) => { const { name, value, type, checked } = e.target; if (name === "amount" && !/^\d*\.?\d*$/.test(value)) { return; } setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = transactionType === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
    onFormSubmit(transaction.id, { ...formData, amount: finalAmount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
      <input type="text" name="description" placeholder={t('description')} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
      <div><div className="flex rounded-md shadow-sm"><button type="button" onClick={() => setTransactionType('expense')} className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('expenses')}</button><button type="button" onClick={() => setTransactionType('income')} className={`-ml-px px-4 py-2 border border-gray-300 rounded-r-md text-sm font-medium ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('income')}</button></div><div className="flex space-x-2 mt-2"><input type="text" name="amount" placeholder={t('amount')} value={formData.amount} onChange={handleChange} pattern="[0-9]*\.?[0-9]*" inputMode="decimal" className="w-2/3 p-2 border rounded" required /><select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 border rounded"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div></div>
      <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
      <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded">
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {t(cat.i18n_key) === cat.i18n_key ? cat.name : t(cat.i18n_key)}
          </option>
      ))}
      </select>
      <label className="flex items-center space-x-2"><input type="checkbox" name="is_recurrent" checked={formData.is_recurrent} onChange={handleChange} /><span>{t('recurrent')}</span></label>
      <div className="flex justify-end space-x-2"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('save')}</button></div>
    </form>
  );
}
export default EditTransactionForm;