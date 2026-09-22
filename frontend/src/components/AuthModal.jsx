import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, User, CheckCircle2, ArrowRight, 
  ShieldCheck, UserCheck, KeyRound, X, Github, Sparkles, 
  Loader2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, currentUser, onLogin, onLogout }) {
  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'login' | 'register'
  const [githubUsername, setGithubUsername] = useState('pavithran');
  const [githubRole, setGithubRole] = useState('ADMIN');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Real-Time GitHub Authentication
  const handleGitHubLogin = async (e) => {
    e.preventDefault();
    const cleanUser = githubUsername.trim().replace('@', '');
    if (!cleanUser) {
      setErrorMsg('Please enter your GitHub username.');
      return;
    }
    setErrorMsg('');
    setGithubLoading(true);
    try {
      const user = await api.loginWithGitHub(cleanUser, null, githubRole);
      setGithubProfile(user);
      onLogin(user);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Could not verify GitHub account.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (activeTab === 'login') {
      const user = await api.loginUser(email, password, role);
      onLogin(user);
      onClose();
    } else if (activeTab === 'register') {
      const user = await api.registerUser(name, email, password, role);
      onLogin(user);
      onClose();
    }
  };

  const handleQuickDemoLogin = (selectedRole) => {
    const demoUser = selectedRole === 'ADMIN' ? {
      name: 'Pavithran (Lead Admin)',
      email: 'admin.pavithran@cybersentry.gov.in',
      role: 'ADMIN',
      badge: 'Lead System Administrator',
      avatar: '🛡️',
      auth_provider: 'DEMO',
      loginTime: new Date().toLocaleTimeString()
    } : {
      name: 'Senior Verifier Officer',
      email: 'verifier.officer@cybersentry.gov.in',
      role: 'VERIFIER',
      badge: 'Border Verification Gate 4',
      avatar: '👤',
      auth_provider: 'DEMO',
      loginTime: new Date().toLocaleTimeString()
    };
    onLogin(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm text-white shadow-inner">
              <ShieldCheck className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">CYBER SENTRY ACCESS</h3>
              <p className="text-xs text-slate-300">AI Fake Identity &amp; Screening Terminal</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-800/80 p-1 rounded-2xl mt-4 border border-slate-700 text-xs">
            <button
              onClick={() => { setActiveTab('github'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'github' ? 'bg-white text-slate-950 shadow-md font-extrabold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub SSO</span>
            </button>
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold transition ${
                activeTab === 'login' ? 'bg-white text-slate-950 shadow-md font-extrabold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Credentials
            </button>
            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold transition ${
                activeTab === 'register' ? 'bg-white text-slate-950 shadow-md font-extrabold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: GITHUB AUTHENTICATION */}
          {activeTab === 'github' && (
            <form onSubmit={handleGitHubLogin} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Github className="h-4 w-4 text-slate-900" />
                  <span>GitHub Account Authentication</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Enter your GitHub username to link your verified GitHub profile &amp; avatar as Lead Administrator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GitHub Username / Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="e.g. your-github-username"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fetches your real GitHub profile, photo, and permissions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Security Access Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGithubRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      githubRole === 'ADMIN'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>Lead Admin (Full)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGithubRole('VERIFIER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      githubRole === 'VERIFIER'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Verifier Officer</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={githubLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 hover:from-black hover:to-slate-900 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-slate-900/20 transition flex items-center justify-center space-x-2"
              >
                {githubLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Connecting to GitHub API...</span>
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    <span>Sign In with GitHub Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2 & 3: STANDARD LOGIN / REGISTER */}
          {activeTab !== 'github' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Officer Pavithran"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email / Staff ID</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@cybersentry.gov.in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      role === 'ADMIN'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>System Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('VERIFIER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      role === 'VERIFIER'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Verifier Staff</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 mt-4"
              >
                <span>{activeTab === 'login' ? 'Authenticate & Enter' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Access Footer */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span className="font-bold">⚡ Quick Access:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Admin Demo
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('VERIFIER')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Verifier Demo
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
