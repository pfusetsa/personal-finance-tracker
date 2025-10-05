import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from './context/AppContext';
import { categoryColorPalette } from './utils.js';
import { apiFetch } from './apiClient';

import AccountManager from './components/AccountManager.jsx';
import AddTransactionForm from './components/AddTransactionForm';
import AddTransferForm from './components/AddTransferForm.jsx';
import BalanceEvolutionChart from './components/BalanceEvolutionChart.jsx';
import BalanceReport from './components/BalanceReport';
import BalanceReportSkeleton from './components/skeletons/BalanceReportSkeleton.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import ChartCard from './components/ChartCard.jsx';
import ChartFilters from './components/ChartFilters.jsx';
import ChartSkeleton from './components/skeletons/ChartSkeleton.jsx';
import Chat from './components/Chat.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import EditTransactionForm from './components/EditTransactionForm';
import EditTransferForm from './components/EditTransferForm.jsx';
import FloatingActionButton from './components/FloatingActionButton.jsx';
import IncomeExpenseChart from './components/IncomeExpenseChart.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';
import Logo from './components/Logo.jsx';
import Modal from './components/Modal.jsx';
import Notification from './components/Notification';
import OnboardingWizard from './components/OnboardingWizard.jsx';
import Pagination from './components/Pagination';
import RecurrentChart from './components/RecurrentChart.jsx';
import RecurrenceModal from './components/RecurrenceModal.jsx';
import SettingsMenu from './components/SettingsMenu.jsx';
import Spinner from './components/Spinner';
import TransactionFilters from './components/TransactionFilters';
import TransactionList from './components/TransactionList';
import TransactionListSkeleton from './components/skeletons/TransactionListSkeleton.jsx';
import TransferCategorySelector from './components/TransferCategorySelector.jsx';
import UserSelector from './components/UserSelector.jsx';

const PAGE_SIZE = 10;
const initialCardVisibility = { incomeVsExpenses: true, category: true, recurrent: true };

