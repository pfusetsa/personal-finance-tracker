import React, { useState, useEffect } from 'react';

const API_URL = "http://127.0.0.1:8000";

function TransferCategorySelector({ categories, onUpdate, t }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    // Fetch the current setting when the component loads
    fetch(`${API_URL}/settings/transfer_category_id`)
      .then(res => res.json())
      .then(data => setSelectedCategoryId(data.value))
      .catch(err => console.error("Could not fetch transfer category setting:", err));
  }, []);

  const handleSave = () => {
    fetch(`${API_URL}/settings/transfer_category_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: selectedCategoryId }),
    })
    .then(res => {
      if (!res.ok) { return res.json().then(err => { throw new Error(err.detail); }); }
      onUpdate(t.transferCategoryUpdated);
    })
    .catch(err => onUpdate(err.message, 'error'));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t.transferCategoryInfo}</p>
      <select 
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className="w-full p-2 border rounded"
      >
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}

export default TransferCategorySelector;