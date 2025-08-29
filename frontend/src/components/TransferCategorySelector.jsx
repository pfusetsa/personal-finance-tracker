// Find and replace the entire content of this file
import React, { useState, useEffect } from 'react';
import TransferMigrationModal from './TransferMigrationModal'; // Import the new modal

const API_URL = "http://127.0.0.1:8000";

function TransferCategorySelector({ categories, onUpdate, t, onComplete }) {
  const [initialCategoryId, setInitialCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/settings/transfer_category_id`)
      .then(res => res.json())
      .then(data => {
        setInitialCategoryId(data.value);
        setSelectedCategoryId(data.value);
      })
      .catch(err => console.error("Could not fetch transfer category setting:", err));
  }, []);

  const handleSave = () => {
    // If the category hasn't changed, just save and close.
    if (selectedCategoryId === initialCategoryId) {
      onUpdate(t.transferCategoryUpdated);
      return;
    }
    // If it has changed, show the migration modal.
    setShowMigrationModal(true);
  };

  const handleMigrationConfirm = (strategy) => {
    fetch(`${API_URL}/settings/transfer_category_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        value: selectedCategoryId,
        original_value: initialCategoryId,
        migration_strategy: strategy,
       }),
    })
    .then(res => {
      if (!res.ok) { return res.json().then(err => { throw new Error(err.detail); }); }
      onUpdate(t.transferCategoryUpdated);
      onComplete();
    })
    .catch(err => onUpdate(err.message, 'error'))
    .finally(() => {
      setShowMigrationModal(false);
    });
  };

  return (
    <>
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

      {showMigrationModal && (
        <TransferMigrationModal
          onConfirm={handleMigrationConfirm}
          onCancel={() => setShowMigrationModal(false)}
          t={t}
        />
      )}
    </>
  );
}

export default TransferCategorySelector;