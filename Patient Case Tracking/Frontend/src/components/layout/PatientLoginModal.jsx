import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Phone,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  QrCode,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { DUMMY_PATIENTS } from '../../data/patientDashboardData';

/**
 * PatientLoginModal Component
 * Interactive modal allowing patients to log in via 14-digit ABHA ID, Mobile OTP,
 * or 1-click Demo Patient profiles.
 */
export const PatientLoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { loginAsPatient } = useAuth();

  const [loginMethod, setLoginMethod] = useState('ABHA'); // 'ABHA' | 'PHONE'
  const [identifier, setIdentifier] = useState('91-4432-8812-9901');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
    }, 400);
  };

  const handleVerifyAndLogin = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const selectedPatient = DUMMY_PATIENTS[selectedDemoIndex] || DUMMY_PATIENTS[0];
      loginAsPatient({
        id: selectedPatient.id,
        name: selectedPatient.name,
        email: selectedPatient.email,
        phone: selectedPatient.phone,
        abhaId: selectedPatient.abhaId,
      });
      setIsSubmitting(false);
      onClose();
      navigate('/patient/dashboard');
    }, 400);
  };

  const handleFastTrackDemo = (patient) => {
    loginAsPatient({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      abhaId: patient.abhaId,
    });
    onClose();
    navigate('/patient/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden text-left">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ABDM PHR Gateway</span>
              </span>
              <span className="text-xs text-slate-400">• DPDP Act 2023</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-950">Patient Portal Login</h2>
            <p className="text-xs text-slate-500">
              Access your diagnostic reports, doctor notes, prescriptions, and live token.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fast-Track 1-Click Demo Patient Profiles */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Fast-Track Demo Patient:
            </span>
            <span className="text-[11px] text-sky-600 font-medium">1-Click Sign-In</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DUMMY_PATIENTS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleFastTrackDemo(p)}
                className="p-3 rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 bg-slate-50/60 transition text-left space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center justify-center">
                    {p.name.charAt(0)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-sky-600">
                    {p.currentToken.token}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-sky-950 truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {p.currentToken.department.split('&')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-medium absolute">
            Or Login with Credentials
          </span>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={otpSent ? handleVerifyAndLogin : handleSendOtp} className="space-y-3.5 relative z-10">
          {/* Method selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('ABHA');
                setIdentifier('91-4432-8812-9901');
                setOtpSent(false);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                loginMethod === 'ABHA'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14-Digit ABHA ID
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('PHONE');
                setIdentifier('9876543210');
                setOtpSent(false);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                loginMethod === 'PHONE'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mobile Number
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {loginMethod === 'ABHA' ? 'Ayushman Bharat Health Account (ABHA)' : 'Mobile Number (+91)'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={loginMethod === 'ABHA' ? 'e.g. 91-4432-8812-9901' : 'e.g. 9876543210'}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {otpSent && (
            <div className="space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">Enter OTP Code (Simulated)</label>
                <span className="text-[11px] text-emerald-600">Auto-filled: 123456</span>
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm tracking-widest text-center font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : otpSent ? (
              <>
                <span>Verify OTP & Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Send OTP Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-1">
          Secured with 256-bit encryption • National Health Authority (NHA) certified
        </div>
      </div>
    </div>
  );
};

export default PatientLoginModal;
