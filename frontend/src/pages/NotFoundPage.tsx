import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 text-center space-y-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
        <Compass className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">404 - Page Not Found</h1>
        <p className="text-sm text-slate-400">The automation route you are trying to access does not exist.</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
