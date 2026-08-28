import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import VerificationResultModal from './components/VerificationResultModal';

// Primary Pages
import IdentityVerificationView from './pages/IdentityVerificationView';
import DocumentScreeningView from './pages/DocumentScreeningView';
import DashboardView from './pages/DashboardView';
import SuspiciousCasesView from './pages/SuspiciousCasesView';
import VerificationHistoryView from './pages/VerificationHistoryView';
import WatchlistManager from './pages/WatchlistManager';
import SecurityPrivacyView from './pages/SecurityPrivacyView';

export default function App() {
  // Navigation active tab - defaults to main Identity & Document Verification
  const [activeTab, setActiveTab] = useState('identity');

  // Authenticated User & Role Management
  const [currentUser, setCurrentUser] = useState({
    name: 'Pavithran (Lead Admin)',
    email: 'admin.pavithran@cybersentry.gov.in',
    role: 'ADMIN',
    avatar: '🛡️',
    loginTime: '10:00 AM'
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Result Modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
