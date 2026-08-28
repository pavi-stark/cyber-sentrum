import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Sliders, ShieldCheck, Activity, 
  Cpu, Database, CheckCircle2, AlertTriangle, Save, 
  RefreshCw, Lock, Server, Check, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPanelView({ currentUser, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  // Threshold configurations
  const [faceThreshold, setFaceThreshold] = useState(70);
  const [tamperTolerance, setTamperTolerance] = useState(40);
  const [highRiskCutoff, setHighRiskCutoff] = useState(70);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(true);
  const [strictMrzCheck, setStrictMrzCheck] = useState(true);

  // User Accounts
  const [users, setUsers] = useState([
    { id: 1, name: 'Pavithran', email: 'admin.pavithran@cybersentry.gov.in', role: 'ADMIN', status: 'ACTIVE', lastLogin: 'Just now' },
    { id: 2, name: 'Senior Inspector Verma', email: 'v.verma@immigration.gov.in', role: 'VERIFIER', status: 'ACTIVE', lastLogin: '15 mins ago' },
    { id: 3, name: 'Officer Priya Sharma', email: 'p.sharma@bordercontrol.in', role: 'VERIFIER', status: 'ACTIVE', lastLogin: '1 hour ago' },
    { id: 4, name: 'Watchlist Auditor Khan', email: 'r.khan@security.gov.in', role: 'VERIFIER', status: 'IDLE', lastLogin: 'Yesterday' }
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess('Security thresholds and AI screening policy updated successfully.');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">System Administration & Configuration</h2>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage system policy, AI model sensitivity thresholds, verifier permissions, and cluster health.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            title="Refresh System Health"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Policy & Threshold Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>AI Screening Thresholds & Tolerances</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Real-time Tuning</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            {/* Slider 1: Biometric Face Match Threshold */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Biometric Face Match Threshold</span>
                <span className="font-mono font-bold text-blue-600">{faceThreshold}% Minimum</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={faceThreshold}
                onChange={(e) => setFaceThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>50% (Permissive)</span>
                <span>70% (Standard Border Default)</span>
                <span>95% (High Security)</span>
              </div>
            </div>

            {/* Slider 2: ELA Forensics Splicing Tolerance */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Forensics Tamper Sensitivity (ELA)</span>
                <span className="font-mono font-bold text-amber-600">{tamperTolerance}% Cutoff</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={tamperTolerance}
                onChange={(e) => setTamperTolerance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>20% (Strict Forgery Flag)</span>
                <span>40% (Balanced)</span>
                <span>80% (Lenient)</span>
              </div>
            </div>

            {/* Slider 3: High Risk Interception Score */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Composite High Risk Alert Trigger</span>
                <span className="font-mono font-bold text-red-600">&ge; {highRiskCutoff} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={highRiskCutoff}
                onChange={(e) => setHighRiskCutoff(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>50 (Aggressive Interceptions)</span>
                <span>70 (Default)</span>
                <span>90 (Strict Exceptions)</span>
              </div>
            </div>

            {/* Boolean Toggles */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveLowRisk}
                  onChange={(e) => setAutoApproveLowRisk(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Expedited Auto-Clear for Low Risk (&lt;20 Risk Score)</span>
                  <span className="text-[11px] text-slate-500 block">Reduces border wait times for verified genuine passports.</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictMrzCheck}
                  onChange={(e) => setStrictMrzCheck(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Strict ICAO / Verhoeff Checksum Enforcement</span>
                  <span className="text-[11px] text-slate-500 block">Auto-flags any document with corrupted or altered check digits.</span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save & Deploy Threshold Policy</span>
            </button>

          </form>
        </div>

        {/* Right Column: Active Model Telemetry & Authorized Users (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Box 1: AI Model Infrastructure */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Server className="h-4 w-4 text-emerald-600" />
                <span>AI Pipeline Cluster Status</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                ALL OPERATIONAL
              </span>
            </div>

            <div className="space-y-2">
              {[
                { name: 'ICAO-9303 Checksum Engine', latency: '4ms', status: 'HEALTHY' },
                { name: 'UIDAI Verhoeff Checksum', latency: '2ms', status: 'HEALTHY' },
                { name: 'Error Level Forensics (ELA)', latency: '120ms', status: 'HEALTHY' },
                { name: 'Facial Biometric Matching', latency: '180ms', status: 'HEALTHY' },
                { name: '2D-FFT Moiré Anti-Spoofing', latency: '65ms', status: 'HEALTHY' },
                { name: 'Interpol Watchlist Registry', latency: '8ms', status: 'HEALTHY' }
              ].map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800">{svc.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-500">{svc.latency}</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Staff & Verifier Management */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Authorized Verifier Accounts</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{users.length} Active</span>
            </div>

            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {u.role}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{u.lastLogin}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
