import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, Cpu, Layers, Sliders, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              FlowMind <span className="text-indigo-400">AI</span>
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Smart Automation
            </span>
          </div>
        </NavLink>

        {/* Navigation links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <NavLink to="/" className={navLinkClass} end>
            <Cpu className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/workflows" className={navLinkClass}>
            <Layers className="w-4 h-4" />
            <span>Workflows</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <Sliders className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Platform v1.0</span>
        </div>
      </div>
    </header>
  );
};
