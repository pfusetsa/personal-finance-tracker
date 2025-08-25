import React, { useState, useEffect } from 'react';
// Import all components...
import { categoryColorPalette } from './utils.js';
import Notification from './components/Notification';
import BalanceReport from './components/BalanceReport';
import TransactionList from './components/TransactionList';
import Pagination from './components/Pagination';
import AddTransactionForm from './components/AddTransactionForm';
import EditTransactionForm from './components/EditTransactionForm';
import AddTransferForm from './components/AddTransferForm.jsx';
import Chat from './components/Chat.jsx';
import ChartFilters from './components/ChartFilters.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';
import Logo from './components/Logo.jsx';
import Modal from './components/Modal.jsx';
import IncomeExpenseChart from './components/IncomeExpenseChart.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import RecurrentChart from './components/RecurrentChart.jsx';
import FloatingActionButton from './components/FloatingActionButton.jsx';
import ChartCard from './components/ChartCard.jsx';
import BalanceEvolutionChart from './components/BalanceEvolutionChart.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import SettingsMenu from './components/SettingsMenu.jsx';
import AccountManager from './components/AccountManager.jsx';
import BalanceReportSkeleton from './components/skeletons/BalanceReportSkeleton.jsx';
import ChartSkeleton from './components/skeletons/ChartSkeleton.jsx';
import TransactionListSkeleton from './components/skeletons/TransactionListSkeleton.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';

const API_URL = "http://127.0.0.1:8000";
const PAGE_SIZE = 10;
const initialCardVisibility = { incomeVsExpenses: true, category: true, recurrent: true };

