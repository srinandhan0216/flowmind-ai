import React, { useEffect, useState } from 'react';
import { Layers, Plus, Clock, Cpu, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchAutomations, type AutomationWorkflow } from '../services/api';

export const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAutomations();
      setWorkflows(data);
    } catch (err: unknown) {
      console.error('Failed to load workflows:', err);
      setError('Unable to fetch workflows from backend API (/api/automations).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Organization Automations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active AI workflows managed by FlowMind engine and routed via Express.js.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadWorkflows}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh workflows"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            onClick={() => alert('Workflow creation builder will be implemented in the next phase.')}
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Fetching workflows from backend API...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Failed to retrieve workflows</h3>
            <p className="text-xs text-rose-300/80">{error}</p>
            <button
              onClick={loadWorkflows}
              className="mt-2 text-xs font-medium text-white bg-rose-850 px-3 py-1.5 rounded-lg hover:bg-rose-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400">
          <Layers className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h3 className="font-medium text-slate-200">No automations found</h3>
          <p className="text-xs text-slate-500 mt-1">Get started by creating your first workflow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                    {wf.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      wf.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {wf.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                    <span>{wf.name}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {wf.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{wf.nodesCount} Nodes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated recently</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
