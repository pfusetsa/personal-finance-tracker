import React from 'react';

function Logo() {
  return (
    <svg 
      className="h-10 w-10 text-blue-600" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10" />
      <path d="M12 15V7" />
      <path d="M15 10l-3-3-3 3" />
    </svg>
  );
}

export default Logo;