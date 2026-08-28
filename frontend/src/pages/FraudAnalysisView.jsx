import React, { useState } from 'react';
import { 
  AlertOctagon, ShieldCheck, AlertTriangle, ShieldAlert, 
  Cpu, Flame, UserCheck, Database, Clock, ArrowRight, 
  Sparkles, CheckCircle2, XCircle, ChevronRight, BarChart2
} from 'lucide-react';
import { api } from '../services/api';

export default function FraudAnalysisView({ onNavigate }) {
  // Preset scenarios to demonstrate fraud intelligence
  const [selectedCase, setSelectedCase] = useState('high_fraud');

  const cases = {
    high_fraud: {
      title: 'Case #1045 — High Risk Fraud & Splicing',
      score: 87,
      level: 'HIGH',
      recommendation: 'REJECT / SECURITY INVESTIGATION',
      summary: 'Critical digital tampering detected on national PAN Card demographic fields and portrait box.',
      indicators: [
        { icon: Flame, title: 'Document Tampering Detected', desc: 'Error Level Analysis (ELA) found 87.5% anomalous high-frequency compression variance around surname block.', severity: 'CRITICAL' },
        { icon: UserCheck, title: 'Borderline Face Match (61.2%)', desc: 'Biometric Euclidean distance indicates potential imposter using someone else’s credential.', severity: 'HIGH' },
        { icon: AlertTriangle, title: 'Inconsistent Demographic Metadata', desc: 'Surname initial on 5th PAN character mismatch against submitted full legal name.', severity: 'MEDIUM' },
        { icon: Database, title: 'Suspicious Document Metadata', desc: 'Creation software tags match Adobe Photoshop CC instead of official UIDAI/NSDL render.', severity: 'MEDIUM' }
      ],
      weights: [
        { name: 'Forensic Pixel Splicing (ELA)', weight: '45%', contribution: '+42 pts', color: 'bg-red-500' },
        { name: 'Biometric Face Discrepancy', weight: '25%', contribution: '+22 pts', color: 'bg-orange-500' },
        { name: 'Algorithmic Checksum Variance', weight: '15%', contribution: '+13 pts', color: 'bg-amber-500' },
        { name: 'Metadata & Format Anomalies', weight: '15%', contribution: '+10 pts', color: 'bg-yellow-500' }
      ]
    },
    medium_fraud: {
      title: 'Case #1041 — Medium Risk Near-Expiry & Glare',
      score: 42,
      level: 'REVIEW',
      recommendation: 'SECONDARY MANUAL INSPECTION',
      summary: 'Document validity near expiry and localized lighting reflection requires human officer verification.',
      indicators: [
        { icon: Clock, title: 'Document Near Expiry', desc: 'Driving License validity expires within 45 days. Needs officer exception override.', severity: 'MEDIUM' },
        { icon: Sparkles, title: 'Surface Glare Reflection', desc: 'Localized highlight over state hologram seal reduced OCR optical confidence to 78%.', severity: 'LOW' }
      ],
      weights: [
        { name: 'Document Expiry Constraint', weight: '40%', contribution: '+25 pts', color: 'bg-amber-500' },
        { name: 'Optical Contrast Glare', weight: '30%', contribution: '+12 pts', color: 'bg-yellow-500' },
        { name: 'Face Biometric Match', weight: '30%', contribution: '+5 pts', color: 'bg-emerald-500' }
      ]
    },
    low_risk: {
      title: 'Case #1044 — Low Risk Genuine Passport',
      score: 6,
      level: 'LOW',
      recommendation: 'EXPEDITED CLEARANCE (VERIFIED)',
      summary: 'All mathematical ICAO checksums verified, 96.8% biometric face match, and 0 security watchlist flags.',
      indicators: [
        { icon: ShieldCheck, title: 'ICAO Doc 9303 Mathematical Integrity', desc: '7-3-1 weight sum check digits matched across Document Number, DOB, and Expiry.', severity: 'PASS' },
        { icon: UserCheck, title: '96.8% Biometric Facial Match', desc: 'Facial embedding distances within 99th percentile of genuine travelers.', severity: 'PASS' },
        { icon: Database, title: 'Clean Security Watchlist Lookup', desc: '0 matches in national database and Interpol Stolen & Lost Travel Documents registry.', severity: 'PASS' }
      ],
      weights: [
        { name: 'Forensic Baseline (Clean)', weight: '35%', contribution: '+2 pts', color: 'bg-emerald-500' },
        { name: 'Biometric Face Match (96.8%)', weight: '35%', contribution: '+2 pts', color: 'bg-emerald-500' },
        { name: 'ICAO Checksum Compliance', weight: '30%', contribution: '+2 pts', color: 'bg-emerald-500' }
      ]
    }
  };

  const current = cases[selectedCase];

  const getTierTheme = (lvl) => {
    if (lvl === 'LOW') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        bar: 'bg-emerald-500'
      };
    } else if (lvl === 'REVIEW') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        badge: 'bg-amber-600 text-white',
        bar: 'bg-amber-500'
      };
    } else {
      return {
        bg: 'bg-red-50 text-red-800 border-red-300',
        badge: 'bg-red-600 text-white',
        bar: 'bg-red-600'
      };
    }
  };

  const theme = getTierTheme(current.level);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explainable AI (XAI) Fraud Analysis</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent multi-signal risk scoring with weighted mathematical justifications.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[10px] font-mono text-slate-400 px-2 font-bold uppercase">Inspect Case:</span>
          <button
            onClick={() => setSelectedCase('high_fraud')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              selectedCase === 'high_fraud'
                ? 'bg-red-600 text-white shadow-xs font-semibold'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            High Risk (87/100)
          </button>
          <button
            onClick={() => setSelectedCase('medium_fraud')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              selectedCase === 'medium_fraud'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Review Req (42/100)
          </button>
          <button
            onClick={() => setSelectedCase('low_risk')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              selectedCase === 'low_risk'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Clean Pass (6/100)
          </button>
        </div>
      </div>

      {/* Main Decision & Score Banner */}
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 animate-fadeIn ${theme.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${theme.badge}`}>
              Decision Tier: {current.recommendation}
            </span>
            <h3 className="text-xl font-extrabold">{current.title}</h3>
            <p className="text-xs max-w-2xl">{current.summary}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-inherit text-center font-mono shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Fraud Risk Index</span>
            <span className="text-3xl font-extrabold text-slate-900">{current.score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${theme.bar}`}
              style={{ width: `${Math.max(5, current.score)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            <span>0 (LOW RISK → VERIFIED)</span>
            <span>30 (MEDIUM RISK → MANUAL REVIEW)</span>
            <span>70 (HIGH RISK → REJECT / INVESTIGATE)</span>
          </div>
        </div>
      </div>

      {/* 2 Columns: Left (Risk Indicators), Right (Explainable XAI Weights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Identified Risk Indicators (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertOctagon className="h-4 w-4 text-blue-600" />
              <span>Identified Risk Indicators & Anomalies</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {current.indicators.length} Vectors Detected
            </span>
          </div>

          <div className="space-y-3">
            {current.indicators.map((ind, i) => {
              const Icon = ind.icon;
              const isCrit = ind.severity === 'CRITICAL' || ind.severity === 'HIGH';
              const isPass = ind.severity === 'PASS';
              return (
                <div 
                  key={i}
                  className={`p-4 rounded-xl border flex items-start space-x-3 transition ${
                    isCrit ? 'bg-red-50/60 border-red-200' : isPass ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCrit ? 'bg-red-100 text-red-700' : isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{ind.title}</h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isCrit ? 'bg-red-100 text-red-800' : isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ind.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{ind.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: XAI Mathematical Weight Contribution (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-indigo-600" />
              <span>Score Attribution Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Weighted Matrix</span>
          </div>

          <div className="space-y-4">
            {current.weights.map((w, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{w.name}</span>
                  <span className="font-mono font-bold text-slate-700">{w.contribution}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${w.color}`} style={{ width: w.weight }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Engine Weight: {w.weight}</span>
                  <span>Confidence: 98.4%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 space-y-1">
            <span className="font-bold block font-mono uppercase">Explainable AI Framework</span>
            <p className="text-blue-700">
              Each flagged factor provides legal audit justification compliant with Section 4 of the Digital Personal Data Protection Act.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
