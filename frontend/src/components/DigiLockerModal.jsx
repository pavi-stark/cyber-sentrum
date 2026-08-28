import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, Loader2, X, FileText, 
  Smartphone, ArrowRight, Sparkles, Building, Key, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function DigiLockerModal({ isOpen, onClose, onDigiLockerSuccess }) {
  const [step, setStep] = useState(1); // 1: Input ID/Phone, 2: OTP, 3: Success Fetch
  const [identifier, setIdentifier] = useState('XXXX XXXX 2227');
  const [docType, setDocType] = useState('AADHAAR');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [fetchedData, setFetchedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMsg('Please enter your Mobile Number or 12-digit Aadhaar number.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.requestDigiLockerOTP(identifier);
      if (res.success) {
        setTransactionId(res.transaction_id);
        setStep(2);
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
    if (!otp) {
      setErrorMsg('Please enter the 6-digit OTP received on your mobile.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.fetchDigiLockerDoc(transactionId, otp, docType);
      if (res.success) {
        setFetchedData(res);
        setStep(3);
      }
    } catch (err) {
      setErrorMsg('OTP verification failed. Please try again.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* DigiLocker Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white relative">
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
                  OFFICIAL GOV
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Direct Government of India Digital KYC & Identity Verification
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Enter Aadhaar / Mobile */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono">
                  Select Document to Fetch
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'AADHAAR', label: 'Aadhaar Card' },
                    { id: 'PAN', label: 'PAN Card' },
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citizen Mobile Number or Aadhaar ID
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter 10-digit mobile or 12-digit Aadhaar..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  A 6-digit OTP will be sent to the UIDAI linked mobile number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting to DigiLocker Server...</span>
                  </>
                ) : (
                  <>
                    <span>Generate DigiLocker OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center space-x-2.5 text-xs text-blue-900 font-bold">
                <Key className="h-4 w-4 text-blue-600 shrink-0" />
                <span>OTP sent to registered mobile for {identifier.slice(-4)}. Enter code:</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit DigiLocker OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-center text-xl tracking-widest font-mono font-bold text-blue-600 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  Demo hint: Enter any 6 digits (e.g. <span className="font-mono font-bold text-blue-600">123456</span>)
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
                  disabled={loading}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Fetching Signed Document...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify & Fetch XML</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Successfully Verified & Fetched */}
          {step === 3 && fetchedData && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-extrabold text-emerald-900">DigiLocker Verified Record</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-600 text-white rounded">
                    DIGITALLY SIGNED
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Document authenticated directly from the Government National Central Vault with SHA-256 RSA digital certificate.
                </p>
              </div>

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
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Apply Verified Details & Complete Screening</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
