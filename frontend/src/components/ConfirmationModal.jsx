import React from 'react';
import { useAppContext } from '../context/AppContext'; 

function ConfirmationModal({ message, onConfirm, onCancel }) {
  const { t } = useAppContext(); 

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow rounded-lg w-full max-w-sm">
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t('delete')}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;