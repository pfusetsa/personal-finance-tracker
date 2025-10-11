import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../apiClient';
import { formatMoney } from '../utils';

function PendingConfirmation({ onConfirm }) {
  const { t, triggerRefresh } = useAppContext();
  const [pending, setPending] = useState([]);

  useEffect(() => {
    // Fetch due transactions when the component mounts or a refresh is triggered
    apiFetch('/transactions/pending')
      .then(setPending)
      .catch(err => console.error("Failed to fetch pending transactions", err));
  }, [triggerRefresh]);

  const handleSkip = (txId) => {
    // Calling the DELETE endpoint will remove just this one pending transaction
    apiFetch(`/transactions/${txId}`, { method: 'DELETE' })
      .then(() => {
        triggerRefresh(); // Refresh all app data
      });
  };

  // If there are no pending transactions, don't render anything
  if (pending.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg shadow">
      <h3 className="font-bold text-yellow-800">{t('paymentsToConfirm', { default: 'Payments to Confirm' })}</h3>
      <ul className="mt-2 space-y-2">
        {pending.map(tx => (
          <li key={tx.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-yellow-100">
            <div>
              <p className="font-semibold text-gray-800">{tx.description} ({tx.date})</p>
              <p className="text-gray-600">{t(tx.category.i18n_key) || tx.category.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(tx.amount, tx.currency)}</span>
              <button onClick={() => onConfirm(tx)} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-semibold hover:bg-green-600">{t('confirmAndFinish')}</button>
              <button onClick={() => handleSkip(tx.id)} className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-semibold hover:bg-gray-600">{t('delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PendingConfirmation;