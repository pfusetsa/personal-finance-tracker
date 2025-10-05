import React, { useState } from 'react';
import { apiFetch } from '../apiClient';
import { useAppContext } from '../context/AppContext'; 
import ConfirmationModal from './ConfirmationModal';
import AdvancedAccountDeleteModal from './AdvancedAccountDeleteModal';

function AccountManager({ onUpdate }) {

  const { accounts, t, triggerRefresh } = useAppContext();

  const [newAccountName, setNewAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [simpleDeleteTarget, setSimpleDeleteTarget] = useState(null);
  const [advancedDeleteTarget, setAdvancedDeleteTarget] = useState(null);

  const handleError = (error) => {
    const detail = error.detail || error.toString();
    onUpdate(detail, 'error');
  };  

  const handleAddAccount = (e) => {
    e.preventDefault();
    apiFetch('/accounts/', { method: 'POST', body: JSON.stringify({ name: newAccountName }) })
    .then(() => {
        triggerRefresh(); // 5. Tell the context to refetch all global data
        setNewAccountName('');
        onUpdate(t('accountAddedSuccess'));
      })
      .catch(handleError);
  };

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    apiFetch(`/accounts/${editingAccount.id}`, { method: 'PUT', body: JSON.stringify({ name: editingAccount.name }) })
      .then(() => {
        triggerRefresh(); // 5. Tell the context to refetch
        setEditingAccount(null);
        onUpdate(t('accountUpdatedSuccess'));
      })
      .catch(handleError);
  };

  const initiateDelete = (account) => {
    apiFetch(`/accounts/${account.id}/transaction_count`)
      .then(data => {
        if (data.count > 0) {
          setAdvancedDeleteTarget({ account, count: data.count });
        } else {
          setSimpleDeleteTarget(account);
        }
      });
  };

  const confirmSimpleDelete = () => {
    if (!simpleDeleteTarget) return;
    apiFetch(`/accounts/${simpleDeleteTarget.id}`, { method: 'DELETE' })
      .then(() => {
        triggerRefresh(); // 5. Tell the context to refetch
        setSimpleDeleteTarget(null);
        onUpdate(t('accountDeletedSuccess'));
      })
      .catch(err => { handleError(err); setSimpleDeleteTarget(null); });
  };
  
  const confirmAdvancedDelete = (options) => {
    const accountId = advancedDeleteTarget.account.id;
    apiFetch(`/accounts/${accountId}`, { method: 'DELETE', body: JSON.stringify(options) })
      .then(() => {
        triggerRefresh(); // 5. Tell the context to refetch
        setAdvancedDeleteTarget(null);
        onUpdate(t('accountDeletedSuccess'));
      })
      .catch(err => { handleError(err); setAdvancedDeleteTarget(null); });
  };

  return (
    <div>
      <form onSubmit={handleAddAccount} className="flex space-x-2 mb-6">
        <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="flex-grow p-2 border rounded" placeholder={t('newAccountPlaceholder')} required />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('add')}</button>
      </form>
      <ul className="space-y-2">
        {accounts.map(account => (
          <li key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            {editingAccount?.id === account.id ? (
              <form onSubmit={handleUpdateAccount} className="flex-grow flex space-x-2">
                <input type="text" value={editingAccount.name} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} className="flex-grow p-1 border rounded" autoFocus />
                <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">{t('save')}</button>
                <button type="button" onClick={() => setEditingAccount(null)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">{t('cancel')}</button>
              </form>
            ) : (
              <>
                <span>{account.name}</span>
                <div className="space-x-2">
                  <button onClick={() => setEditingAccount(account)} className="text-blue-600 hover:text-blue-800">{t('edit')}</button>
                  <button onClick={() => initiateDelete(account)} className="text-red-600 hover:text-red-800">{t('delete')}</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {simpleDeleteTarget && (<ConfirmationModal message={`${t('deleteConfirmMessage')} "${simpleDeleteTarget.name}"?`} onConfirm={confirmSimpleDelete} onCancel={() => setSimpleDeleteTarget(null)} confirmText={t('delete')} cancelText={t('cancel')} />)}
      {advancedDeleteTarget && ( <AdvancedAccountDeleteModal account={advancedDeleteTarget.account} transactionCount={advancedDeleteTarget.count} allAccounts={accounts} onConfirm={confirmAdvancedDelete} onCancel={() => setAdvancedDeleteTarget(null)} t={t} /> )}
    </div>
  );
}

export default AccountManager;