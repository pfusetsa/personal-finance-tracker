import React, { useState, useEffect } from 'react';
import { categoryColorPalette } from './utils.js';
// Import all components...
import Notification from './components/Notification';
import BalanceReport from './components/BalanceReport';
import TransactionList from './components/TransactionList';
import Pagination from './components/Pagination';
import AddTransactionForm from './components/AddTransactionForm';
import EditTransactionForm from './components/EditTransactionForm';
import AddTransferForm from './components/AddTransferForm.jsx';
import Chat from './components/Chat.jsx';
import ChartFilters from './components/ChartFilters.jsx';
import IncomeExpenseChart from './components/IncomeExpenseChart.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import RecurrentChart from './components/RecurrentChart.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';

// Constants and translations...
const API_URL = "http://127.0.0.1:8000";
const PAGE_SIZE = 10;
const translations = {
  en: { financeTracker: "Finance Tracker", addTransaction: "Add Transaction", addTransfer: "Add Transfer", askAI: "Ask the AI", balanceReport: "Balance Report", totalBalance: "Total Balance", recentTransactions: "Recent Transactions", summaryByCategory: "Summary by Category", incomeVsExpenses: "Income vs. Expenses", recurrentTransactions: "Recurrent Transactions", date: "Date", description: "Description", category: "Category", recurrent: "Recurrent", amount: "Amount", actions: "Actions", income: "Income", expenses: "Expenses", yes: "Yes", no: "No", '6 Months': '6 Months', '1 Year': '1 Year', 'All Time': 'All Time', 'Custom': 'Custom' },
  es: { financeTracker: "Gestor de Finanzas", addTransaction: "Añadir Transacción", addTransfer: "Añadir Transferencia", askAI: "Preguntar a la IA", balanceReport: "Informe de Saldo", totalBalance: "Saldo Total", recentTransactions: "Transacciones Recientes", summaryByCategory: "Resumen por Categoría", incomeVsExpenses: "Ingresos vs. Gastos", recurrentTransactions: "Transacciones Recurrentes", date: "Fecha", description: "Descripción", category: "Categoría", recurrent: "Recurrente", amount: "Cantidad", actions: "Acciones", income: "Ingresos", expenses: "Gastos", yes: "Sí", no: "No", '6 Months': '6 Meses', '1 Year': '1 Año', 'All Time': 'Total', 'Custom': 'Personalizado' }
};

