import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { enUS, es } from 'date-fns/locale';

// Import the stylesheet for the date picker
import "react-datepicker/dist/react-datepicker.css";

const locales = {
  en: enUS,
  es: es,
};

function DatePicker({ selectedDate, onChange, language }) {
  // Convert the string date back to a Date object for the library
  const dateObject = selectedDate ? new Date(selectedDate) : null;

  return (
    <ReactDatePicker
      selected={dateObject}
      onChange={onChange}
      locale={locales[language]} // Set the language for the calendar
      dateFormat="dd/MM/yyyy"
      className="w-full p-2 border rounded"
    />
  );
}

export default DatePicker;