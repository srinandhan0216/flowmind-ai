import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  actionTo,
  onActionClick
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
      
      {(actionText && (actionTo || onActionClick)) && (
        <div className="mt-6">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
