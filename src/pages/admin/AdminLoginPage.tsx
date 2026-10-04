import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loginWithEmail, loginWithGoogle, isAdmin, mfaVerified } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and MFA verified, redirect to dashboard
  if (isAdmin && mfaVerified) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide an authorized administrator email and password.');
      sound.playError();
      return;
    }

    setSubmitting(true);
    setError(null);
    sound.playClick();

    try {
      const res = await loginWithEmail(email, password);
      if (res.requiresMfa) {
        navigate('/admin/mfa');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      sound.playError();
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid administrator credentials.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Access denied: This email is not registered on the Administrator allowlist.');
      } else {
        setError(err.message || 'Authentication failed. Only pre-authorized administrators can sign in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    sound.playClick();
    try {
      await loginWithGoogle();
      navigate('/admin/dashboard');
    } catch (err: any) {
      sound.playError();
      setError(err.message || 'Google sign-in was cancelled or denied by the Administrator allowlist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 cyber-grid-bg">
      <div className="w-full max-w-md bg-[#070c1a] border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl cyber-glow-purple relative overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
          <div className="flex items-center gap-2 text-purple-400">
            <Lock className="w-4 h-4" />
            <span className="font-mono text-xs tracking-wider font-bold text-amber-300">CLASSIC BINGO</span>
            <sup className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 select-none">
              Cyber Edition
            </sup>
          </div>
          <span className="text-[10px] font-mono text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-500/40">
            ALLOWLIST + MFA
          </span>
        </div>

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 mx-auto mb-3 flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            ADMINISTRATOR ACCESS
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Restricted Portal • Pre-Authorized Administrators Only
          </p>
        </div>

        {/* Strict Zero Sign-Up Security Banner */}
        <div className="mb-5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-[11px] font-mono flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Public Account Creation Disabled:</span> Self-registration is blocked. Unlisted accounts attempting SSO or credential sign-in are automatically rejected and logged.
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Google SSO Button for Authorized Admin */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-200" />
            <span>SIGN IN WITH AUTHORIZED GOOGLE ACCOUNT</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] font-mono uppercase">
            <span className="bg-[#070c1a] px-3 text-slate-500">OR PROVISIONED ADMIN CREDENTIALS</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 tracking-wider">
              AUTHORIZED ADMIN EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.delacruz@company.com"
              className="w-full bg-[#050811] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 tracking-wider">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#050811] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-cyber font-bold tracking-wider text-xs text-purple-200 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="font-mono text-xs">VERIFYING ALLOWLIST...</span>
            ) : (
              <>
                <span>VERIFY & PROCEED TO MFA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            ← Return to Public Game Portal
          </button>
        </div>

      </div>
    </div>
  );
};
