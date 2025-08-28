import React from 'react';

function Spinner() {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default Spinner;