function App() {
  const [balanceReportData, setBalanceReportData] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryColorMap, setCategoryColorMap] = useState({});
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [translations, setTranslations] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState('categories');
  const [chartPeriod, setChartPeriod] = useState('6m');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [incomeExpenseData, setIncomeExpenseData] = useState(null);
  const [categorySummaryData, setCategorySummaryData] = useState(null);
  const [recurrentData, setRecurrentData] = useState(null);
  const [balanceEvolutionData, setBalanceEvolutionData] = useState(null);
  const [categoryChartType, setCategoryChartType] = useState('expense');
  const [cardVisibility, setCardVisibility] = useState(() => { try { const saved = localStorage.getItem('cardVisibility'); return saved ? JSON.parse(saved) : initialCardVisibility; } catch (e) { return initialCardVisibility; } });

  useEffect(() => { fetch(`/locales/${language}.json`).then(res => res.json()).then(data => setTranslations(data)); localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('cardVisibility', JSON.stringify(cardVisibility)); }, [cardVisibility]);
  useEffect(() => { const handleKeyDown = (event) => { if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) { return; } if (event.key === 'Escape') { setActiveForm(null); setEditingTransaction(null); setShowSettings(false); setShowChat(false); setDeletingTransaction(null); } if (event.key.toLowerCase() === 'n') { event.preventDefault(); setActiveForm('transaction'); } if (event.key.toLowerCase() === 't') { event.preventDefault(); setActiveForm('transfer'); } if (event.key.toLowerCase() === 'a') { event.preventDefault(); setShowChat(true); } }; window.addEventListener('keydown', handleKeyDown); return () => { window.removeEventListener('keydown', handleKeyDown); }; }, []);
  
  // Simple, stable useEffect for fetching transactions
  useEffect(() => {
    setTransactionsData(null);
    fetch(`${API_URL}/transactions/?page=${currentPage}&page_size=${PAGE_SIZE}`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => setTransactionsData(data));
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    fetch(`${API_URL}/reports/balance/`, { cache: 'no-cache' }).then(res => res.json()).then(data => setBalanceReportData(data));
    fetch(`${API_URL}/reports/balance-evolution/`, { cache: 'no-cache' }).then(res => res.json()).then(data => setBalanceEvolutionData(data));
    fetch(`${API_URL}/accounts/`, { cache: 'no-cache' }).then(res => res.json()).then(data => setAccounts(data));
    fetch(`${API_URL}/categories/`, { cache: 'no-cache' }).then(res => res.json()).then(data => { setCategories(data); const colorMap = {}; data.forEach((cat, index) => { colorMap[cat.name] = categoryColorPalette[index % categoryColorPalette.length]; }); setCategoryColorMap(colorMap); });
  }, [refreshTrigger]);
  
  useEffect(() => {
    let startDate, endDate = new Date().toISOString().split('T')[0];
    if (chartPeriod === '1m') { const d = new Date(); d.setMonth(d.getMonth() - 1); startDate = d.toISOString().split('T')[0]; } // Add this condition
    else if (chartPeriod === '6m') { const d = new Date(); d.setMonth(d.getMonth() - 6); startDate = d.toISOString().split('T')[0]; } 
    else if (chartPeriod === '1y') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); startDate = d.toISOString().split('T')[0]; } 
    else if (chartPeriod === 'all') { startDate = '1970-01-01'; } 
    else if (chartPeriod === 'custom' && customDates.start && customDates.end) { startDate = customDates.start; endDate = customDates.end; } 
    else { return; }
    setCategorySummaryData(null); setIncomeExpenseData(null); setRecurrentData(null);
    fetch(`${API_URL}/reports/category-summary/?start_date=${startDate}&end_date=${endDate}&transaction_type=${categoryChartType}`).then(res=>res.json()).then(data=>setCategorySummaryData(data));
    fetch(`${API_URL}/reports/monthly-income-expense-summary/?start_date=${startDate}&end_date=${endDate}`).then(res=>res.json()).then(data=>setIncomeExpenseData(data));
    fetch(`${API_URL}/reports/recurrent-summary/?start_date=${startDate}&end_date=${endDate}`).then(res=>res.json()).then(data=>setRecurrentData(data));
  }, [refreshTrigger, chartPeriod, customDates, categoryChartType]);

  const toggleCardVisibility = (cardName) => { setCardVisibility(prev => ({ ...prev, [cardName]: !prev[cardName] })); };
  const showNotification = (message, type = 'success') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000); };
  const handleDataUpdate = (message, type = 'success') => { setRefreshTrigger(c => c + 1); showNotification(message, type); };
  const handleTransactionSuccess = (message) => { handleDataUpdate(message); setActiveForm(null); setEditingTransaction(null); };
  const openSettings = (view) => { setSettingsView(view); setShowSettings(true); };
  
  const confirmDeleteTransaction = () => {
    if (!deletingTransaction) return;
    fetch(`${API_URL}/transactions/${deletingTransaction.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          handleDataUpdate(t.transactionDeletedSuccess);
          setDeletingTransaction(null);
        }
      });
  };

  if (!translations) { return <div className="p-8 text-center">Loading TrakFin...</div>; }

  const t = translations;
  const fabActions = [{ label: t.addTransaction, icon: 'transaction', onClick: () => setActiveForm('transaction'), shortcut: 'N' }, { label: t.addTransfer, icon: 'transfer', onClick: () => setActiveForm('transfer'), shortcut: 'T' }, { label: t.askAI, icon: 'ai', onClick: () => setShowChat(true), shortcut: 'A' }];
  const categoryChartFilterControl = ( <select value={categoryChartType} onChange={e => setCategoryChartType(e.target.value)} className="p-1 border rounded-md text-sm bg-gray-50"><option value="expense">{t.expenses}</option><option value="income">{t.income}</option><option value="both">{t.both}</option></select> );
  const handleAddTransaction = (formData) => { fetch(`${API_URL}/transactions/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, currency: formData.currency, amount: parseFloat(formData.amount), account_id: parseInt(formData.account_id), category_id: parseInt(formData.category_id) }) }).then(res => { if (!res.ok) { throw new Error('Network response was not ok'); } return res.json(); }).then(() => handleTransactionSuccess(t.transactionAddedSuccess)).catch(error => { console.error('Failed to add transaction:', error); showNotification(t.transactionAddError, 'error'); }); };
  const handleUpdateTransaction = (transactionId, formData) => { fetch(`${API_URL}/transactions/${transactionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, currency: formData.currency, amount: parseFloat(formData.amount), account_id: parseInt(formData.account_id), category_id: parseInt(formData.category_id) }) }).then(res => { if (!res.ok) { throw new Error('Network response was not ok'); } return res.json(); }).then(() => handleTransactionSuccess(t.transactionUpdatedSuccess)).catch(error => { console.error('Failed to update transaction:', error); showNotification(t.transactionUpdateError, 'error'); }); };
  const handleAddTransfer = (formData) => { const fromAccount = accounts.find(acc => acc.id === parseInt(formData.from_account_id)); const toAccount = accounts.find(acc => acc.id === parseInt(formData.to_account_id)); if (!fromAccount || !toAccount) { showNotification('Could not find accounts.', 'error'); return; } const description = t.transferDescription.replace('{fromName}', fromAccount.name).replace('{toName}', toAccount.name); fetch(`${API_URL}/transfers/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, description, amount: parseFloat(formData.amount), from_account_id: parseInt(formData.from_account_id), to_account_id: parseInt(formData.to_account_id) }) }).then(res => { if (!res.ok) { return res.json().then(err => { throw new Error(err.detail); }); } return res.json(); }).then(() => handleTransactionSuccess(t.transferAddedSuccess)).catch(error => { console.error('Failed to add transfer:', error); showNotification(error.message || t.transferAddError, 'error'); }); };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Notification message={notification?.message} type={notification?.type} />
      <header>
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center"><div className="flex items-center space-x-3"><Logo /><h1 className="text-4xl font-bold text-brand-blue tracking-tight">{t.financeTracker}</h1></div><div className="flex items-center space-x-4"><LanguageSelector language={language} setLanguage={setLanguage} /><SettingsMenu onManageCategories={() => openSettings('categories')} onManageAccounts={() => openSettings('accounts')} t={t} /></div></div>
        </div>
      </header>
      
      {activeForm === 'transaction' && (<Modal title={t.addTransaction} onClose={() => setActiveForm(null)}><AddTransactionForm accounts={accounts} categories={categories} onFormSubmit={handleAddTransaction} onCancel={() => setActiveForm(null)} t={t} language={language} /></Modal>)}
      {activeForm === 'transfer' && (<Modal title={t.addTransfer} onClose={() => setActiveForm(null)}><AddTransferForm accounts={accounts} onFormSubmit={handleAddTransfer} onCancel={() => setActiveForm(null)} t={t} language={language} /></Modal>)}
      {editingTransaction && (<Modal title={t.editTransaction} onClose={() => setEditingTransaction(null)}><EditTransactionForm transaction={editingTransaction} accounts={accounts} categories={categories} onFormSubmit={handleUpdateTransaction} onCancel={() => setEditingTransaction(null)} t={t} language={language} /></Modal>)}
      {deletingTransaction && (<ConfirmationModal message={`${t.deleteConfirmMessage} "${deletingTransaction.description}"?`} onConfirm={confirmDeleteTransaction} onCancel={() => setDeletingTransaction(null)} confirmText={t.delete} cancelText={t.cancel} />)}
      {showChat && <Chat apiUrl={API_URL} onCancel={() => setShowChat(false)} t={t} />}
      {showSettings && (<Modal title={settingsView === 'categories' ? t.manageCategories : t.manageAccounts} onClose={() => setShowSettings(false)}>{settingsView === 'categories' ? <CategoryManager onUpdate={handleDataUpdate} t={t} /> : <AccountManager onUpdate={handleDataUpdate} t={t} />}</Modal>)}
      
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"><div className="lg:col-span-1">{balanceReportData ? <BalanceReport report={balanceReportData} t={t} /> : <BalanceReportSkeleton />}</div><div className="lg:col-span-2"><ChartCard title={t.balanceEvolution} isOpen={true} onToggle={null}>{balanceEvolutionData ? <BalanceEvolutionChart data={balanceEvolutionData} /> : <div className="h-64 flex items-center justify-center"><p>Loading chart...</p></div>}</ChartCard></div></div>
        <ChartFilters period={chartPeriod} setPeriod={setChartPeriod} customDates={customDates} setCustomDates={setCustomDates} t={t} language={language} />
        <div className="space-y-8 mt-8">
          <ChartCard title={t.incomeVsExpenses} isOpen={cardVisibility.incomeVsExpenses} onToggle={() => toggleCardVisibility('incomeVsExpenses')}>{incomeExpenseData ? <IncomeExpenseChart data={incomeExpenseData} t={t} /> : <ChartSkeleton />}</ChartCard>
          <ChartCard title={t.summaryByCategory} isOpen={cardVisibility.category} onToggle={() => toggleCardVisibility('category')} headerControls={categoryChartFilterControl}>{categorySummaryData ? <CategoryChart data={categorySummaryData} t={t} /> : <ChartSkeleton />}</ChartCard>
          <ChartCard title={t.recurrentTransactions} isOpen={cardVisibility.recurrent} onToggle={() => toggleCardVisibility('recurrent')}>{recurrentData ? <RecurrentChart data={recurrentData} t={t} /> : <ChartSkeleton />}</ChartCard>
        </div>
        <div className="mt-8">
          {transactionsData ? (<><TransactionList transactions={transactionsData.transactions} onEdit={setEditingTransaction} onDelete={setDeletingTransaction} categoryColorMap={categoryColorMap} t={t} /><Pagination currentPage={currentPage} totalItems={transactionsData.total_count} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} t={t} /></>) : ( <TransactionListSkeleton /> )}
        </div>
      </main>

      <FloatingActionButton actions={fabActions} />
    </div>
  );
}

export default App;