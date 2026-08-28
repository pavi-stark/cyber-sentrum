import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Shield, Upload, Play, RotateCcw, Loader2, 
  AlertTriangle, CheckCircle2, XCircle, Flame, Eye, ScanLine, 
  Sparkles, FileText, Check, Clock, Database, ChevronRight, QrCode
} from 'lucide-react';
import DemoCaseBar from '../components/DemoCaseBar';
import ForensicHeatmapViewer from '../components/ForensicHeatmapViewer';
import ExtractedFieldsTable from '../components/ExtractedFieldsTable';
import ExplainableRiskCard from '../components/ExplainableRiskCard';
import RiskScoreCard from '../components/RiskScoreCard';
import OfficerActionPanel from '../components/OfficerActionPanel';
import { api } from '../services/api';

export default function DocumentScreeningView({ onInspectResult }) {
  const [activeSampleKey, setActiveSampleKey] = useState('clean_pass');
  const [documentImage, setDocumentImage] = useState('');
  const [selfieImage, setSelfieImage] = useState('');
  const [mrzText, setMrzText] = useState('');
  const [docType, setDocType] = useState('PASSPORT');

  const [loading, setLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState('');

  // Auto load Case 1 on initial mount
  useEffect(() => {
    handleSelectSample('clean_pass');
  }, []);

  const handleSelectSample = async (sampleKey) => {
    try {
      setLoading(true);
      setError('');
      setActiveSampleKey(sampleKey);
      setScreeningResult(null);

      const sample = await api.getSampleData(sampleKey);
      setDocumentImage(sample.doc_image_base64);
      setSelfieImage(sample.selfie_image_base64);
      setMrzText(sample.mrz_text || '');
      setDocType(sample.document_type || 'PASSPORT');

      // Auto trigger screening execution
      const result = await api.screenDocumentJson({
        doc_image_base64: sample.doc_image_base64,
        selfie_image_base64: sample.selfie_image_base64,
        mrz_text: sample.mrz_text,
        document_type: sample.document_type || 'PASSPORT',
        extracted_fields: sample.extracted_fields
      });

      setScreeningResult(result);
    } catch (err) {
      console.error('Error processing sample:', err);
    } finally {
      setLoading(false);
    }
  };

  const [customExtractedFields, setCustomExtractedFields] = useState(null);

  const handleRunCustomScreening = async () => {
    if (!documentImage) {
      alert('Please upload or select a document image first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setScreeningResult(null);

      const result = await api.screenDocumentJson({
        doc_image_base64: documentImage,
        selfie_image_base64: selfieImage || null,
        mrz_text: mrzText || null,
        document_type: docType,
        extracted_fields: customExtractedFields || {
          full_name: "PAVITHRAN",
          document_number: "XXXX XXXX 2227",
          dob: "15/08/2003",
          address: "No. 42, Pillayar Kovil Street, Anna Nagar, Chennai 600040"
        }
      });

      setScreeningResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        setDocumentImage(base64Data);
        setSelfieImage('');
        setActiveSampleKey('');
        setScreeningResult(null);

        // Auto extract fields
        try {
          const ext = await api.extractDocumentFields(base64Data);
          if (ext && ext.extracted_fields) {
            setCustomExtractedFields(ext.extracted_fields);
            if (ext.extracted_fields.document_type) {
              setDocType(ext.extracted_fields.document_type);
            }
          }
        } catch (err) {
          console.warn('Field extraction err:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setActiveSampleKey('');
    setDocumentImage('');
    setSelfieImage('');
    setMrzText('');
    setScreeningResult(null);
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <FileCheck className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Document Forensics & QR Verification</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Error Level Analysis (ELA), digital modification detection, and database check digit inspection.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {screeningResult && (
            <button
              onClick={() => onInspectResult && onInspectResult(screeningResult)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>View Verification Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Test Scenarios (1-Click Evaluation):</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">10 Multi-Document Scenarios</span>
        </div>

        <DemoCaseBar
          onSelectSample={handleSelectSample}
          activeSampleKey={activeSampleKey}
          loading={loading}
        />
      </div>

      {/* Upload and Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Document Ingestion Box (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ScanLine className="h-5 w-5 text-blue-600" />
              <span>Document Image & MRZ Ingestion</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {activeSampleKey ? `Scenario: ${activeSampleKey}` : 'Custom Document'}
            </span>
          </div>

          {/* Document Preview & Upload Zone */}
          <div className="aspect-[16/10] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 relative overflow-hidden transition group flex items-center justify-center p-4">
            {documentImage ? (
              <>
                <img
                  src={documentImage}
                  alt="Ingested Document"
                  className="h-full w-full object-contain rounded-xl"
                />
                <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer border border-slate-200 transition">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center">
                <Upload className="h-10 w-10 text-slate-400 group-hover:text-blue-600 transition mb-2" />
                <span className="text-base font-extrabold text-slate-800">Upload Identity Document Image</span>
                <span className="text-xs text-slate-500 mt-1">Aadhaar, PAN, Passport, DL, Voter ID</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Configuration & Automated Checks (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Automated Inspection Checklist</h3>
              <p className="text-xs text-slate-500">Continuous AI scanning parameters</p>
            </div>

            {/* Document Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">Selected Document Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PASSPORT', label: 'Passport (ICAO)' },
                  { id: 'AADHAAR_CARD', label: 'Aadhaar (UIDAI)' },
                  { id: 'PAN_CARD', label: 'PAN Card' },
                  { id: 'DRIVING_LICENSE', label: 'Driving License' },
                  { id: 'VOTER_ID', label: 'Voter ID (EPIC)' },
                  { id: 'VISA', label: 'Consular Visa' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setDocType(type.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition border ${
                      docType === type.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Checks List */}
            <div className="space-y-2 pt-2">
              {[
                { name: '1. QR Code Cryptographic Check', desc: 'UIDAI / ICAO Digital Signature' },
                { name: '2. Modification Detection (ELA)', desc: 'Error Level Pixel Discrepancies' },
                { name: '3. Central Database Cross-Match', desc: 'National Identity Registry Record' },
                { name: '4. Mathematical Checksum Math', desc: 'Verhoeff / 7-3-1 Weight Sums' },
                { name: '5. Security Watchlist Lookup', desc: 'Interpol & Revoked Serials' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-medium">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Action */}
          <div className="pt-4 flex items-center space-x-2">
            <button
              onClick={handleReset}
              disabled={loading}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleRunCustomScreening}
              disabled={loading || !documentImage}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center space-x-2 transition ${
                loading || !documentImage
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning Document Forensics...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>RUN DEEP FORENSIC SCREENING</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Screening Outcome & Deep Forensics Cards */}
      {screeningResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Risk Score Summary */}
          <RiskScoreCard
            riskAssessment={screeningResult.risk_assessment}
            biometrics={screeningResult.biometrics}
            forensics={screeningResult.forensics}
            mrzData={screeningResult.mrz_data}
            blacklist={screeningResult.blacklist}
            validity={screeningResult.validity}
          />

          {/* Forensic Heatmap & Extracted Fields in 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ForensicHeatmapViewer
              originalDoc={documentImage}
              forensics={screeningResult.forensics}
            />

            <ExtractedFieldsTable
              fields={screeningResult.extracted_fields}
              mrzData={screeningResult.mrz_data}
            />
          </div>

          {/* Explainable AI Risk Justifications */}
          <ExplainableRiskCard
            riskFactors={screeningResult.risk_assessment?.risk_factors}
          />

          {/* Officer Final Action Panel */}
          <OfficerActionPanel
            sessionId={screeningResult.session_id}
            onDecisionMade={() => {}}
          />

        </div>
      )}

    </div>
  );
}
