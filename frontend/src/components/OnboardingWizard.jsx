import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Logo from './Logo';
import AccountManager from './AccountManager';
import CategoryManager from './CategoryManager';
import Notification from './Notification';

function OnboardingWizard({ onComplete, step, setStep }) {
  const { t, activeUser, triggerRefresh } = useAppContext();
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleManagerUpdate = (message, type = 'success') => {
    if (type === 'error') {
      showNotification(message, 'error');
    } else {
      triggerRefresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Notification message={notification?.message} type={notification?.type} /> {/* <-- Add this line */}
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        {step === 'welcome' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{t('welcomeUser', {name: activeUser?.first_name})}</h1>
            <p className="text-gray-600 mb-8">{t('onboardingIntro')}</p>
            <button 
              onClick={() => setStep('accounts')} 
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              {t('letsBegin')}
            </button>
          </div>
        )}
        
        {step === 'accounts' && (
          <div>
            <h2 className="text-xl font-semibold mb-1">{t('step1Title')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('step1Subtitle')}</p>
            <div className="text-center my-4 text-gray-500 p-8 border rounded-lg bg-gray-50">
                <AccountManager onUpdate={handleManagerUpdate} />
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setStep('welcome')} className="w-1/3 bg-gray-300 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-400">{t('back')}</button>
              <button onClick={() => setStep('categories')} className="w-2/3 bg-blue-600 text-white p-3 rounded-lg font-semibold">{t('nextAddCategories')}</button>
            </div>
          </div>
        )}

        {step === 'categories' && (
          <div>
            <h2 className="text-xl font-semibold mb-1">{t('step2Title')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('step2Subtitle')}</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mb-4 rounded-r-lg" role="alert">
              <p className="text-sm">{t('onboardingTransferInfo')}</p>
            </div>

            <div className="my-4 p-4 border rounded-lg bg-gray-50">
              <CategoryManager onUpdate={handleManagerUpdate} />
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setStep('accounts')} className="w-1/3 bg-gray-300 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-400">{t('back')}</button>
              <button onClick={onComplete} className="w-2/3 bg-green-500 text-white p-3 rounded-lg font-semibold">{t('finishSetup')}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default OnboardingWizard;