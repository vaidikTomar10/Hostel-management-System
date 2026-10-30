import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, ArrowDown } from 'lucide-react';
import { UrgencyLevel } from '../types';

interface Props {
  urgency: UrgencyLevel;
  className?: string;
}

export const UrgencyBadge: React.FC<Props> = ({ urgency, className = '' }) => {
  const getUrgencyConfig = () => {
    switch (urgency) {
      case 'emergency':
        return {
          label: 'Critical / Emergency',
          icon: Flame,
          classes: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold ring-1 ring-rose-400/30 shadow-xs',
        };
      case 'high':
        return {
          label: 'High Priority',
          icon: ShieldAlert,
          classes: 'bg-orange-100 text-orange-900 border-orange-300 font-semibold shadow-xs',
        };
      case 'medium':
        return {
          label: 'Medium Priority',
          icon: AlertTriangle,
          classes: 'bg-amber-100 text-amber-900 border-amber-300 font-medium shadow-xs',
        };
      case 'low':
      default:
        return {
          label: 'Standard / Low',
          icon: ArrowDown,
          classes: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
        };
    }
  };

  const config = getUrgencyConfig();
  const Icon = config.icon;

  return (
    <span
      id={`urgency-badge-${urgency}`}
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border gap-1 ${config.classes} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
