import React, { useState } from 'react';

function AddTransferForm({ accounts, onFormSubmit, onCancel, lang }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    from_account_id: accounts[0]?.id || '',
    to_account_id: accounts[1]?.id || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.from_account_id === formData.to_account_id) {
      alert(lang === 'es' ? 'No se puede transferir a la misma cuenta.' : "Cannot transfer to the same account.");
      return;
    }
    onFormSubmit(formData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{lang === 'es' ? 'Añadir Transferencia' : 'Add Transfer'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="number" name="amount" placeholder={lang === 'es' ? 'Cantidad' : 'Amount'} value={formData.amount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} className="w-full p-2 border rounded" required step="0.01" />
        <div>
          <label className="block text-sm font-medium text-gray-700">{lang === 'es' ? 'Desde la Cuenta' : 'From Account'}</label>
          <select name="from_account_id" value={formData.from_account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{lang === 'es' ? 'A la Cuenta' : 'To Account'}</label>
          <select name="to_account_id" value={formData.to_account_id} onChange={handleChange} className="w-full p-2 border rounded">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{lang === 'es' ? 'Añadir' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}

export default AddTransferForm;