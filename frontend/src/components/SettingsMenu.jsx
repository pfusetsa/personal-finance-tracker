import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function SettingsMenu({ onManageCategories, onManageAccounts, onSetTransferCategory}) {

  const { handleLogout, t } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} title={ t('settings')} className="text-gray-500 hover:text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200">
          <ul className="py-1">
            <li onClick={() => { onManageCategories(); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{ t('manageCategories')}</li>
            <li onClick={() => { onManageAccounts(); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{ t('manageAccounts')}</li>
            <li onClick={() => { onSetTransferCategory(); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-t mt-1 pt-2">{ t('manageTransferCategory')}</li>
            <li onClick={() => { handleLogout(); setIsOpen(false); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-t mt-1 pt-2">{ t('logout')}</li>

          </ul>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;