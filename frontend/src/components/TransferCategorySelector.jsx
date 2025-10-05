import React, { useState, useEffect } from 'react';
import { apiFetch } from '../apiClient';
import { useAppContext } from '../context/AppContext';
import TransferMigrationModal from './TransferMigrationModal';
import PerTransactionManagerModal from './PerTransactionManagerModal';

function TransferCategorySelector({ onUpdate, onComplete }) {

  const { categories, t } = useAppContext();

  const [initialCategoryId, setInitialCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [modalStep, setModalStep] = useState('selection'); 

  useEffect(() => {
    apiFetch('/settings/transfer_category_id')
      .then(data => {
        if (data) {
          const id = data.value.toString();
          setInitialCategoryId(id);
          setSelectedCategoryId(id);
        }
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
      setModalStep('per_transaction');
      return;
    }

    apiFetch(`/settings/transfer_category_id`, {
      method: 'PUT',
      body: JSON.stringify({ 
        value: selectedCategoryId,
        original_value: initialCategoryId,
        migration_strategy: strategy,
      }),
    })
    .then(res => {
      handleFinalizeSettingUpdate(t('transferCategoryUpdated'));
    })
    .catch(err => onUpdate(err.message || 'An error occurred', 'error'));
  };

  const handlePerTxManageComplete = (didFinish) => {
    if (didFinish) {
      // If the user managed all transactions, save the new setting
      apiFetch(`/settings/transfer_category_id`, {
        method: 'PUT',
        body: JSON.stringify({ value: selectedCategoryId, migration_strategy: 'keep_unchanged' }),
      })
      .then(() => { // No need to parse JSON on a successful PUT
        handleFinalizeSettingUpdate(t('transferCategoryUpdated'));
      })
      .catch(err => onUpdate(err.message || 'An error occurred', 'error'));
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
          <p className="text-sm text-gray-600">{ t('transferCategoryInfo')}</p>
          <select 
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{t(cat.i18n_key) === cat.i18n_key ? cat.name : t(cat.i18n_key)}</option>
            ))}
          </select>
          <div className="flex justify-end">
            <button 
              onClick={handleSave} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              { t('save')}
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