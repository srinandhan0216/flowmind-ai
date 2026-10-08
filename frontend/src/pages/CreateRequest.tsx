import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowLeft, 
  Sparkles, 
  DollarSign, 
  Building2, 
  Tag, 
  Send,
  AlertCircle,
  Wand2,
  CheckCircle2
} from 'lucide-react';
import { createRequest, analyzeAIRequest, type AIAnalysisResultPayload } from '../services/api';
import type { RequestPriority, RequestRisk } from '../types/database';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();

  // Natural language AI prompt bar state
  const [aiPrompt, setAiPrompt] = useState('I need ₹75000 to purchase three laptops for my development team.');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResultPayload | null>(null);

  // Form fields state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Procurement');
  const [department, setDepartment] = useState('Engineering');
  const [amount, setAmount] = useState<string>('0');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [risk, setRisk] = useState<RequestRisk>('low');
  const [description, setDescription] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Trigger Gemini Decision Engine analysis
  const handleAIExtract = async () => {
    if (!aiPrompt.trim()) return;
    setAiAnalyzing(true);
    setApiError(null);
    try {
      const result = await analyzeAIRequest(aiPrompt.trim());
      setAiResult(result);

      // Auto-fill form fields from AI analysis
      if (result.extractedData?.item) {
        setTitle(`Purchase: ${result.extractedData.quantity ? result.extractedData.quantity + 'x ' : ''}${result.extractedData.item}`);
      } else {
        setTitle(`Request: ${result.category.replace(/_/g, ' ')}`);
      }

      setAmount(String(result.extractedData?.amount || 0));
      setDescription(aiPrompt);

      if (result.category) {
        // Map category if matches standard list
        setCategory(result.category.replace(/_/g, ' '));
      }

      const pMap: Record<string, RequestPriority> = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'urgent'
      };
      if (result.priority && pMap[result.priority]) {
        setPriority(pMap[result.priority]);
      }

      const rMap: Record<string, RequestRisk> = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high'
      };
      if (result.risk && rMap[result.risk]) {
        setRisk(rMap[result.risk]);
      }
    } catch (err: unknown) {
      console.error('AI Analysis failed:', err);
      setApiError('Gemini decision analysis failed. Check that GEMINI_API_KEY is configured in backend/.env.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setApiError(null);

    // Client-side validations
    const errors: string[] = [];
    if (!title.trim()) {
      errors.push('Request title is required.');
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      errors.push('Amount must be a non-negative number.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // If AI was already run and created a record with requestId, navigate there
      if (aiResult?.requestId && !submitting) {
        navigate(`/requests/${aiResult.requestId}`);
        return;
      }

      const created = await createRequest({
        title: title.trim(),
        category: category.trim(),
        department: department.trim(),
        amount: parsedAmount,
        priority,
        risk,
        description: description.trim()
      });

      // Navigate to the newly created request detail view
      navigate(`/requests/${created.id}`);
    } catch (err: unknown) {
      console.error('Error submitting request:', err);
      const errorObj = err as { response?: { data?: { errors?: string[]; message?: string } } };
      if (errorObj?.response?.data?.errors) {
        setValidationErrors(errorObj.response.data.errors);
      } else {
        setApiError(errorObj?.response?.data?.message || 'Failed to submit request to backend API.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/requests"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          title="Back to Inbox"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-indigo-400" />
            <span>Create New Request</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit an operational or budget authorization request for autonomous AI evaluation.
          </p>
        </div>
      </div>

      {/* AI Smart Extraction Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-900/30 border border-indigo-500/30 space-y-3 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>FlowMind AI Decision Engine (POST /api/ai/analyze-request)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
            Gemini 2.5
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Paste any natural language request and let Gemini extract line items, quantify risk, and evaluate Supabase workflow rules:
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. I need ₹75000 to purchase three laptops for my development team."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAIExtract}
            disabled={aiAnalyzing || !aiPrompt.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all disabled:opacity-50 shrink-0"
          >
            {aiAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Rules...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Auto-Extract</span>
              </>
            )}
          </button>
        </div>

        {/* Display Result banner */}
        {aiResult && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Analysis Complete &bull; Decision: {aiResult.decision}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                Priority: {aiResult.priority} | Risk: {aiResult.risk}
              </span>
            </div>
            <p className="text-slate-300 italic text-[11px] leading-relaxed">
              "{aiResult.reason}"
            </p>
            {aiResult.requiredApprovals.length > 0 && (
              <div className="text-[11px] text-amber-300">
                Required Approvals: {aiResult.requiredApprovals.join(' & ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Errors display */}
      {(validationErrors.length > 0 || apiError) && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Please resolve the following before proceeding:</span>
          </div>
          {apiError && <p className="text-xs text-rose-300/90">{apiError}</p>}
          {validationErrors.length > 0 && (
            <ul className="list-disc list-inside text-xs space-y-1 text-rose-300/80 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Request Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Purchase: 3x laptops"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              required
            />
          </div>

          {/* Category & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Category</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. IT_EQUIPMENT or Procurement"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Department</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Product">Product</option>
                <option value="Legal">Legal</option>
                <option value="HR">HR</option>
              </select>
            </div>
          </div>

          {/* Amount, Priority, Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                <span>Amount</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Risk */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Assessed Risk
              </label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as RequestRisk)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Business Justification / Scope
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context, vendor contract details, justification, or deliverables for AI policy evaluation..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/requests"
            className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Save Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
