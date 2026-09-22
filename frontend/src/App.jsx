import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import VerificationResultModal from './components/VerificationResultModal';

// Primary Pages
import IdentityVerificationView from './pages/IdentityVerificationView';
import AIModelHubView from './pages/AIModelHubView';
import DocumentScreeningView from './pages/DocumentScreeningView';
import DashboardView from './pages/DashboardView';
import SuspiciousCasesView from './pages/SuspiciousCasesView';
import VerificationHistoryView from './pages/VerificationHistoryView';
import WatchlistManager from './pages/WatchlistManager';
import SecurityPrivacyView from './pages/SecurityPrivacyView';

export default function App() {
  // Navigation active tab - defaults to main Identity & Document Verification
  const [activeTab, setActiveTab] = useState('identity');

  // Authenticated User & Role Management with localStorage persistence
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cyber_sentry_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Pavithran (Lead Admin)',
      username: 'pavithran',
      email: 'pavithran@github.com',
      role: 'ADMIN',
      badge: 'Lead System Administrator',
      avatar: 'https://github.com/pavithran.png',
      auth_provider: 'GITHUB',
      loginTime: 'Active Session'
    };
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Result Modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cyber_sentry_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cyber_sentry_user');
    } catch (e) {}
  };

  const handleInspectResult = (res) => {
    setActiveResult(res);
    setResultModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Clean Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'identity' && (
          <IdentityVerificationView onScreeningComplete={handleInspectResult} />
        )}
        {activeTab === 'ai-hub' && (
          <AIModelHubView />
        )}
        {activeTab === 'document' && (
          <DocumentScreeningView onInspectResult={handleInspectResult} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView onNavigate={setActiveTab} onInspectResult={handleInspectResult} />
        )}
        {activeTab === 'suspicious' && (
          <SuspiciousCasesView onInspectResult={handleInspectResult} />
        )}
        {activeTab === 'watchlist' && (
          <WatchlistManager />
        )}
        {activeTab === 'history' && (
          <VerificationHistoryView onInspectResult={handleInspectResult} />
        )}
        {activeTab === 'security' && (
          <SecurityPrivacyView />
        )}
      </main>

      {/* Verification Result Certificate Modal */}
      <VerificationResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={activeResult}
        onVerifyAgain={() => setActiveTab('identity')}
        onSendForReview={() => setActiveTab('suspicious')}
      />

      {/* Auth & Role Switching Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">CYBER SENTRY</span>
            <span>•</span>
            <span>AI-Based Fake Identity & Document Screening System</span>
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Automated QR Verification • Forensics Engine • Central Database Match</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
