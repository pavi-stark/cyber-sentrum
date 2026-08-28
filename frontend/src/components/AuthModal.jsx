import React, { useState } from 'react';
import { Shield, Lock, Mail, User, CheckCircle2, ArrowRight, ShieldCheck, UserCheck, KeyRound, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, currentUser, onLogin, onLogout }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('VERIFIER'); // 'ADMIN' | 'VERIFIER'
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'login') {
      const loggedUser = {
        name: email.split('@')[0] || (role === 'ADMIN' ? 'Admin Pavithran' : 'Staff Verifier'),
        email: email || (role === 'ADMIN' ? 'admin@cybersentry.gov.in' : 'verifier@cybersentry.gov.in'),
        role: role,
        avatar: role === 'ADMIN' ? '🛡️' : '👤',
        loginTime: new Date().toLocaleTimeString()
      };
      onLogin(loggedUser);
      onClose();
    } else if (activeTab === 'register') {
      const newUser = {
        name: name || 'Authorized Officer',
        email: email,
        role: role,
        avatar: role === 'ADMIN' ? '🛡️' : '👤',
        loginTime: new Date().toLocaleTimeString()
      };
      onLogin(newUser);
      onClose();
    } else {
      setMessage('Password reset instructions sent to ' + email);
      setTimeout(() => {
        setMessage('');
        setActiveTab('login');
      }, 2000);
    }
  };

  const handleQuickDemoLogin = (selectedRole) => {
    const demoUser = selectedRole === 'ADMIN' ? {
      name: 'Pavithran (Lead Admin)',
      email: 'admin.pavithran@cybersentry.gov.in',
      role: 'ADMIN',
      badge: 'Lead System Administrator',
      avatar: '🛡️',
      loginTime: new Date().toLocaleTimeString()
    } : {
      name: 'Senior Verifier Officer',
      email: 'verifier.officer@cybersentry.gov.in',
      role: 'VERIFIER',
      badge: 'Border Verification Gate 4',
      avatar: '👤',
      loginTime: new Date().toLocaleTimeString()
    };
    onLogin(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">CYBER SENTRY ACCESS</h3>
              <p className="text-xs text-blue-100">AI Fake Identity & Document Screening Terminal</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-blue-900/40 p-1 rounded-xl mt-4 border border-blue-400/20 text-xs">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'login' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'register' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab('forgot')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'forgot' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* 1-Click Quick Demo Login for Evaluators */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>⚡ 1-Click Demo Evaluation</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">Quick Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="px-3 py-2 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('VERIFIER')}
                className="px-3 py-2 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Verifier Staff</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">or continue with credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Officer Pavithran"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email / Staff ID</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@agency.gov.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {activeTab !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            )}

            {activeTab !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('VERIFIER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                      role === 'VERIFIER'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Verifier / Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                      role === 'ADMIN'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>System Admin</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 mt-4"
            >
              <span>{activeTab === 'login' ? 'Authenticate & Enter' : activeTab === 'register' ? 'Create Account' : 'Send Reset Link'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
