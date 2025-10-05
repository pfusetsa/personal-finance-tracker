import React from 'react';
import { useAppContext } from '../context/AppContext';

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {

  const { t } = useAppContext();
  
  if (!totalItems) return null;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const pageOfText =  t('pageOf')
    .replace('{currentPage}', currentPage)
    .replace('{totalPages}', totalPages);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        { t('previous')}
      </button>
      
      <span className="font-medium">{pageOfText}</span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        { t('next')}
      </button>
    </div>
  );
}

export default Pagination;