import React, { useRef } from 'react';
import { Upload, FileText, Image, RefreshCw, Scan } from 'lucide-react';

export default function DocumentUploader({
  documentImage,
  setDocumentImage,
  mrzText,
  setMrzText,
  isScanning
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocumentImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocumentImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <Scan className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">1. Document Capture & OCR</h3>
            <p className="text-xs text-slate-500">Passport, Visa, or National ID Card</p>
          </div>
        </div>
        {documentImage && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Change</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview / Dropzone */}
      <div className="flex-1 flex flex-col justify-center">
        {documentImage ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center group max-h-[300px]">
            <img
              src={documentImage}
              alt="Document Scan"
              className="max-h-[290px] w-full object-contain rounded-lg"
            />
            {/* Scanning radar line animation during screening */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] animate-scan"></div>
            )}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded border border-slate-200 text-[11px] font-mono text-slate-700 font-bold shadow-xs">
              DOCUMENT LOADED
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/30 flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="p-4 rounded-full bg-white border border-slate-200 text-blue-600 mb-3 shadow-xs">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">Click to Upload or Drag & Drop</p>
            <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP high-res document scans</p>
          </div>
        )}
      </div>

      {/* Optional MRZ Override Box */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>MRZ Zone (Machine Readable Zone Lines)</span>
          <span className="text-[10px] text-blue-600 font-mono">ICAO Doc 9303</span>
        </label>
        <textarea
          rows={2}
          value={mrzText}
          onChange={(e) => setMrzText(e.target.value)}
          placeholder="P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 tracking-wider resize-none"
        />
      </div>
    </div>
  );
}
