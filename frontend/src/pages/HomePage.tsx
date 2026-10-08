import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Workflow, 
  Server, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { fetchHealthCheck, type HealthResponse } from '../services/api';

export const HomePage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthCheck();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      console.error('Failed to connect to backend:', err);
      setError('Unable to reach backend at port 5000. Ensure the Express server is running.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-xs text-indigo-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Enterprise Automation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Workflows Powered by{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              FlowMind AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Unify business logic, predictive document processing, and generative AI agents into a single high-performance automation engine. Built with React, Express, Supabase, and Gemini.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/workflows"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Workflow className="w-4 h-4" />
              <span>Explore Workflows</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Check Server Health</span>
            </button>
          </div>
        </div>
      </section>

      {/* Realtime Backend Health Check Card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Full-Stack Interconnection Health</h2>
              <p className="text-xs text-slate-400">Verifying live communication between Frontend (5173) and Backend (5000)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs text-slate-400">Last checked: {lastChecked}</span>
            )}
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Pinging Express API at http://localhost:5000/health...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Backend Unreachable</div>
              <div className="text-xs text-rose-300/80">{error}</div>
              <div className="text-xs text-slate-400 pt-2 font-mono">
                Start backend with: <span className="text-indigo-300 bg-slate-900 px-2 py-0.5 rounded">cd backend && npm run dev</span>
              </div>
            </div>
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Express API Status */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Backend API</div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span className="capitalize">{health.status}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">Port: {health.port || 5000} &bull; Uptime: {health.uptimeSeconds || 0}s</div>
            </div>

            {/* Supabase Status */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Supabase Database</div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className={`text-sm font-semibold ${health.integrations?.supabaseConfigured ?? true ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {health.integrations?.supabaseConfigured ?? true ? 'Connected' : 'Config Pending'}
                </span>
              </div>
              <div className="text-xs text-slate-400">PostgreSQL Cloud Layer</div>
            </div>

            {/* Gemini AI Status */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Gemini AI Model</div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className={`text-sm font-semibold ${health.integrations?.geminiConfigured ?? true ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {health.integrations?.geminiConfigured ?? true ? 'Ready' : 'API Key Required'}
                </span>
              </div>
              <div className="text-xs text-slate-400">Google Generative AI</div>
            </div>

            {/* Environment */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Environment</div>
              <div className="flex items-center gap-2 text-slate-200 font-semibold capitalize text-sm">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>{health.environment || 'production'}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">{health.service || 'FlowMind AI'}</div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Architecture Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Smart Event Automations</h3>
          <p className="text-sm text-slate-400">
            React frontend running on port 5173 communicating seamlessly over Axios with Node.js Express backend.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Gemini AI Intelligence</h3>
          <p className="text-sm text-slate-400">
            Configured with official Google Generative AI SDK ready for multi-modal reasoning and agent pipelines.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Supabase PostgreSQL</h3>
          <p className="text-sm text-slate-400">
            Secure client initialization with environment variable protection and enterprise schema readiness.
          </p>
        </div>
      </section>
    </div>
  );
};
