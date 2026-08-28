import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldCheck, AlertTriangle, ShieldAlert, Download, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(riskFilter, search);
      setLogs(data);
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

  const exportLogsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cyber_sentry_audit_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">REVIEW REQ</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-600/20 text-red-400 border border-red-500/30">HIGH RISK</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">{risk}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Immutable Inspection Audit Trail</h2>
            <p className="text-xs text-slate-400">Searchable history of all screened identity documents and officer dispositions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportLogsJson}
            disabled={logs.length === 0}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON Log</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Passenger Name, Passport No, Session ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </form>

        {/* Risk Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'LOW', 'REVIEW', 'HIGH'].map((f) => (
            <button
              key={f}
              onClick={() => setRiskFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                riskFilter === f
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Risks' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Session ID / Date</th>
                <th className="px-4 py-3">Passenger Name</th>
                <th className="px-4 py-3">Document No.</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3">Biometric Match</th>
                <th className="px-4 py-3">Tamper Score</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No screening logs recorded matching the criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="text-slate-200 font-semibold">{log.session_id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{log.full_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.nationality || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">
                      {log.document_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getRiskBadge(log.risk_level)}
                        <span className="font-mono text-slate-300">{log.composite_risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {log.face_match_score !== null ? `${log.face_match_score}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={log.tamper_score > 40 ? 'text-red-400' : 'text-slate-300'}>
                        {log.tamper_score || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        log.officer_decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.officer_decision === 'REJECTED' ? 'bg-red-600/20 text-red-400' :
                        log.officer_decision === 'ESCALATED' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.officer_decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg border border-slate-700 transition"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">{selectedLog.session_id}</h3>
                <p className="text-xs text-slate-400">{new Date(selectedLog.timestamp).toUTCString()}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">PASSENGER NAME</span>
                <div className="font-bold text-white mt-0.5">{selectedLog.full_name}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">DOCUMENT NUMBER</span>
                <div className="font-bold text-blue-400 font-mono mt-0.5">{selectedLog.document_number}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">RISK SCORE & STATUS</span>
                <div className="font-bold text-white mt-0.5">{selectedLog.risk_level} ({selectedLog.composite_risk_score}/100)</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">OFFICER DECISION</span>
                <div className="font-bold text-white mt-0.5">{selectedLog.officer_decision}</div>
              </div>
            </div>

            {selectedLog.risk_factors && (
              <div>
                <h4 className="text-xs font-mono text-slate-400 mb-2">RISK JUSTIFICATIONS:</h4>
                <div className="space-y-1.5">
                  {selectedLog.risk_factors.map((f, i) => (
                    <div key={i} className="p-2 bg-slate-950 rounded-lg text-xs border border-slate-800 text-slate-300">
                      <span className="font-semibold text-blue-400">[{f.severity}] {f.title}: </span>
                      {f.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLog.officer_notes && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono text-[10px]">OFFICER NOTES:</span>
                <p className="text-slate-200 mt-1">{selectedLog.officer_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
