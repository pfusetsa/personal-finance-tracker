import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatMoney } from '../utils.js';
import { apiFetch } from '../apiClient';
import Spinner from './Spinner';
import Modal from './Modal';

const API_URL = "http://127.0.0.1:8000";

function PerTransactionManagerModal({ onComplete, onClose, categoryToManage, availableActions, allCategories, newTransferCategoryId }) {

  const { t } = useAppContext();

  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [targetCategoryId, setTargetCategoryId] = useState(allCategories.length > 0 ? allCategories[0].id : '');

  useEffect(() => {
    if (categoryToManage && categoryToManage.id) {
      setIsLoading(true);
      apiFetch(`/transactions/?category_ids=${categoryToManage.id}&page_size=10000`)
        .then(data => { setTransactions(data.transactions || []); })
        .finally(() => setIsLoading(false));
    } else {
      setTransactions([]);
      setIsLoading(false);
    }
  }, [categoryToManage]);

  const handleApplyAction = (action) => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);

    const instructions = Array.from(selectedIds).map(id => ({
      transaction_id: id,
      action: action,
      target_category_id: action === 'recategorize' ? (newTransferCategoryId || parseInt(targetCategoryId)) : null,
    }));

    apiFetch(`/transactions/batch-process`, {
      method: 'POST',
      body: JSON.stringify({ instructions }),
    })
    .then(() => {
      setTransactions(prev => prev.filter(tx => !selectedIds.has(tx.id)));
      setSelectedIds(new Set());
    })
    .finally(() => setIsLoading(false));
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(transactions.map(tx => tx.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = selectedIds.size > 0 && selectedIds.size === transactions.length;
  const isMoveDisabled = availableActions.includes('recategorize') && !targetCategoryId && !newTransferCategoryId;
  const isConfirmDisabled = transactions.length > 0;

  return (
    <Modal title={ t('manageTransactionsTitle')} onClose={onClose}>
      <div className="flex flex-col" style={{ height: '70vh' }}>
        {isLoading && <Spinner />}
        <p className="text-sm text-gray-500 mb-4">{ t('transactionsToManage').replace('{count}', transactions.length)}</p>
        
        <div className="p-4 flex flex-wrap items-center gap-4 bg-gray-50 rounded-md">
          <span className="text-sm font-medium">{ t('applyToAction')}:</span>
          {availableActions.includes('keep') && <button onClick={() => handleApplyAction('keep')} disabled={selectedIds.size === 0} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">{ t('keep')}</button>}
          {availableActions.includes('recategorize') && (
            <div className="flex items-center space-x-2">
              <button onClick={() => handleApplyAction('recategorize')} disabled={selectedIds.size === 0 || isMoveDisabled} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{ t('move')}</button>
              {!newTransferCategoryId && <select value={targetCategoryId} onChange={e => setTargetCategoryId(e.target.value)} className="p-1 border rounded text-sm"><option value="">{ t('selectTargetCategory')}</option>{allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
            </div>
          )}
          {availableActions.includes('delete') && <button onClick={() => handleApplyAction('delete')} disabled={selectedIds.size === 0} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{ t('delete')}</button>}
        </div>

        <div className="flex-grow overflow-y-auto mt-4 border rounded-md">
          <table className="min-w-full">
            <thead className="bg-gray-100 sticky top-0 z-10"><tr>
              <th className="p-2"><input type="checkbox" checked={allSelected} onChange={handleSelectAll} /></th>
              <th className="p-2 text-left text-xs font-medium text-gray-500">{ t('date')}</th>
              <th className="p-2 text-left text-xs font-medium text-gray-500">{ t('description')}</th>
              <th className="p-2 text-right text-xs font-medium text-gray-500">{ t('amount')}</th>
            </tr></thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b">
                  <td className="p-2"><input type="checkbox" checked={selectedIds.has(tx.id)} onChange={() => handleSelect(tx.id)} /></td>
                  <td className="p-2 text-sm text-gray-500">{tx.date}</td>
                  <td className="p-2 text-sm">{tx.description}</td>
                  <td className={`p-2 text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end pt-4 mt-auto">
          <button 
            onClick={onComplete} 
            disabled={isConfirmDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isConfirmDisabled ?  t('confirmAndFinish') :  t('allTransactionsManaged')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PerTransactionManagerModal;