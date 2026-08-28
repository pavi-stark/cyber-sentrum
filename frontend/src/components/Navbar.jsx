import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, UserCheck, FileCheck, 
  History, ShieldAlert, BarChart3, Clock, PlusCircle, 
  User, LogOut, ChevronDown, Database
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenAuth, 
  onLogout 
}) {
  const [time, setTime] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'identity', label: 'Identity Verification', icon: UserCheck },
    { id: 'document', label: 'Document Forensics & QR', icon: FileCheck },
    { id: 'dashboard', label: 'Dashboard & Metrics', icon: LayoutDashboard },
    { id: 'suspicious', label: 'Suspicious Queue', icon: ShieldAlert, badge: 'Live' },
    { id: 'watchlist', label: 'Citizen Database & Watchlist', icon: Database },
    { id: 'history', label: 'Verification History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      
      {/* Top Status Bar */}
      <div className="bg-slate-900 text-white text-xs font-mono py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">SYSTEM ACTIVE</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Identity & Document Screening Platform</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>{time.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main Top Header - Fixed overlap with proper vertical padding and no overflowing constraints */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          
          {/* System Title & Logo */}
          <div 
            onClick={() => setActiveTab('identity')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 text-white group-hover:scale-105 transition flex-shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                AI Identity & Document Screening System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Automated QR Verification, Forensics & Database Matching
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-red-100 text-red-700 font-bold ml-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Role Profile & Quick Action */}
          <div className="flex items-center space-x-2.5">
            
            <button
              onClick={() => setActiveTab('identity')}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Verify Document</span>
            </button>

            {/* User Profile */}
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs bg-white shadow-xs"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {currentUser.avatar || '👤'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="font-bold text-slate-800 text-xs truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition"
                >
                  Sign In
                </button>
              )}

              {/* User Dropdown */}
              {userMenuOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-1.5">
                    <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenAuth();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Switch Role / User</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      onLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition font-bold"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="lg:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="bg-slate-100 border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-2 font-bold focus:outline-none focus:border-blue-500"
              >
                {navItems.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
