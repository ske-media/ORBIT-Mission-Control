import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string | React.ReactNode;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = ''
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-moon-gray">
          {label}
          {required && <span className="text-red-alert ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 appearance-none ${
            disabled
              ? 'opacity-70 cursor-not-allowed'
              : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'
          } ${error ? 'border-red-alert focus:border-red-alert focus:ring-red-alert' : ''} ${className}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {typeof option.label === 'string' ? option.label : option.value}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-moon-gray pointer-events-none"
        />
      </div>
      {error && <p className="text-sm text-red-alert">{error}</p>}
    </div>
  );
};

export default Select; 