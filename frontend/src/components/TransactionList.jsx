import React, { useMemo } from 'react';
import { formatMoney } from '../utils.js';
import { useAppContext } from '../context/AppContext';
import { categoryColorPalette } from '../utils.js';

import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import TransferIcon from './icons/TransferIcon';
import TransactionFilters from './TransactionFilters';
import Spinner from './Spinner';

function TransactionList({ transactions, onEdit, onDelete, filters, onFilterChange, isFiltering }) {
  const { t, accounts, categories, language } = useAppContext();

  const categoryColorMap = useMemo(() => {
    const colorMap = {};
    categories.forEach((cat, index) => {
      colorMap[cat.name] = categoryColorPalette[index % categoryColorPalette.length];
    });
    return colorMap;
  }, [categories]);

  return (
    <div className="bg-white shadow rounded-lg p-6 relative">
      {isFiltering && <Spinner />}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('recentTransactions')}</h2>
      <div>
        <table className="min-w-full divide-y divide-gray-200">
          <TransactionFilters 
            filters={filters}
            onFilterChange={onFilterChange}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => {
                const color = categoryColorMap[tx.category] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                return (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={tx.description}>
                      <div className="flex items-center space-x-2">
                        {tx.transfer_id && <span title="This is a transfer"><TransferIcon /></span>}
                        <span>{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color.bg} ${color.text}`}>
                        {t(tx.category.i18n_key) || tx.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.account}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{tx.is_recurrent ? t('yes') : t('no')}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(tx.amount, tx.currency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium space-x-3">
                      <button onClick={() => onEdit(tx)} className="text-indigo-600 hover:text-indigo-900" title={t('edit')}><EditIcon /></button>
                      <button onClick={() => onDelete(tx)} className="text-red-600 hover:text-red-900" title={t('delete')}><DeleteIcon /></button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-16 px-6">
                  <h3 className="text-xl font-semibold text-gray-800">{t('noMatchingTransactions')}</h3>
                  <p className="text-gray-500 mt-2">{t('noMatchingTransactionsSubtitle')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionList;