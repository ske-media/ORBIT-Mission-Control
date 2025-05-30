import React from 'react';
import { TicketPriority } from '../../types';
import { cn } from '@/lib/utils';

type BadgeProps = {
  priority?: TicketPriority;
  className?: string;
  variant?: 'outline' | 'default';
  children?: React.ReactNode;
};

const Badge: React.FC<BadgeProps> = ({ priority, className = '', variant = 'default', children }) => {
  let colorClasses = '';
  
  if (variant === 'outline') {
    colorClasses = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
  } else if (priority) {
    switch (priority) {
      case TicketPriority.HIGH:
        colorClasses = 'bg-red-alert/20 text-red-alert border-red-alert';
        break;
      case TicketPriority.MEDIUM:
        colorClasses = 'bg-yellow-warning/20 text-yellow-warning border-yellow-warning';
        break;
      case TicketPriority.LOW:
        colorClasses = 'bg-green-success/20 text-green-success border-green-success';
        break;
    }
  }
  
  return (
    <span className={cn("text-xs px-2 py-1 rounded-full border", colorClasses, className)}>
      {children || (priority === TicketPriority.HIGH ? 'Haute' : priority === TicketPriority.MEDIUM ? 'Moyenne' : 'Basse')}
    </span>
  );
};

export default Badge;