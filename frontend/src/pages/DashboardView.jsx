import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldCheck, AlertTriangle, ShieldAlert, 
  FileCheck, Activity, PlusCircle, Search, RefreshCw, Eye, 
  ArrowRight, Download, Clock, UserCheck, CheckCircle2, XCircle, 
  SlidersHorizontal, ChevronRight, Sparkles, Shield
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ onNavigate, onInspectResult }) {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        api.getStats(),
        api.getAuditLogs('ALL', '')
      ]);
      setStats(statsData);
      setRecentLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredLogs = recentLogs.filter(log => {
    const matchesRisk = filterRisk === 'ALL' || log.risk_level === filterRisk;
    const matchesSearch = !search || 
      (log.full_name && log.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.document_number && log.document_number.toLowerCase().includes(search.toLowerCase())) ||
      (log.session_id && log.session_id.toLowerCase().includes(search.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'LOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>VERIFIED</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>SUSPICIOUS</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{risk}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner with Summary & Quick Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">Operational Command Center</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time monitoring of identity verifications, fraud detections, and secondary review cases.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('suspicious')}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Review Suspicious Queue</span>
          </button>

          <button
            onClick={() => onNavigate('identity')}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Start New Verification</span>
          </button>
        </div>
      </div>

      {/* 5 Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Verifications */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Verifications</span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {stats?.total_screenings ?? recentLogs.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Real-time sessions
          </div>
        </div>

        {/* Card 2: Verified (Low Risk) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Verified (Passed)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {stats?.verified_count ?? recentLogs.filter(l => l.risk_level === 'LOW').length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Authentic documents
          </div>
        </div>

        {/* Card 3: Suspicious (Review) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Suspicious Cases</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
            {stats?.suspicious_count ?? recentLogs.filter(l => l.risk_level === 'REVIEW').length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Pending Officer Review
          </div>
        </div>

        {/* Card 4: Rejected (High Risk) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Rejected / Fraud</span>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono">
            {stats?.rejected_count ?? recentLogs.filter(l => l.risk_level === 'HIGH').length}
          </div>
          <div className="text-[11px] text-red-700 font-medium">
            Watchlist & Forgeries
          </div>
        </div>

        {/* Card 5: Documents Scanned */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Documents Scanned</span>
            <FileCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">
            {stats?.documents_scanned ?? recentLogs.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Across credential types
          </div>
        </div>

      </div>

      {/* Main Table: Recent Verifications */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
        
        {/* Table Header & Search Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Verification Activity</h3>
            <p className="text-xs text-slate-500">Live feed of identity submissions and AI disposition results</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicant or ID..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-full sm:w-auto">
              {['ALL', 'LOW', 'REVIEW', 'HIGH'].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    filterRisk === r
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'ALL' ? 'All' : r === 'LOW' ? 'Verified' : r === 'REVIEW' ? 'Suspicious' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Document Number</th>
                <th className="px-4 py-3">Screening Result</th>
                <th className="px-4 py-3 font-mono">Risk Score</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No matching verification records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.full_name || 'Anonymous Applicant'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.session_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]">
                        {log.document_type || 'PASSPORT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">
                      {log.document_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {getRiskBadge(log.risk_level)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={log.composite_risk_score > 70 ? 'text-red-600' : log.composite_risk_score > 30 ? 'text-amber-600' : 'text-emerald-600'}>
                        {log.composite_risk_score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onInspectResult(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-medium transition"
                      >
                        Inspect
                      </button>
                      {log.risk_level !== 'LOW' && (
                        <button
                          onClick={() => onNavigate('suspicious')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium transition"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View All Logs Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-mono">
            Showing {Math.min(filteredLogs.length, 10)} of {filteredLogs.length} live records
          </span>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View Complete Audit History</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Bottom Grid: Quick Modules & Operational Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Document Screening */}
        <div 
          onClick={() => onNavigate('document')}
          className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-xs cursor-pointer group transition space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <FileCheck className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Deep Document Forensics
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Test Aadhaar, PAN, Passport with Error Level Analysis (ELA) and mathematical check digit validation.
            </p>
          </div>
        </div>

        {/* Module 2: Face Verification */}
        <div 
          onClick={() => onNavigate('face')}
          className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-xs cursor-pointer group transition space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Biometric Face Matching
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Compare ID portrait against live selfie with passive anti-spoofing and texture analysis.
            </p>
          </div>
        </div>

        {/* Module 3: Security Watchlist */}
        <div 
          onClick={() => onNavigate('watchlist')}
          className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-xs cursor-pointer group transition space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <Shield className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
              Interpol & Watchlist Database
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Manage stolen passports, Red Notices, and national security alert databases with instant lookup.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
