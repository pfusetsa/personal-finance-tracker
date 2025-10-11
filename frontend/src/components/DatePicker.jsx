import React from 'react';
import { useAppContext } from '../context/AppContext';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { enUS, es } from 'date-fns/locale';

import "react-datepicker/dist/react-datepicker.css";

// Register locales globally for the date picker library
registerLocale('en', enUS);
registerLocale('es', es);

function DatePicker({ selectedDate, onChange, placeholderText }) {

  const { language } = useAppContext();

  const dateObject = selectedDate ? new Date(selectedDate) : null;

  return (
    <ReactDatePicker
      selected={dateObject}
      onChange={onChange}
      locale={language}
      dateFormat="dd/MM/yyyy"
      className="w-full p-2 border rounded"
      placeholderText={placeholderText}
      minDate={null} // <-- Add this line
    />
  );
}

export default DatePicker;