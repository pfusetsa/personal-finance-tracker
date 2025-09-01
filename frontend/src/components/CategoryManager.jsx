import React, { useState, useEffect } from 'react';
import { apiFetch } from '../apiClient'; 
import ConfirmationModal from './ConfirmationModal';
import AdvancedDeleteModal from './AdvancedDeleteModal';
import PerTransactionManagerModal from './PerTransactionManagerModal';
import TransferCategoryDeleteModal from './TransferCategoryDeleteModal';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

function CategoryManager({ onUpdate, t }) {
  const [categories, setCategories] = useState([]);
  const [transferCategoryId, setTransferCategoryId] = useState(null);
  const [perTxManageTarget, setPerTxManageTarget] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [simpleDeleteTarget, setSimpleDeleteTarget] = useState(null);
  const [advancedDeleteTarget, setAdvancedDeleteTarget] = useState(null);
  const [transferDeleteTarget, setTransferDeleteTarget] = useState(null);

  const fetchCategories = () => {
    apiFetch('/categories/').then(setCategories).catch(handleError);
  };
  
  const fetchTransferCategorySetting = () => {
    apiFetch('/settings/transfer_category_id')
      .then(data => setTransferCategoryId(data ? parseInt(data.value) : null))
      .catch(() => setTransferCategoryId(null));
  };

  useEffect(() => { fetchCategories(); fetchTransferCategorySetting(); }, []);

  const handleError = (error) => {
    const detail = error.detail || error;
    if (detail && detail.key) {
      const camelCaseKey = detail.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const translationKey = `${camelCaseKey}Error`;
      
      if (t[translationKey]) {
        let message = t[translationKey];
        if (detail.params) {
          for (const [key, value] of Object.entries(detail.params)) {
            message = message.replace(`{${key}}`, value);
          }
        }
        onUpdate(message, 'error');
        return;
      }
    }
    onUpdate(detail || 'An unknown error occurred.', 'error');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    apiFetch('/categories/', { method: 'POST', body: JSON.stringify({ name: newCategoryName }) })
      .then(newCategory => {
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        onUpdate(t.categoryAddedSuccess);
      })
      .catch(handleError);
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    apiFetch(`/categories/${editingCategory.id}`, { method: 'PUT', body: JSON.stringify({ name: editingCategory.name }), })
      .then(() => {
        setCategories(categories.map(cat => cat.id === editingCategory.id ? { ...cat, name: editingCategory.name } : cat));
        setEditingCategory(null);
        onUpdate(t.categoryUpdatedSuccess);
      })
      .catch(handleError);
  };

  const confirmSimpleDelete = () => {
    if (!simpleDeleteTarget) return;
    apiFetch(`/categories/${simpleDeleteTarget.id}`, { method: 'DELETE' })
      .then(() => {
        setCategories(categories.filter(cat => cat.id !== simpleDeleteTarget.id));
        setSimpleDeleteTarget(null);
        onUpdate(t.categoryDeletedSuccess);
      })
      .catch(err => { handleError(err); setSimpleDeleteTarget(null); });
  };
  
  const initiateDelete = (category) => {
    // Check if the category is the active transfer category
    if (category.id === transferCategoryId) {
      onUpdate(t.cannotDeleteTransferCategoryError, 'error');
      return;
    }

    apiFetch(`/categories/${category.id}/transaction_count`)
      .then(data => {
        if (data.count > 0) {
          setAdvancedDeleteTarget({ category, count: data.count });
        } else {
          setSimpleDeleteTarget(category);
        }
      })
      .catch(handleError);
  };

  const confirmAdvancedDelete = (options) => {
    if (options.strategy === 'per_transaction') {
      setPerTxManageTarget(advancedDeleteTarget.category);
      setAdvancedDeleteTarget(null);
      return;
    }
    const categoryId = advancedDeleteTarget.category.id;
    apiFetch(`/categories/${categoryId}`, { method: 'DELETE', body: JSON.stringify(options) })
      .then(() => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        setAdvancedDeleteTarget(null);
        onUpdate(t.categoryDeletedSuccess);
      })
      .catch(err => { handleError(err); setAdvancedDeleteTarget(null); });
  };

  const handlePerTxManageComplete = () => {
    const categoryToDelete = perTxManageTarget;
    setPerTxManageTarget(null);
    // User explicitly finished, so we attempt to delete the now-empty category.
    apiFetch(`/categories/${categoryToDelete.id}`, { method: 'DELETE' })
      .then(() => {
        onUpdate(t.categoryDeletedSuccess);
        fetchCategories();
      })
      .catch(() => { fetchCategories(); });
  };

  const handlePerTxManageClose = () => {
    // User cancelled, so we just close the modal and do nothing.
    setPerTxManageTarget(null);
  };


  return (
    <div>
      <form onSubmit={handleAddCategory} className="flex space-x-2 mb-6">
        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow p-2 border rounded" placeholder={t.newCategoryPlaceholder} required />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t.add}</button>
      </form>
      <ul className="space-y-2">
        {categories.map(category => (
          <li key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            {editingCategory?.id === category.id ? (
              <form onSubmit={handleUpdateCategory} className="flex-grow flex space-x-2">
                <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} className="flex-grow p-1 border rounded" autoFocus />
                <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">{t.save}</button>
                <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">{t.cancel}</button>
              </form>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span>{category.name}</span>
                  {category.id === transferCategoryId && <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{t.transfer || 'Transfer'}</span>}
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setEditingCategory(category)} className="text-blue-600 hover:text-blue-800" title={t.edit}><EditIcon /></button>
                  <button onClick={() => initiateDelete(category)} className="text-red-600 hover:text-red-800" title={t.delete}><DeleteIcon /></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      
      {simpleDeleteTarget && ( <ConfirmationModal message={`${t.deleteConfirmMessage} "${simpleDeleteTarget.name}"?`} onConfirm={confirmSimpleDelete} onCancel={() => setSimpleDeleteTarget(null)} confirmText={t.delete} cancelText={t.cancel} /> )}
      {advancedDeleteTarget && ( <AdvancedDeleteModal category={advancedDeleteTarget.category} transactionCount={advancedDeleteTarget.count} allCategories={categories} onConfirm={confirmAdvancedDelete} onCancel={() => setAdvancedDeleteTarget(null)} t={t} /> )}
      {perTxManageTarget && (
        <PerTransactionManagerModal
          t={t}
          onComplete={handlePerTxManageComplete}
          onClose={handlePerTxManageClose}
          categoryToManage={perTxManageTarget}
          availableActions={['recategorize', 'delete']}
          allCategories={categories.filter(c => c.id !== perTxManageTarget.id)}
        />
      )}
    </div>
  );
}

export default CategoryManager;