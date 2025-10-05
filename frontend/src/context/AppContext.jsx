import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch, setActiveUser as setApiClientUser } from '../apiClient';

const AppContext = createContext();

export function AppProvider({ children }) {
    
  const [activeUser, _setActiveUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('activeUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) { return null; }
  });

  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  
  // All app-wide data now lives here
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balanceReportData, setBalanceReportData] = useState(null);
  const [balanceEvolutionData, setBalanceEvolutionData] = useState(null);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(c => c + 1);

  useEffect(() => {
    if (activeUser?.id) {
      setIsLoading(true);
      setApiClientUser(activeUser.id);
      
      // All global and dashboard data is fetched here, in the correct order
      Promise.all([
        apiFetch('/accounts/'),
        apiFetch('/categories/'),
        apiFetch('/reports/balance/'),
        apiFetch('/reports/balance-evolution/')
      ]).then(([accountsData, categoriesData, balanceData, evolutionData]) => {
        setAccounts(accountsData);
        setCategories(categoriesData);
        setBalanceReportData(balanceData);
        setBalanceEvolutionData(evolutionData);
        setIsLoading(false);
      }).catch(error => {
        console.error("Failed to load initial data", error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      setAccounts([]);
      setCategories([]);
    }
  }, [activeUser, refreshTrigger]);

  useEffect(() => {
    fetch(`/locales/${language}.json`).then(res => res.json()).then(setTranslations);
    localStorage.setItem('language', language);
  }, [language]);

  const handleSetUser = (user) => {
    localStorage.setItem('activeUser', JSON.stringify(user));
    _setActiveUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('activeUser');
    _setActiveUser(null);
  };


  const value = {
    isLoading, activeUser, handleSetUser, handleLogout,
    accounts, categories, balanceReportData, balanceEvolutionData,
    language, setLanguage, translations, t: (key) => translations?.[key] || key,
    triggerRefresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}