import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  iconLeft,
  iconRight,
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const variantClasses = {
    primary: 'bg-nebula-purple hover:bg-nebula-purple-light text-star-white',
    secondary: 'bg-galaxy-blue hover:bg-galaxy-blue-light text-star-white',
    outline: 'bg-transparent border border-nebula-purple text-nebula-purple hover:bg-nebula-purple/10',
    ghost: 'bg-transparent hover:bg-white/10 text-star-white',
    danger: 'bg-red-alert hover:bg-red-alert/80 text-star-white'
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5'
  };

  return (
    <button
      type={type}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-md font-medium transition-all duration-200 ease-in-out
        flex items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
};

export default Button;