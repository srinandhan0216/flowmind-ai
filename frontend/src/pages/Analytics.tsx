import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Building2, 
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { fetchRequests } from '../services/api';
import type { RequestItem } from '../types/database';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';

export const Analytics: React.FC = () => {
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
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics metrics from Express backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = requests.length;
  const approved = requests.filter((r) => r.status === 'approved' || r.ai_decision === 'auto_approved').length;

  const totalAmount = requests.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const autoApprovedRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  // Estimated hours and cost savings (each automated decision saves ~45 mins of manual reviewer time @ $65/hr)
  const estimatedHoursSaved = (approved * 0.75).toFixed(1);
  const estimatedCostSaved = Math.round(approved * 0.75 * 65);

  // Department breakdown
  const departments = ['Engineering', 'Finance', 'Operations', 'Legal', 'Product', 'HR'];
  const departmentCounts = departments.map((dept) => {
    const count = requests.filter((r) => r.department === dept).length;
    return { dept, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  }).filter((d) => d.count > 0);

  // Risk breakdown
  const riskCounts = [
    { risk: 'Low', count: requests.filter((r) => r.risk === 'low').length, color: 'bg-emerald-500' },
    { risk: 'Medium', count: requests.filter((r) => r.risk === 'medium').length, color: 'bg-amber-500' },
    { risk: 'High', count: requests.filter((r) => r.risk === 'high').length, color: 'bg-orange-500' },
    { risk: 'Critical', count: requests.filter((r) => r.risk === 'critical').length, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            <span>Operational & AI Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated metrics derived from live Supabase PostgreSQL and Gemini automation logs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors self-start sm:self-auto"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* KPI Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Automation Rate */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Autonomous Resolution</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white">{autoApprovedRate}%</div>
            <p className="text-xs text-slate-400">Processed without human lag</p>
          </div>

          {/* Value Managed */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Volume Filtered</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-300">
              ${totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-slate-400">Across {total} organizational requests</p>
          </div>

          {/* Reviewer Hours Saved */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Review Time Saved</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-cyan-300">
              {estimatedHoursSaved} hrs
            </div>
            <p className="text-xs text-slate-400">~45 mins average per triage</p>
          </div>

          {/* OPEX Cost Reductions */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-indigo-300 text-xs">
              <span>Estimated Cost Savings</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              ${estimatedCostSaved.toLocaleString()}
            </div>
            <p className="text-xs text-indigo-400/80">Direct operational labor savings</p>
          </div>
        </div>
      )}

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Department Intake Distribution</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{departmentCounts.length} active units</span>
          </div>

          {departmentCounts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No department records available.</p>
          ) : (
            <div className="space-y-4">
              {departmentCounts.map((d) => (
                <div key={d.dept} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium">{d.dept}</span>
                    <span className="font-mono text-slate-400">{d.count} requests ({d.pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${d.pct}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Level Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Risk Profile Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Gemini Threat Model</span>
          </div>

          <div className="space-y-4">
            {riskCounts.map((r) => {
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={r.risk} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium">{r.risk} Risk</span>
                    <span className="font-mono text-slate-400">{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${r.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            Requests flagged as <strong>Critical</strong> or <strong>High</strong> risk bypass auto-approval and enforce multi-factor managerial sign-off.
          </div>
        </div>
      </div>
    </div>
  );
};
