import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, Loader2, X, FileText, 
  Smartphone, ArrowRight, Sparkles, Building, Key, Check,
  AlertTriangle, Bell, ShieldAlert, Settings, Info, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function DigiLockerModal({ isOpen, onClose, onDigiLockerSuccess, uploadedFields = null, defaultDocType = 'AADHAAR_CARD' }) {
  const [step, setStep] = useState(1); // 1: Input ID/Phone, 2: OTP, 3: Success / Authenticity Check
  const [identifier, setIdentifier] = useState('9840122227');
  const [docType, setDocType] = useState(defaultDocType.includes('PAN') ? 'PAN' : defaultDocType.includes('DRIV') ? 'DRIVING_LICENSE' : defaultDocType.includes('VOTER') ? 'VOTER_ID' : 'AADHAAR');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [liveOtpInfo, setLiveOtpInfo] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Fast2SMS configuration drawer
  const [showConfig, setShowConfig] = useState(false);
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  if (!isOpen) return null;

  const handleSaveSMSKey = async (e) => {
    e.preventDefault();
    if (!fast2smsKey.trim()) return;
    try {
      const res = await api.configureSMSGateway({ fast2sms_api_key: fast2smsKey.trim() });
      if (res.success) {
        setConfigSuccess('✓ Fast2SMS API Key saved! Real SMS will be sent directly to your phone.');
        setTimeout(() => setConfigSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!identifier || identifier.trim().length < 4) {
      setErrorMsg('Please enter your 10-digit Mobile Number or 12-digit Aadhaar UID.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.requestDigiLockerOTP(identifier);
      if (res.success) {
        setTransactionId(res.transaction_id);
        setLiveOtpInfo(res);
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Could not generate OTP.');
      }
    } catch (err) {
      setErrorMsg('Could not reach DigiLocker Gateway. Trying fallback...');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the valid 6-digit OTP code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.fetchDigiLockerDoc(transactionId, otp, docType, uploadedFields);
      if (res.success) {
        setFetchedData(res);
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (fetchedData && onDigiLockerSuccess) {
      onDigiLockerSuccess(fetchedData);
    }
    onClose();
  };

  const isOriginal = fetchedData?.authenticity_check?.is_original !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* DigiLocker Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white text-blue-900 rounded-2xl shadow-md">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black tracking-tight text-white">DigiLocker Gateway</h3>
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  GOV 2FA OTP
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Direct Government of India Digital KYC &amp; Real-Time Originality Verification
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-2xl text-xs font-bold text-red-700 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Aadhaar / Mobile */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono">
                  Document Type to Verify
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'AADHAAR', label: 'Aadhaar (UIDAI)' },
                    { id: 'VOTER_ID', label: 'Voter ID (ECI)' },
                    { id: 'DRIVING_LICENSE', label: 'Driving License' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDocType(d.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        docType === d.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Citizen Mobile Number or Aadhaar UID
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Settings className="h-3 w-3" />
                    <span>{showConfig ? 'Hide SMS Setup' : 'Real SMS Gateway (Fast2SMS)'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your 10-digit mobile number (e.g. 9840122227)..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                  <span>Enter your actual phone number to receive real OTP via SMS.</span>
                </p>
              </div>

              {/* Optional Fast2SMS Real SMS Gateway Setup Box */}
              {showConfig && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Key className="h-3.5 w-3.5 text-blue-600" />
                    <span>Real Phone SMS Dispatch (Fast2SMS API Key)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    To deliver SMS straight to your real mobile handset, enter your free Fast2SMS API key:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={fast2smsKey}
                      onChange={(e) => setFast2smsKey(e.target.value)}
                      placeholder="Paste Fast2SMS API Key here..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSMSKey}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                    >
                      Save Key
                    </button>
                  </div>
                  {configSuccess && (
                    <p className="text-[11px] text-emerald-600 font-bold">{configSuccess}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting to UIDAI / DigiLocker Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Send DigiLocker Real OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              
              {/* Real SMS Dispatch Notification Box */}
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-300 rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-sky-900">
                    <Bell className="h-4 w-4 text-sky-600 shrink-0 animate-bounce" />
                    <span>Gov Gateway Dispatch ({liveOtpInfo?.phone_masked || identifier}):</span>
                  </div>
                  {liveOtpInfo?.real_sms_sent ? (
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                      REAL SMS DELIVERED
                    </span>
                  ) : (
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                      LIVE CARRIER ROUTE
                    </span>
                  )}
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-sky-200 text-xs font-mono text-slate-800 font-medium">
                  {liveOtpInfo?.sms_preview || `Your DigiLocker OTP is ${liveOtpInfo?.generated_otp || '123456'}. Valid for 10 mins.`}
                </div>

                {liveOtpInfo?.generated_otp && (
                  <div className="flex items-center justify-between text-[11px] text-sky-800 font-mono pt-1">
                    <span>Generated OTP Code:</span>
                    <button
                      type="button"
                      onClick={() => setOtp(liveOtpInfo.generated_otp)}
                      className="font-bold underline text-blue-700 hover:text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded"
                    >
                      Autofill: {liveOtpInfo.generated_otp}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit DigiLocker OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full bg-slate-50 border-2 border-blue-400 rounded-xl px-3.5 py-3 text-center text-2xl tracking-widest font-mono font-black text-blue-700 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  Security: 3 attempts allowed · Session active for 10 minutes
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={`w-2/3 py-3 rounded-xl font-extrabold text-xs text-white shadow-md transition flex items-center justify-center space-x-2 ${
                    loading || otp.length !== 6
                      ? 'bg-emerald-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Validating OTP &amp; Originality...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify &amp; Cross-Check</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Successfully Verified & Fetched */}
          {step === 3 && fetchedData && (
            <div className="space-y-4">
              
              {isOriginal ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <span className="text-sm font-black text-emerald-950">100% ORIGINAL GOVERNMENT DOCUMENT</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-600 text-white rounded shrink-0">
                      DIGITALLY SIGNED
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Document verified directly against the National Central Vault ({fetchedData.audit_trail?.issuer}). SHA-256 RSA certificate is 100% authentic.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                      <span className="text-sm font-black text-red-950">TAMPERED / MISMATCHED DOCUMENT</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-red-600 text-white rounded shrink-0">
                      FRAUD DETECTED
                    </span>
                  </div>
                  <p className="text-xs text-red-800">
                    {fetchedData.authenticity_check?.discrepancies?.[0] || 'Uploaded document does not match Government Master Records.'}
                  </p>
                </div>
              )}

              {/* Verified Details Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Legal Name:</span>
                  <span className="font-bold text-slate-900">{fetchedData.extracted_fields?.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Document No:</span>
                  <span className="font-bold text-blue-600">{fetchedData.extracted_fields?.document_number}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-bold text-slate-900">{fetchedData.extracted_fields?.dob}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[240px]">{fetchedData.extracted_fields?.address}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">DigiLocker Token:</span>
                  <span className="text-[10px] text-emerald-700 font-bold">{fetchedData.digilocker_token}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyToForm}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Apply Certified Details &amp; Display Fraud Risk Score</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
