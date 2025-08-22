import React, { useState } from 'react';
import DatePicker from './DatePicker'; // Import our new component

function AddTransactionForm({ accounts, categories, onFormSubmit, onCancel, t, language }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', amount: '', currency: 'EUR', is_recurrent: false,
    account_id: accounts[0]?.id || '', category_id: categories[0]?.id || '',
  });
  const [transactionType, setTransactionType] = useState('expense');

  // ... (handleChange remains the same)
  const handleChange = (e) => { const { name, value, type, checked } = e.target; if (name === "amount" && !/^\d*\.?\d*$/.test(value)) { return; } setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  // New handler for the date picker
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = transactionType === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
    onFormSubmit({ ...formData, amount: finalAmount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
      {/* ... the rest of the form remains the same ... */}
      <input type="text" name="description" placeholder={t.description} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
      <div><div className="flex rounded-md shadow-sm"><button type="button" onClick={() => setTransactionType('expense')} className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t.expenses}</button><button type="button" onClick={() => setTransactionType('income')} className={`-ml-px px-4 py-2 border border-gray-300 rounded-r-md text-sm font-medium ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t.income}</button></div><div className="flex space-x-2 mt-2"><input type="text" name="amount" placeholder={t.amount} value={formData.amount} onChange={handleChange} pattern="[0-9]*\.?[0-9]*" inputMode="decimal" className="w-2/3 p-2 border rounded" required /><select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 border rounded"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div></div>
      <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
      <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
      <label className="flex items-center space-x-2"><input type="checkbox" name="is_recurrent" checked={formData.is_recurrent} onChange={handleChange} /><span>{t.recurrent}</span></label>
      <div className="flex justify-end space-x-2"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t.add}</button></div>
    </form>
  );
}
export default AddTransactionForm;