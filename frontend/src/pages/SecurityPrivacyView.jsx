import React from 'react';
import { 
  Lock, Shield, Key, EyeOff, FileText, CheckCircle2, 
  AlertTriangle, Database, Server, Award, Info
} from 'lucide-react';

export default function SecurityPrivacyView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Security, Privacy & Compliance Architecture</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standards compliance, cryptographic audit trails, PII redaction, and access governance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-xl font-mono">
            🛡️ DPDP & GDPR READY
          </span>
        </div>
      </div>

      {/* System Operational Notice Callout */}
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-blue-900 block text-sm">Enterprise Identity Verification Architecture</span>
          <p className="text-blue-800 leading-relaxed">
            This application implements automated multimodal document screening, QR code verification, forensic Error Level Analysis (ELA) tampering detection, and biometric matching designed for high-security identity checkpoints and digital KYC terminals.
          </p>
        </div>
      </div>

      {/* 6 Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Pillar 1 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 w-fit">
            <Key className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">AES-256 Data Encryption</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All ingested passport scans, Aadhaar numbers, PAN cards, and biometric face embeddings are encrypted in-transit (TLS 1.3) and at-rest using AES-256-GCM authenticated envelopes.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 w-fit">
            <EyeOff className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Automatic PII Redaction</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sensitive demographic fields such as first 8 digits of UIDAI Aadhaar and tax numbers are masked during visual UI rendering according to government privacy mandates.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 w-fit">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict separation of privileges between Border Verifier Officers (operational verification) and System Administrators (threshold policy, model weights, and user management).
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-700 w-fit">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Tamper-Evident Audit Trail</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every identity scan, forensic heatmap output, risk index breakdown, and officer disposition is persistently logged to SQLite/PostgreSQL with cryptographically signed timestamps.
          </p>
        </div>

        {/* Pillar 5 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 w-fit">
            <Server className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ephemeral Storage & Data Retention</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            High-resolution biometric selfies and raw document captures can be configured for automatic secure zeroization after 30 days to uphold GDPR "Right to be Forgotten" mandates.
          </p>
        </div>

        {/* Pillar 6 */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 w-fit">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Explainable AI (XAI) Ethics</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            No black-box rejections. The system outputs transparent mathematical justifications for every flag, ensuring fair secondary officer review without demographic bias.
          </p>
        </div>

      </div>

      {/* Compliance Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Regulatory Framework & Compliance Matrix</h3>
        
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Regulation / Standard</th>
                <th className="px-4 py-3">Governing Body</th>
                <th className="px-4 py-3">System Implementation</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {[
                { std: 'ICAO Doc 9303 (Parts 1-12)', org: 'International Civil Aviation Org', impl: 'TD1, TD2, TD3 MRZ Parsing & 7-3-1 Weight Sum Checksums', status: 'Compliant' },
                { std: 'UIDAI Circular on Aadhaar Masking', org: 'Govt of India (UIDAI)', impl: 'Verhoeff Check Digit validation and 8-digit masking', status: 'Compliant' },
                { std: 'Digital Personal Data Protection Act', org: 'Ministry of Electronics & IT', impl: 'Consent-based screening & explicit purpose limitation', status: 'Compliant' },
                { std: 'ISO/IEC 30107-3 Biometric Presentation Attack', org: 'ISO / IEC', impl: '2D-FFT Moiré frequency texture passive anti-spoofing', status: 'Compliant' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">{row.std}</td>
                  <td className="px-4 py-3 text-slate-600">{row.org}</td>
                  <td className="px-4 py-3 text-slate-600 text-[11px]">{row.impl}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
