import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Download, RefreshCw, Eye, 
  ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, 
  XCircle, Calendar, FileText, ChevronRight, X
} from 'lucide-react';
import { api } from '../services/api';

export default function VerificationHistoryView({ onInspectResult }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(riskFilter, search);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const filteredLogs = logs.filter(log => {
    if (docTypeFilter !== 'ALL' && log.document_type !== docTypeFilter) {
      return false;
    }
    return true;
  });

  const exportLogsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Verification_History_Export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'LOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>VERIFIED (LOW)</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>SUSPICIOUS</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-50 text-red-700 border border-red-200">
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
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Verification History & Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically timestamped record of all screened applicant documents and biometric inspections.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            title="Refresh History"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportLogsJson}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON Logs</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Applicant / ID Number 🔍..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Document Type Dropdown */}
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Documents</option>
            <option value="PASSPORT">Passports</option>
            <option value="AADHAAR_CARD">Aadhaar Cards</option>
            <option value="PAN_CARD">PAN Cards</option>
            <option value="DRIVING_LICENSE">Driving Licenses</option>
            <option value="VOTER_ID">Voter IDs</option>
            <option value="VISA">Visas</option>
          </select>

          {/* Risk Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'LOW', 'REVIEW', 'HIGH'].map(f => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  riskFilter === f
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'All Risks' : f === 'LOW' ? 'Verified' : f === 'REVIEW' ? 'Suspicious' : 'Rejected'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Session ID & Timestamp</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Document Type & No</th>
                <th className="px-4 py-3">Screening Outcome</th>
                <th className="px-4 py-3 font-mono">Biometric Match</th>
                <th className="px-4 py-3 font-mono">Tamper Score</th>
                <th className="px-4 py-3">Officer Decision</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No verification records found matching the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900">{log.session_id}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.full_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.nationality || 'IND'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-600 font-bold">{log.document_number || 'N/A'}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{log.document_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        {getRiskBadge(log.risk_level)}
                        <span className="font-mono font-bold text-slate-700 text-[11px]">{log.composite_risk_score}/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      <span className={(log.face_match_score || 0) >= 70 ? 'text-emerald-600' : 'text-slate-500'}>
                        {log.face_match_score !== null ? `${log.face_match_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      <span className={(log.tamper_score || 0) > 40 ? 'text-red-600' : 'text-slate-700'}>
                        {log.tamper_score || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        log.officer_decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        log.officer_decision === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        log.officer_decision === 'ESCALATED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.officer_decision || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">{selectedLog.session_id}</h3>
                <p className="text-xs text-slate-500">{new Date(selectedLog.timestamp).toUTCString()}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Applicant Name</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedLog.full_name || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Document Number</span>
                <div className="font-bold text-blue-600 font-mono mt-0.5">{selectedLog.document_number || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Risk Level & Score</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedLog.risk_level} ({selectedLog.composite_risk_score}/100)</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Officer Decision</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedLog.officer_decision}</div>
              </div>
            </div>

            {selectedLog.risk_factors && selectedLog.risk_factors.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 font-mono">RISK FACTORS RECORDED:</h4>
                {selectedLog.risk_factors.map((f, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200 text-slate-700">
                    <span className="font-bold text-blue-600">[{f.severity}] {f.title}: </span>
                    {f.description}
                  </div>
                ))}
              </div>
            )}

            {selectedLog.officer_notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-mono text-[10px] uppercase">OFFICER AUDIT NOTES:</span>
                <p className="text-slate-800 mt-1">{selectedLog.officer_notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
