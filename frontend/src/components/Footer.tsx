import React from 'react';
import { Database, Sparkles, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-850 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>FlowMind AI &bull; Smart Organizational Automation Platform</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Gemini AI
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Supabase PG
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            Node/Express
          </span>
        </div>
      </div>
    </footer>
  );
};
