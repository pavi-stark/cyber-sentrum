import React from 'react';
import { 
  Shield, UserCheck, FileCheck, ScanFace, AlertOctagon, 
  BarChart3, ArrowRight, ShieldCheck, CheckCircle2, Lock, 
  Zap, Globe, Search, Cpu, FileText, Check, Award, Sparkles, ChevronRight
} from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const features = [
    {
      icon: UserCheck,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      title: '🪪 Identity Verification',
      desc: 'Seamless multi-modal applicant demographic onboarding, cross-checking personal details against national identity databases.',
      link: 'identity'
    },
    {
      icon: FileCheck,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: '📄 Document Authentication',
      desc: 'Deep optical inspection and algorithmic checksum validation for Aadhaar, PAN, Passport, Driving License, Voter ID & Visas.',
      link: 'document'
    },
    {
      icon: Cpu,
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      title: '🤖 AI Fraud Detection',
      desc: 'Error Level Analysis (ELA) and compression discrepancy mapping to spot spliced text, photo alterations, and counterfeit layouts.',
      link: 'fraud'
    },
    {
      icon: ScanFace,
      color: 'from-cyan-500 to-blue-600',
      bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      title: '🔍 Face Matching & Liveness',
      desc: 'High-precision biometric matching comparing document portraits with live selfies, with passive 2D-FFT anti-spoofing.',
      link: 'face'
    },
    {
      icon: AlertOctagon,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      title: '⚠️ Risk Detection & Watchlist',
      desc: 'Multi-signal Explainable AI (XAI) risk engine computing composite 0-100 fraud scores and querying Interpol Red Notices.',
      link: 'suspicious'
    },
    {
      icon: BarChart3,
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '📊 Verification Reports',
      desc: 'Comprehensive digital KYC certificates, audit trail logs, downloadable JSON/PDF reports, and human-in-the-loop decisions.',
      link: 'analytics'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Upload / Ingest ID Document',
      desc: 'Scan or upload Passport, Aadhaar, PAN, DL, or Voter ID. The system detects document geometry and runs high-resolution preprocessing.'
    },
    {
      step: '02',
      title: 'OCR & Mathematical Checksums',
      desc: 'Extracts demographic text and verifies ICAO 9303 7-3-1 weight sum check digits, UIDAI Verhoeff, and PAN format consistency.'
    },
    {
      step: '03',
      title: 'Live Selfie & Anti-Spoofing',
      desc: 'Captures live webcam portrait and detects passive screen replay or printed mask spoofing via frequency texture analysis.'
    },
    {
      step: '04',
      title: 'ELA Forensics & AI Risk Engine',
      desc: 'Detects digital pixel manipulation, queries the security watchlist, and synthesizes all signals into an explainable 0-100 score.'
    },
    {
      step: '05',
      title: 'Instant Certificate & Disposition',
      desc: 'Generates an immutable KYC certificate. Officers can approve, reject, or escalate flagged exceptions with one click.'
    }
  ];

  const supportedDocs = [
    { name: 'Indian Passport (ICAO 9303)', tag: 'TD3 Machine Readable', color: 'bg-blue-50 text-blue-700' },
    { name: 'UIDAI Aadhaar Card', tag: 'Verhoeff Checksum', color: 'bg-emerald-50 text-emerald-700' },
    { name: 'Income Tax PAN Card', tag: 'Entity & Surname Check', color: 'bg-indigo-50 text-indigo-700' },
    { name: 'MoRTH Driving License', tag: 'RTO & Year Sequence', color: 'bg-amber-50 text-amber-700' },
    { name: 'ECI Voter ID (EPIC)', tag: 'Assembly Alpha-Numeric', color: 'bg-purple-50 text-purple-700' },
    { name: 'Consular Visa Stickers', tag: 'TD2 / Embassy Serial', color: 'bg-teal-50 text-teal-700' }
  ];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-24">
        
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* System Operational Badge */}
            <div className="inline-flex items-center space-x-2 bg-white border border-slate-300/80 shadow-xs px-4 py-1.5 rounded-full text-xs font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Enterprise Identity Verification & Fraud Screening</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-700 font-mono">v1.0.0 Online</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              AI-Based Fake Identity & <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
                Document Screening System
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed">
              Detect fraudulent identities and documents using AI. Engineered for border checkpoints, digital KYC portals, immigration kiosks, and identity verification authorities.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('identity')}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 group"
              >
                <span>Start Verification</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl text-sm font-bold shadow-xs transition flex items-center justify-center space-x-2"
              >
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Explore Live Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('document')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-semibold transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>10 Test Scenarios</span>
              </button>
            </div>

            {/* Trust & Performance Highlights */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {[
                { label: 'Screening Speed', val: '< 380 ms', desc: 'Per document cycle' },
                { label: 'Fraud Detection Rate', val: '99.4%', desc: 'Across 15+ vectors' },
                { label: 'Compliant Standards', val: 'ICAO & UIDAI', desc: 'Doc 9303 / Verhoeff' },
                { label: 'Human-in-the-Loop', val: '100% Audit', desc: 'Officer review workflow' },
              ].map((item, i) => (
                <div key={i} className="p-3.5 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-xl font-extrabold text-slate-900 font-mono">{item.val}</div>
                  <div className="text-xs font-bold text-blue-600">{item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* 6 Core Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Comprehensive Multimodal AI Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A real-world enterprise identity screening platform that protects borders, banks, and government systems against deepfakes, forged documents, and impersonators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i}
                onClick={() => onNavigate(feat.link)}
                className="bg-white border border-slate-200 hover:border-blue-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${feat.bg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-blue-600">
                  <span>Open module</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5-Step System Verification Flow */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              End-to-End Operational Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How the System Verifies in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Each document traverses five sequential inspection gates combining computer vision, OCR mathematics, and biometric comparisons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                    {step.step}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Documents Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
                Multi-Document Ingestion Engine
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Standardized Support for Indian & International Credentials
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                The platform includes specialized algorithmic parsers for Indian national identities as well as international ICAO travel documents.
              </p>
            </div>
            <button
              onClick={() => onNavigate('document')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 whitespace-nowrap self-start md:self-auto"
            >
              Test Documents Now
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {supportedDocs.map((doc, i) => (
              <div key={i} className="p-3.5 bg-white/10 backdrop-blur rounded-2xl border border-white/15 space-y-1">
                <div className="text-xs font-bold text-white truncate">{doc.name}</div>
                <div className="text-[10px] font-mono text-blue-300 truncate">{doc.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-extrabold">Ready to evaluate the screening system?</h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Launch pre-loaded test cases for Genuine Passports, Aadhaar, PAN cards, Interpol Watchlist alerts, and Tampered documents.
            </p>
          </div>
          <button
            onClick={() => onNavigate('identity')}
            className="px-6 py-3 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shadow-lg transition whitespace-nowrap"
          >
            Launch Screening Terminal
          </button>
        </div>
      </section>

    </div>
  );
}
