import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  error,
  disabled = false,
  required = false,
  className = ''
}) => {
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-moon-gray">
          {label}
          {required && <span className="text-red-alert ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value ? formatDate(value) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
          disabled={disabled}
          className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${
            disabled
              ? 'opacity-70 cursor-not-allowed'
              : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'
          } ${error ? 'border-red-alert focus:border-red-alert focus:ring-red-alert' : ''} ${className}`}
          placeholder={placeholder}
        />
        <Calendar
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none"
        />
      </div>
      {error && <p className="text-sm text-red-alert">{error}</p>}
    </div>
  );
};

export default DatePicker; 