function App() {
  // All existing state...
  const [balanceReport, setBalanceReport] = useState(null);
  const [transactionsData, setTransactionsData] = useState({ transactions: [], total_count: 0 });
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryColorMap, setCategoryColorMap] = useState({});
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [language, setLanguage] = useState('en');
  const [activeForm, setActiveForm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const t = translations[language];

  // New state for chart filters
  const [chartPeriod, setChartPeriod] = useState('6m');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  // State for chart data
  const [incomeExpenseData, setIncomeExpenseData] = useState(null);
  const [categorySummaryData, setCategorySummaryData] = useState(null);
  const [recurrentData, setRecurrentData] = useState(null);

  // Data fetching hooks remain the same for transactions and balance
  useEffect(() => {
    const fetchTransactions = (page) => {
      fetch(`${API_URL}/transactions/?page=${page}&page_size=${PAGE_SIZE}`, { cache: 'no-cache' })
        .then(res => res.json())
        .then(data => setTransactionsData(data));
    };
    fetchTransactions(currentPage);
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    const fetchBalance = () => {
      fetch(`${API_URL}/reports/balance/`, { cache: 'no-cache' })
        .then(res => res.json())
        .then(data => setBalanceReport(data));
    };
    const fetchLookups = () => {
      fetch(`${API_URL}/accounts/`, { cache: 'no-cache' }).then(res => res.json()).then(data => setAccounts(data));
      fetch(`${API_URL}/categories/`, { cache: 'no-cache' }).then(res => res.json()).then(data => {
        setCategories(data);
        const colorMap = {};
        data.forEach((cat, index) => {
          colorMap[cat.name] = categoryColorPalette[index % categoryColorPalette.length];
        });
        setCategoryColorMap(colorMap);
      });
    };
    fetchBalance();
    fetchLookups();
  }, [refreshTrigger]);

  // Updated useEffect for fetching chart data based on filters
  useEffect(() => {
    let startDate, endDate = new Date().toISOString().split('T')[0];
    if (chartPeriod === '6m') { const d = new Date(); d.setMonth(d.getMonth() - 6); startDate = d.toISOString().split('T')[0]; }
    else if (chartPeriod === '1y') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); startDate = d.toISOString().split('T')[0]; }
    else if (chartPeriod === 'all') { startDate = '1970-01-01'; }
    else if (chartPeriod === 'custom' && customDates.start && customDates.end) { startDate = customDates.start; endDate = customDates.end; }
    else { return; }

    fetch(`${API_URL}/reports/monthly-income-expense-summary/?start_date=${startDate}&end_date=${endDate}`).then(res=>res.json()).then(data=>setIncomeExpenseData(data));
    fetch(`${API_URL}/reports/category-summary/?start_date=${startDate}&end_date=${endDate}&transaction_type=expense`).then(res=>res.json()).then(data=>setCategorySummaryData(data));
    fetch(`${API_URL}/reports/recurrent-summary/?start_date=${startDate}&end_date=${endDate}`).then(res=>res.json()).then(data=>setRecurrentData(data));
  }, [refreshTrigger, chartPeriod, customDates]);

  // All handler functions remain the same...
  const handleDataUpdate = (message) => { setActiveForm(null); setEditingTransaction(null); setRefreshTrigger(c => c + 1); setNotification({ message, type: 'success' }); setTimeout(() => setNotification(null), 3000); };
  const handleAddTransaction = (formData) => {
    fetch(`${API_URL}/transactions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount), account_id: parseInt(formData.account_id), category_id: parseInt(formData.category_id) })
    })
    .then(res => {
      if (!res.ok) { throw new Error('Network response was not ok'); }
      return res.json();
    })
    .then(() => handleDataUpdate('Transaction added!'))
    .catch(error => {
      console.error('Failed to add transaction:', error);
      showNotification('Failed to add transaction.', 'error');
    });
  };
  const handleUpdateTransaction = (transactionId, formData) => {
    fetch(`${API_URL}/transactions/${transactionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount), account_id: parseInt(formData.account_id), category_id: parseInt(formData.category_id) })
    })
    .then(res => {
      if (!res.ok) { throw new Error('Network response was not ok'); }
      return res.json();
    })
    .then(() => handleDataUpdate('Transaction updated!'))
    .catch(error => {
      console.error('Failed to update transaction:', error);
      showNotification('Failed to update transaction.', 'error');
    });
  };
  const handleAddTransfer = (formData) => { fetch(`${API_URL}/transfers/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount), from_account_id: parseInt(formData.from_account_id), to_account_id: parseInt(formData.to_account_id) }) }).then(() => handleDataUpdate('Transfer added!')) };
  const handleDelete = (transactionId) => { if (window.confirm("Are you sure?")) { fetch(`${API_URL}/transactions/${transactionId}`, { method: 'DELETE' }).then(res => res.ok && handleDataUpdate('Transaction deleted!')) } };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Notification message={notification?.message} type={notification?.type} />
      
      <header>
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <svg className="h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8l3 5m0 0l3-5m-3 5v4m0 0H9m3 0h3m-3-5a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 12a7 7 0 1114 0 7 7 0 01-14 0z" /></svg>
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">{t.financeTracker}</h1>
            </div>
            <div className="relative">
              <LanguageSelector language={language} setLanguage={setLanguage} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button onClick={() => setActiveForm('transaction')} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">{t.addTransaction}</button>
            <button onClick={() => setActiveForm('transfer')} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">{t.addTransfer}</button>
            <button onClick={() => setShowChat(true)} className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">{t.askAI}</button>
          </div>
        </div>
      </header>

      {activeForm === 'transaction' && <AddTransactionForm accounts={accounts} categories={categories} onFormSubmit={handleAddTransaction} onCancel={() => setActiveForm(null)} lang={language} />}
      {activeForm === 'transfer' && <AddTransferForm accounts={accounts} onFormSubmit={handleAddTransfer} onCancel={() => setActiveForm(null)} lang={language} />}
      {editingTransaction && <EditTransactionForm transaction={editingTransaction} accounts={accounts} categories={categories} onFormSubmit={handleUpdateTransaction} onCancel={() => setEditingTransaction(null)} lang={language} />}
      {showChat && <Chat apiUrl={API_URL} onCancel={() => setShowChat(false)} />}
      
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <BalanceReport report={balanceReport} t={t} />
          </div>
          <div className="lg:col-span-2">
              <IncomeExpenseChart title={t.incomeVsExpenses} data={incomeExpenseData} t={t} />
          </div>
        </div>
        
        <ChartFilters period={chartPeriod} setPeriod={setChartPeriod} customDates={customDates} setCustomDates={setCustomDates} t={t} />
        
        <div className="space-y-8 mt-8">
          <CategoryChart title={t.summaryByCategory} data={categorySummaryData} t={t} />
          <RecurrentChart title={t.recurrentTransactions} data={recurrentData} t={t} />
        </div>

        <div className="mt-8">
          <TransactionList transactions={transactionsData.transactions} onEdit={setEditingTransaction} onDelete={handleDelete} categoryColorMap={categoryColorMap} t={t} />
          <Pagination currentPage={currentPage} totalItems={transactionsData.total_count} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} />
        </div>
      </main>
    </div>
  );
}

export default App;