import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Inbox, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ArrowUpRight, 
  Building2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { fetchRequests } from '../services/api';
import type { RequestItem } from '../types/database';
import { Badge } from '../components/Badge';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorAlert } from '../components/ErrorAlert';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export const RequestInbox: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Filters state
  const statusFilter = searchParams.get('status') || 'all';
  const departmentFilter = searchParams.get('department') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const searchInput = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(searchInput);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchInput) params.search = searchInput;

      const res = await fetchRequests(params);
      setRequests(res.data);
    } catch (err: unknown) {
      console.error('Failed to load requests:', err);
      setError('Failed to fetch requests from Express backend (/api/requests).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, departmentFilter, priorityFilter, searchInput, user?.id, user?.role]);


  const handleStatusTab = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'all') {
      next.delete('status');
    } else {
      next.set('status', status);
    }
    setSearchParams(next);
  };

  const handleDepartmentChange = (dept: string) => {
    const next = new URLSearchParams(searchParams);
    if (dept === 'all') {
      next.delete('department');
    } else {
      next.set('department', dept);
    }
    setSearchParams(next);
  };

  const handlePriorityChange = (prio: string) => {
    const next = new URLSearchParams(searchParams);
    if (prio === 'all') {
      next.delete('priority');
    } else {
      next.set('priority', prio);
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      next.set('search', localSearch.trim());
    } else {
      next.delete('search');
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setLocalSearch('');
    setSearchParams({});
  };

  const statusTabs: { label: string; value: string }[] = [
    { label: 'All Requests', value: 'all' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Escalated', value: 'escalated' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="w-7 h-7 text-indigo-400" />
            <span>Request Inbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, and review all organizational operational and financial intake requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
            title="Refresh requests"
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

      {/* Role Permission Scope Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
            {user?.role || 'AUTH'} SCOPE
          </span>
          <span className="text-slate-300">
            {user?.role === 'ADMIN' && 'Full Organization Visibility: You can view and manage all intake requests across departments.'}
            {user?.role === 'FINANCE' && 'Finance Visibility: Scoped to financial purchases, budget triage, and departmental requests.'}
            {user?.role === 'MANAGER' && `Managerial Visibility: Scoped to ${user?.department || 'Departmental'} operations and pending approvals.`}
            {user?.role === 'EMPLOYEE' && 'Employee Visibility: Strictly restricted to requests submitted by your account.'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          {requests.length} accessible
        </span>
      </div>

      {/* Status Filter Tabs */}

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-850">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by title, description or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
        </form>

        {/* Department select */}
        <div className="sm:col-span-3">
          <select
            value={departmentFilter}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Legal">Legal</option>
            <option value="HR">HR</option>
          </select>
        </div>

        {/* Priority select */}
        <div className="sm:col-span-2">
          <select
            value={priorityFilter}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Reset */}
        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={clearFilters}
            className="p-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Reset filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadRequests} />}

      {/* Main Content: Table or Empty/Loading state */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests match criteria"
          description="We couldn't find any requests with the applied filters. Try adjusting your search query or clear the active filter."
          actionText="Clear Filters"
          onActionClick={clearFilters}
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl shadow-black/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Title & Context</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Priority & Risk</th>
                  <th className="py-3.5 px-4">AI Decision & Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-850/50 transition-colors group"
                  >
                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        to={`/requests/${req.id}`}
                        className="font-medium text-slate-100 hover:text-indigo-400 transition-colors block truncate"
                      >
                        {req.title}
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{req.category}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.department}</span>
                      </div>
                      {req.users && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          by {req.users.name}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      ${Number(req.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Priority & Risk */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge type="priority" value={req.priority} />
                        <Badge type="risk" value={req.risk} />
                      </div>
                    </td>

                    {/* AI Decision */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {req.ai_decision ? (
                        <div className="space-y-1">
                          <Badge type="ai" value={req.ai_decision} />
                          {req.ai_reason && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic" title={req.ai_reason}>
                              "{req.ai_reason}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-slate-600" />
                          <span>Pending AI Evaluation</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge type="status" value={req.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-colors"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-850 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {requests.length} total entries</span>
            <span className="font-mono text-[11px]">FlowMind Express API synced</span>
          </div>
        </div>
      )}
    </div>
  );
};
