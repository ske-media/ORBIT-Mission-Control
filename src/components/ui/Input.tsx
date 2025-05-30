import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm text-moon-gray">
          {label}
          {props.required && <span className="text-red-alert ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full bg-space-black border rounded-lg px-3 py-2.5 text-star-white focus:outline-none focus:ring-1 ${
          props.disabled
            ? 'opacity-70 cursor-not-allowed'
            : 'border-white/10 focus:border-nebula-purple focus:ring-nebula-purple hover:border-white/30'
        } ${error ? 'border-red-alert focus:border-red-alert focus:ring-red-alert' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-alert">{error}</p>}
    </div>
  );
};

export default Input; 