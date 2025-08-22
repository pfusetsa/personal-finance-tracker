import React, { useState } from 'react';

function FloatingActionButton({ actions }) {
  const [isOpen, setIsOpen] = useState(false);

  const ICONS = {
    add: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
    transaction: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    transfer: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    ai: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  };

  return (
    // This container will now ignore pointer events by default
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end pointer-events-none">
      <div className="flex flex-col items-end space-y-2 mb-2">
        {actions.map((action, index) => (
          <div
            key={action.label}
            className={`transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
          >
            {/* The button itself will accept pointer events */}
            <button
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className="flex items-center justify-center bg-white shadow-md rounded-lg py-3 px-5 text-base font-semibold text-blue-800 hover:bg-gray-100 pointer-events-auto"
            >
              {ICONS[action.icon]}
              {action.label}
            </button>
          </div>
        ))}
      </div>
      
      {/* The main button will also accept pointer events */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-blue-600 rounded-full text-white shadow-lg flex items-center justify-center focus:outline-none hover:bg-blue-700 transition-transform duration-300 pointer-events-auto z-50"
      >
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          {ICONS.add}
        </div>
      </button>
    </div>
  );
}

export default FloatingActionButton;