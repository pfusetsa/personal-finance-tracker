import React, { useState } from 'react';

function EditTransactionForm({ transaction, accounts, categories, onFormSubmit, onCancel, lang }) {
  const [formData, setFormData] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    currency: transaction.currency || 'EUR', // Add this
    is_recurrent: transaction.is_recurrent,
    account_id: transaction.account_id,
    category_id: transaction.category_id,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(transaction.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{lang === 'es' ? 'Editar Transacción' : 'Edit Transaction'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" />
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
          <div className="flex space-x-2">
            <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+'].includes(e.key) && e.preventDefault()} className="w-2/3 p-2 border rounded" required step="0.01" />
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
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{lang === 'es' ? 'Guardar Cambios' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTransactionForm;