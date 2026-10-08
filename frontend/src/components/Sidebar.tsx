import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Bot, 
  LayoutDashboard, 
  Inbox, 
  Workflow, 
  BarChart3, 
  Sliders, 
  X, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const navItems = [

    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Requests', path: '/requests', icon: Inbox },
    { label: 'Workflows', path: '/workflows', icon: Workflow },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950/95 border-r border-slate-850 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-850">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>FlowMind</span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono font-semibold">AI</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Enterprise SaaS</span>
            </div>
          </NavLink>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            Platform Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Engine status banner */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Automation Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Connected to Gemini & Supabase PG for real-time triaging.
          </p>
        </div>

        {/* User profile / session footer */}
        <div className="p-4 border-t border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'FM'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Organization Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                <span className="text-indigo-400 font-semibold">{user?.role || 'ADMIN'}</span>
                <span>&bull;</span>
                <span>{user?.department || 'Executive'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

