import React, { useState } from 'react';
import { PlayCircle, ShieldCheck, AlertOctagon, UserX, AlertTriangle, Clock, CreditCard, FileBadge, Globe } from 'lucide-react';

export default function DemoCaseBar({ onSelectSample, activeSampleKey, loading }) {
  const [filterCategory, setFilterCategory] = useState('ALL');

  const cases = [
    {
      key: 'clean_pass',
      label: '1. Genuine Passport',
      badge: 'LOW RISK',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      desc: 'Valid ICAO MRZ + 97% Face Match',
      category: 'PASSPORT'
    },
    {
      key: 'altered_dob',
      label: '2. Forged Passport DOB',
      badge: 'TAMPERED',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      desc: 'MRZ Checksum Mismatch + ELA Anomaly',
      category: 'PASSPORT'
    },
    {
      key: 'swapped_photo',
      label: '3. Photo Swapped Fake',
      badge: 'IMPERSONATION',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: UserX,
      desc: 'Biometric Mismatch + Border Splicing',
      category: 'PASSPORT'
    },
    {
      key: 'aadhaar_valid',
      label: '4. Genuine Aadhaar Card',
      badge: 'VERHOEFF PASS',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CreditCard,
      desc: '12-Digit Verhoeff Checksum Verified',
      category: 'NATIONAL_ID'
    },
    {
      key: 'aadhaar_tampered',
      label: '5. Forged Aadhaar Card',
      badge: 'VERHOEFF FAIL',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertOctagon,
      desc: 'Invalid Check Digit + Photo Tamper',
      category: 'NATIONAL_ID'
    },
    {
      key: 'pan_valid',
      label: '6. Genuine PAN Card',
      badge: 'PAN VERIFIED',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: FileBadge,
      desc: 'Individual "P" Status & Surname Match',
      category: 'NATIONAL_ID'
    },
    {
      key: 'pan_forged',
      label: '7. Forged PAN Card',
      badge: 'INVALID ENTITY',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertTriangle,
      desc: 'Invalid Entity Code & Surname Mismatch',
      category: 'NATIONAL_ID'
    },
    {
      key: 'visa_valid',
      label: '8. Valid Entry Visa',
      badge: 'VISA VERIFIED',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Globe,
      desc: 'Consular Visa Stamp & TD2 MRZ Valid',
      category: 'VISA'
    },
    {
      key: 'blacklisted',
      label: '9. Interpol Red Notice',
      badge: 'BLACKLISTED',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertOctagon,
      desc: 'High-Priority Watchlist Alert Hit',
      category: 'PASSPORT'
    },
    {
      key: 'expired',
      label: '10. Expired Travel Doc',
      badge: 'EXPIRED',
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: Clock,
      desc: 'Expired Past Permitted Window',
      category: 'PASSPORT'
    }
  ];

  const filteredCases = filterCategory === 'ALL'
    ? cases
    : cases.filter(c => c.category === filterCategory);

  return (
    <div className="space-y-3">
      {/* Category Filter Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-fit">
        {[
          { id: 'ALL', label: 'All Cases (10)' },
          { id: 'PASSPORT', label: 'Passports' },
          { id: 'NATIONAL_ID', label: 'Aadhaar & PAN' },
          { id: 'VISA', label: 'Visas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              filterCategory === tab.id
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {filteredCases.map((c) => {
          const Icon = c.icon;
          const isSelected = activeSampleKey === c.key;
          return (
            <button
              key={c.key}
              disabled={loading}
              onClick={() => onSelectSample(c.key)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                  : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 mb-1">{c.label}</div>
                <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">{c.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
