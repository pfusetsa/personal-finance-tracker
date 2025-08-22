import React from 'react';

function TransactionListSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionListSkeleton;