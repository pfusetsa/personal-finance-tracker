import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

const API_URL = "http://127.0.0.1:8000";

function CategoryManager({ onUpdate, t }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/categories/`).then(res => res.json()).then(data => setCategories(data));
  }, []);

  const handleError = (error) => {
    if (error && error.key) {
      // Convert snake_case from API (e.g., category_exists) to camelCase for JS (categoryExists)
      const camelCaseKey = error.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const translationKey = `${camelCaseKey}Error`; // e.g., categoryExistsError

      if (t[translationKey]) {
        let message = t[translationKey];
        if (error.params) {
          for (const [key, value] of Object.entries(error.params)) {
            message = message.replace(`{${key}}`, value);
          }
        }
        onUpdate(message, 'error');
        return; // Exit after handling the specific error
      }
    }
    // Fallback for all other errors
    onUpdate(error.message || error.detail || 'An unknown error occurred.', 'error');
  };

  const apiCall = (endpoint, options) => {
    return fetch(endpoint, options)
      .then(async (res) => {
        if (!res.ok) {
          const errorBody = await res.json();
          throw errorBody;
        }
        if (res.status === 204) { return null; }
        return res.json();
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
      .catch(err => handleError(err.detail || err));
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    apiCall(`${API_URL}/categories/${deletingCategory.id}`, { method: 'DELETE' })
      .then(() => {
        setCategories(categories.filter(cat => cat.id !== deletingCategory.id));
        setDeletingCategory(null);
        onUpdate(t.categoryDeletedSuccess);
      })
      .catch(err => {
        handleError(err.detail || err);
        setDeletingCategory(null);
      });
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    apiCall(`${API_URL}/categories/${editingCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingCategory.name }), })
      .then(() => {
        setCategories(categories.map(cat => cat.id === editingCategory.id ? { ...cat, name: editingCategory.name } : cat));
        setEditingCategory(null);
        onUpdate(t.categoryUpdatedSuccess);
      })
      .catch(err => handleError(err.detail || err));
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
                <div className="space-x-2">
                  <button onClick={() => setEditingCategory(category)} className="text-blue-600 hover:text-blue-800">{t.edit}</button>
                  <button onClick={() => setDeletingCategory(category)} className="text-red-600 hover:text-red-800">{t.delete}</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {deletingCategory && ( <ConfirmationModal message={`${t.deleteConfirmMessage} "${deletingCategory.name}"?`} onConfirm={confirmDeleteCategory} onCancel={() => setDeletingCategory(null)} confirmText={t.delete} cancelText={t.cancel} /> )}
    </div>
  );
}

export default CategoryManager;