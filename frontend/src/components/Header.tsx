import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Plus, Activity, Search, User } from 'lucide-react';
import { fetchHealthCheck, type HealthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onOpenMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    fetchHealthCheck()
      .then((data) => {
        if (mounted) setHealth(data);
      })
      .catch(() => {
        if (mounted) setHealth(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/requests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const roleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'FINANCE':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'MANAGER':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'EMPLOYEE':
      default:
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-850 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Mobile toggle button & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearch} className="relative w-full max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests, invoices, workflows..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User Role & Profile Switcher Button */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
            title="Click to switch user role or sign in"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
              {user?.name ? user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-200 line-clamp-1 leading-tight">
                {user?.name || 'Guest'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono leading-tight">
                {user?.department || 'FlowMind'}
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${roleBadgeStyle(user?.role)}`}>
              {user?.role || 'AUTH'}
            </span>
          </button>

          {/* Backend health pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Activity
              className={`w-3.5 h-3.5 ${
                health ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {health ? 'API Connected' : 'Connecting...'}
            </span>
          </div>

          {/* New Request Button */}
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Request</span>
          </Link>
        </div>
      </header>

      {/* Auth & Role Switcher Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