function App() {
  // --- Global State & Functions from Context ---
  const { 
    isLoading, activeUser, t, handleSetUser,
    accounts, categories, balanceReportData, balanceEvolutionData,
    triggerRefresh, showOnboarding, completeOnboarding
  } = useAppContext();

  // --- Local State (for UI interaction and non-global data) ---
  const [transactionsData, setTransactionsData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeForm, setActiveForm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState('categories');
  const [chartPeriod, setChartPeriod] = useState('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [categoryChartType, setCategoryChartType] = useState('expense');
  const [isFiltering, setIsFiltering] = useState(false);
  const [cardVisibility, setCardVisibility] = useState(() => { try { const saved = localStorage.getItem('cardVisibility'); return saved ? JSON.parse(saved) : initialCardVisibility; } catch (e) { return initialCardVisibility; } });
  const [filters, setFilters] = useState({
    accountIds: [],
    categoryIds: [],
    dateRange: { start: '', end: '' },
    description: '',
    recurrent: null, // can be true, false, or null for 'all'
    amountRange: { min: '', max: '' },
    sort: { by: 'date', order: 'desc' },
  });
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [recurrenceModalIsOpen, setRecurrenceModalIsOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [incomeExpenseData, setIncomeExpenseData] = useState(null);
  const [categorySummaryData, setCategorySummaryData] = useState(null);
  const [recurrentData, setRecurrentData] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState('welcome');
  
  // --- Local useEffects ---
  useEffect(() => {
    if (!activeUser || isLoading) return;

    let startDate;
    let endDate = new Date().toISOString().split('T')[0];

    if (chartPeriod === '1m') { const d = new Date(); d.setMonth(d.getMonth() - 1); startDate = d.toISOString().split('T')[0]; } 
    else if (chartPeriod === '6m') { const d = new Date(); d.setMonth(d.getMonth() - 6); startDate = d.toISOString().split('T')[0]; } 
    else if (chartPeriod === '1y') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); startDate = d.toISOString().split('T')[0]; } 
    else if (chartPeriod === 'all') { startDate = '1970-01-01'; } 
    else if (chartPeriod === 'custom' && customDates.start && customDates.end) { startDate = customDates.start; endDate = customDates.end; } 
    else { return; }
    
    // Fetch chart-specific data that depends on the date filters
    setCategorySummaryData(null); setIncomeExpenseData(null); setRecurrentData(null);
    apiFetch(`/reports/category-summary/?start_date=${startDate}&end_date=${endDate}&transaction_type=${categoryChartType}`).then(setCategorySummaryData);
    apiFetch(`/reports/monthly-income-expense-summary/?start_date=${startDate}&end_date=${endDate}`).then(setIncomeExpenseData);
    apiFetch(`/reports/recurrent-summary/?start_date=${startDate}&end_date=${endDate}`).then(setRecurrentData);

  }, [activeUser, isLoading, triggerRefresh, chartPeriod, customDates, categoryChartType]);

  
  useEffect(() => {
    if (!activeUser || isLoading) return;
    setIsFiltering(true);

    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 300; 

    const params = new URLSearchParams({
      page: currentPage,
      page_size: PAGE_SIZE,
      sort_by: filters.sort.by,
      sort_order: filters.sort.order,
    });

    if (filters.description) params.append('search', filters.description);
    if (filters.dateRange.start) params.append('start_date', filters.dateRange.start);
    if (filters.dateRange.end) params.append('end_date', filters.dateRange.end);
    if (filters.recurrent !== null) params.append('recurrent', filters.recurrent);
    if (filters.amountRange.min) params.append('amount_min', filters.amountRange.min);
    if (filters.amountRange.max) params.append('amount_max', filters.amountRange.max);
    
    filters.accountIds.forEach(id => params.append('account_ids', id));
    filters.categoryIds.forEach(id => params.append('category_ids', id));

    const queryString = params.toString();

    apiFetch(`/transactions/?${queryString}`)
      .then(data => {
        const elapsedTime = Date.now() - startTime;
        const delay = Math.max(MIN_DISPLAY_TIME - elapsedTime, 0);
        
        setTimeout(() => {
          setTransactionsData(data);
          setIsFiltering(false);
        }, delay);
      })
      .catch(() => setIsFiltering(false));
  }, [activeUser, isLoading, currentPage, triggerRefresh, filters]);

  useEffect(() => { localStorage.setItem('cardVisibility', JSON.stringify(cardVisibility)); }, [cardVisibility]);
  useEffect(() => { const handleKeyDown = (event) => { if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) { return; } if (event.key === 'Escape') { setActiveForm(null); setEditingTransaction(null); setShowSettings(false); setShowChat(false); setDeletingTransaction(null); } if (event.key.toLowerCase() === 'n') { event.preventDefault(); setActiveForm('transaction'); } if (event.key.toLowerCase() === 't') { event.preventDefault(); setActiveForm('transfer'); } if (event.key.toLowerCase() === 'a') { event.preventDefault(); setShowChat(true); } }; window.addEventListener('keydown', handleKeyDown); return () => { window.removeEventListener('keydown', handleKeyDown); }; }, []);

// --- Local Handlers ---
  const handleFilterChange = useCallback((newFilterValues) => { setFilters(prev => ({ ...prev, ...newFilterValues })); setCurrentPage(1); }, []);
  const showNotification = (message, type = 'success') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000); };
  const handleDataUpdate = (message, type = 'success') => { triggerRefresh(); showNotification(message, type); };
  const handleTransactionSuccess = (message) => { handleDataUpdate(message); setActiveForm(null); setEditingTransaction(null); };
  const openSettings = (view) => { setSettingsView(view); setShowSettings(true); };
  const toggleCardVisibility = (cardName) => { setCardVisibility(prev => ({ ...prev, [cardName]: !prev[cardName] })); };
  const confirmDeleteTransaction = () => {
    if (!deletingTransaction) return;
    apiFetch(`/transactions/${deletingTransaction.id}`, { method: 'DELETE' })
      .then(() => {
        const message = deletingTransaction.transfer_id ?  t('transferDeletedSuccess') :  t('transactionDeletedSuccess');
        handleDataUpdate(message);
        setDeletingTransaction(null);
      });
  };
  const handleAddTransfer = (formData) => {
    const fromAccount = accounts.find(acc => acc.id === parseInt(formData.from_account_id));
    const toAccount = accounts.find(acc => acc.id === parseInt(formData.to_account_id));
    if (!fromAccount || !toAccount) { showNotification('Could not find accounts.', 'error'); return; }
    const description =  t('transferDescription').replace('{fromName}', fromAccount.name).replace('{toName}', toAccount.name);
    apiFetch(`/transfers/`, { method: 'POST', body: JSON.stringify({ ...formData, description }) })
      .then(() => handleTransactionSuccess( t('transferAddedSuccess')))
      .catch(error => { console.error('Failed to add transfer:', error); showNotification(error.message ||  t('transferAddError'), 'error'); });
  };
  const handleUpdateTransfer = (transferId, formData) => {
    apiFetch(`/transfers/${transferId}`, { method: 'PUT', body: JSON.stringify(formData) })
      .then(() => {
        handleDataUpdate( t('transferUpdatedSuccess'));
        setEditingTransferId(null);
      })
      .catch(error => { console.error('Failed to update transfer:', error); showNotification( t('transferUpdateError'), 'error'); });
  };
  const handleTransactionSubmit = (formData, originalTransaction = null) => {
    // Check if this is a new recurrent transaction or one being toggled to recurrent
    const isNewRecurrence = formData.is_recurrent && !originalTransaction?.is_recurrent;

    if (isNewRecurrence) {
      // If it's a new recurrence, hold the data and open the recurrence modal
      setPendingTransaction({ ...formData, original: originalTransaction });
      setActiveForm(null);
      setEditingTransaction(null);
      setRecurrenceModalIsOpen(true);
    } else {
      // Otherwise, save it directly (handles simple add, simple update, and toggling off recurrence)
      const apiCall = originalTransaction
        ? apiFetch(`/transactions/${originalTransaction.id}`, { method: 'PUT', body: JSON.stringify({ ...formData, currency: 'EUR' }) })
        : apiFetch(`/transactions/`, { method: 'POST', body: JSON.stringify({ ...formData, currency: 'EUR' }) });
      
      apiCall.then(() => {
        const message = originalTransaction ?  t('transactionUpdatedSuccess') :  t('transactionAddedSuccess');
        handleTransactionSuccess(message);
      }).catch(error => {
        const message = originalTransaction ?  t('transactionUpdateError') :  t('transactionAddError');
        console.error('Failed to save transaction:', error);
        showNotification(message, 'error');
      });
    }
  };
  const handleFinalizeRecurrence = (recurrenceData) => {
    const { original, ...transactionData } = pendingTransaction;
    const finalTransactionData = {
      ...transactionData,
      ...recurrenceData,
      currency: 'EUR'
    };

    const apiCall = original
      ? apiFetch(`/transactions/${original.id}`, { method: 'PUT', body: JSON.stringify(finalTransactionData) })
      : apiFetch(`/transactions/`, { method: 'POST', body: JSON.stringify(finalTransactionData) });
    
    apiCall.then((response) => {
      const message = original ?  t('transactionUpdatedSuccess') :  t('transactionAddedSuccess');
      handleDataUpdate(message);
      setRecurrenceModalIsOpen(false);
      setPendingTransaction(null);
    }).catch(error => {
      console.error('Failed to save recurrent transaction:', error);
      const message = original ?  t('transactionUpdateError') :  t('transactionAddError');
      showNotification(message, 'error');
    });
  };
  const handleCancelRecurrence = () => {
    setRecurrenceModalIsOpen(false);
    if (pendingTransaction.original) {
      setEditingTransaction(pendingTransaction.original);
    } else {
      setActiveForm('transaction'); 
    }
  };
  
  // --- Render Logic ---
  if (isLoading || !t('financeTracker')) {
    return <div className="p-8 text-center">Loading TrakFin...</div>;
  }

  if (!activeUser) {
    return <UserSelector />; // No props needed!
  }

  if (showOnboarding) {
  return <OnboardingWizard 
            onComplete={() => { completeOnboarding(); setOnboardingStep('welcome'); }} 
            step={onboardingStep} 
            setStep={setOnboardingStep} 
         />;
}

  const fabActions = [{ label: t('addTransaction'), icon: 'transaction', onClick: () => setActiveForm('transaction'), shortcut: 'N' }, { label: t('addTransfer'), icon: 'transfer', onClick: () => setActiveForm('transfer'), shortcut: 'T' }, { label: t('askAI'), icon: 'ai', onClick: () => setShowChat(true), shortcut: 'A' }];
  const categoryChartFilterControl = ( <select value={categoryChartType} onChange={e => setCategoryChartType(e.target.value)} className="p-1 border rounded-md text-sm bg-gray-50"><option value="expense">{t('expenses')}</option><option value="income">{t('income')}</option><option value="both">{t('both')}</option></select> );
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Notification message={notification?.message} type={notification?.type} />
      <header>
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3"><Logo /><h1 className="text-4xl font-bold text-brand-blue tracking-tight">{t('financeTracker')}</h1></div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <SettingsMenu 
                onManageCategories={() => openSettings('categories')} 
                onManageAccounts={() => openSettings('accounts')} 
                onSetTransferCategory={() => openSettings('transferCategory')} 
              />
            </div>
          </div>
        </div>
      </header>
      
      {activeForm === 'transfer' && ( <Modal title={t('addTransfer')} onClose={() => setActiveForm(null)}><AddTransferForm onFormSubmit={handleAddTransfer} onCancel={() => setActiveForm(null)} /></Modal> )}
      {editingTransferId && ( <Modal title={t('editTransfer')} onClose={() => setEditingTransferId(null)}><EditTransferForm transferId={editingTransferId} onFormSubmit={handleUpdateTransfer} onCancel={() => setEditingTransferId(null)}/></Modal> )}
      {activeForm === 'transaction' && ( <Modal title={t('addTransaction')} onClose={() => { setActiveForm(null); setPendingTransaction(null); }}><AddTransactionForm onFormSubmit={handleTransactionSubmit} onCancel={() => { setActiveForm(null); setPendingTransaction(null); }} initialData={pendingTransaction && !pendingTransaction.original ? pendingTransaction : null}/></Modal> )}
      {editingTransaction && ( <Modal title={t('editTransaction')} onClose={() => setEditingTransaction(null)}><EditTransactionForm transaction={editingTransaction} onFormSubmit={(transactionId, formData) => handleTransactionSubmit(formData, editingTransaction)} onCancel={() => setEditingTransaction(null)} /></Modal> )}
      {recurrenceModalIsOpen && ( <Modal title={t('setRecurrence')} onClose={handleCancelRecurrence}><RecurrenceModal transaction={pendingTransaction} onSave={handleFinalizeRecurrence} onCancel={handleCancelRecurrence} /></Modal> )}
      {deletingTransaction && (<ConfirmationModal message={`${t('deleteConfirmMessage')} "${deletingTransaction.description}"?`} onConfirm={confirmDeleteTransaction} onCancel={() => setDeletingTransaction(null)} />)}
      {showChat && <Chat onCancel={() => setShowChat(false)} />}
      {showSettings && (
        <Modal 
          title={ settingsView === 'categories' ? t('manageCategories') : settingsView === 'accounts' ? t('manageAccounts') : t('manageTransferCategory') } 
          onClose={() => setShowSettings(false)}
        >
          {settingsView === 'categories' && <CategoryManager onUpdate={handleDataUpdate}/>}
          {settingsView === 'accounts' && <AccountManager onUpdate={handleDataUpdate}/>}
          {settingsView === 'transferCategory' && <TransferCategorySelector onUpdate={handleDataUpdate} onComplete={() => setShowSettings(false)} />}
        </Modal>
      )}
      
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">{balanceReportData ? <BalanceReport report={balanceReportData}/> : <BalanceReportSkeleton />}</div>
          <div className="lg:col-span-2"><ChartCard title={t('balanceEvolution')} isOpen={true}>{balanceEvolutionData ? <BalanceEvolutionChart data={balanceEvolutionData} /> : <ChartSkeleton />}</ChartCard></div>
        </div>
        <ChartFilters period={chartPeriod} setChartPeriod={setChartPeriod} customDates={customDates} setCustomDates={setCustomDates} />
        <div className="space-y-8 mt-8">
          <ChartCard title={t('incomeVsExpenses')} isOpen={cardVisibility.incomeVsExpenses} onToggle={() => toggleCardVisibility('incomeVsExpenses')}>{incomeExpenseData ? <IncomeExpenseChart data={incomeExpenseData} /> : <ChartSkeleton />}</ChartCard>
          <ChartCard title={t('summaryByCategory')} isOpen={cardVisibility.category} onToggle={() => toggleCardVisibility('category')} headerControls={categoryChartFilterControl}>{categorySummaryData ? <CategoryChart data={categorySummaryData} /> : <ChartSkeleton />}</ChartCard>
          <ChartCard title={t('recurrentTransactions')} isOpen={cardVisibility.recurrent} onToggle={() => toggleCardVisibility('recurrent')}>{recurrentData ? <RecurrentChart data={recurrentData} /> : <ChartSkeleton />}</ChartCard>
        </div>
        <div className="mt-8">
          {transactionsData ? (
            <>
              <TransactionList 
                transactions={transactionsData.transactions} 
                onEdit={(tx) => tx.transfer_id ? setEditingTransferId(tx.transfer_id) : setEditingTransaction(tx)} 
                onDelete={setDeletingTransaction} 
                filters={filters}
                onFilterChange={handleFilterChange}
                isFiltering={isFiltering}
              />
              <Pagination 
                currentPage={currentPage} 
                totalItems={transactionsData.total_count} 
                itemsPerPage={PAGE_SIZE} 
                onPageChange={setCurrentPage} 
              />
            </>
          ) : ( <TransactionListSkeleton /> )}
        </div>
      </main>

      <div className="fixed bottom-8 right-8 z-40">
        <FloatingActionButton actions={fabActions} onToggle={setIsFabOpen} />
      </div>
    </div>
  );
}

export default App;