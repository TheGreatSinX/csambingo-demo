import React, { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';
import { generateBase32Secret, buildOtpAuthUri } from '../../utils/totp';

export const AdminMfaPage: React.FC = () => {
  const { 
    user,
    adminProfile, 
    isAdmin,
    mfaVerified,
    mfaResolver,
    verifyMfaChallenge, 
    enrollTotpMfa,
    resetAdminTotpMfa,
    logout
  } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Generate a fresh Base32 TOTP secret if the administrator hasn't enrolled one yet
  const [pendingSecret, setPendingSecret] = useState<string>(() => generateBase32Secret(20));

  const isEnrolled = !!(
    mfaResolver ||
    (adminProfile?.totpEnrolled && adminProfile?.totpSecret)
  );

  const adminEmail = user?.email || adminProfile?.email || 'juan.delacruz@company.com';

  const otpAuthUri = useMemo(() => {
    return buildOtpAuthUri(adminEmail, pendingSecret, 'Classic Bingo Cyber Edition');
  }, [adminEmail, pendingSecret]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(otpAuthUri)}`;
  }, [otpAuthUri]);

  // Redirect if not signed in as an admin and no active MFA resolver
  if (!isAdmin && !mfaResolver) {
    return <Navigate to="/admin/login" replace />;
  }

  // If MFA is already verified, proceed directly to dashboard
  if (isAdmin && mfaVerified) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleCopySecret = () => {
    sound.playClick();
    navigator.clipboard.writeText(pendingSecret).catch(() => {});
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleRegenerateSecret = () => {
    sound.playClick();
    setPendingSecret(generateBase32Secret(20));
    setCode('');
    setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (cleaned.length < 6) {
      setError('Please enter the 6-digit verification code from your Authenticator app.');
      sound.playError();
      return;
    }

    setLoading(true);
    setError(null);
    sound.playClick();

    try {
      const success = isEnrolled
        ? await verifyMfaChallenge(cleaned)
        : await enrollTotpMfa(pendingSecret, cleaned);

      if (success) {
        sound.playCellMark();
        navigate('/admin/dashboard');
      } else {
        sound.playError();
        setError(
          isEnrolled
            ? 'Invalid 6-digit Authenticator code. Please check the current code on your device.'
            : 'Code mismatch. Scan the QR code or enter the Setup Key in Google Authenticator / Authy, then enter the 6-digit code shown.'
        );
      }
    } catch (err: any) {
      sound.playError();
      setError(err.message || 'MFA validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEnrollment = async () => {
    sound.playClick();
    setError(null);
    setCode('');
    setPendingSecret(generateBase32Secret(20));
    await resetAdminTotpMfa();
  };

  const handleBackToLogin = async () => {
    sound.playClick();
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 cyber-grid-bg">
      <div className="w-full max-w-md bg-[#070c1a] border-2 border-purple-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl cyber-glow-purple text-center">
        
        <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-400 mx-auto mb-3 flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-purple-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-[11px] font-mono text-purple-300 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isEnrolled ? 'SECOND FACTOR CHALLENGE' : 'FIRST-TIME MFA ENROLLMENT'}</span>
        </div>

        <h1 className="font-cyber font-bold text-2xl text-white tracking-wide mb-1">
          {isEnrolled ? 'MFA VERIFICATION' : 'SET UP AUTHENTICATOR MFA'}
        </h1>

        <p className="text-xs font-mono text-slate-400 mb-5">
          {isEnrolled
            ? `Enter the 6-digit code from your Authenticator App for ${adminEmail}.`
            : 'Scan the QR code below with Google Authenticator, Microsoft Authenticator, or Authy to bind MFA to your administrator account.'}
        </p>

        {/* Enrollment QR & Secret Key Card (Shown on first login before MFA is enrolled) */}
        {!isEnrolled && (
          <div className="mb-5 p-4 rounded-xl bg-[#050811] border border-purple-500/30 text-left space-y-3">
            <div className="flex flex-col items-center justify-center">
              <div className="p-2.5 bg-white rounded-xl shadow-lg border-2 border-cyan-400/60 mb-2">
                <img
                  src={qrImageUrl}
                  alt="TOTP Authenticator QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-cyan-400" />
                Scan with Google Authenticator or Authy
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-purple-400" />
                  MANUAL SETUP KEY (BASE32)
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateSecret}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Generate new secret key"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>New Key</span>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-amber-300 tracking-wider break-all flex-1 select-all">
                  {pendingSecret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">
              ENTER 6-DIGIT AUTHENTICATOR CODE
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full bg-[#050811] border-2 border-purple-500/40 rounded-xl px-4 py-3.5 text-center font-mono text-3xl tracking-[0.4em] text-purple-300 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-3.5 rounded-xl font-cyber font-bold tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono text-xs animate-pulse">VERIFYING TOTP TOKEN...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEnrolled ? 'VERIFY MFA & ACCESS CONSOLE' : 'COMPLETE MFA ENROLLMENT & LOGIN'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            ← Cancel & Sign Out
          </button>

          {isEnrolled && !mfaResolver && (
            <button
              type="button"
              onClick={handleResetEnrollment}
              className="text-cyan-400 hover:underline cursor-pointer"
              title="Re-enroll a new Authenticator device"
            >
              Re-configure QR Device
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

