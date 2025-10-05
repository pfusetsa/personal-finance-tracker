import React, { useState, useEffect } from 'react';
import { apiFetch } from '../apiClient';
import { useAppContext } from '../context/AppContext';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector'; 

function UserSelector() { 
  const { handleSetUser, t } = useAppContext();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    first_name: '', 
    second_name: '', 
    surname: '',
    preferred_currency: 'EUR',
  });

  useEffect(() => {
    apiFetch('/users/').then(setUsers);
  }, []);

  const handleSelect = () => {
    const user = users.find(u => u.id === parseInt(selectedUserId));
    if (user) {
      handleSetUser(user);
    }
  };
  
  const handleCreateUser = (e) => {
    e.preventDefault();
    apiFetch('/users/', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }).then(createdUser => {
      handleSetUser(createdUser);
    });
  };

  const handleNewUserChange = (e) => {
    setNewUser({...newUser, [e.target.name]: e.target.value});
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">{t('welcomeMessage')}</h1>

        {!showCreateForm ? (
          <div className="space-y-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">{t('selectProfile')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {`${user.first_name} ${user.second_name || ''} ${user.surname}`}
                </option>
              ))}
            </select>
            <button 
              onClick={handleSelect}
              disabled={!selectedUserId}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {t('loadProfile')}
            </button>
            <div className="text-center">
              <button onClick={() => setShowCreateForm(true)} className="text-blue-600 hover:underline">
                {t('createNewProfile')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">{t('createNewProfile')}</h2>
            <input type="text" name="first_name" placeholder={t('firstName')} required value={newUser.first_name} onChange={handleNewUserChange} className="w-full p-2 border rounded" />
            <input type="text" name="second_name" placeholder={t('secondName')} value={newUser.second_name} onChange={handleNewUserChange} className="w-full p-2 border rounded" />
            <input type="text" name="surname" placeholder={t('surname')} required value={newUser.surname} onChange={handleNewUserChange} className="w-full p-2 border rounded" />
            
            <div>
              <label htmlFor="preferred_currency" className="block text-sm font-medium text-gray-700">{t('preferredCurrency')}</label>
              <select 
                id="preferred_currency"
                name="preferred_currency" 
                value={newUser.preferred_currency} 
                onChange={handleNewUserChange} 
                className="w-full p-2 border rounded mt-1 bg-white"
              >
                <option value="EUR">{t('euro')}</option>
                <option value="USD">{t('usDollar')}</option>
                <option value="GBP">{t('britishPound')}</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="w-full bg-gray-300 p-2 rounded-lg hover:bg-gray-400">{t('cancel')}</button>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{t('createAndLoad')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserSelector;