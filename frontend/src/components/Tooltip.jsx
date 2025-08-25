import React from 'react';

function Tooltip({ text }) {
  return (
    <div className="absolute right-full mr-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">
      {text}
    </div>
  );
}

export default Tooltip;