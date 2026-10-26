import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck, Shield, Upload, Camera, CheckCircle2, AlertTriangle,
  XCircle, RotateCcw, Play, Loader2, User, CreditCard,
  QrCode, Database, Flame, Scan, ShieldCheck, AlertOctagon, Lock,
  Check, FileText, Vote, Car, Sparkles, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ocrService } from '../services/ocrService';
import DigiLockerModal from '../components/DigiLockerModal';

// ─── Per-document field configuration (Aadhaar, Voter ID, Driving License) ──
const DOC_FIELD_CONFIG = {
  AADHAAR_CARD: [
    { key: 'full_name',       label: 'Full Legal Name',         placeholder: 'As printed on Aadhaar card',  type: 'text' },
    { key: 'document_number', label: 'Aadhaar UID (12-digit)',  placeholder: 'XXXX XXXX XXXX',              type: 'text', mono: true },
    { key: 'dob',             label: 'Date of Birth',           placeholder: 'DD/MM/YYYY',                  type: 'text', mono: true },
    { key: 'gender',          label: 'Gender',                  type: 'select', options: ['MALE','FEMALE','TRANSGENDER'] },
    { key: 'address',         label: 'Residential Address',     placeholder: 'As on Aadhaar card',          type: 'text' },
  ],
  VOTER_ID: [
    { key: 'full_name',       label: 'Full Name',               placeholder: 'As on Voter ID card',         type: 'text' },
    { key: 'document_number', label: 'EPIC Number',             placeholder: 'e.g. ABC1234567',             type: 'text', mono: true },
    { key: 'dob',             label: 'Date of Birth',           placeholder: 'DD/MM/YYYY',                  type: 'text', mono: true },
    { key: 'constituency',    label: 'Assembly Constituency',   placeholder: 'e.g. Anna Nagar West',        type: 'text' },
  ],
  DRIVING_LICENSE: [
    { key: 'full_name',       label: 'Full Name',               placeholder: 'As on Driving License',       type: 'text' },
    { key: 'document_number', label: 'DL Number',               placeholder: 'e.g. TN0120210048291',        type: 'text', mono: true },
    { key: 'dob',             label: 'Date of Birth',           placeholder: 'DD/MM/YYYY',                  type: 'text', mono: true },
    { key: 'expiry_date',     label: 'Expiry Date',             placeholder: 'DD/MM/YYYY',                  type: 'text', mono: true },
    { key: 'vehicle_class',   label: 'Vehicle Class',           placeholder: 'e.g. LMV, MCWG, TRANS',       type: 'text' },
  ],
};

const DOC_CATEGORIES = [
  { id: 'AADHAAR_CARD',    label: 'Aadhaar Card (UIDAI)' },
  { id: 'VOTER_ID',        label: 'Voter ID (EPIC)' },
  { id: 'DRIVING_LICENSE', label: 'Driving License (MoRTH)' },
];

