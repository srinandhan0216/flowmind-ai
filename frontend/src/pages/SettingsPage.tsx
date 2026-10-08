import React from 'react';
import { Sliders, KeyRound, Globe, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured in frontend';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System & Environment Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Verify application endpoints, ports, and environment variable integration status.
        </p>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-indigo-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-white">Zero Hardcoded Credentials Guarantee</div>
          <p className="text-indigo-300/80 leading-relaxed">
            All API keys (Gemini, Supabase Anon/Service Role) are loaded dynamically through isolated <code className="text-indigo-200 bg-slate-900 px-1 py-0.5 rounded">.env</code> files. Never commit real production secrets to version control.
          </p>
        </div>
      </div>

      {/* Connection matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend Config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Frontend Service</h3>
              <p className="text-xs text-slate-400">Vite + React + TypeScript</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Local Port</span>
              <span className="font-mono text-indigo-400 font-semibold">5173</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Target Backend URL</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]">{apiBaseUrl}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Supabase Client URL</span>
              <span className="font-mono text-slate-400 truncate max-w-[180px]">{supabaseUrl}</span>
            </div>
          </div>
        </div>

        {/* Backend Config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Backend Service</h3>
              <p className="text-xs text-slate-400">Node.js + Express + TypeScript</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Listening Port</span>
              <span className="font-mono text-cyan-400 font-semibold">5000</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Health Endpoint</span>
              <span className="font-mono text-emerald-400 font-semibold">/health</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">API Prefix</span>
              <span className="font-mono text-slate-300 font-semibold">/api</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variable Setup Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <span>Configuring Environment Variables</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          To connect your actual Supabase project and Gemini API key, edit <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">backend/.env</code>:
        </p>
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key`}
        </pre>
      </div>
    </div>
  );
};
