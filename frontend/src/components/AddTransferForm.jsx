import React, { useState } from 'react';
import DatePicker from './DatePicker'; // Import the new component

function AddTransferForm({ accounts, onFormSubmit, onCancel, t, language }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    from_account_id: accounts[0]?.id || '',
    to_account_id: accounts[1]?.id || '',
  });

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.from_account_id === formData.to_account_id) {
      alert(t.sameAccountError || "Cannot transfer to the same account.");
      return;
    }
    onFormSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker selectedDate={formData.date} onChange={handleDateChange} language={language} />
      <input type="number" name="amount" placeholder={t.amount} value={formData.amount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+'].includes(e.key) && e.preventDefault()} className="w-full p-2 border rounded" required step="0.01" />
      <div>
        <label className="block text-sm font-medium text-gray-700">{t.fromAccount || 'From Account'}</label>
        <select name="from_account_id" value={formData.from_account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t.toAccount || 'To Account'}</label>
        <select name="to_account_id" value={formData.to_account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t.add}</button>
      </div>
    </form>
  );
}

export default AddTransferForm;