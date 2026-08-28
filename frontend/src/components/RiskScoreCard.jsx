import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Check, X, Clock, Database, UserCheck, Flame } from 'lucide-react';

export default function RiskScoreCard({ riskAssessment, biometrics, forensics, mrzData, blacklist, validity }) {
  if (!riskAssessment) return null;

  const { composite_risk_score, risk_level, recommendation, summary } = riskAssessment;

  const getRiskTheme = () => {
    if (risk_level === 'LOW') {
      return {
        bg: 'bg-emerald-50/80 border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        text: 'text-emerald-700',
        progress: 'bg-emerald-500',
        icon: ShieldCheck,
        title: 'VERIFIED (CLEAR - LOW RISK)'
      };
    } else if (risk_level === 'REVIEW') {
      return {
        bg: 'bg-amber-50/80 border-amber-300',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        text: 'text-amber-700',
        progress: 'bg-amber-500',
        icon: AlertTriangle,
        title: 'MANUAL REVIEW REQUIRED'
      };
    } else {
      return {
        bg: 'bg-red-50/80 border-red-300',
        badge: 'bg-red-100 text-red-800 border-red-300',
        text: 'text-red-700',
        progress: 'bg-red-600',
        icon: ShieldAlert,
        title: 'HIGH RISK (MODIFICATION / TAMPER DETECTED)'
      };
    }
  };

  const theme = getRiskTheme();
  const Icon = theme.icon;

  const hasSelfie = biometrics?.selfie_provided === true && biometrics?.match_score !== null && biometrics?.match_score !== undefined;

  return (
    <div className={`border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 ${theme.bg}`}>
      
      {/* Header with Risk Level */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3.5">
          <div className={`p-3.5 rounded-2xl border shadow-xs ${theme.badge}`}>
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-wider text-slate-500 uppercase font-bold">
              Automated Screening Risk Engine
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${theme.text}`}>
              {theme.title}
            </h2>
          </div>
        </div>

        {/* Score Number Display */}
        <div className="flex items-baseline space-x-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="text-xs font-mono text-slate-500 font-bold">RISK SCORE</span>
          <span className={`text-4xl font-extrabold font-mono ${theme.text}`}>
            {composite_risk_score}
          </span>
          <span className="text-xs font-mono text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Progress Score Bar */}
      <div className="mb-6">
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
          <div
            className={`h-full rounded-full transition-all duration-700 ${theme.progress}`}
            style={{ width: `${Math.max(4, Math.min(100, composite_risk_score))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1 font-semibold">
          <span>0 (AUTHENTIC / VERIFIED)</span>
          <span>30 (REVIEW THRESHOLD)</span>
          <span>70 (HIGH THRESHOLD)</span>
          <span>100 (CRITICAL FORGERY)</span>
        </div>
      </div>

      {/* 5 Core Sub-Systems Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        
        {/* 1. Biometric Match */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-mono text-slate-500 font-bold">BIOMETRIC</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {hasSelfie ? `${biometrics.match_score}%` : 'PASS'}
          </div>
          <div className={`text-[10px] font-bold truncate mt-0.5 ${hasSelfie ? (biometrics.match_score >= 75 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-500'}`}>
            {hasSelfie ? biometrics.match_status : 'DOC ONLY (OPTIONAL)'}
          </div>
        </div>

        {/* 2. ELA Forensics */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <Flame className="h-4 w-4 text-orange-600" />
            <span className="text-[10px] font-mono text-slate-500 font-bold">FORENSICS</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {forensics?.tamper_score || 0}%
          </div>
          <div className={`text-[10px] font-bold mt-0.5 ${
            forensics?.status === 'TAMPERED' ? 'text-red-600' : forensics?.status === 'SUSPICIOUS' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {forensics?.status || 'CLEAN'}
          </div>
        </div>

        {/* 3. ICAO / Check Digit */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-mono text-slate-500 font-bold">CHECKSUM</span>
          </div>
          <div className={`text-base font-bold font-mono ${
            mrzData?.checksum_valid !== false ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {mrzData?.checksum_valid !== false ? 'VALID' : 'FAILED'}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            Verhoeff / ICAO
          </div>
        </div>

        {/* 4. Watchlist Alert */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <Database className="h-4 w-4 text-red-600" />
            <span className="text-[10px] font-mono text-slate-500 font-bold">WATCHLIST</span>
          </div>
          <div className={`text-base font-bold font-mono ${
            blacklist?.is_blacklisted ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {blacklist?.is_blacklisted ? 'ALERT HIT' : 'CLEAN'}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            Security Watchlist
          </div>
        </div>

        {/* 5. Document Expiry */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-[10px] font-mono text-slate-500 font-bold">VALIDITY</span>
          </div>
          <div className={`text-base font-bold font-mono ${
            validity?.status === 'EXPIRED' ? 'text-red-600' : validity?.status === 'NEAR_EXPIRY' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {validity?.status || 'VALID'}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            {validity?.expiry_date || 'Active'}
          </div>
        </div>

      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3.5">
        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5 flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">Recommendation: {recommendation}</div>
          <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{summary}</div>
        </div>
      </div>

    </div>
  );
}
