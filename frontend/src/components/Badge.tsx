import React from 'react';
import type { RequestPriority, RequestRisk, RequestStatus, AIDecision } from '../types/database';

interface BadgeProps {
  type: 'status' | 'priority' | 'risk' | 'ai';
  value: RequestStatus | RequestPriority | RequestRisk | AIDecision | string | null | undefined;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  if (!value) return null;

  const val = String(value).toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = String(value).replace(/_/g, ' ');

  if (type === 'status') {
    switch (val) {
      case 'approved':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        break;
      case 'pending':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        break;
      case 'under_review':
        colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
        break;
      case 'rejected':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        break;
      case 'escalated':
        colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  } else if (type === 'priority') {
    switch (val) {
      case 'urgent':
        colorClasses = 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold';
        break;
      case 'high':
        colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold';
        break;
      case 'medium':
        colorClasses = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
        break;
      case 'low':
        colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
        break;
    }
  } else if (type === 'risk') {
    switch (val) {
      case 'critical':
        colorClasses = 'bg-red-500/20 text-red-300 border-red-500/50 font-bold';
        break;
      case 'high':
        colorClasses = 'bg-orange-500/15 text-orange-300 border-orange-500/40';
        break;
      case 'medium':
        colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
        break;
      case 'low':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        break;
    }
  } else if (type === 'ai') {
    switch (val) {
      case 'auto_approved':
        colorClasses = 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border-emerald-500/40';
        label = 'AI Approved';
        break;
      case 'auto_rejected':
        colorClasses = 'bg-rose-500/15 text-rose-300 border-rose-500/40';
        label = 'AI Rejected';
        break;
      case 'manual_review_required':
        colorClasses = 'bg-blue-500/15 text-blue-300 border-blue-500/40';
        label = 'Manual Review';
        break;
      case 'escalated':
        colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/40';
        label = 'AI Escalated';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border capitalize font-medium tracking-wide ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
