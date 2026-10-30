import React from 'react';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { ComplaintStatus } from '../types';

interface Props {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Resolved',
          icon: CheckCircle2,
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: Loader2,
          bgColor: 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-500/20',
          dot: 'bg-sky-500',
          spin: true,
        };
      case 'pending':
      default:
        return {
          label: 'Pending Action',
          icon: Clock,
          bgColor: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20',
          dot: 'bg-amber-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      id={`status-badge-${status}`}
      className={`inline-flex items-center rounded-full border ${config.bgColor} ${sizeStyles} ${className}`}
    >
      <Icon
        size={size === 'sm' ? 12 : 14}
        className={`shrink-0 ${config.spin ? 'animate-spin' : ''}`}
      />
      <span>{config.label}</span>
    </span>
  );
};
