import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, Plus, RotateCcw, CheckCircle2, 
  XCircle, AlertTriangle, ShieldCheck, User, CreditCard, 
  Car, Vote, FileText, ChevronRight, Hash, MapPin, Calendar,
  Shield, Check, X, RefreshCw, Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function CitizenRegistryView({ onNavigateToVerification }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New Record Form State
  const [formData, setFormData] = useState({
    document_type: 'AADHAAR_CARD',
    document_number: '',
    document_number_formatted: '',
    full_name: '',
    dob: '',
    gender: 'MALE',
    father_or_guardian: '',
    address: '',
    issuing_authority: 'Unique Identification Authority of India (UIDAI)',
    is_active: true
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const docTypeParam = selectedType === 'ALL' ? null : selectedType;
      const data = await api.getRegistryRecords(docTypeParam, search);
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedType, search]);

  const handleSeed = async () => {
    try {
      setLoading(true);
      const res = await api.seedRegistry();
      setActionMessage({ type: 'success', text: res.message || 'Seeded authoritative records successfully.' });
      setTimeout(() => setActionMessage(null), 4000);
      fetchRecords();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to seed registry.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    if (name === 'document_type') {
      if (value === 'AADHAAR_CARD') {
        newFormData.issuing_authority = 'Unique Identification Authority of India (UIDAI)';
      } else if (value === 'VOTER_ID') {
        newFormData.issuing_authority = 'Election Commission of India (ECI)';
      } else if (value === 'DRIVING_LICENSE') {
        newFormData.issuing_authority = 'Ministry of Road Transport & Highways (MoRTH)';
      }
    }

    setFormData(newFormData);
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!formData.document_number || !formData.full_name) {
      alert('Document Number and Full Name are required.');
      return;
    }

    try {
      const res = await api.addRegistryRecord(formData);
      setActionMessage({ type: 'success', text: `Citizen record for ${formData.full_name} created successfully.` });
      setTimeout(() => setActionMessage(null), 4000);
      setShowAddModal(false);
      setFormData({
        document_type: 'AADHAAR_CARD',
        document_number: '',
        document_number_formatted: '',
        full_name: '',
        dob: '',
        gender: 'MALE',
        father_or_guardian: '',
        address: '',
        issuing_authority: 'Unique Identification Authority of India (UIDAI)',
        is_active: true
      });
      fetchRecords();
    } catch (err) {
      alert(`Error creating record: ${err.message}`);
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'AADHAAR_CARD':
        return {
          label: 'Aadhaar (UIDAI)',
          icon: Shield,
          color: 'bg-amber-50 text-amber-800 border-amber-300'
        };
      case 'VOTER_ID':
        return {
          label: 'Voter ID (EPIC)',
          icon: Vote,
          color: 'bg-cyan-50 text-cyan-800 border-cyan-300'
        };
      case 'DRIVING_LICENSE':
        return {
          label: 'Driving Licence (MoRTH)',
          icon: Car,
          color: 'bg-blue-50 text-blue-800 border-blue-300'
        };
      default:
        return {
          label: type,
          icon: FileText,
          color: 'bg-slate-50 text-slate-800 border-slate-300'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Central Citizen Database &amp; Registry</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-300">
                  SQL Table: citizen_registry
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Authoritative repository used to cross-verify extracted details from Aadhaar, Voter ID, and Driving Licences
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            title="Restore canonical records for Dilip Mehti, Subhash Chandra Roy, and Bhaskar Adhikary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reset / Re-Seed Database</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Register Citizen Record</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Document Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Document Structures' },
            { id: 'AADHAAR_CARD', label: 'Aadhaar (UIDAI)' },
            { id: 'VOTER_ID', label: 'Voter ID (EPIC)' },
            { id: 'DRIVING_LICENSE', label: 'Driving Licence (MoRTH)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or guardian..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Document Structure &amp; ID</th>
                <th className="px-5 py-3.5">Citizen Name &amp; Guardian</th>
                <th className="px-5 py-3.5">DOB &amp; Gender</th>
                <th className="px-5 py-3.5">Registered Address</th>
                <th className="px-5 py-3.5">Issuing Authority</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Loading authoritative registry records...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold">No records found matching your filter</p>
                    <button
                      onClick={handleSeed}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                      Click here to seed default government records
                    </button>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const badge = getDocTypeBadge(rec.document_type);
                  const Icon = badge.icon;
                  return (
                    <tr 
                      key={rec.id || rec.document_number}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setSelectedRecord(rec)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-slate-900 mt-1 text-sm tracking-wide">
                          {rec.document_number_formatted || rec.document_number}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900 text-sm">{rec.full_name}</div>
                        {rec.father_or_guardian && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            S/O: <span className="font-semibold text-slate-700">{rec.father_or_guardian}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-700">
                        <div>{rec.dob || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{rec.gender || 'UNSPECIFIED'}</div>
                      </td>

                      <td className="px-5 py-4 text-[11px] text-slate-600 max-w-[220px] truncate" title={rec.address}>
                        {rec.address || 'Central Address on File'}
                      </td>

                      <td className="px-5 py-4 text-[11px] text-slate-500 max-w-[180px] truncate" title={rec.issuing_authority}>
                        {rec.issuing_authority || 'Govt of India'}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          rec.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {rec.is_active !== false ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>{rec.is_active !== false ? 'ACTIVE' : 'REVOKED'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(rec);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 font-bold text-xs transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Count */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Total Master Records: {records.length}</span>
          <span>Authoritative Source: UIDAI CIDR / MoRTH Sarathi / ECI EPIC</span>
        </div>
      </div>

      {/* Inspect Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Official Master Record</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedRecord.document_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Field Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Document Structure</span>
                <div className="font-extrabold text-slate-800 mt-0.5">{selectedRecord.document_type}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Official Document Number</span>
                <div className="font-mono font-extrabold text-indigo-700 mt-0.5">{selectedRecord.document_number_formatted || selectedRecord.document_number}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Full Legal Name</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{selectedRecord.full_name}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Father / Guardian</span>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedRecord.father_or_guardian || 'N/A'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Date of Birth</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedRecord.dob || 'N/A'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Gender</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedRecord.gender || 'UNSPECIFIED'}</div>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Official Registered Address</span>
                <div className="font-medium text-slate-700 mt-0.5">{selectedRecord.address || 'Registered central address'}</div>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Issuing Authority</span>
                <div className="font-medium text-slate-700 mt-0.5">{selectedRecord.issuing_authority}</div>
              </div>
            </div>

            {/* Record Status Banner */}
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              selectedRecord.is_active !== false 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {selectedRecord.is_active !== false ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>Status: {selectedRecord.is_active !== false ? 'ACTIVE & VALID IN NATIONAL ARCHIVES' : 'SUSPENDED / REVOKED'}</span>
              </div>
              <span className="font-mono text-[10px]">VERIFIED REGISTRY</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Citizen Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-fadeIn max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Register New Citizen Identity</h3>
                  <p className="text-xs text-slate-500">Insert record into citizen_registry database table</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Structure</label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="AADHAAR_CARD">UIDAI Aadhaar Card (e-Aadhaar format)</option>
                  <option value="VOTER_ID">ECI Voter ID (EPIC format)</option>
                  <option value="DRIVING_LICENSE">MoRTH Indian Union Driving Licence</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Number *</label>
                  <input
                    type="text"
                    name="document_number"
                    value={formData.document_number}
                    onChange={handleFormChange}
                    placeholder="e.g. 407872646921 or WB2320150223071"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Formatted Number</label>
                  <input
                    type="text"
                    name="document_number_formatted"
                    value={formData.document_number_formatted}
                    onChange={handleFormChange}
                    placeholder="e.g. 4078 7264 6921"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Citizen Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Dilip Mehti"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="text"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    placeholder="DD/MM/YYYY (e.g. 02/01/2003)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="TRANSGENDER">TRANSGENDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Father / Guardian Name</label>
                <input
                  type="text"
                  name="father_or_guardian"
                  value={formData.father_or_guardian}
                  onChange={handleFormChange}
                  placeholder="e.g. Indra Mahto"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Residential Address"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issuing Authority</label>
                <input
                  type="text"
                  name="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="font-bold text-slate-700">
                  Active Status (Uncheck to simulate a Revoked / Suspended identity)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Save to Database
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
