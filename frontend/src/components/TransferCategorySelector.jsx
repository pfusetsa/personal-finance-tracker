import React, { useState, useEffect } from 'react';
import TransferMigrationModal from './TransferMigrationModal';
import PerTransactionManagerModal from './PerTransactionManagerModal';

const API_URL = "http://127.0.0.1:8000";

function TransferCategorySelector({ categories, onUpdate, t, onComplete }) {
  const [initialCategoryId, setInitialCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [modalStep, setModalStep] = useState('selection'); 

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
    if (selectedCategoryId === initialCategoryId) {
      onComplete();
      return;
    }
    setModalStep('migrate'); // Show the migration choice modal
  };

  const handleFinalizeSettingUpdate = (message) => {
    onUpdate(message);
    onComplete();
  };

  const handleMigrationConfirm = (strategy) => {
    if (strategy === 'per_transaction') {
      setModalStep('per_transaction'); // Show the per-transaction modal
      return;
    }

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
      handleFinalizeSettingUpdate(t.transferCategoryUpdated);
    })
    .then(() => { handleFinalizeSettingUpdate(t.transferCategoryUpdated); })
    .catch(err => onUpdate(err.message, 'error'));
  };

  const handlePerTxManageComplete = (didFinish) => {
    if (didFinish) {
      // If the user managed all transactions, save the new setting
      fetch(`${API_URL}/settings/transfer_category_id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: selectedCategoryId, migration_strategy: 'keep_unchanged' }),
      })
      .then(res => {
        if (!res.ok) { return res.json().then(err => { throw new Error(err.detail); }); }
        handleFinalizeSettingUpdate(t.transferCategoryUpdated);
      })
      .then(() => { handleFinalizeSettingUpdate(t.transferCategoryUpdated); })
      .catch(err => onUpdate(err.message, 'error'));
    }
  };

  const handlePerTxManageClose = () => {
    // User closed the modal early, so we go back to the previous step.
    setModalStep('migrate');
  };

  const categoryToManage = categories.find(c => String(c.id) === String(initialCategoryId));

  return (
    <>
      {modalStep === 'selection' && (
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
      )}

      {modalStep === 'migrate' && (
        <TransferMigrationModal
          onConfirm={handleMigrationConfirm}
          onCancel={() => setModalStep('selection')}
          t={t}
        />
      )}

      {modalStep === 'per_transaction' && categoryToManage && (
        <PerTransactionManagerModal
          t={t}
          onComplete={handlePerTxManageComplete}
          onClose={handlePerTxManageClose}
          categoryToManage={categoryToManage}
          availableActions={['recategorize', 'keep', 'delete']}
          allCategories={categories}
          newTransferCategoryId={selectedCategoryId}
        />
      )}
    </>
  );
}

export default TransferCategorySelector;