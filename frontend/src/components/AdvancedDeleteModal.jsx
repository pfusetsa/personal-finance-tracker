import React, { useState } from 'react';

function AdvancedDeleteModal({ category, transactionCount, allCategories, onConfirm, onCancel, t }) {
  const [strategy, setStrategy] = useState('recategorize');
  const [targetCategoryId, setTargetCategoryId] = useState('');

  // Filter out the category being deleted from the dropdown list
  const availableCategories = allCategories.filter(c => c.id !== category.id);

  const isConfirmDisabled = strategy === 'recategorize' && !targetCategoryId;

  const handleConfirm = () => {
    onConfirm({
      strategy,
      target_category_id: strategy === 'recategorize' ? parseInt(targetCategoryId) : null,
    });
  };
  
  // Set a default target category when the component loads
  useState(() => {
    if (availableCategories.length > 0) {
      setTargetCategoryId(availableCategories[0].id);
    }
  }, [availableCategories]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{t.categoryInUseTitle || 'Category in Use'}</h3>
          <p className="text-gray-700 mb-4">
            {t.categoryInUseMessage?.replace('{name}', category.name).replace('{count}', transactionCount) || `The category "${category.name}" is used by ${transactionCount} transactions. What would you like to do?`}
          </p>
          
          <div className="space-y-4">
            {/* Option 1: Re-categorize */}
            <div>
              <label className="flex items-center space-x-2">
                <input type="radio" name="delete_strategy" value="recategorize" checked={strategy === 'recategorize'} onChange={() => setStrategy('recategorize')} />
                <span>{t.recategorizeTransactions || 'Re-categorize transactions to:'}</span>
              </label>
              <select 
                disabled={strategy !== 'recategorize' || availableCategories.length === 0}
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full mt-2 p-2 border rounded disabled:bg-gray-100"
              >
                {availableCategories.length > 0 ? (
                  availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  <option>{t.noOtherCategories || 'No other categories available'}</option>
                )}
              </select>
            </div>

            {/* Option 2: Delete All */}
            <div>
              <label className="flex items-center space-x-2">
                <input type="radio" name="delete_strategy" value="delete_transactions" checked={strategy === 'delete_transactions'} onChange={() => setStrategy('delete_transactions')} />
                <span className="text-red-700 font-medium">{t.deleteAllTransactions || 'Delete all associated transactions'}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button>
          <button 
            onClick={handleConfirm} 
            disabled={isConfirmDisabled}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
          >
            {t.confirmDeletion || 'Confirm Deletion'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedDeleteModal;