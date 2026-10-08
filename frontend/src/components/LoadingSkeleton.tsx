import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-6 w-16 bg-slate-800 rounded-full" />
      </div>
      <div className="h-6 bg-slate-800 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-800/60 rounded w-full" />
        <div className="h-3 bg-slate-800/60 rounded w-2/3" />
      </div>
      <div className="pt-4 border-t border-slate-800/60 flex justify-between">
        <div className="h-4 bg-slate-800 rounded w-20" />
        <div className="h-4 bg-slate-800 rounded w-16" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/80 overflow-hidden animate-pulse">
      <div className="p-4 bg-slate-950/60 flex gap-4">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-4 bg-slate-800 rounded w-1/6" />
        <div className="h-4 bg-slate-800 rounded w-1/6" />
        <div className="h-4 bg-slate-800 rounded w-1/6" />
        <div className="h-4 bg-slate-800 rounded w-1/12" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <div className="space-y-1.5 w-1/4">
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
          </div>
          <div className="h-5 bg-slate-800 rounded-full w-1/6" />
          <div className="h-4 bg-slate-800 rounded w-1/6" />
          <div className="h-5 bg-slate-800 rounded-full w-1/6" />
          <div className="h-5 bg-slate-800 rounded w-1/12 ml-auto" />
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-800 rounded w-16" />
            <div className="w-6 h-6 bg-slate-800 rounded-lg" />
          </div>
          <div className="h-7 bg-slate-800 rounded w-12" />
          <div className="h-2 bg-slate-800/60 rounded w-20" />
        </div>
      ))}
    </div>
  );
};
