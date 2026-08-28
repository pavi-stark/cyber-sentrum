import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, 
  Search, RefreshCw, Eye, Flame, UserCheck, Check, 
  ArrowUpRight, Clock, ShieldCheck, ChevronRight, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

export default function SuspiciousCasesView({ onInspectResult }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchSuspiciousCases = async () => {
    try {
      setLoading(true);
      const allLogs = await api.getAuditLogs('ALL', '');
      // Filter logs that are flagged (REVIEW or HIGH or PENDING)
      const flagged = allLogs.filter(l => l.risk_level === 'REVIEW' || l.risk_level === 'HIGH' || l.officer_decision === 'PENDING');
      setCases(flagged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspiciousCases();
  }, []);

  const handleDecision = async (decision) => {
    if (!selectedCase) return;
    try {
      setLoading(true);
      await api.submitOfficerDecision(selectedCase.session_id, decision, notes);
      setActionSuccess(`Case ${selectedCase.session_id} successfully marked as ${decision}.`);
      setSelectedCase(null);
      setNotes('');
      fetchSuspiciousCases();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterType === 'PENDING') return c.officer_decision === 'PENDING';
    if (filterType === 'HIGH') return c.risk_level === 'HIGH';
    if (filterType === 'REVIEW') return c.risk_level === 'REVIEW';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">Suspicious Cases Review Queue</h2>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                HUMAN-IN-THE-LOOP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Secondary exception desk for flagged documents, face mismatches, and watchlist hits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSuspiciousCases}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            title="Refresh Queue"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs w-fit">
        {[
          { id: 'ALL', label: 'All Flagged' },
          { id: 'PENDING', label: 'Pending Review' },
          { id: 'HIGH', label: 'High Risk Alerts' },
          { id: 'REVIEW', label: 'Medium Exception' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === tab.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Flagged Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCases.length === 0 ? (
          <div className="col-span-full p-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">Suspicious Queue is Clean!</p>
            <p className="text-xs text-slate-500">No pending flagged cases require secondary inspection.</p>
          </div>
        ) : (
          filteredCases.map(item => {
            const isHigh = item.risk_level === 'HIGH';
            return (
              <div 
                key={item.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                  isHigh ? 'border-red-200' : 'border-amber-200'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Case Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Case Reference</span>
                      <h4 className="text-sm font-extrabold text-slate-900 font-mono">{item.session_id}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isHigh ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {item.composite_risk_score}/100 RISK
                    </span>
                  </div>

                  {/* Applicant & Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Applicant:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[160px]">{item.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Document:</span>
                      <span className="font-mono font-semibold text-blue-600">{item.document_type} ({item.document_number})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Face Match:</span>
                      <span className={`font-mono font-bold ${
                        (item.face_match_score || 0) < 70 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {item.face_match_score !== null ? `${item.face_match_score}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Tamper Score:</span>
                      <span className={`font-mono font-bold ${
                        (item.tamper_score || 0) > 40 ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {item.tamper_score || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Primary Issue Reason */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Flagged Reason:</span>
                    <p className="text-[11px] line-clamp-2">
                      {item.risk_factors && item.risk_factors.length > 0 
                        ? item.risk_factors[0].description 
                        : (item.blacklist_status === 'HIT' ? 'Security Watchlist match hit' : 'Elevated forensic variance detected')}
                    </p>
                  </div>

                </div>

                {/* Case Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCase(item)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition text-center"
                  >
                    Action Case
                  </button>
                  <button
                    onClick={() => onInspectResult && onInspectResult(item)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="View Full Report"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Officer Decision Modal Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">{selectedCase.session_id}</h3>
                <p className="text-xs text-slate-500">Applicant: {selectedCase.full_name}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Case Snapshot */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Assessment:</span>
                <span className="font-bold text-red-600 font-mono">{selectedCase.risk_level} ({selectedCase.composite_risk_score}/100)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Biometric Match:</span>
                <span className="font-mono font-semibold">{selectedCase.face_match_score || 'N/A'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamper Score:</span>
                <span className="font-mono font-semibold">{selectedCase.tamper_score || 0}%</span>
              </div>
            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Officer Notes & Audit Remarks
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter justification for secondary inspection disposition..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleDecision('APPROVED')}
                disabled={loading}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Approve (Override)
              </button>
              <button
                onClick={() => handleDecision('ESCALATED')}
                disabled={loading}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Escalate Case
              </button>
              <button
                onClick={() => handleDecision('REJECTED')}
                disabled={loading}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Reject & Intercept
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
