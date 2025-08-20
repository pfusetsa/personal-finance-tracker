import React from 'react';
import { formatMoney } from '../utils.js'; // Use formatMoney instead of formatCurrency

function BalanceReport({ report, t }) {
  if (!report) return <p>Loading balance...</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.balanceReport}</h2>
      <div className="mb-4 pb-4 border-b">
        <p className="text-sm text-gray-500">{t.totalBalance}</p>
        <p className={`text-3xl font-bold ${report.total_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatMoney(report.total_balance)}
        </p>
      </div>
      <ul className="space-y-2">
        {report.balances_by_account.map(account => (
          <li key={account.name} className="flex justify-between items-center p-2">
            <span className="font-medium text-gray-600">{account.name}</span>
            <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(account.balance)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BalanceReport;