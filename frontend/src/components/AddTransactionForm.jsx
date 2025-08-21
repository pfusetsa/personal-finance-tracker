import React, { useState } from 'react';

function AddTransactionForm({ accounts, categories, onFormSubmit, onCancel, lang }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    currency: 'EUR', // Add this
    is_recurrent: false,
    account_id: accounts[0]?.id || '',
    category_id: categories[0]?.id || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{lang === 'es' ? 'Añadir Transacción' : 'Add Transaction'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="text" name="description" placeholder={lang === 'es' ? 'Descripción' : 'Description'} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
        <div className="flex space-x-2">
          <input type="number" name="amount" placeholder={lang === 'es' ? 'Cantidad' : 'Amount'} value={formData.amount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+'].includes(e.key) && e.preventDefault()} className="w-2/3 p-2 border rounded" required step="0.01" />
          <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 border rounded">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
        <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
        <label className="flex items-center space-x-2"><input type="checkbox" name="is_recurrent" checked={formData.is_recurrent} onChange={handleChange} /><span>{lang === 'es' ? '¿Es Recurrente?' : 'Is Recurrent?'}</span></label>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{lang === 'es' ? 'Añadir' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}

export default AddTransactionForm;