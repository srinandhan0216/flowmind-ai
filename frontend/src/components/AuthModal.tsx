import React, { useState } from 'react';
import { 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ShieldAlert, 
  X, 
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, register, logout, switchDemoRole, demoAccounts } = useAuth();
  const [tab, setTab] = useState<'switch' | 'login' | 'register'>('switch');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [department, setDepartment] = useState('Engineering');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, email, password, role, department });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleSelect = async (r: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await switchDemoRole(r);
      onClose();
    } catch (err: any) {
      setError('Failed to switch role.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'from-amber-500 to-orange-600 border-amber-500/30 text-amber-300',
    FINANCE: 'from-emerald-500 to-teal-600 border-emerald-500/30 text-emerald-300',
    MANAGER: 'from-indigo-500 to-blue-600 border-indigo-500/30 text-indigo-300',
    EMPLOYEE: 'from-purple-500 to-pink-600 border-purple-500/30 text-purple-300'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <span>Identity & Role Access Control</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Currently signed in as: <span className="font-semibold text-white">{user?.name}</span> ({user?.role})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setTab('switch'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'switch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Switch Role
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Instant Role Switcher */}
        {tab === 'switch' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience FlowMind AI's role-based access control by switching personas instantly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoAccounts.map((account) => {
                const isCurrent = user?.email === account.email;
                return (
                  <button
                    key={account.email}
                    disabled={submitting}
                    onClick={() => handleRoleSelect(account.role)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                      isCurrent
                        ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColors[account.role]}`}>
                        {account.role}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-indigo-400 font-mono">Active</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{account.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{account.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-850">
              <span className="text-slate-500">JWT signed & verified</span>
              {user && (
                <button
                  type="button"
                  onClick={() => { logout(); onClose(); }}
                  className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Standard Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@flowmind.ai"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In with JWT'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Tab 3: Register New User */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Connor"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@flowmind.ai"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password (bcrypt hashed)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? 'Registering...' : 'Create Account & Sign In'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
