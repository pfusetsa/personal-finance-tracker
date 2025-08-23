import React, { useState } from 'react';
import { formatMoney } from '../utils.js';
import FilterPopover from './FilterPopover';
import DatePicker from './DatePicker';

const FilterIcon = ({ active }) => ( <svg className={`h-4 w-4 ml-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 016 17v-2.586L3.293 6.707A1 1 0 013 6V4z" /></svg> );

function TransactionList({ transactions, onEdit, onDelete, categoryColorMap, t, filters, setFilters, categories, language, accounts }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [tempFilters, setTempFilters] = useState(filters);

  const handleHeaderClick = (filterName) => { setTempFilters(filters); setActiveFilter(activeFilter === filterName ? null : filterName); };
  const handleApply = () => { setFilters(tempFilters); setActiveFilter(null); };
  
  const handleClear = (filterName) => {
    const newFilters = { ...filters };
    if (filterName === 'date') { newFilters.startDate = ''; newFilters.endDate = ''; newFilters.sortBy = 'date'; newFilters.sortOrder = 'desc'; }
    else if (filterName === 'description') { newFilters.searchQuery = ''; }
    else if (filterName === 'category') { newFilters.categoryId = ''; }
    else if (filterName === 'account') { newFilters.accountId = ''; }
    else if (filterName === 'recurrent') { newFilters.isRecurrent = ''; }
    setFilters(newFilters);
    setActiveFilter(null);
  };

  const renderPopoverContent = () => {
    switch (activeFilter) {
      case 'date': return ( <div className="space-y-2"><h5 className="font-semibold text-sm">{t.sort}</h5><label className="flex items-center text-sm"><input type="radio" name="sortOrder" value="desc" checked={tempFilters.sortOrder === 'desc'} onChange={(e) => setTempFilters({...tempFilters, sortOrder: e.target.value})} className="mr-2" /> {t.newestToOldest}</label><label className="flex items-center text-sm"><input type="radio" name="sortOrder" value="asc" checked={tempFilters.sortOrder === 'asc'} onChange={(e) => setTempFilters({...tempFilters, sortOrder: e.target.value})} className="mr-2" /> {t.oldestToNewest}</label><hr className="my-2"/><h5 className="font-semibold text-sm">{t.filterByDateRange}</h5><DatePicker selectedDate={tempFilters.startDate} onChange={(date) => setTempFilters({...tempFilters, startDate: date ? date.toISOString().split('T')[0] : ''})} language={language} /><DatePicker selectedDate={tempFilters.endDate} onChange={(date) => setTempFilters({...tempFilters, endDate: date ? date.toISOString().split('T')[0] : ''})} language={language} /></div> );
      case 'description': return <input type="text" value={tempFilters.searchQuery} onChange={(e) => setTempFilters({...tempFilters, searchQuery: e.target.value})} className="w-full p-2 border rounded" placeholder={t.searchPlaceholder}/>;
      case 'category': return <select value={tempFilters.categoryId} onChange={(e) => setTempFilters({...tempFilters, categoryId: e.target.value})} className="w-full p-2 border rounded"><option value="">{t.allCategories}</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>;
      case 'account': return <select value={tempFilters.accountId} onChange={(e) => setTempFilters({...tempFilters, accountId: e.target.value})} className="w-full p-2 border rounded"><option value="">{t.allAccounts}</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>;
      case 'recurrent': return (<div className="space-y-2"><label className="flex items-center"><input type="checkbox" checked={tempFilters.isRecurrent === 'true' || tempFilters.isRecurrent === true} onChange={(e) => setTempFilters({...tempFilters, isRecurrent: e.target.checked ? 'true' : (tempFilters.isRecurrent === 'false' ? 'false' : '')})} className="mr-2" /> {t.yes}</label><label className="flex items-center"><input type="checkbox" checked={tempFilters.isRecurrent === 'false' || tempFilters.isRecurrent === false} onChange={(e) => setTempFilters({...tempFilters, isRecurrent: e.target.checked ? 'false' : (tempFilters.isRecurrent === 'true' ? 'true' : '')})} className="mr-2" /> {t.no}</label></div>);
      default: return null;
    }
  };

  if (transactions && transactions.length === 0) { return ( <div className="text-center py-16 bg-white shadow rounded-lg"><h3 className="text-xl font-semibold text-gray-800">No Matching Transactions</h3><p className="text-gray-500 mt-2">Try adjusting your filters or add a new transaction.</p></div> ); }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.recentTransactions}</h2>
      <div className={`${activeFilter ? 'overflow-visible' : 'overflow-x-auto'}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"><div className="flex items-center cursor-pointer" onClick={() => handleHeaderClick('date')} >{t.date} <FilterIcon active={!!filters.startDate || !!filters.endDate || filters.sortOrder !== 'desc'} /></div>{activeFilter === 'date' && <FilterPopover title={t.filterAndSortByDate} onApply={handleApply} onClear={() => handleClear('date')} onClose={() => setActiveFilter(null)}>{renderPopoverContent()}</FilterPopover>}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"><div className="flex items-center cursor-pointer" onClick={() => handleHeaderClick('description')}>{t.description} <FilterIcon active={!!filters.searchQuery} /></div>{activeFilter === 'description' && <FilterPopover title={t.searchDescription} onApply={handleApply} onClear={() => handleClear('description')} onClose={() => setActiveFilter(null)}>{renderPopoverContent()}</FilterPopover>}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"><div className="flex items-center cursor-pointer" onClick={() => handleHeaderClick('category')}>{t.category} <FilterIcon active={!!filters.categoryId} /></div>{activeFilter === 'category' && <FilterPopover title={t.filterByCategory} onApply={handleApply} onClear={() => handleClear('category')} onClose={() => setActiveFilter(null)}>{renderPopoverContent()}</FilterPopover>}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"><div className="flex items-center cursor-pointer" onClick={() => handleHeaderClick('account')}>{t.account} <FilterIcon active={!!filters.accountId} /></div>{activeFilter === 'account' && <FilterPopover title={t.filterByAccount} onApply={handleApply} onClear={() => handleClear('account')} onClose={() => setActiveFilter(null)}>{renderPopoverContent()}</FilterPopover>}</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative"><div className="flex items-center justify-center cursor-pointer" onClick={() => handleHeaderClick('recurrent')}>{t.recurrent} <FilterIcon active={filters.isRecurrent !== ''} /></div>{activeFilter === 'recurrent' && <FilterPopover title={t.filterByRecurrent} onApply={handleApply} onClear={() => handleClear('recurrent')} onClose={() => setActiveFilter(null)}>{renderPopoverContent()}</FilterPopover>}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.amount}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{transactions.map((tx) => { const color = categoryColorMap[tx.category] || { bg: 'bg-gray-100', text: 'text-gray-800' }; return ( <tr key={tx.id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description}</td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color.bg} ${color.text}`}>{tx.category}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.account}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{tx.is_recurrent ? t.yes : t.no}</td><td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(tx.amount, tx.currency)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium space-x-2"><button onClick={() => onEdit(tx)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button><button onClick={() => onDelete(tx.id)} className="text-red-600 hover:text-red-900" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button></td></tr> ); })}</tbody>
        </table>
      </div>
    </div>
  );
}
export default TransactionList;