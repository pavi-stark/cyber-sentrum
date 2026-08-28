import React, { useState, useEffect } from 'react';
import { Shield, Play, RotateCcw, Loader2, FileSearch, CheckCircle, AlertOctagon } from 'lucide-react';
import DemoCaseBar from '../components/DemoCaseBar';
import DocumentUploader from '../components/DocumentUploader';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ForensicHeatmapViewer from '../components/ForensicHeatmapViewer';
import RiskScoreCard from '../components/RiskScoreCard';
import ExplainableRiskCard from '../components/ExplainableRiskCard';
import ExtractedFieldsTable from '../components/ExtractedFieldsTable';
import OfficerActionPanel from '../components/OfficerActionPanel';
import { api } from '../services/api';

export default function ScreeningTerminal() {
  const [activeSampleKey, setActiveSampleKey] = useState('');
  const [documentImage, setDocumentImage] = useState('');
  const [selfieImage, setSelfieImage] = useState('');
  const [mrzText, setMrzText] = useState('');
  const [docType, setDocType] = useState('PASSPORT');

  const [loading, setLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState('');

  // Auto-load Case 1 (Genuine Passport) on first load for immediate test demonstration
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

      // Auto-trigger screening execution
      const result = await api.screenDocumentJson({
        doc_image_base64: sample.doc_image_base64,
        selfie_image_base64: sample.selfie_image_base64,
        mrz_text: sample.mrz_text,
        document_type: sample.document_type || 'PASSPORT',
        extracted_fields: sample.extracted_fields
      });

      setScreeningResult(result);
    } catch (err) {
      setError(err.message || 'Failed to process sample');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCustomScreening = async () => {
    if (!documentImage) {
      setError('Please upload or snap a document image first.');
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
        document_type: docType
      });

      setScreeningResult(result);
    } catch (err) {
      setError(err.message || 'Screening failed. Please check backend connection.');
    } finally {
      setLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1-Click SIH Demo Test Scenarios */}
      <DemoCaseBar
        onSelectSample={handleSelectSample}
        activeSampleKey={activeSampleKey}
        loading={loading}
      />

      {/* Main Dual Ingestion Grid (Document Scan + Live Biometric Face) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentUploader
          documentImage={documentImage}
          setDocumentImage={setDocumentImage}
          mrzText={mrzText}
          setMrzText={setMrzText}
          isScanning={loading}
        />

        <CameraCaptureModal
          selfieImage={selfieImage}
          setSelfieImage={setSelfieImage}
          isScanning={loading}
        />
      </div>

      {/* Trigger Screening Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] font-mono text-slate-500 px-1">DOCUMENT TYPE:</span>
          {[
            { id: 'PASSPORT', label: 'Passport (ICAO)' },
            { id: 'AADHAAR_CARD', label: 'Aadhaar (UIDAI)' },
            { id: 'PAN_CARD', label: 'PAN Card' },
            { id: 'DRIVING_LICENSE', label: 'Driving License' },
            { id: 'VISA', label: 'Visa Sticker' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setDocType(type.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                docType === type.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Fields</span>
          </button>

          <button
            onClick={handleRunCustomScreening}
            disabled={loading || !documentImage}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-semibold text-xs text-white shadow-lg transition flex items-center justify-center space-x-2 ${
              loading || !documentImage
                ? 'bg-blue-800/50 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing Document Forensics...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>EXECUTE AI SCREENING</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-mono flex items-center space-x-2">
          <AlertOctagon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Screening Outcome & Deep Forensic Breakdown */}
      {screeningResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Level Risk Gauge Card */}
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
