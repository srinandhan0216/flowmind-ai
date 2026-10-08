import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  ArrowUpRight, 
  RefreshCw,
  Plus,
  TrendingUp,
  Sparkles,
  Building2
} from 'lucide-react';
import { fetchRequests } from '../services/api';
import type { RequestItem } from '../types/database';
import { Badge } from '../components/Badge';
import { StatsSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';
import { EmptyState } from '../components/EmptyState';

export const Dashboard: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRequests({ limit: 100 });
      setRequests(res.data);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to fetch requests from Express backend. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending' || r.status === 'under_review').length;
  const autoApproved = requests.filter((r) => r.ai_decision === 'auto_approved' || r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'rejected' || r.ai_decision === 'auto_rejected').length;
  const escalated = requests.filter((r) => r.status === 'escalated' || r.ai_decision === 'escalated').length;

  const resolved = requests.filter((r) => r.status !== 'pending' && r.status !== 'under_review').length;
  const automationRate = total > 0 ? Math.round(((autoApproved + rejected) / total) * 100) : 0;

  const recentRequests = requests.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Automation Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
              Live Overview
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time organizational intake, AI decision telemetry, and autonomous approval metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* 6 Key Enterprise SaaS Metric Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Requests */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Requests</span>
              <Inbox className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-[11px] text-slate-500">All intake channels</div>
          </div>

          {/* Pending Approvals */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{pending}</div>
            <div className="text-[11px] text-slate-500">Requires review</div>
          </div>

          {/* Auto Approved */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Auto Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">{autoApproved}</div>
            <div className="text-[11px] text-slate-500">Zero human touch</div>
          </div>

          {/* Rejected */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-rose-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-300">{rejected}</div>
            <div className="text-[11px] text-slate-500">Policy violations</div>
          </div>

          {/* Escalated */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Escalated</span>
              <AlertTriangle className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{escalated}</div>
            <div className="text-[11px] text-slate-500">High-risk flags</div>
          </div>

          {/* Automation Rate */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-indigo-300">
              <span className="text-xs font-medium">Automation Rate</span>
              <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">{automationRate}%</div>
            <div className="text-[11px] text-indigo-400/80">AI efficiency index</div>
          </div>
        </div>
      )}

      {/* Middle Section: Insights & Performance Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automation Throughput Banner */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Organizational Velocity</h3>
                <p className="text-xs text-slate-400">Distribution across resolution pipelines</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {resolved} of {total} processed
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${total ? (autoApproved / total) * 100 : 0}%` }} 
              className="bg-emerald-500 transition-all duration-500" 
              title="Auto Approved"
            />
            <div 
              style={{ width: `${total ? (pending / total) * 100 : 0}%` }} 
              className="bg-amber-500 transition-all duration-500" 
              title="Pending"
            />
            <div 
              style={{ width: `${total ? (escalated / total) * 100 : 0}%` }} 
              className="bg-purple-500 transition-all duration-500" 
              title="Escalated"
            />
            <div 
              style={{ width: `${total ? (rejected / total) * 100 : 0}%` }} 
              className="bg-rose-500 transition-all duration-500" 
              title="Rejected"
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Approved ({autoApproved})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pending ({pending})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Escalated ({escalated})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Rejected ({rejected})</span>
            </div>
          </div>
        </div>

        {/* AI Agent Summary */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/30 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gemini Decision Engine</span>
            </div>
            <h4 className="text-base font-semibold text-white">Active Autonomous Rules</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Invoices under $2,500 with zero anomaly risk are auto-approved. Critical compliance requests route automatically to tier-2 approvers.
            </p>
          </div>

          <Link
            to="/workflows"
            className="inline-flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-indigo-500/40 transition-colors"
          >
            <span>Configure Workflows</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
          </Link>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Organizational Requests</h2>
            <p className="text-xs text-slate-400">Incoming requests and real-time AI triage status</p>
          </div>
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>View All ({total})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : recentRequests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Your intake queue is currently empty. Create a new request to see FlowMind AI auto-triage in action."
            actionText="Create First Request"
            actionTo="/requests/new"
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Request & Category</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Priority & Risk</th>
                    <th className="py-3.5 px-4">AI Decision</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/requests/${req.id}`}
                          className="font-medium text-slate-100 hover:text-indigo-400 transition-colors block line-clamp-1"
                        >
                          {req.title}
                        </Link>
                        <span className="text-[11px] text-slate-500">{req.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{req.department}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                        ${Number(req.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge type="priority" value={req.priority} />
                          <Badge type="risk" value={req.risk} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type="ai" value={req.ai_decision} />
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type="status" value={req.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/requests/${req.id}`}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 font-medium transition-colors"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
