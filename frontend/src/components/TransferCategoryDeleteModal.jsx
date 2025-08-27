import React, { useState, useEffect } from 'react';

function TransferCategoryDeleteModal({ category, allCategories, onConfirm, onCancel, t }) {
  const [newTransferCategoryId, setNewTransferCategoryId] = useState('');

  // Filter out the category being deleted to create the list of available replacements
  const availableCategories = allCategories.filter(c => c.id !== category.id);
  
  // Set a default selection when the component loads
  useEffect(() => {
    if (availableCategories.length > 0) {
      setNewTransferCategoryId(availableCategories[0].id);
    }
  }, []);

  const handleConfirm = () => {
    // Pass the selected new category ID to the parent handler
    onConfirm(parseInt(newTransferCategoryId));
  };

  const isConfirmDisabled = !newTransferCategoryId || availableCategories.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{t.transferCategoryInUseTitle}</h3>
          <p className="text-gray-700 mb-4">
            {t.transferCategoryInUseMessage?.replace('{name}', category.name)}
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t.selectNewTransferCategory}</label>
            <select 
              value={newTransferCategoryId}
              onChange={(e) => setNewTransferCategoryId(e.target.value)}
              className="w-full mt-2 p-2 border rounded disabled:bg-gray-100"
              disabled={availableCategories.length === 0}
            >
              {availableCategories.length > 0 ? (
                availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                <option>{t.noOtherCategories || 'No other categories available'}</option>
              )}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button>
          <button 
            onClick={handleConfirm} 
            disabled={isConfirmDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferCategoryDeleteModal;