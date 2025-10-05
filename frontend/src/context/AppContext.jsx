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
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(c => c + 1);

  useEffect(() => {
    const loadAppData = async () => {
      if (activeUser?.id) {
        setIsLoading(true);
        setApiClientUser(activeUser.id);

        try {
          const [
            accountsData, 
            categoriesData, 
            balanceData, 
            evolutionData,
            translationsData
          ] = await Promise.all([
            apiFetch('/accounts/'),
            apiFetch('/categories/'),
            apiFetch('/reports/balance/'),
            apiFetch('/reports/balance-evolution/'),
            fetch(`/locales/${language}.json`).then(res => res.json())
          ]);

          setTranslations(translationsData);
          setAccounts(accountsData);
          setCategories(categoriesData);
          setBalanceReportData(balanceData);
          setBalanceEvolutionData(evolutionData);

          if (accountsData.length === 0) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Failed to load initial data", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAccounts([]);
        setCategories([]);
        setIsLoading(false);
      }
    };

    loadAppData();
  }, [activeUser, refreshTrigger, language]);

  const handleSetUser = (user) => {
    localStorage.setItem('activeUser', JSON.stringify(user));
    _setActiveUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('activeUser');
    _setActiveUser(null);
  };

  const completeOnboarding = () => setShowOnboarding(false);

  const value = {
    isLoading, 
    activeUser, 
    handleSetUser, 
    handleLogout,
    accounts, 
    categories, 
    balanceReportData, 
    balanceEvolutionData,
    language, 
    setLanguage, 
    translations, 
    triggerRefresh,
    showOnboarding,
    completeOnboarding,
    t: (key, params) => {
      if (!translations || !translations[key]) return key;
      let text = translations[key];
      if (params) {
        Object.keys(params).forEach(p => {
          const regex = new RegExp(`\\{${p}\\}`, 'g');
          text = text.replace(regex, params[p]);
        });
      }
      return text;
    },
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}