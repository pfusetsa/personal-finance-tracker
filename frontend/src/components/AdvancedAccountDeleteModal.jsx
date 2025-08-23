import React, { useState } from 'react';

function AdvancedAccountDeleteModal({ account, transactionCount, allAccounts, onConfirm, onCancel, t }) {
  const [strategy, setStrategy] = useState('reassign');
  const [targetAccountId, setTargetAccountId] = useState('');

  const availableAccounts = allAccounts.filter(a => a.id !== account.id);

  const isConfirmDisabled = strategy === 'reassign' && !targetAccountId;

  const handleConfirm = () => {
    onConfirm({
      strategy,
      target_account_id: strategy === 'reassign' ? parseInt(targetAccountId) : null,
    });
  };
  
  useState(() => {
    if (availableAccounts.length > 0) {
      setTargetAccountId(availableAccounts[0].id);
    }
  }, [availableAccounts]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{t.accountInUseTitle}</h3>
          <p className="text-gray-700 mb-4">
            {t.accountInUseMessage?.replace('{name}', account.name).replace('{count}', transactionCount)}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input type="radio" name="delete_strategy" value="reassign" checked={strategy === 'reassign'} onChange={() => setStrategy('reassign')} />
                <span>{t.reassignTransactions}</span>
              </label>
              <select 
                disabled={strategy !== 'reassign' || availableAccounts.length === 0}
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full mt-2 p-2 border rounded disabled:bg-gray-100"
              >
                {availableAccounts.length > 0 ? (
                  availableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                ) : (
                  <option>{t.noOtherAccounts}</option>
                )}
              </select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input type="radio" name="delete_strategy" value="delete_transactions" checked={strategy === 'delete_transactions'} onChange={() => setStrategy('delete_transactions')} />
                <span className="text-red-700 font-medium">{t.deleteAllTransactions}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button>
          <button onClick={handleConfirm} disabled={isConfirmDisabled} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300">
            {t.confirmDeletion}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAccountDeleteModal;