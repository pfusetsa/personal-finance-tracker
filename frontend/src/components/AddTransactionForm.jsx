import React, { useState } from 'react';

function AddTransactionForm({ accounts, categories, onFormSubmit, onCancel, lang }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    currency: 'EUR',
    is_recurrent: false,
    account_id: accounts[0]?.id || '',
    category_id: categories[0]?.id || '',
  });
  const [transactionType, setTransactionType] = useState('expense'); // New state for the toggle

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Allow only numbers and a single decimal point for the amount
    if (name === "amount" && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adjust the amount based on the toggle before submitting
    const finalAmount = transactionType === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
    onFormSubmit({ ...formData, amount: finalAmount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" />
      <input type="text" name="description" placeholder={lang === 'es' ? 'Descripción' : 'Description'} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" required />
      
      {/* New Amount Input with Toggle */}
      <div>
        <div className="flex rounded-md shadow-sm">
          <button type="button" onClick={() => setTransactionType('expense')} className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Expense</button>
          <button type="button" onClick={() => setTransactionType('income')} className={`-ml-px px-4 py-2 border border-gray-300 rounded-r-md text-sm font-medium ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Income</button>
        </div>
        <div className="flex space-x-2 mt-2">
          <input type="text" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} pattern="[0-9]*\.?[0-9]*" inputMode="decimal" className="w-2/3 p-2 border rounded" required />
          <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 border rounded"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select>
        </div>
      </div>
      
      <select name="account_id" value={formData.account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
      <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border rounded">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
      <label className="flex items-center space-x-2"><input type="checkbox" name="is_recurrent" checked={formData.is_recurrent} onChange={handleChange} /><span>{lang === 'es' ? '¿Es Recurrente?' : 'Is Recurrent?'}</span></label>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{lang === 'es' ? 'Añadir' : 'Add'}</button>
      </div>
    </form>
  );
}

export default AddTransactionForm;