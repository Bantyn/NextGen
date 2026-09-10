import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  QrCode,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { DUMMY_PATIENTS } from '../../../data/patientDashboardData';

export const PatientLoginView = () => {
  const navigate = useNavigate();
  const { loginAsPatient } = useAuth();

  const [loginMethod, setLoginMethod] = useState('ABHA');
  const [identifier, setIdentifier] = useState('91-4432-8812-9901');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const defaultPatient = DUMMY_PATIENTS[0];
      loginAsPatient({
        id: defaultPatient.id,
        name: defaultPatient.name,
        email: defaultPatient.email,
        phone: defaultPatient.phone,
        abhaId: defaultPatient.abhaId,
      });
      setIsSubmitting(false);
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
    navigate('/patient/dashboard');
  };

  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-8 px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ABHA Digital Health Locker</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Patient Portal Login</h1>
          <p className="text-xs text-slate-500">
            Sign in to view your diagnostic reports, consulted doctor history, and live OPD status.
          </p>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Fast-Track Demo Profiles:
            </span>
            <span className="text-[11px] text-sky-600 font-medium">1-Click Sign In</span>
          </div>

          <div className="space-y-2">
            {DUMMY_PATIENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleFastTrackDemo(p)}
                className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 bg-slate-50/70 transition flex items-center justify-between cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-sky-950">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {p.currentToken.department} • Token {p.currentToken.token}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-medium absolute">
            Or Login with ABHA
          </span>
        </div>

        <form onSubmit={otpSent ? handleVerifyAndLogin : handleSendOtp} className="space-y-4 relative z-10">
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
              {loginMethod === 'ABHA' ? 'ABHA Health ID Number' : 'Registered Mobile Number'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {otpSent && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">Enter OTP (Simulated)</label>
                <span className="text-[11px] text-emerald-600 font-medium">Auto: 123456</span>
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
            className="w-full py-2.5 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 underline">
            Healthcare Staff Login
          </Link>
          <Link to="/patient/register" className="text-sky-700 font-medium hover:underline">
            New Patient Intake →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginView;
