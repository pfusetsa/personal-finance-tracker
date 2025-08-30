import React from 'react';

function TransferMigrationModal({ onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow rounded-lg w-full max-w-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{t.migrationModalTitle}</h3>
          <p className="text-gray-700 mb-6">{t.migrationModalMessage}</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => onConfirm('move_all')}
              className="w-full text-left p-4 border rounded-lg hover:bg-blue-50"
            >
              <h4 className="font-semibold text-blue-800">{t.moveAllButton}</h4>
              <p className="text-sm text-gray-600">{t.moveAllDescription}</p>
            </button>
            <button 
              onClick={() => onConfirm('keep_unchanged')}
              className="w-full text-left p-4 border rounded-lg hover:bg-gray-100"
            >
              <h4 className="font-semibold">{t.keepUnchangedButton}</h4>
              <p className="text-sm text-gray-600">{t.keepUnchangedDescription}</p>
            </button>
            <button 
              onClick={() => onConfirm('per_transaction')}
              className="w-full text-left p-4 border rounded-lg hover:bg-gray-100"
            >
              <h4 className="font-semibold">{t.perTransactionChoice}</h4>
              <p className="text-sm text-gray-600">{t.perTransactionChoiceDescription}</p>
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}

export default TransferMigrationModal;