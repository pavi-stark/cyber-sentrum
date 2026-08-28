import React from 'react';
import { FileText, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export default function ExtractedFieldsTable({ fields, mrzData }) {
  if (!fields) return null;

  const checks = mrzData?.checks || {};

  const fieldList = [
    { label: 'DOCUMENT NUMBER', value: fields.document_number, check: checks.document_number_checksum || checks.format_valid },
    { label: 'FULL LEGAL NAME', value: fields.full_name, check: null },
    { label: 'NATIONALITY / ISSUER', value: fields.nationality || fields.issuing_country || 'IND', check: null },
    { label: 'DATE OF BIRTH', value: fields.dob, check: checks.dob_checksum },
    { label: 'SEX / GENDER', value: fields.sex || 'M', check: null },
    { label: 'DATE OF EXPIRY', value: fields.expiry_date || 'N/A', check: checks.expiry_checksum },
    { label: 'DOCUMENT TYPE', value: fields.document_type || 'PASSPORT (TD3)', check: null },
    { label: 'COMPOSITE CHECKSUM', value: mrzData?.checksum_valid ? 'VERIFIED' : 'FAILED', check: checks.composite_checksum || checks.verhoeff_checksum },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Extracted Identity Fields & Checksums</h3>
            <p className="text-xs text-slate-500">OCR & Algorithmic Check Digit Validations</p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold">
          FORMAT: {mrzData?.format || 'ICAO MRTD / UIDAI'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {fieldList.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider font-bold">
                {item.label}
              </div>
              <div className="text-xs font-bold text-slate-900 font-mono mt-0.5 truncate max-w-[140px]">
                {item.value || 'N/A'}
              </div>
            </div>

            {item.check !== undefined && item.check !== null && (
              <div className="flex items-center space-x-1">
                {item.check.valid ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>CHECKSUM OK</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">
                    <XCircle className="h-3 w-3" />
                    <span>FAIL</span>
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Raw MRZ Lines Display */}
      {mrzData?.raw_mrz && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-mono text-slate-500 mb-1.5 flex items-center justify-between">
            <span>DECODED ICAO 9303 MRZ STREAM</span>
            <span className="text-emerald-600 font-bold">7-3-1 Weight Sum Algorithm</span>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-blue-400 tracking-widest leading-relaxed">
            {mrzData.raw_mrz.map((line, lIdx) => (
              <div key={lIdx}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
