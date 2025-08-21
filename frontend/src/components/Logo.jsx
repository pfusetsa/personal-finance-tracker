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
      <path d="M3 17l5-5 4 4L21 7" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export default Logo;