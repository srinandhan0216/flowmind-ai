import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  FileText, 
  Activity, 
  Check, 
  RotateCcw,
  Zap,
  Layers,
  History
} from 'lucide-react';
import { 
  fetchRequestById, 
  updateRequest, 
  executeWorkflow, 
  fetchWorkflowLogs, 
  type WorkflowLogItem 
} from '../services/api';
import type { RequestItem, RequestStatus, AIDecision } from '../types/database';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [logs, setLogs] = useState<WorkflowLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Action decision state
  const [actionLoading, setActionLoading] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [reqData, logsData] = await Promise.all([
        fetchRequestById(id),
        fetchWorkflowLogs(id).catch(() => [])
      ]);
      setRequest(reqData);
      setLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load request details:', err);
      if (err.response?.status === 403) {
        setError(`Access Denied (403): Role "${user?.role}" does not have permission to view this request.`);
      } else {
        setError(`Unable to retrieve request "${id}". Ensure it exists in the database.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.id, user?.role]);


  // Run FlowMind Workflow Execution Engine
  const handleExecuteEngine = async () => {
    if (!id) return;
    setExecutingWorkflow(true);
    setActionSuccess(null);
    setError(null);
    try {
      const result = await executeWorkflow(id);
      setActionSuccess(`Workflow executed: Status moved to ${result.finalStatus} (${result.aiDecision}).`);
      // Reload request & audit logs
      const [updatedReq, updatedLogs] = await Promise.all([
        fetchRequestById(id),
        fetchWorkflowLogs(id)
      ]);
      setRequest(updatedReq);
      setLogs(updatedLogs);
    } catch (err: unknown) {
      console.error('Workflow execution failed:', err);
      setError('Failed to execute workflow pipeline on backend.');
    } finally {
      setExecutingWorkflow(false);
    }
  };

  const handleStatusUpdate = async (newStatus: RequestStatus, decisionType?: AIDecision) => {
    if (!id || !request) return;
    setActionLoading(true);
    setActionSuccess(null);
    setError(null);

    try {
      const payload: Partial<RequestItem> = {
        status: newStatus
      };

      if (decisionType) {
        payload.ai_decision = decisionType;
      }

      if (comment.trim()) {
        payload.ai_reason = `${request.ai_reason ? request.ai_reason + ' | ' : ''}Manual review: ${comment.trim()}`;
      }

      const updated = await updateRequest(id, payload);
      setRequest(updated);
      setActionSuccess(`Status successfully updated to "${newStatus.replace('_', ' ')}".`);
      setComment('');
      // Refresh logs
      fetchWorkflowLogs(id).then(setLogs).catch(() => {});
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      setError('Failed to update request status via Express PATCH endpoint.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Request Inbox</span>
        </Link>
        <ErrorAlert
          title="Request Not Found"
          message={error || 'The requested resource could not be loaded.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top back navigation & status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/requests"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
            title="Back to requests"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">ID: {request.id.slice(0, 8)}...</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-xs text-slate-400 font-medium">{request.category}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {request.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge type="status" value={request.status} className="text-sm px-3.5 py-1" />
          <Badge type="priority" value={request.priority} />
          <Badge type="risk" value={request.risk} />

          {/* Trigger Workflow Execution Engine */}
          <button
            onClick={handleExecuteEngine}
            disabled={executingWorkflow}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            title="Trigger FlowMind Autonomous Workflow Pipeline"
          >
            <Zap className={`w-3.5 h-3.5 ${executingWorkflow ? 'animate-spin' : ''}`} />
            <span>{executingWorkflow ? 'Executing Pipeline...' : 'Run Workflow Engine'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {/* Grid: Main Details & AI Insight Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Parameters Card */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Request Specifications</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Amount</span>
                <div className="text-base font-bold font-mono text-white flex items-center">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{Number(request.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Department</span>
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{request.department}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Created On</span>
                <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Description / Scope */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Detailed Justification
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {request.description || 'No detailed scope provided.'}
              </div>
            </div>

            {/* Submitter */}
            {request.users && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Submitted by <strong className="text-slate-200">{request.users.name}</strong> ({request.users.email})</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{request.users.department}</span>
              </div>
            )}
          </div>

          {/* Human-in-the-Loop Action Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Approval Operations & Decision Controls</span>
            </h3>
            <p className="text-xs text-slate-400">
              Override or certify the AI recommendation. Submitting will update the PostgreSQL database in real time.
            </p>

            <div className="space-y-3">
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional reviewer notes or audit rationale..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap items-center gap-3">
                {user?.role === 'EMPLOYEE' ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs w-full flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Employees cannot approve or reject requests. Switch to Manager, Finance, or Admin role above to perform approval decisions.</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={actionLoading || request.status === 'approved'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Request</span>
                    </button>

                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={actionLoading || request.status === 'rejected'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>

                    <button
                      onClick={() => handleStatusUpdate('escalated')}
                      disabled={actionLoading || request.status === 'escalated'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Escalate to Executive</span>
                    </button>

                    <button
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={actionLoading || request.status === 'pending'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors disabled:opacity-50 ml-auto"
                      title="Reset to pending"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Pending</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>


          {/* Workflow Execution Audit Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Workflow Audit Trail (GET /api/workflows/logs/{request.id.slice(0, 8)}...)</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">{logs.length} logged events</span>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No workflow execution logs recorded yet. Click "Run Workflow Engine" above to trigger.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300 font-mono text-[11px] uppercase">
                        [{log.step}] &bull; {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(log.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Decision Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 space-y-6 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>AI Cognitive Audit</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Gemini
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400">Current AI Determination:</span>
              <div>
                <Badge type="ai" value={request.ai_decision || 'pending'} className="text-xs px-3 py-1 font-semibold" />
              </div>
            </div>

            {/* AI Reason */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400">Reasoning & Telemetry:</span>
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                {request.ai_reason ? (
                  `"${request.ai_reason}"`
                ) : (
                  <span className="text-slate-500 not-italic">
                    AI evaluation awaiting pipeline trigger or human reviewer determination.
                  </span>
                )}
              </div>
            </div>

            {/* Active Policy Summary */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Default Purchase Policy Check:</span>
              </span>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Current Amount:</span>
                  <span className="font-mono text-emerald-300 font-semibold">₹{Number(request.amount || 0).toLocaleString()}</span>
                </div>
                <div className="text-slate-400 leading-snug">
                  {Number(request.amount || 0) <= 10000
                    ? 'Tier 1 Micro: Eligible for Auto-Approve (<= ₹10,000)'
                    : Number(request.amount || 0) <= 50000
                    ? 'Tier 2 Standard: Requires Manager sign-off'
                    : Number(request.amount || 0) <= 200000
                    ? 'Tier 3 Elevated: Requires Manager + Finance sign-off'
                    : 'Tier 4 Executive: Requires Manager + Finance + Director sign-off'}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Timestamp card */}
          <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 text-xs text-slate-500 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span>{new Date(request.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Updated</span>
              <span>{new Date(request.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
