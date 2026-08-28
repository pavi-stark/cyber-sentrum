import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, ShieldAlert, AlertTriangle, Search, CheckCircle2, Shield, X } from 'lucide-react';
import { api } from '../services/api';

export default function WatchlistManager() {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [docNum, setDocNum] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('IND');
  const [reason, setReason] = useState('');
  const [authority, setAuthority] = useState('Interpol / National Security Bureau');
  const [severity, setSeverity] = useState('CRITICAL');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const data = await api.getBlacklist();
      setBlacklist(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!docNum || !fullName || !reason) {
      alert('Please fill out document number, name, and reason.');
      return;
    }
    try {
      await api.addBlacklist({
        document_number: docNum,
        full_name: fullName,
        nationality: nationality,
        reason: reason,
        issuing_authority: authority,
        severity: severity,
        notes: notes
      });
      setShowAddModal(false);
      setDocNum('');
      setFullName('');
      setReason('');
      setNotes('');
      fetchBlacklist();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this entry from the active watchlist?')) return;
    try {
      await api.deleteBlacklist(id);
      fetchBlacklist();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = blacklist.filter((item) =>
    (item.document_number && item.document_number.toLowerCase().includes(search.toLowerCase())) ||
    (item.full_name && item.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (item.reason && item.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Security Watchlist & Interpol Red Notices</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Revoked stolen passports, international arrest notices, and high-risk syndicate database.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Security Notice</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search watchlist by Document Number, Name, Notice reason..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Grid of Blacklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 hover:border-red-300 p-5 rounded-2xl shadow-xs flex flex-col justify-between transition group space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold flex items-center space-x-1">
                  <ShieldAlert className="h-3 w-3" />
                  <span>{item.severity}</span>
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="font-mono text-base font-extrabold text-red-600 mb-0.5">
                {item.document_number}
              </div>
              <div className="font-bold text-slate-900 text-sm mb-2">
                {item.full_name} <span className="text-xs text-slate-400 font-normal">({item.nationality || 'IND'})</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="text-slate-400 block text-[10px] font-mono font-bold uppercase">ALERT CHARGES:</span>
                <p className="text-[11px] leading-relaxed">{item.reason}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="truncate max-w-[180px]">{item.issuing_authority}</span>
              <span className="text-emerald-600 font-bold">ACTIVE ALERT</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="h-4 w-4 text-red-600" />
                <span>Create Watchlist Record</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">DOCUMENT / PASSPORT SERIAL *</label>
                <input
                  type="text"
                  required
                  value={docNum}
                  onChange={(e) => setDocNum(e.target.value.toUpperCase())}
                  placeholder="e.g. RU9901428 or DL12345678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-red-500 transition font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">WANTED PERSON FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.toUpperCase())}
                  placeholder="e.g. VIKTOR KOROLKOV"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NATIONALITY (3-LETTER)</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value.toUpperCase())}
                    placeholder="RUS"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SEVERITY LEVEL</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="SUSPECT">SUSPECT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">CRIMINAL NOTICE / REASON *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Interpol Red Notice #8839 - Financial Fraud & Forgery"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ISSUING AUTHORITY</label>
                <input
                  type="text"
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Save Watchlist Alert
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
