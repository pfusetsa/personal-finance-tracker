import React from 'react';

function Modal({ title, onClose, children }) {
  return (
    // The overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      {/* The modal window */}
      <div className="bg-white shadow rounded-lg w-full max-w-md flex flex-col max-h-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>
        
        {/* Modal Body (now scrollable) */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;