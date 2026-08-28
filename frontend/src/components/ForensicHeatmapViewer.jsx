import React, { useState } from 'react';
import { Eye, Layers, Flame, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ForensicHeatmapViewer({ originalDoc, forensics }) {
  const [viewMode, setViewMode] = useState('overlay'); // 'original', 'heatmap', 'overlay'

  if (!forensics) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center text-slate-400">
        Run screening to view forensic Error Level Analysis (ELA)
      </div>
    );
  }

  const { tamper_score, status, metrics, heatmap_image, overlay_image } = forensics;

  const getStatusBadge = () => {
    if (status === 'CLEAN') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>CLEAN (NO TAMPERING)</span>
        </span>
      );
    } else if (status === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>SUSPICIOUS ANOMALY</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>TAMPERED DOCUMENT DETECTED</span>
        </span>
      );
    }
  };

  const getCurrentImage = () => {
    if (viewMode === 'heatmap' && heatmap_image) return heatmap_image;
    if (viewMode === 'overlay' && overlay_image) return overlay_image;
    return originalDoc;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Image Forensics & Error Level Analysis (ELA)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Detects digital splicing, altered text/DOB, and photo-swaps via compression variance
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center space-x-1.5 mb-3 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setViewMode('overlay')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
            viewMode === 'overlay'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Composite Overlay</span>
        </button>

        <button
          onClick={() => setViewMode('heatmap')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
            viewMode === 'heatmap'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>ELA Heatmap</span>
        </button>

        <button
          onClick={() => setViewMode('original')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
            viewMode === 'original'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Raw Document</span>
        </button>
      </div>

      {/* Forensic Visual Display */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[280px]">
        <img
          src={getCurrentImage()}
          alt="Forensic View"
          className="max-h-[320px] w-full object-contain rounded-lg transition-all duration-300"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-slate-700 border border-slate-200 font-bold">
          VIEW: {viewMode.toUpperCase()}
        </div>
      </div>

      {/* Forensic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-slate-500 font-bold">TAMPER SCORE</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {tamper_score}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${
                tamper_score > 50 ? 'bg-red-500' : tamper_score > 25 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, tamper_score)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-slate-500 font-bold">HIGH ERROR RATIO</div>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {metrics?.high_error_ratio || 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Outlier pixel density</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-slate-500 font-bold">NOISE STD DEV</div>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {metrics?.std_deviation || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Laplacian frequency variance</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-mono text-slate-500 font-bold">PEAK ANOMALY</div>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {metrics?.peak_anomaly_ratio || 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Localized edit clusters</div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
        <span className="font-bold text-blue-700">Forensic Diagnosis: </span>
        {metrics?.description || 'Analysis complete.'}
      </div>
    </div>
  );
}
