import React from 'react';

function ChartSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse h-full">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

export default ChartSkeleton;