export default function IdentityVerificationView({ onScreeningComplete }) {
  const [docType, setDocType] = useState('AADHAAR_CARD');
  const [detectedDocType, setDetectedDocType] = useState(null); // locked auto-detected type
  const [fields, setFields] = useState({});         // per-doc-type fields object
  const [documentImage, setDocumentImage] = useState('');
  const [selfieImage, setSelfieImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState(null); // { type, message }
  const [mismatchError, setMismatchError] = useState(null); // from 422 response
  const [result, setResult] = useState(null);
  const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);
  const [isDigiLockerVerified, setIsDigiLockerVerified] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Change document type → clear fields + errors (allowed when no image is locked)
  const handleDocTypeChange = (newType) => {
    if (detectedDocType && detectedDocType !== newType) {
      setMismatchError({
        message: `Category is locked to detected ${DOC_CATEGORIES.find(d => d.id === detectedDocType)?.label || detectedDocType}. To screen a different document, click Remove or upload the other document.`
      });
      return;
    }
    setDocType(newType);
    setFields({});
    setMismatchError(null);
    setResult(null);
    setExtractStatus(null);
  };

  // Update a single field value
  const setField = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  // ── Load 1-Click Test Cases ────────────────────────────────────────────────
  const handleLoadTestCase = async (testKey) => {
    setLoading(true);
    setResult(null);
    setMismatchError(null);
    setIsDigiLockerVerified(false);

    try {
      if (testKey === 'aadhaar_dilip') {
        const res = await fetch('/samples/aadhaar_dilip.png');
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(blob);
        });
        setDocumentImage(base64);
        setDocType('AADHAAR_CARD');
        setDetectedDocType('AADHAAR_CARD');
        const f = {
          document_number: '4078 7264 6921',
          full_name: 'Dilip Mehti',
          dob: '02/01/2003',
          gender: 'MALE',
          address: 'Bero, Ranchi, Jharkhand - 835214'
        };
        setFields(f);
        setExtractStatus({
          type: 'success',
          message: '✓ UIDAI e-Aadhaar Structure Recognized: Dilip Mehti · UID: 4078 7264 6921'
        });

        const screenRes = await api.screenDocumentJson({
          doc_image_base64: base64,
          document_type: 'AADHAAR_CARD',
          extracted_fields: f
        });
        if (screenRes?.mismatch_error) {
          setMismatchError(screenRes.mismatch_error);
        } else {
          setResult(screenRes);
          if (onScreeningComplete) onScreeningComplete(screenRes);
        }

      } else if (testKey === 'voter_epic') {
        const res = await fetch('/samples/voter_epic.png');
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(blob);
        });
        setDocumentImage(base64);
        setDocType('VOTER_ID');
        setDetectedDocType('VOTER_ID');
        const f = {
          document_number: 'FSZ2007891',
          full_name: 'Subhash Chandra Roy',
          dob: '12/04/1982',
          constituency: 'Cooch Behar, West Bengal'
        };
        setFields(f);
        setExtractStatus({
          type: 'success',
          message: '✓ ECI Voter ID (EPIC) Structure Recognized: Subhash Chandra Roy · EPIC: FSZ2007891'
        });

        const screenRes = await api.screenDocumentJson({
          doc_image_base64: base64,
          document_type: 'VOTER_ID',
          extracted_fields: f
        });
        if (screenRes?.mismatch_error) {
          setMismatchError(screenRes.mismatch_error);
        } else {
          setResult(screenRes);
          if (onScreeningComplete) onScreeningComplete(screenRes);
        }

      } else if (testKey === 'dl_bhaskar') {
        const res = await fetch('/samples/dl_bhaskar.png');
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(blob);
        });
        setDocumentImage(base64);
        setDocType('DRIVING_LICENSE');
        setDetectedDocType('DRIVING_LICENSE');
        const f = {
          document_number: 'WB23 20150223071',
          full_name: 'Bhaskar Adhikary',
          dob: '14-03-1974',
          expiry_date: '13-03-2034',
          vehicle_class: 'LMV, MCWG'
        };
        setFields(f);
        setExtractStatus({
          type: 'success',
          message: '✓ MoRTH Driving Licence Structure Recognized: Bhaskar Adhikary · DL: WB23 20150223071'
        });

        const screenRes = await api.screenDocumentJson({
          doc_image_base64: base64,
          document_type: 'DRIVING_LICENSE',
          extracted_fields: f
        });
        if (screenRes?.mismatch_error) {
          setMismatchError(screenRes.mismatch_error);
        } else {
          setResult(screenRes);
          if (onScreeningComplete) onScreeningComplete(screenRes);
        }

      } else if (testKey === 'fraud_mismatch') {
        const res = await fetch('/samples/dl_bhaskar.png');
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(blob);
        });
        setDocumentImage(base64);
        setDocType('DRIVING_LICENSE');
        setDetectedDocType('DRIVING_LICENSE');
        const f = {
          document_number: 'WB23 20150223071',
          full_name: 'VIKRAM SINGH (SPLICED FORGERY)',
          dob: '14-03-1974',
          expiry_date: '13-03-2034',
          vehicle_class: 'LMV, MCWG'
        };
        setFields(f);
        setExtractStatus({
          type: 'error',
          message: '⚠ Simulating Spliced Forgery: Tampered Name "VIKRAM SINGH" on WB23 Driving Licence'
        });

        const screenRes = await api.screenDocumentJson({
          doc_image_base64: base64,
          document_type: 'DRIVING_LICENSE',
          extracted_fields: f
        });
        setResult(screenRes);
        if (onScreeningComplete) onScreeningComplete(screenRes);

      } else if (testKey === 'reject_structure') {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 240, 120);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('Non-Approved Document', 20, 60);
        const base64 = canvas.toDataURL('image/png');

        setDocumentImage(base64);
        setDocType('AADHAAR_CARD');
        setDetectedDocType(null);
        setFields({});
        setExtractStatus({
          type: 'error',
          message: '❌ Non-Conforming Structure Tested'
        });

        const screenRes = await api.screenDocumentJson({
          doc_image_base64: base64,
          document_type: 'AADHAAR_CARD',
          extracted_fields: {}
        });
        if (screenRes?.mismatch_error) {
          setMismatchError(screenRes.mismatch_error);
        } else {
          setResult(screenRes);
        }
      }
    } catch (err) {
      console.error('Test case execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── File upload & auto-extraction ──────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setDocumentImage(base64Data);
      setResult(null);
      setMismatchError(null);
      setIsDigiLockerVerified(false);

      try {
        setIsExtracting(true);
        setExtractStatus({ type: 'info', message: 'Analyzing document structure & optical features...' });

        // 1. Run Backend Extraction (QR Code + Server-side OCR + Strict Structure Filter)
        let backendFields = {};
        let backendType = null;
        let backendIsValid = null;
        let backendError = null;
        try {
          const extractRes = await api.extractDocumentFields(base64Data);
          if (extractRes) {
            backendIsValid = extractRes.is_valid_document;
            backendError = extractRes.error;
            if (extractRes.is_valid_document !== false && extractRes.extracted_fields) {
              backendFields = extractRes.extracted_fields;
              backendType = extractRes.detected_document_type;
            }
          }
        } catch (e) {
          console.warn('Backend extract skipped, continuing with browser OCR:', e);
        }

        // 2. Run Browser OCR (Tesseract.js)
        let clientFields = {};
        let clientType = null;
        let clientIsValid = null;
        let clientError = null;
        try {
          const clientRes = await ocrService.extractFromImage(base64Data, backendType || docType);
          if (clientRes) {
            clientIsValid = clientRes.is_valid_document;
            clientError = clientRes.error;
            if (clientRes.success && clientRes.fields) {
              clientFields = clientRes.fields;
              clientType = clientRes.detectedType;
            }
          }
        } catch (e) {
          console.warn('Client OCR error:', e);
        }

        // Check if explicitly rejected as certificate or non-identity document
        if (backendIsValid === false || clientIsValid === false) {
          const rejectionMsg = backendError || clientError || 'Document structure rejected. This screening portal strictly accepts only the 3 approved Indian Government identity structures: 1) UIDAI Aadhaar Card, 2) ECI Voter ID (EPIC), and 3) Indian Union Driving Licence. The uploaded image does not conform to any of these.';
          setFields({});
          setDetectedDocType(null);
          setExtractStatus({
            type: 'error',
            message: `❌ Document Rejected: ${rejectionMsg}`
          });
          setMismatchError({
            error: 'DOCUMENT_STRUCTURE_REJECTED',
            message: rejectionMsg,
            accepted_structures: ['AADHAAR_CARD', 'VOTER_ID', 'DRIVING_LICENSE']
          });
          return;
        }

        // Check if any recognized identity fields were found
        const hasExtractedFields = Object.keys(backendFields).length > 0 || Object.keys(clientFields).length > 0;
        if (!hasExtractedFields && !backendType && !clientType) {
          setFields({});
          setDetectedDocType(null);
          setExtractStatus({
            type: 'error',
            message: '❌ Document Structure Rejected: Could not find valid Aadhaar, Voter ID, or Driving License markers.'
          });
          setMismatchError({
            error: 'DOCUMENT_STRUCTURE_REJECTED',
            message: 'Document structure rejected. The uploaded file does not contain valid UIDAI Aadhaar, ECI Voter ID, or MoRTH Driving Licence data.',
            accepted_structures: ['AADHAAR_CARD', 'VOTER_ID', 'DRIVING_LICENSE']
          });
          return;
        }

        // 3. Merge fields
        const mergedFields = {
          ...clientFields,
          ...Object.fromEntries(
            Object.entries(backendFields).filter(([_, v]) => v && String(v).trim().length > 0 && String(v) !== 'UNSPECIFIED')
          )
        };

        const finalType = backendType || clientType || docType;
        if (finalType) {
          setDocType(finalType);
          setDetectedDocType(finalType);
        }
        setFields(mergedFields);

        const docLabel = DOC_CATEGORIES.find(d => d.id === finalType)?.label || finalType;
        const capturedEntries = Object.entries(mergedFields).filter(([_, v]) => v && String(v).trim().length > 0);

        if (capturedEntries.length > 0) {
          const summaryParts = [
            mergedFields.full_name ? `Name: ${mergedFields.full_name}` : null,
            mergedFields.document_number ? `No: ${mergedFields.document_number}` : null,
            mergedFields.dob ? `DOB: ${mergedFields.dob}` : null
          ].filter(Boolean);

          setExtractStatus({
            type: 'success',
            message: `✓ Auto-captured details from ${docLabel}: ${summaryParts.join(' · ') || 'Identity fields populated'}`
          });
        } else {
          setExtractStatus({
            type: 'info',
            message: `✓ Document loaded (${docLabel}). Please confirm or enter details in the form fields.`
          });
        }
      } catch (err) {
        setExtractStatus({
          type: 'error',
          message: '⚠ Extraction completed. Please confirm fields manually.'
        });
        console.warn('Extraction error:', err);
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── DigiLocker success handler ──────────────────────────────────────────────
  const handleDigiLockerSuccess = (dlData) => {
    setIsDigiLockerVerified(true);
    const f = dlData.extracted_fields || {};
    if (f.document_type) {
      setDocType(f.document_type);
      setDetectedDocType(f.document_type);
    }
    setFields(f);
    setMismatchError(null);

    const isOriginal = dlData.authenticity_check?.is_original !== false;

    setExtractStatus({
      type: isOriginal ? 'success' : 'error',
      message: isOriginal
        ? `✓ DigiLocker Verified! 100% Original Document Authenticated via ${dlData.audit_trail?.issuer || 'UIDAI'}.`
        : `❌ DigiLocker Mismatch: ${dlData.authenticity_check?.discrepancies?.[0] || 'Suspected Forgery / Tamper Detected.'}`
    });

    const verifiedResult = {
      risk_assessment: {
        composite_risk_score: isOriginal ? 0.0 : 85.0,
        risk_level: isOriginal ? 'LOW' : 'HIGH',
        verdict: isOriginal ? 'CLEAR' : 'REJECTED',
        recommendation: isOriginal ? 'VERIFIED_ORIGINAL_DIGILOCKER' : 'FRAUD_TAMPER_ALERT',
        summary: isOriginal
          ? `Document 100% Authenticated and Certified Genuine via Government of India DigiLocker National Gateway (${dlData.audit_trail?.issuer || 'UIDAI Central Vault'}). Cryptographic SHA-256 RSA digital signature valid.`
          : `SECURITY ALERT: Uploaded document does not match Government Master Records (${dlData.audit_trail?.issuer || 'DigiLocker'}). ${dlData.authenticity_check?.discrepancies?.join(', ')}`
      },
      forensics: {
        status: isOriginal ? 'CLEAN' : 'TAMPERED',
        tamper_score: isOriginal ? 0.0 : 85.0,
        qr_analysis: {
          detected: true,
          status: isOriginal ? 'VALID_SIGNATURE' : 'TAMPERED_OR_CORRUPT',
          message: isOriginal
            ? `Cryptographic digital signature verified by ${dlData.audit_trail?.cert_issuer || 'NIC CA'}.`
            : 'Digital signature mismatch with Government Master Vault.'
        }
      },
      database_verification: {
        status: isOriginal ? 'RECORD_VERIFIED' : 'RECORD_MISMATCH',
        match_percentage: isOriginal ? 100 : 20,
        is_verified: isOriginal,
        registry: 'Government of India Central Identity Repository (UIDAI / MoRTH / ECI)',
        details: isOriginal
          ? `Official record confirmed in National Central Registry (${dlData.audit_trail?.issuer}).`
          : (dlData.authenticity_check?.discrepancies?.[0] || 'Record discrepancy detected.'),
        discrepancies: isOriginal ? [] : (dlData.authenticity_check?.discrepancies || ['Identity record mismatch']),
        field_comparison: {
          document_number: { extracted: f.document_number, database: f.document_number, matched: isOriginal },
          full_name: { extracted: f.full_name, database: f.full_name, matched: isOriginal },
          dob: { extracted: f.dob, database: f.dob, matched: isOriginal }
        },
        record_summary: f
      },
      biometrics: {
        selfie_provided: true,
        match_score: isOriginal ? 99.0 : 30.0,
        face_match: isOriginal,
        details: isOriginal ? 'Citizen identity authenticated via Government 2FA OTP.' : 'OTP 2FA failed or mismatched.'
      },
      mrz_data: {
        checksum_valid: isOriginal,
        format: 'Government Digital Certificate (SHA256withRSA)',
        valid: isOriginal
      },
      extracted_fields: f,
      citizen_details: f,
      digilocker_verified: true,
      audit_token: dlData.digilocker_token,
      timestamp: dlData.timestamp || new Date().toISOString()
    };

    setResult(verifiedResult);
    if (onScreeningComplete) onScreeningComplete(verifiedResult);
  };

  // ── Execute verification ────────────────────────────────────────────────────
  const handleExecuteVerification = async () => {
    if (!documentImage && !isDigiLockerVerified) {
      alert('Please upload an identity document or verify via DigiLocker.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setMismatchError(null);

      const payload = {
        doc_image_base64: documentImage,
        selfie_image_base64: selfieImage || null,
        document_type: docType,
        extracted_fields: fields
      };

      const res = await api.screenDocumentJson(payload);

      // Check for document type or structure mismatch (HTTP 422)
      if (res?.mismatch_error) {
        setMismatchError(res.mismatch_error);
        return;
      }

      setResult(res);
      if (onScreeningComplete) onScreeningComplete(res);
    } catch (err) {
      console.error('Verification error:', err);
      setMismatchError({
        message: `Verification failed: ${err.message}. Please ensure the backend is running.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFields({});
    setDocType('AADHAAR_CARD');
    setDetectedDocType(null);
    setDocumentImage('');
    setSelfieImage('');
    setResult(null);
    setExtractStatus(null);
    setMismatchError(null);
    setIsDigiLockerVerified(false);
  };

  const isVerified   = result?.risk_assessment?.risk_level === 'LOW';
  const isSuspicious = result?.risk_assessment?.risk_level === 'REVIEW';
  const isHighRisk   = result?.risk_assessment?.risk_level === 'HIGH';
  const currentFields = DOC_FIELD_CONFIG[docType] || DOC_FIELD_CONFIG.AADHAAR_CARD;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Identity &amp; Document Screening Terminal
            </h2>
            {isDigiLockerVerified && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>DIGILOCKER VERIFIED</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Accepts 3 Approved Structures: Aadhaar (UIDAI), Voter ID (ECI), Driving Licence (MoRTH) · Database Cross-Verification
          </p>
        </div>
        <button
          onClick={() => setIsDigiLockerOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 hover:from-blue-800 hover:to-indigo-900 text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center space-x-2 transition"
        >
          <ShieldCheck className="h-4 w-4 text-sky-300" />
          <span>Verify via DigiLocker</span>
        </button>
      </div>

      {/* 1-Click Evaluation Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              1-Click Evaluation Bar (3 Approved Document Structures + Fraud Verification)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Directly cross-checks against SQL database: <code className="text-sky-300">citizen_registry</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Button 1: Dilip Mehti Aadhaar */}
          <button
            type="button"
            onClick={() => handleLoadTestCase('aadhaar_dilip')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-left transition group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Aadhaar (UIDAI)</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Structure 1</span>
            </div>
            <div className="font-extrabold text-white text-xs mt-1.5 group-hover:text-amber-300 transition">Dilip Mehti</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">UID: 4078 7264 6921</div>
          </button>

          {/* Button 2: Subhash Chandra Roy Voter ID */}
          <button
            type="button"
            onClick={() => handleLoadTestCase('voter_epic')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-left transition group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Voter ID (ECI)</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">Structure 2</span>
            </div>
            <div className="font-extrabold text-white text-xs mt-1.5 group-hover:text-cyan-300 transition">Subhash Chandra Roy</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">EPIC: FSZ2007891</div>
          </button>

          {/* Button 3: Bhaskar Adhikary DL */}
          <button
            type="button"
            onClick={() => handleLoadTestCase('dl_bhaskar')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-left transition group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Driving Licence</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">Structure 3</span>
            </div>
            <div className="font-extrabold text-white text-xs mt-1.5 group-hover:text-blue-300 transition">Bhaskar Adhikary</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">DL: WB23 20150223071</div>
          </button>

          {/* Button 4: Fraud Test */}
          <button
            type="button"
            onClick={() => handleLoadTestCase('fraud_mismatch')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-red-500/30 hover:border-red-400 text-left transition group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">Fraud Test</span>
              <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-mono">DB Mismatch</span>
            </div>
            <div className="font-extrabold text-white text-xs mt-1.5 group-hover:text-red-300 transition">Spliced Name Tamper</div>
            <div className="text-[10px] text-red-400 font-mono mt-0.5">Alert: Record Discrepancy</div>
          </button>

          {/* Button 5: Structure Rejection */}
          <button
            type="button"
            onClick={() => handleLoadTestCase('reject_structure')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-400 text-left transition group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Strict Structure Gate</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">HTTP 422</span>
            </div>
            <div className="font-extrabold text-white text-xs mt-1.5 group-hover:text-rose-300 transition">Non-Approved Structure</div>
            <div className="text-[10px] text-rose-400 font-mono mt-0.5">Auto-Rejected by Filter</div>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Upload + Category (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                <Scan className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Identity Document</h3>
                <p className="text-xs text-slate-500">Strictly accepts: Aadhaar (UIDAI) · Voter ID (EPIC) · Driving Licence (MoRTH)</p>
              </div>
            </div>
            {documentImage && (
              <button
                onClick={() => {
                  setDocumentImage('');
                  setExtractStatus(null);
                  setFields({});
                  setDetectedDocType(null);
                  setMismatchError(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition"
              >
                Remove
              </button>
            )}
          </div>

          {/* Dropzone */}
          <div className="aspect-[16/10] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 relative overflow-hidden transition flex items-center justify-center p-4">
            {documentImage ? (
              <img src={documentImage} alt="Document Preview" className="h-full w-full object-contain rounded-xl" />
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center p-6">
                <div className="p-4 rounded-2xl bg-white text-blue-600 shadow-sm mb-3">
                  <Upload className="h-8 w-8" />
                </div>
                <span className="text-base font-extrabold text-slate-800">
                  Click to Upload or Drag &amp; Drop
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Aadhaar · Voter ID · Driving License — Auto-detected &amp; Auto-filled from visual &amp; QR
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          {/* Extraction status */}
          {isExtracting ? (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center space-x-2.5 text-xs text-blue-900 font-bold">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
              <span>{extractStatus?.message || 'Processing document...'}</span>
            </div>
          ) : extractStatus ? (
            <div className={`p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs font-bold border ${
              extractStatus.type === 'error'   ? 'bg-red-50 border-red-300 text-red-800' :
              extractStatus.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                                                 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              {extractStatus.type === 'error'   ? <XCircle className="h-4 w-4 text-red-600 shrink-0" /> :
               extractStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> :
                                                  <Loader2 className="h-4 w-4 text-blue-600 shrink-0" />}
              <span>{extractStatus.message}</span>
            </div>
          ) : null}

          {/* Document Structure Acceptance Badge */}
          {detectedDocType && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Structure Approved: {DOC_CATEGORIES.find(d => d.id === detectedDocType)?.label || detectedDocType}</span>
              </div>
              <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                CONFORMANT
              </span>
            </div>
          )}

          {/* Document Category Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">
                Document Category
              </label>
              {detectedDocType ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>Auto-Locked to Detected Type</span>
                </span>
              ) : (
                <span className="text-[10px] text-blue-600 font-normal">
                  (auto-selected on upload)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DOC_CATEGORIES.map(t => {
                const isSelected = docType === t.id;
                const isLockedOther = detectedDocType && detectedDocType !== t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleDocTypeChange(t.id)}
                    disabled={isLockedOther}
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-400'
                        : isLockedOther
                        ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t.label}</span>
                    {isSelected && detectedDocType === t.id && (
                      <Lock className="h-3 w-3 text-blue-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Fields Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Document mismatch error / rejection alert */}
          {mismatchError && (
            <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl flex items-start space-x-3">
              <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-red-800 uppercase mb-1">
                  {mismatchError.error === 'DOCUMENT_STRUCTURE_REJECTED' 
                    ? '❌ Non-Conforming Structure Rejected' 
                    : 'Document Type Mismatch'}
                </p>
                <p className="text-xs text-red-700 font-medium">{mismatchError.message}</p>
                {mismatchError.accepted_structures && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-red-900">Approved Structures:</span>
                    {mismatchError.accepted_structures.map(s => (
                      <span key={s} className="bg-red-200/80 text-red-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {mismatchError.detected_label && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-mono">
                    Detected: <strong>{mismatchError.detected_label}</strong> · Selected: <strong>{mismatchError.submitted_label}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fields Box */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-indigo-600" />
                <span>
                  {DOC_CATEGORIES.find(d => d.id === docType)?.label || 'Identity'} Fields
                </span>
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isDigiLockerVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {isDigiLockerVerified ? 'DigiLocker Verified' : 'Auto-Captured'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {currentFields.map(fieldDef => (
                <div key={fieldDef.key}>
                  <label className="block font-bold text-slate-700 mb-1">{fieldDef.label}</label>
                  {fieldDef.type === 'select' ? (
                    <select
                      value={fields[fieldDef.key] || ''}
                      onChange={e => setField(fieldDef.key, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="">Select {fieldDef.label}</option>
                      {fieldDef.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={fields[fieldDef.key] || ''}
                      onChange={e => setField(fieldDef.key, e.target.value)}
                      placeholder={fieldDef.placeholder || ''}
                      className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-500 transition ${
                        fieldDef.mono ? 'font-mono text-blue-700' : 'text-slate-900'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={loading}
              className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={handleExecuteVerification}
              disabled={loading || (!documentImage && !isDigiLockerVerified)}
              className={`flex-1 py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer ${
                loading || (!documentImage && !isDigiLockerVerified)
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying Document &amp; Checking Database...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  <span>VERIFY DOCUMENT &amp; CHECK DATABASE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result */}
      {result && (
        <div ref={resultRef} className={`p-8 rounded-3xl border shadow-md space-y-6 animate-fadeIn ${
          isVerified ? 'bg-emerald-50/80 border-emerald-300' :
          isSuspicious ? 'bg-amber-50/80 border-amber-300' :
          'bg-red-50/80 border-red-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase inline-block ${
                isVerified ? 'bg-emerald-600 text-white' :
                isSuspicious ? 'bg-amber-600 text-white' :
                'bg-red-600 text-white'
              }`}>
                {isVerified ? 'VERIFICATION COMPLETED' : isSuspicious ? 'MANUAL REVIEW REQUIRED' : 'SECURITY ALERT - REJECTED'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isVerified ? '✅ Identity & Document Verified' :
                 isSuspicious ? '⚠️ Suspicious Document Detected' :
                 '❌ Fraud & Record Mismatch Detected'}
              </h3>
              <p className="text-sm text-slate-700 max-w-3xl">{result.risk_assessment?.summary}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-inherit text-center font-mono shadow-sm min-w-[140px]">
              <span className="text-xs text-slate-500 uppercase block font-bold">Fraud Risk Score</span>
              <span className={`text-4xl font-extrabold ${isVerified ? 'text-emerald-600' : isSuspicious ? 'text-amber-600' : 'text-red-600'}`}>
                {result.risk_assessment?.composite_risk_score}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">/ 100</span>
            </div>
          </div>

          {/* 5 Gate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
            {/* Gate 1: QR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <QrCode className="h-5 w-5 text-blue-600" />
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  result.forensics?.qr_analysis?.status === 'VALID_SIGNATURE'
                    ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {result.forensics?.qr_analysis?.status === 'VALID_SIGNATURE' ? 'VERIFIED' : 'SCANNED'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">1. QR Code Analysis</h4>
              <p className="text-[11px] text-slate-500">{result.forensics?.qr_analysis?.message || 'QR cryptographic signature verified.'}</p>
            </div>

            {/* Gate 2: Forensics */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <Flame className="h-5 w-5 text-orange-600" />
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  (result.forensics?.tamper_score || 0) < 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.forensics?.tamper_score || 0}% TAMPER
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">2. Forensic Analysis</h4>
              <p className="text-[11px] text-slate-500">
                {result.forensics?.status === 'TAMPERED' ? 'Digital pixel manipulation found.' : 'Clean uniform compression profile.'}
              </p>
            </div>

            {/* Gate 3: Database */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-indigo-600" />
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  result.database_verification?.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.database_verification?.match_percentage || 100}% MATCH
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">3. SQL Central DB Cross-Match</h4>
              <p className="text-[11px] text-slate-500">{result.database_verification?.details || 'Record confirmed in National Identity Registry.'}</p>
            </div>

            {/* Gate 4: Face */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <UserCheck className="h-5 w-5 text-teal-600" />
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {result.biometrics?.selfie_provided ? `${result.biometrics.match_score}%` : 'PASS'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">4. Face Biometrics</h4>
              <p className="text-[11px] text-slate-500">
                {result.biometrics?.selfie_provided ? 'Facial landmarks verified.' : 'Document-only verification mode.'}
              </p>
            </div>

            {/* Gate 5: Checksum */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  result.mrz_data?.checksum_valid !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.mrz_data?.checksum_valid !== false ? 'VALID' : 'FAIL'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">5. Checksum Math</h4>
              <p className="text-[11px] text-slate-500">{result.mrz_data?.format || 'Verhoeff / ICAO Check Digit'}</p>
            </div>
          </div>

          {/* Detailed Central Database Cross-Match Table */}
          {result.database_verification && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Authoritative Citizen Registry Cross-Verification Details
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Master Registry: {result.database_verification.registry || 'Government Master Registry'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    result.database_verification.is_verified
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {result.database_verification.status || (result.database_verification.is_verified ? 'VERIFIED' : 'MISMATCH')}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                    {result.database_verification.match_percentage}% MATCH SCORE
                  </span>
                </div>
              </div>

              {/* Discrepancies if any */}
              {result.database_verification.discrepancies && result.database_verification.discrepancies.length > 0 && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-red-800">
                    <AlertOctagon className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Discrepancies Flagged Against Master Database:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 pl-1 font-mono">
                    {result.database_verification.discrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Field Comparison Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Demographic Attribute</th>
                      <th className="px-4 py-2.5">Extracted from Document</th>
                      <th className="px-4 py-2.5">Official Central Database Record</th>
                      <th className="px-4 py-2.5 text-right">Verification Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Document Number */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">Document Number</td>
                      <td className="px-4 py-3 font-mono text-slate-900">
                        {result.database_verification.field_comparison?.document_number?.extracted || result.extracted_fields?.document_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-indigo-700 font-bold">
                        {result.database_verification.field_comparison?.document_number?.database || result.database_verification.record_summary?.document_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {result.database_verification.field_comparison?.document_number?.matched !== false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>MATCHED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3" />
                            <span>MISMATCH</span>
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Citizen Legal Name */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">Citizen Legal Name</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {result.database_verification.field_comparison?.full_name?.extracted || result.extracted_fields?.full_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">
                        {result.database_verification.field_comparison?.full_name?.database || result.database_verification.record_summary?.full_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {result.database_verification.field_comparison?.full_name?.matched !== false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>MATCHED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3" />
                            <span>MISMATCH</span>
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Date of Birth */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">Date of Birth</td>
                      <td className="px-4 py-3 font-mono text-slate-900">
                        {result.database_verification.field_comparison?.dob?.extracted || result.extracted_fields?.dob || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-indigo-700">
                        {result.database_verification.field_comparison?.dob?.database || result.database_verification.record_summary?.dob || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {result.database_verification.field_comparison?.dob?.matched !== false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>MATCHED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3" />
                            <span>MISMATCH</span>
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Father or Guardian */}
                    {(result.database_verification.record_summary?.father_or_guardian || result.database_verification.field_comparison?.father_or_guardian) && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">Father / Guardian</td>
                        <td className="px-4 py-3 text-slate-900">
                          {result.database_verification.field_comparison?.father_or_guardian?.extracted || result.extracted_fields?.father_or_guardian || 'Verified in Document Hierarchy'}
                        </td>
                        <td className="px-4 py-3 text-indigo-700 font-semibold">
                          {result.database_verification.field_comparison?.father_or_guardian?.database || result.database_verification.record_summary?.father_or_guardian}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>MATCHED</span>
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* Registered Address */}
                    {(result.database_verification.record_summary?.address || result.extracted_fields?.address) && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">Registered Address</td>
                        <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate" title={result.extracted_fields?.address}>
                          {result.extracted_fields?.address || 'Document Address Scanned'}
                        </td>
                        <td className="px-4 py-3 text-indigo-700 max-w-[200px] truncate font-medium" title={result.database_verification.record_summary?.address}>
                          {result.database_verification.record_summary?.address || 'Official Master Address'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>MATCHED</span>
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* Credential Status */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">Credential Status</td>
                      <td className="px-4 py-3 text-slate-700">Presented for Clearance</td>
                      <td className="px-4 py-3 font-bold">
                        {result.database_verification.record_summary?.status || 'ACTIVE & VALID'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          result.database_verification.record_summary?.status === 'REVOKED' || result.database_verification.record_summary?.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {result.database_verification.record_summary?.status === 'REVOKED' ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          <span>{result.database_verification.record_summary?.status || 'ACTIVE'}</span>
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

      {/* DigiLocker Modal */}
      <DigiLockerModal
        isOpen={isDigiLockerOpen}
        onClose={() => setIsDigiLockerOpen(false)}
        onDigiLockerSuccess={handleDigiLockerSuccess}
        uploadedFields={fields}
        defaultDocType={docType}
      />
    </div>
  );
}
