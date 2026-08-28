import React from 'react';
import { HelpCircle, AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ExplainableRiskCard({ riskFactors }) {
  if (!riskFactors || riskFactors.length === 0) return null;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
            CRITICAL (+65)
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-orange-800 border border-orange-200">
            HIGH IMPACT (+35-45)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            MEDIUM (+20-30)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            VERIFIED (0)
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Explainable AI (XAI) Risk Factors
          </h3>
          <p className="text-xs text-slate-500">
            Transparent justification for screening score and anomaly detections
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {riskFactors.map((factor, idx) => {
          const isPositive = factor.severity === 'LOW' || factor.severity === 'PASS';
          const isCrit = factor.severity === 'CRITICAL' || factor.severity === 'HIGH';
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start space-x-3 transition ${
                isPositive
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : isCrit
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="mt-0.5">
                {isPositive ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isCrit ? (
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    {factor.title}
                  </span>
                  {getSeverityBadge(factor.severity)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {factor.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
