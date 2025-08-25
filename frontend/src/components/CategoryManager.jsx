import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import AdvancedDeleteModal from './AdvancedDeleteModal';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

const API_URL = "http://127.0.0.1:8000";

function CategoryManager({ onUpdate, t }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [simpleDeleteTarget, setSimpleDeleteTarget] = useState(null);
  const [advancedDeleteTarget, setAdvancedDeleteTarget] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/categories/`).then(res => res.json()).then(data => setCategories(data));
  }, []);

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

  const apiCall = (endpoint, options) => {
    return fetch(endpoint, options).then(async (res) => {
      if (!res.ok) {
        throw await res.json();
      }
      return res.status === 204 ? null : res.json();
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    apiCall(`${API_URL}/categories/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategoryName }), })
      .then(newCategory => {
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        onUpdate(t.categoryAddedSuccess);
      })
      .catch(handleError);
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    apiCall(`${API_URL}/categories/${editingCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingCategory.name }), })
      .then(() => {
        setCategories(categories.map(cat => cat.id === editingCategory.id ? { ...cat, name: editingCategory.name } : cat));
        setEditingCategory(null);
        onUpdate(t.categoryUpdatedSuccess);
      })
      .catch(handleError);
  };

  const initiateDelete = (category) => {
    fetch(`${API_URL}/categories/${category.id}/transaction_count`).then(res => res.json())
      .then(data => {
        if (data.count > 0) {
          setAdvancedDeleteTarget({ category, count: data.count });
        } else {
          setSimpleDeleteTarget(category);
        }
      })
      .catch(handleError);
  };

  const confirmSimpleDelete = () => {
    if (!simpleDeleteTarget) return;
    apiCall(`${API_URL}/categories/${simpleDeleteTarget.id}`, { method: 'DELETE' })
      .then(() => {
        setCategories(categories.filter(cat => cat.id !== simpleDeleteTarget.id));
        setSimpleDeleteTarget(null);
        onUpdate(t.categoryDeletedSuccess);
      })
      .catch(err => { handleError(err); setSimpleDeleteTarget(null); });
  };
  
  const confirmAdvancedDelete = (options) => {
    const categoryId = advancedDeleteTarget.category.id;
    apiCall(`${API_URL}/categories/${categoryId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options) })
      .then(() => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        setAdvancedDeleteTarget(null);
        onUpdate(t.categoryDeletedSuccess);
      })
      .catch(err => { handleError(err); setAdvancedDeleteTarget(null); });
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
                <span>{category.name}</span>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setEditingCategory(category)} className="text-blue-600 hover:text-blue-800" title={t.edit}>
                    <EditIcon />
                  </button>
                  <button onClick={() => initiateDelete(category)} className="text-red-600 hover:text-red-800" title={t.delete}>
                    <DeleteIcon />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      
      {simpleDeleteTarget && ( <ConfirmationModal message={`${t.deleteConfirmMessage} "${simpleDeleteTarget.name}"?`} onConfirm={confirmSimpleDelete} onCancel={() => setSimpleDeleteTarget(null)} confirmText={t.delete} cancelText={t.cancel} /> )}
      {advancedDeleteTarget && ( <AdvancedDeleteModal category={advancedDeleteTarget.category} transactionCount={advancedDeleteTarget.count} allCategories={categories} onConfirm={confirmAdvancedDelete} onCancel={() => setAdvancedDeleteTarget(null)} t={t} /> )}
    </div>
  );
}

export default CategoryManager;