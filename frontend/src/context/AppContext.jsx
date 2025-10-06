import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch, setActiveUser as setApiClientUser } from '../apiClient';
import { categoryColorPalette } from '../utils.js';

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
  const [categoryColorMap, setCategoryColorMap] = useState({});
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(c => c + 1);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/locales/${language}.json`)
      .then(res => res.json())
      .then(translationsData => {
        setTranslations(translationsData);

        if (activeUser?.id) {
          setApiClientUser(activeUser.id);
          
          // Once translations are loaded, fetch all user-specific data
          Promise.all([
            apiFetch('/accounts/'),
            apiFetch('/categories/'),
            apiFetch('/reports/balance/'),
            apiFetch('/reports/balance-evolution/'),
          ]).then(([accountsData, categoriesData, balanceData, evolutionData]) => {
            const t = (key) => translationsData?.[key] || key;
            const sortedCategories = [...categoriesData].sort((a, b) => {
              const nameA = t(a.i18n_key) || a.name;
              const nameB = t(b.i18n_key) || b.name;
              return nameA.localeCompare(nameB, language);
            });

            const colorMap = {};
            sortedCategories.forEach((cat, index) => {
              const displayName = t(cat.i18n_key) || cat.name;
              colorMap[displayName] = categoryColorPalette[index % categoryColorPalette.length];
            });

            setAccounts(accountsData);
            setCategories(sortedCategories);
            setCategoryColorMap(colorMap);
            setBalanceReportData(balanceData);
            setBalanceEvolutionData(evolutionData);

            if (accountsData.length === 0) {
              setShowOnboarding(true);
            } else {
              setShowOnboarding(false);
            }
            setIsLoading(false);
            }).catch(error => {
            console.error("Failed to load user data:", error);
            setIsLoading(false);
          });
        } else {
          // No user, so we are done loading.
          setIsLoading(false);
          setAccounts([]);
          setCategories([]);
        }
      })
      .catch(error => {
        console.error("Failed to load translations:", error);
        setIsLoading(false);
      });
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
    categoryColorMap,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}