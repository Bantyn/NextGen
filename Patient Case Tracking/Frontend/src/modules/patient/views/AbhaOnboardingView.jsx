import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Lock,
  RefreshCw,
  ExternalLink,
  Check,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../core/auth';
import {
  initiateAbhaAPI,
  verifyAbhaOtpAPI,
  linkAbhaAPI,
  getAbhaStatusAPI,
} from '../services/patientDashboardService';

export const AbhaOnboardingView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Resolve target patient ID from query param or session or auth user
  const patientId =
    searchParams.get('patientId') ||
    sessionStorage.getItem('selected_patient_id') ||
    user?.patient_id ||
    user?.id ||
    '';

  // Wizard Steps: 1: CHOOSE_METHOD -> 2: ENTER_IDENTIFIER -> 3: VERIFY_OTP -> 4: CONFIRM_LINK -> 5: SUCCESS
  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState('AADHAAR'); // 'AADHAAR' | 'MOBILE'

  // Form states
  const [identifierInput, setIdentifierInput] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [preferredAddress, setPreferredAddress] = useState('');

  // Transaction & Verification State
  const [txnId, setTxnId] = useState(null);
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [expiresIn, setExpiresIn] = useState(600);
  const [verifiedAbha, setVerifiedAbha] = useState(null);

  // Async UI states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [conflictError, setConflictError] = useState(null);
  const [existingStatus, setExistingStatus] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if patient already has a linked ABHA
  useEffect(() => {
    let isMounted = true;
    if (!patientId) {
      setCheckingExisting(false);
      return;
    }

    getAbhaStatusAPI(patientId)
      .then((res) => {
        if (!isMounted) return;
        if (res?.isLinked) {
          setExistingStatus(res);
          setStep(5); // Jump straight to confirmed linked state
        }
      })
      .catch((err) => {
        console.warn('[ABHA Onboarding] Status check notice:', err.message);
      })
      .finally(() => {
        if (isMounted) setCheckingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Step 1 -> Step 2: Proceed to identifier input
  const handleSelectMethod = (method) => {
    setAuthMethod(method);
    setIdentifierInput('');
    setErrorMessage('');
    setStep(2);
  };

  // Step 2: Request OTP from backend ABDM gateway
  const handleInitiateOtp = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setErrorMessage(
        authMethod === 'AADHAAR'
          ? 'Please enter your 12-digit Aadhaar number'
          : 'Please enter your 10-digit mobile number'
      );
      return;
    }

    if (!consentGiven) {
      setErrorMessage('Consent to authenticate with ABDM is required.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setConflictError(null);

      const res = await initiateAbhaAPI({
        patient_id: patientId,
        auth_method: authMethod,
        identifier: identifierInput.trim().replace(/\s+/g, ''),
        consent: true,
      });

      if (res?.txnId) {
        setTxnId(res.txnId);
        setMaskedIdentifier(res.maskedIdentifier || identifierInput.slice(-4));
        setExpiresIn(res.expiresIn || 600);
        // Default preferred ABHA address suggestion based on patient name or random handle
        const defaultHandle = user?.first_name
          ? `${user.first_name.toLowerCase()}${Math.floor(100 + Math.random() * 900)}@abdm`
          : `health${Math.floor(1000 + Math.random() * 9000)}@abdm`;
        setPreferredAddress(defaultHandle);
        setStep(3);
      } else {
        throw new Error(res?.message || 'Failed to initiate verification with ABDM gateway.');
      }
    } catch (err) {
      console.error('[ABHA Onboarding] Initiate failed:', err);
      setErrorMessage(
        err?.response?.data?.message || err.message || 'Unable to connect to ABDM verification gateway.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit OTP received on your phone.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const res = await verifyAbhaOtpAPI({
        txnId,
        otp: otpInput.trim(),
        preferred_address: preferredAddress.trim(),
      });

      if (res?.abhaNumber) {
        setVerifiedAbha(res);
        setStep(4);
      } else {
        throw new Error(res?.message || 'ABDM OTP verification could not be validated.');
      }
    } catch (err) {
      console.error('[ABHA Onboarding] OTP verification failed:', err);
      setErrorMessage(
        err?.response?.data?.message || err.message || 'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Securely link verified ABHA to existing Patient ID without duplicating records
  const handleConfirmLinking = async () => {
    if (!verifiedAbha?.abhaNumber) {
      setErrorMessage('Verified ABHA details missing. Please re-verify.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setConflictError(null);

      const res = await linkAbhaAPI({
        patient_id: patientId,
        abha_number: verifiedAbha.abhaNumber,
        abha_address: verifiedAbha.abhaAddress,
        verification_method: authMethod,
        metadata: {
          name: verifiedAbha.name,
          gender: verifiedAbha.gender,
          dob: verifiedAbha.dateOfBirth,
        },
      });

      if (res?.success) {
        // Broadcast change so any open dashboard tabs can immediately sync state
        try {
          localStorage.setItem(
            'abha_linked_event',
            JSON.stringify({
              patientId: res.patientId,
              abhaNumber: res.abhaNumber,
              timestamp: Date.now(),
            })
          );
        } catch (_) {}

        setStep(5);
      }
    } catch (err) {
      console.error('[ABHA Onboarding] Linking failed:', err);
      if (err?.response?.status === 409 || err?.response?.data?.error === 'CONFLICT') {
        setConflictError(
          err.response?.data?.message ||
            'This ABHA is already linked to another patient account. Please contact hospital administrator.'
        );
      } else {
        setErrorMessage(
          err?.response?.data?.message || err.message || 'Failed to complete identity linking.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Connecting to ABDM Identity Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* NHA / ABDM Official Header Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-700 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Ayushman Bharat Digital Mission (ABDM)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Official Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500">
                National Health Authority (NHA) • Digital Health Identity Linking
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hospital Profile ID</span>
            <span className="font-mono font-bold text-slate-800">{patientId || 'Unspecified'}</span>
          </div>
        </div>

        {/* Multi-Step Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { num: 1, label: 'Choose Method' },
              { num: 2, label: 'Identity Auth' },
              { num: 3, label: 'OTP Verification' },
              { num: 4, label: 'Link Records' },
            ].map((st) => {
              const isActive = step === st.num;
              const isPast = step > st.num || step === 5;
              return (
                <div key={st.num} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-sky-600'
                        : isPast
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium block truncate ${
                      isActive
                        ? 'text-sky-700 font-bold'
                        : isPast
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.num}. {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Conflict Error Banner (Requirement 6) */}
        {conflictError && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Identity Conflict Detected</span>
            </div>
            <p className="leading-relaxed">{conflictError}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setConflictError(null);
                  setStep(1);
                }}
                className="px-4 py-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold transition cursor-pointer"
              >
                Try with different credentials
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE ONBOARDING METHOD */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Create or Link Your ABHA</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your Ayushman Bharat Health Account (ABHA) connects your digital health identity across all ABDM-compliant healthcare providers in India.
              </p>
            </div>

            {/* Architecture Explainer Badge */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sky-900">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Existing Medical History Is Preserved</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Linking your ABHA will <strong>NOT</strong> duplicate or replace your patient profile (ID: <span className="font-mono font-bold text-slate-800">{patientId}</span>). All your existing appointments, diagnostic lab reports, clinical consultations, and vital readings remain attached to your primary record.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Select Authentication Mode
              </label>

              <div
                onClick={() => handleSelectMethod('AADHAAR')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Authenticate via Aadhaar</h3>
                    <p className="text-xs text-slate-500">
                      Recommended by ABDM • Instant verification via Aadhaar-linked Mobile OTP
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
              </div>

              <div
                onClick={() => handleSelectMethod('MOBILE')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Authenticate via Mobile Number</h3>
                    <p className="text-xs text-slate-500">
                      Verify using OTP sent to your registered 10-digit mobile number
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit ABDM Compliant Encryption</span>
              </span>
              <button
                type="button"
                onClick={() => window.close()}
                className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel & Close
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ENTER IDENTIFIER & CONSENT */}
        {step === 2 && (
          <form
            onSubmit={handleInitiateOtp}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {authMethod === 'AADHAAR' ? 'Enter Aadhaar Number' : 'Enter Mobile Number'}
                </h2>
                <p className="text-xs text-slate-500">
                  {authMethod === 'AADHAAR'
                    ? 'A 6-digit OTP will be sent to the mobile number registered with your Aadhaar.'
                    : 'A 6-digit OTP will be sent to your mobile phone via SMS.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Mode</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {authMethod === 'AADHAAR' ? '12-Digit Aadhaar Identifier' : '10-Digit Mobile Number'}
              </label>
              <input
                type="text"
                maxLength={authMethod === 'AADHAAR' ? 14 : 10}
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder={authMethod === 'AADHAAR' ? 'XXXX XXXX XXXX' : '9876543210'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-400">
                Security notice: We never store your full Aadhaar number in plain text.
              </p>
            </div>

            {/* Explicit ABDM Consent Clause */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I voluntarily give my consent to use my {authMethod === 'AADHAAR' ? 'Aadhaar' : 'Mobile'} details to authenticate with the National Health Authority (NHA) ABDM system for creating/linking my ABHA ID and connecting my healthcare records with this hospital.
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !identifierInput || !consentGiven}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Requesting ABDM Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Generate OTP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: VERIFY OTP */}
        {step === 3 && (
          <form
            onSubmit={handleVerifyOtp}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-950">Verify 6-Digit OTP</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the one-time password sent by ABDM to your number ending in{' '}
                <span className="font-mono font-bold text-slate-800">XXXX-{maskedIdentifier}</span>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Authentication OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Sandbox Test Code: 123456</span>
                  <span>Expires in: {expiresIn}s</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Preferred ABHA Address (PHR Address)
                </label>
                <input
                  type="text"
                  value={preferredAddress}
                  onChange={(e) => setPreferredAddress(e.target.value)}
                  placeholder="username@abdm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This handle acts as your digital health email for receiving lab reports and prescriptions.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otpInput.length < 6}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with ABDM...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: CONFIRM IDENTITY LINKING */}
        {step === 4 && verifiedAbha && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">ABHA Identity Verified</h2>
                <p className="text-xs text-slate-500">
                  Ready to link this verified health account with your hospital medical records.
                </p>
              </div>
            </div>

            {/* Official ABHA Card Summary */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                  ABDM Verified Identity
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                  Active
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ABHA Number</div>
                <div className="text-xl font-mono font-bold text-white tracking-wider">
                  {verifiedAbha.abhaNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400">ABHA Address</div>
                  <div className="font-mono text-sky-300">{verifiedAbha.abhaAddress}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Hospital Internal ID</div>
                  <div className="font-mono text-slate-300">{patientId}</div>
                </div>
              </div>
            </div>

            {/* Architecture Link Assurance Clause */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Single Canonical Patient Identity Maintained</span>
              </div>
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Your internal patient ID (<span className="font-mono font-bold">{patientId}</span>) remains unchanged. Your existing appointments, consultations, vitals, and diagnostic reports will automatically remain attached to your profile and will now be indexed with your ABHA.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmLinking}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Linking Identity to Patient...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Link ABHA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS STATE */}
        {step === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-950">ABHA Linked Successfully!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your Ayushman Bharat Digital Health Account is now securely attached to your hospital patient profile.
              </p>
            </div>

            {/* Linked Credentials Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Verified & Linked
                </span>
              </div>
              <div className="text-xs space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">ABHA Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {verifiedAbha?.abhaNumber || existingStatus?.abhaNumber || 'Verified ABHA'}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">ABHA Address</span>
                <span className="font-mono text-sky-700">
                  {verifiedAbha?.abhaAddress || existingStatus?.abhaAddress || 'Registered PHR'}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">Hospital Patient ID</span>
                <span className="font-mono text-slate-700">{patientId}</span>
              </div>
            </div>

            {/* Medical Records Preservation Notice */}
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your existing clinical consultations, laboratory diagnostic reports, and scheduled appointments remain fully intact and associated with your account.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    navigate('/patient/dashboard');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Go to Patient Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbhaOnboardingView;
