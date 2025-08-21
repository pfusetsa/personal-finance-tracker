import React from 'react';

function ChartCard({ title, isOpen, onToggle, headerControls, children }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <div className="flex items-center space-x-4">
          {/* Stop click propagation so clicking controls doesn't collapse the card */}
          <div onClick={(e) => e.stopPropagation()}>
            {headerControls}
          </div>
          <button className="text-gray-500 hover:text-gray-800">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="p-6 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default ChartCard;