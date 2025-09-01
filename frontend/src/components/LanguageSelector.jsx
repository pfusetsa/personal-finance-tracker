import React, { useState } from 'react';

function LanguageSelector({ language, setLanguage }) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const selectedLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-800 p-2 rounded-md bg-gray-100 hover:bg-gray-200"
      >
        <span>{selectedLanguage.flag}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <ul className="py-1">
            {/* Filter the list to show only the non-selected language */}
            {languages.filter(lang => lang.code !== language).map(lang => (
              <li
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <span className="mr-3">{lang.flag}</span>
                {lang.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;