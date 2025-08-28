import React, { useRef, useEffect } from 'react';

function FilterPopover({ title, children, onApply, onClear, onClose, t }) {
  const popoverRef = useRef(null);

  // Effect to handle clicking outside of the popover to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef, onClose]);

  return (
    <div ref={popoverRef} className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-lg z-30 border border-gray-200 w-64">
      <div className="p-4">
        <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
        {children}
      </div>
      <div className="flex justify-end space-x-2 p-2 bg-gray-50 rounded-b-md">
        <button onClick={onClear} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">{t.clear}</button>
        <button onClick={onApply} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t.apply}</button>
      </div>
    </div>
  );
}

export default FilterPopover;