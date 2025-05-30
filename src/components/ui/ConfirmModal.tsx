import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-red-alert/20 text-red-alert hover:bg-red-alert/30',
      icon: 'text-red-alert'
    },
    warning: {
      button: 'bg-yellow-warning/20 text-yellow-warning hover:bg-yellow-warning/30',
      icon: 'text-yellow-warning'
    },
    info: {
      button: 'bg-nebula-purple/20 text-nebula-purple hover:bg-nebula-purple/30',
      icon: 'text-nebula-purple'
    }
  };

  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-deep-space rounded-xl w-full max-w-md border border-white/10 shadow-xl">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-orbitron text-star-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-moon-gray hover:text-star-white"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-moon-gray mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={variantStyles[variant].button}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 