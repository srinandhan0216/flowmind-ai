import React, { useEffect, useState } from 'react';
import { 
  Workflow, 
  Sparkles, 
  Wand2, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  RefreshCw, 
  Zap, 
  Code2, 
  Clock,
  Send
} from 'lucide-react';
import { 
  generateAIWorkflow, 
  saveWorkflow, 
  fetchWorkflowsList, 
  type GeneratedWorkflowData 
} from '../services/api';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';

export const WorkflowBuilder: React.FC = () => {
  // Natural Language Prompt State
  const [prompt, setPrompt] = useState('For purchases above ₹50,000 require manager and finance approval.');
  const [generating, setGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflowData | null>({
    name: 'High Value Purchase Approval',
    trigger: 'PURCHASE_REQUEST',
    conditions: [
      {
        field: 'amount',
        operator: '>',
        value: 50000
      }
    ],
    actions: [
      {
        type: 'REQUIRE_APPROVAL',
        role: 'MANAGER'
      },
      {
        type: 'REQUIRE_APPROVAL',
        role: 'FINANCE'
      }
    ]
  });

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Saved workflows from Supabase
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const samplePrompts = [
    'For purchases above ₹50,000 require manager and finance approval.',
    'Auto-approve cloud observability tools under $2,500 if low risk.',
    'All IT server purchases above ₹2,00,000 require director and finance approval.'
  ];

  const loadWorkflows = async () => {
    setLoadingWorkflows(true);
    try {
      const data = await fetchWorkflowsList();
      setSavedWorkflows(data);
    } catch (err: unknown) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  // Generate workflow from natural language
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const result = await generateAIWorkflow(prompt.trim());
      setGeneratedWorkflow(result);
    } catch (err: unknown) {
      console.error('Workflow generation failed:', err);
      setError('Gemini AI workflow generation failed. Verify your prompt or backend connection.');
    } finally {
      setGenerating(false);
    }
  };

  // Save generated workflow to Supabase
  const handleSaveToSupabase = async () => {
    if (!generatedWorkflow) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const saved = await saveWorkflow({
        name: generatedWorkflow.name,
        trigger: generatedWorkflow.trigger,
        conditions: generatedWorkflow.conditions,
        actions: generatedWorkflow.actions
      });

      setSaveSuccess(`Workflow "${saved.name}" successfully persisted to Supabase (ID: ${saved.id.slice(0, 8)}...).`);
      await loadWorkflows();
    } catch (err: unknown) {
      console.error('Failed to save workflow:', err);
      setError('Failed to save workflow to Supabase database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Workflow className="w-7 h-7 text-indigo-400" />
            <span>AI Workflow Builder</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Describe organizational policies in natural language &mdash; Gemini generates structured, Zod-validated rules and saves them to Supabase.
          </p>
        </div>

        <button
          onClick={loadWorkflows}
          disabled={loadingWorkflows}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors self-start sm:self-auto"
          title="Refresh saved workflows"
        >
          <RefreshCw className={`w-4 h-4 ${loadingWorkflows ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Natural Language Prompt Studio Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800 space-y-6 shadow-2xl shadow-indigo-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Natural Language to Workflow Pipeline (POST /api/ai/generate-workflow)</span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
            Powered by Gemini
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. For purchases above ₹50,000 require manager and finance approval."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors leading-relaxed"
            />
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Try sample:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                "{p}"
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Workflow Rules...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Workflow with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Visual Canvas of the Generated Workflow */}
      {generatedWorkflow && (
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                Validated Zod Structure
              </div>
              <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                <span>{generatedWorkflow.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {generatedWorkflow.trigger}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showJson ? 'Visual Canvas' : 'View Raw JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToSupabase}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Workflow to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showJson ? (
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(generatedWorkflow, null, 2)}
            </pre>
          ) : (
            /* Visual Flow Representation */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* 1. Trigger Node */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Stage 1</span>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Zap className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Event Trigger</h3>
                    <p className="text-xs text-slate-400 mt-1">Listens to intake requests</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/90 text-xs font-mono text-indigo-300 border border-slate-800">
                    trigger: {generatedWorkflow.trigger}
                  </div>
                </div>

                {/* 2. Conditions Node */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 hover:border-indigo-500/50 transition-colors shadow-lg shadow-indigo-500/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">Stage 2</span>
                    <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Sliders className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Rule Conditions</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {generatedWorkflow.conditions.length} threshold rule(s)
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {generatedWorkflow.conditions.map((cond, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-900/90 text-xs font-mono text-cyan-300 border border-slate-800 flex items-center justify-between">
                        <span>{cond.field}</span>
                        <span className="text-indigo-400 font-bold">{cond.operator}</span>
                        <span>{String(cond.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Actions Node */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 hover:border-emerald-500/50 transition-colors shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">Stage 3</span>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Send className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Execution Actions</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {generatedWorkflow.actions.length} action(s) chained
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {generatedWorkflow.actions.map((act, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-900/90 text-xs font-mono text-emerald-300 border border-slate-800 flex items-center justify-between">
                        <span className="truncate">{act.type}</span>
                        {act.role && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-bold">
                            {act.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Saved Workflows in Supabase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Active Organizational Workflows in Supabase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workflows loaded dynamically by FlowMind AI decision engine.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {savedWorkflows.length} policies registered
          </span>
        </div>

        {loadingWorkflows ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : savedWorkflows.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No workflows in database. Use the generator above to create and save your first workflow.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedWorkflows.map((wf) => {
              const rulesCount = Array.isArray(wf.rules) ? wf.rules.length : (wf.rules ? Object.keys(wf.rules).length : 0);
              const actionsCount = Array.isArray(wf.actions) ? wf.actions.length : (wf.actions ? Object.keys(wf.actions).length : 0);

              return (
                <div
                  key={wf.id}
                  className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {wf.id.slice(0, 8)}...
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-1">{wf.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {wf.description || 'Custom organizational automation workflow.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-indigo-300">
                      {rulesCount} Rules &bull; {actionsCount} Actions
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(wf.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
