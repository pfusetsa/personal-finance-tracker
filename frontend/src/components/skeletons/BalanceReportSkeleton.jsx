import React from 'react';

function BalanceReportSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
}

export default BalanceReportSkeleton;