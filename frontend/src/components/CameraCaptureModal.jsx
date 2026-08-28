import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, UserCheck, Check, X, Upload } from 'lucide-react';

export default function CameraCaptureModal({
  selfieImage,
  setSelfieImage,
  isScanning
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setCameraError('Webcam access unavailable or permission denied. Please upload a selfie photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setSelfieImage(dataUri);
    stopCamera();
  };

  const handleSelfieUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
            <UserCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">2. Live Biometric Face Capture</h3>
            <p className="text-xs text-slate-500">Live Kiosk Camera / Passenger Selfie</p>
          </div>
        </div>
        {selfieImage && !isCameraActive && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-700 hover:text-blue-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold"
            >
              Upload
            </button>
            <button
              onClick={startCamera}
              className="text-xs text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-semibold"
            >
              Camera
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleSelfieUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="flex-1 flex flex-col justify-center">
        {isCameraActive ? (
          <div className="relative rounded-xl overflow-hidden border border-indigo-500/50 bg-slate-950 flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-[260px] object-cover"
            />
            {/* Facial Oval Alignment Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-36 h-48 rounded-[50%] border-2 border-dashed border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse"></div>
            </div>
            <div className="absolute bottom-3 flex space-x-3">
              <button
                onClick={capturePhoto}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Snap Selfie</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selfieImage ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[300px]">
            <img
              src={selfieImage}
              alt="Passenger Live Face"
              className="max-h-[290px] w-full object-contain rounded-lg"
            />
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_#818cf8] animate-scan"></div>
            )}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded border border-slate-200 text-[11px] font-mono text-indigo-700 font-bold shadow-xs">
              LIVE BIOMETRIC CAPTURED
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center min-h-[220px] transition">
            <div className="p-4 rounded-full bg-white border border-slate-200 text-indigo-600 mb-3 shadow-xs">
              <Camera className="h-6 w-6" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Camera className="h-4 w-4" />
                <span>Start Live Webcam</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Selfie Photo</span>
              </button>
            </div>
            {cameraError && (
              <p className="text-[11px] text-amber-700 mt-3 font-mono">{cameraError}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Facial Biometrics & Anti-Spoofing</span>
        <span className="text-indigo-600 font-mono font-bold">2D-FFT Liveness</span>
      </div>
    </div>
  );
}
