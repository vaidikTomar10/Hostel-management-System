import React from 'react';
import {
  Zap,
  Wrench,
  Hammer,
  Wifi,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { ComplaintCategory } from '../types';

interface Props {
  category: ComplaintCategory;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const getCategoryMeta = (cat: ComplaintCategory) => {
  switch (cat) {
    case 'electrical':
      return {
        label: 'Electrician',
        icon: Zap,
        bgColor: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-500',
        borderColor: 'border-l-amber-500',
        cardGradient: 'from-amber-500 to-yellow-500',
        iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950',
        pillBg: 'bg-amber-50 text-amber-800 border-amber-300/80',
        lightBg: 'bg-amber-50/80',
      };
    case 'plumbing':
      return {
        label: 'Plumber',
        icon: Wrench,
        bgColor: 'bg-sky-100 text-sky-900 border-sky-300',
        dotColor: 'bg-sky-500',
        borderColor: 'border-l-sky-500',
        cardGradient: 'from-sky-500 to-blue-600',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
        pillBg: 'bg-sky-50 text-sky-800 border-sky-300/80',
        lightBg: 'bg-sky-50/80',
      };
    case 'carpentry':
      return {
        label: 'Carpenter',
        icon: Hammer,
        bgColor: 'bg-orange-100 text-orange-950 border-orange-300',
        dotColor: 'bg-orange-600',
        borderColor: 'border-l-orange-500',
        cardGradient: 'from-orange-500 to-amber-600',
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white',
        pillBg: 'bg-orange-50 text-orange-900 border-orange-300/80',
        lightBg: 'bg-orange-50/80',
      };
    case 'internet':
      return {
        label: 'Wi-Fi & Network',
        icon: Wifi,
        bgColor: 'bg-indigo-100 text-indigo-950 border-indigo-300',
        dotColor: 'bg-indigo-500',
        borderColor: 'border-l-indigo-500',
        cardGradient: 'from-indigo-500 to-purple-600',
        iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
        pillBg: 'bg-indigo-50 text-indigo-900 border-indigo-300/80',
        lightBg: 'bg-indigo-50/80',
      };
    case 'civil':
      return {
        label: 'Civil & Masonry',
        icon: Building2,
        bgColor: 'bg-rose-100 text-rose-950 border-rose-300',
        dotColor: 'bg-rose-500',
        borderColor: 'border-l-rose-500',
        cardGradient: 'from-rose-500 to-red-500',
        iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white',
        pillBg: 'bg-rose-50 text-rose-900 border-rose-300/80',
        lightBg: 'bg-rose-50/80',
      };
    case 'other':
    default:
      return {
        label: 'General / Other',
        icon: HelpCircle,
        bgColor: 'bg-purple-100 text-purple-950 border-purple-300',
        dotColor: 'bg-purple-500',
        borderColor: 'border-l-purple-500',
        cardGradient: 'from-purple-500 to-fuchsia-600',
        iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white',
        pillBg: 'bg-purple-50 text-purple-900 border-purple-300/80',
        lightBg: 'bg-purple-50/80',
      };
  }
};

export const CategoryBadge: React.FC<Props> = ({
  category,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      id={`cat-badge-${category}`}
      className={`inline-flex items-center rounded-md border ${meta.bgColor} ${sizeClasses} ${className}`}
    >
      <Icon size={iconSizes} className="shrink-0" />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
};
