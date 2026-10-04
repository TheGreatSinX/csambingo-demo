import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Trophy,
  Volume2,
  Grid,
  Users,
  X,
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { findGameByPin, findActiveHostedGame, createGameRoom } from '../services/gameService';
import { DEFAULT_GAME_CONFIG } from '../game/seedData';
import { sound } from '../game/soundEngine';
import { ClassicBingoBall } from '../components/ClassicBingoBall';
import { FloatingBingoBackground } from '../components/FloatingBingoBackground';
import { useAuth } from '../context/AuthContext';
import { generateBase32Secret, buildOtpAuthUri } from '../utils/totp';

type QuickPatternPreset = 'standard' | 'x_pattern' | 'postage' | 'blackout';

export const HomePage: React.FC = () => {
  // Inline card PIN & Nickname state
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<QuickPatternPreset>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Glassmorphic Light-Blue Modal for "PLAY CLASSIC BINGO NOW" (6-Digit Room PIN)
  const [showPinModal, setShowPinModal] = useState(false);
  const [modalPin, setModalPin] = useState('');
  const [modalNickname, setModalNickname] = useState('');
  const [modalPinError, setModalPinError] = useState<string | null>(null);

  // 2. Glassmorphic Light-Blue Modal for "HOST LIVE BINGO HALL (CALLER)" (Admin MFA + Single Host)
  const [showHostMfaModal, setShowHostMfaModal] = useState(false);
  const [hostStep, setHostStep] = useState<'credentials' | 'mfa'>('credentials');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [hostModalError, setHostModalError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const {
    user,
    isAdmin,
    adminProfile,
    mfaVerified,
    loginWithEmail,
    verifyMfaChallenge,
    enrollTotpMfa
  } = useAuth();

  const navigate = useNavigate();

  // Ephemeral TOTP secret in case an admin has not enrolled Authenticator yet
  const enrollmentSecret = useMemo(() => generateBase32Secret(32), [user?.uid]);
  const isAlreadyEnrolled = Boolean(adminProfile?.totpEnrolled && adminProfile?.totpSecret);
  const otpAuthUri = useMemo(() => {
    const accountLabel = user?.email || adminProfile?.email || adminEmail || 'juan.delacruz@company.com';
    return buildOtpAuthUri(accountLabel, enrollmentSecret, 'Classic Bingo Cyber Edition');
  }, [enrollmentSecret, user?.email, adminProfile?.email, adminEmail]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(otpAuthUri)}`;
  }, [otpAuthUri]);

  const getConfigForPreset = (preset: QuickPatternPreset) => {
    const base = {
      ...DEFAULT_GAME_CONFIG,
      draw: {
        ...DEFAULT_GAME_CONFIG.draw,
        contentType: 'numbers' as const,
        numberRangeMin: 1,
        numberRangeMax: 75,
      },
      board: {
        ...DEFAULT_GAME_CONFIG.board,
        rows: 5,
        columns: 5,
        freeSpace: true,
        freeSpaceLabel: '★ FREE ★',
      },
    };

    if (preset === 'x_pattern') {
      return {
        ...base,
        name: 'CLASSIC BINGO — BIG X',
        winningPatterns: ['pattern-x-mode'],
      };
    }
    if (preset === 'postage') {
      return {
        ...base,
        name: 'CLASSIC BINGO — POSTAGE STAMP & 4 CORNERS',
        winningPatterns: ['pattern-postage-stamp', 'pattern-four-corners'],
      };
    }
    if (preset === 'blackout') {
      return {
        ...base,
        name: 'CLASSIC BINGO — FULL CARD BLACKOUT',
        winningPatterns: ['pattern-blackout'],
      };
    }
    return {
      ...base,
      name: 'CLASSIC 75-BALL BINGO',
      winningPatterns: [
        'pattern-horizontal',
        'pattern-vertical',
        'pattern-diagonal',
        'pattern-four-corners',
      ],
    };
  };

  // Shared helper to validate a 6-digit Room PIN and join the hall
  const joinRoomWithPin = async (rawPin: string, rawNickname: string, setErr: (msg: string | null) => void) => {
    const cleanPin = rawPin.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setErr('Please enter a valid 6-digit Room PIN.');
      sound.playError();
      return;
    }
    const finalNickname = rawNickname.trim() || `Player_${Math.floor(100 + Math.random() * 900)}`;

    setLoading(true);
    setErr(null);
    sound.playClick();

    try {
      const game = await findGameByPin(cleanPin);

      if (!game) {
        setErr(`No active Bingo Hall found with 6-Digit PIN ${cleanPin}. Please verify the PIN with your Host Caller.`);
        sound.playError();
        setLoading(false);
        return;
      }

      if (game.status === 'FINISHED' || game.status === 'CANCELLED') {
        setErr('This Bingo game has already concluded.');
        sound.playError();
        setLoading(false);
        return;
      }

      localStorage.setItem(`cyber_bingo_nick_${game.id}`, finalNickname);
      setShowPinModal(false);
      navigate(`/game/${game.id}`);
    } catch (err: any) {
      setErr('Connection interrupted. Please check your internet and try again.');
      sound.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter your player nickname.');
      sound.playError();
      return;
    }
    await joinRoomWithPin(pin, nickname, setError);
  };

  // 1. Clicking "PLAY CLASSIC BINGO NOW" opens the Glassmorphic Light-Blue 6-Digit PIN Modal
  const handleOpenPlayPinModal = () => {
    sound.playClick();
    setModalPin(pin);
    setModalNickname(nickname);
    setModalPinError(null);
    setShowPinModal(true);
  };

  const handleModalPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinRoomWithPin(modalPin, modalNickname, setModalPinError);
  };

  // 2. Clicking "HOST LIVE BINGO HALL (CALLER)" opens the Glassmorphic Light-Blue Admin MFA Modal
  const handleOpenHostMfaModal = () => {
    sound.playClick();
    setHostModalError(null);
    setMfaCode('');
    if (user && isAdmin) {
      setHostStep('mfa');
    } else {
      setHostStep('credentials');
    }
    setShowHostMfaModal(true);
  };

  // Step 1 inside Host Modal: Verify Admin Email & Password -> Proceed to MFA
  const handleHostCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHostModalError(null);
    setLoading(true);
    sound.playClick();

    try {
      await loginWithEmail(adminEmail.trim(), adminPassword);
      setHostStep('mfa');
    } catch (err: any) {
      sound.playError();
      setHostModalError(
        err?.message || 'Invalid Administrator credentials. Only authorized Administrators can host a Live Bingo Hall.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 inside Host Modal: Verify 6-Digit MFA Code & Enforce Single Host at a Time
  const handleHostMfaVerifyAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = mfaCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setHostModalError('Please enter a valid 6-digit MFA Authenticator code.');
      sound.playError();
      return;
    }

    setLoading(true);
    setHostModalError(null);
    sound.playClick();

    try {
      const ok = isAlreadyEnrolled
        ? await verifyMfaChallenge(cleanCode)
        : await enrollTotpMfa(enrollmentSecret, cleanCode);

      if (!ok) {
        sound.playError();
        setHostModalError('Invalid 6-digit MFA code. Please check your Authenticator app and try again.');
        setLoading(false);
        return;
      }

      // Enforce Single Host at a Time: Check if an active Bingo Hall is already open
      const existingActiveGame = await findActiveHostedGame();
      const currentAdminUid = user?.uid || adminProfile?.id || 'admin_host';
      const currentAdminEmail = user?.email || adminProfile?.email || adminEmail;

      if (existingActiveGame) {
        // If this administrator is already the host, resume that hall; otherwise block or connect to single active hall
        if (
          existingActiveGame.hostId === currentAdminUid ||
          (existingActiveGame.hostEmail &&
            currentAdminEmail &&
            existingActiveGame.hostEmail.toLowerCase() === currentAdminEmail.toLowerCase())
        ) {
          setShowHostMfaModal(false);
          navigate(`/host/${existingActiveGame.id}`);
          return;
        } else {
          sound.playError();
          setHostModalError(
            `Only one Host is allowed at a time. Active Hall "${existingActiveGame.title}" (PIN: ${existingActiveGame.pin}) is currently being hosted. Please end that session first or resume it from the Admin Console.`
          );
          setLoading(false);
          return;
        }
      }

      const cfg = getConfigForPreset(selectedPreset);
      const newGame = await createGameRoom(
        cfg.name,
        cfg,
        currentAdminUid,
        currentAdminEmail || 'admin@company.com'
      );

      setShowHostMfaModal(false);
      navigate(`/host/${newGame.id}`);
    } catch (err: any) {
      console.error(err);
      sound.playError();
      setHostModalError('Failed to verify MFA or open Caller Stage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(enrollmentSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#0b0e1a] via-[#11162b] to-[#090b14]">
      {/* Floating 3D Bingo Objects Background (Crowned Balls, Fanned Cards, Gold Coins, Prize Wheel) */}
      <FloatingBingoBackground />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Classic Bingo Hero & Instant Play */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Decorative 3D Bingo Balls Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <ClassicBingoBall value={7} size="md" />
            <ClassicBingoBall value={22} size="md" />
            <ClassicBingoBall value={38} size="md" />
            <ClassicBingoBall value={54} size="md" />
            <ClassicBingoBall value={71} size="md" />
            <span className="ml-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-bold text-amber-300 tracking-wide">
              ★ OFFICIAL 75-BALL HALL
            </span>
          </div>

          <h1 className="font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
            THE CLASSIC <br />
            <span className="inline-flex items-start gap-2 flex-wrap">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
                BINGO GAME
              </span>
              <sup className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 shadow-md mt-1 sm:mt-1.5 select-none">
                Cyber Edition
              </sup>
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
            Step into the grand Bingo Hall! Play authentic 75-ball <strong className="text-amber-300">B-I-N-G-O</strong> with real ink daubers, a live voice caller, master flashboard, and classic winning patterns. Enter your 6-digit Room PIN or host an official hall!
          </p>

          {/* Winning Pattern Selector */}
          <div className="bg-[#12182e]/90 border border-amber-500/25 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Grid className="w-4 h-4" />
              <span>Select Winning Game Pattern:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'standard', label: 'Any Line / 4 Corners', sub: 'Row, Col, Diag' },
                { id: 'postage', label: 'Postage Stamp', sub: '2x2 Corner / 4 Corners' },
                { id: 'x_pattern', label: 'Big X Pattern', sub: 'Both Diagonals' },
                { id: 'blackout', label: 'Full Blackout', sub: 'All 25 Squares' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedPreset(item.id as QuickPatternPreset);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPreset === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold leading-snug">{item.label}</div>
                  <div className="text-[10px] text-amber-300/80 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons: Play Now (Opens PIN Modal) or Host Stage (Opens Admin MFA Modal) */}
          <div className="pt-1 flex flex-wrap gap-3.5">
            <button
              onClick={handleOpenPlayPinModal}
              disabled={loading}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black tracking-wide text-base flex items-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>PLAY CLASSIC BINGO NOW</span>
            </button>

            <button
              onClick={handleOpenHostMfaModal}
              disabled={loading}
              className="px-5 py-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/50 text-emerald-300 font-bold tracking-wide text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>HOST LIVE BINGO HALL (CALLER)</span>
            </button>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>B-I-N-G-O (1–75) Cards</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-xl">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live Voice Caller</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-xl">
              <Trophy className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Custom Ink Daubers</span>
            </div>
          </div>
        </div>

        {/* Right Column: Join Multiplayer Bingo Room by PIN */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#12172b]/95 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Header Tag */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2 text-amber-400">
                <Users className="w-5 h-5" />
                <span className="font-extrabold text-sm tracking-wider uppercase">JOIN MULTIPLAYER HALL</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                LIVE ROOMS
              </span>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-5">
              {/* Nickname Field */}
              <div>
                <label htmlFor="callsign" className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  YOUR PLAYER NAME
                </label>
                <input
                  id="callsign"
                  type="text"
                  maxLength={24}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Grandma Rose, LuckyJack"
                  className="w-full bg-[#090d1a] border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Game PIN Field */}
              <div>
                <label htmlFor="gamePin" className="block text-xs font-bold text-amber-300 mb-2 uppercase tracking-wider">
                  6-DIGIT ROOM PIN (FROM HOST)
                </label>
                <div className="relative">
                  <input
                    id="gamePin"
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="482913"
                    className="w-full bg-[#090d1a] border-2 border-amber-500/40 rounded-xl px-4 py-3.5 text-center font-mono font-black text-2xl tracking-[0.3em] text-amber-300 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                  <div className="absolute right-3.5 top-4 text-slate-500 font-mono text-xs">
                    {pin.length}/6
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <button
                type="submit"
                disabled={loading || pin.length < 6}
                className="w-full py-4 rounded-xl font-black tracking-wider text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="text-xs tracking-wider animate-pulse">GETTING YOUR BINGO CARD...</span>
                ) : (
                  <>
                    <span>JOIN WITH ROOM PIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
              Ready to play? Click <strong className="text-amber-300">Play Classic Bingo Now</strong> and enter your 6-digit Room PIN!
            </div>
          </div>
        </div>

      </div>

      {/* =====================================================================
          MODAL 1: GLASSMORPHIC LIGHT-BLUE 6-DIGIT ROOM PIN MODAL (PLAYER)
         ===================================================================== */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/60 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-sky-400/25 via-cyan-500/20 to-blue-600/25 backdrop-blur-2xl border-2 border-sky-300/50 shadow-[0_0_60px_rgba(56,189,248,0.35)] p-6 sm:p-8 text-white overflow-hidden">
            {/* Ambient light-blue glass highlights */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 rounded-full bg-sky-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-cyan-400/25 blur-3xl" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-sky-950/50 hover:bg-sky-900/70 border border-sky-300/40 text-sky-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-400/25 border-2 border-sky-200/60 flex items-center justify-center mx-auto shadow-lg shadow-sky-400/25">
                <Play className="w-7 h-7 text-sky-100 fill-sky-100" />
              </div>
              <h2 id="pin-modal-title" className="text-2xl font-black tracking-wide text-white drop-shadow">
                ENTER 6-DIGIT ROOM PIN
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/90">
                Enter your player name and the 6-digit Bingo Hall PIN announced by the Host Caller to receive your official card.
              </p>
            </div>

            {modalPinError && (
              <div className="relative z-10 mb-4 p-3 rounded-xl bg-red-950/80 border border-red-400/60 text-red-100 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span>{modalPinError}</span>
              </div>
            )}

            <form onSubmit={handleModalPinSubmit} className="relative z-10 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-100 mb-1.5">
                  YOUR PLAYER NICKNAME
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={modalNickname}
                  onChange={(e) => setModalNickname(e.target.value)}
                  placeholder="e.g. LuckyPlayer"
                  className="w-full rounded-xl bg-sky-950/60 border border-sky-300/50 px-4 py-3 text-sm font-semibold text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-100 mb-1.5">
                  6-DIGIT ROOM PIN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={modalPin}
                  onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-2xl bg-sky-950/75 border-2 border-sky-200/70 px-4 py-4 text-center font-mono font-black text-3xl tracking-[0.35em] text-sky-100 placeholder:text-sky-300/30 focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
                />
                <div className="text-right text-[11px] font-mono text-sky-200/80 mt-1">
                  {modalPin.length}/6 digits
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || modalPin.length !== 6}
                className="w-full py-4 rounded-2xl font-black tracking-wider text-sm text-slate-950 bg-gradient-to-r from-sky-200 via-cyan-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-xl shadow-sky-400/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-pulse">VERIFYING ROOM PIN...</span>
                ) : (
                  <>
                    <span>ENTER BINGO HALL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: GLASSMORPHIC LIGHT-BLUE ADMIN MFA MODAL FOR HOST CALLER STAGE
          (Only Admin can be the only Host & only one Host at a time)
         ===================================================================== */}
      {showHostMfaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/65 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="host-mfa-modal-title"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-sky-400/25 via-cyan-500/20 to-blue-600/25 backdrop-blur-2xl border-2 border-sky-300/55 shadow-[0_0_65px_rgba(56,189,248,0.4)] p-6 sm:p-8 text-white overflow-hidden">
            {/* Ambient light-blue glass highlights */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-56 h-56 rounded-full bg-sky-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-cyan-400/25 blur-3xl" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowHostMfaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-sky-950/50 hover:bg-sky-900/70 border border-sky-300/40 text-sky-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 text-center space-y-2 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-sky-400/25 border-2 border-sky-200/60 flex items-center justify-center mx-auto shadow-lg shadow-sky-400/25">
                <ShieldCheck className="w-7 h-7 text-sky-100" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-950/70 border border-sky-300/50 text-[10px] font-mono font-bold uppercase tracking-widest text-sky-200">
                SINGLE-HOST ADMIN SECURITY GATE
              </div>
              <h2 id="host-mfa-modal-title" className="text-xl sm:text-2xl font-black tracking-wide text-white">
                HOST CALLER MFA VERIFICATION
              </h2>
              <p className="text-xs text-sky-100/90 leading-relaxed">
                Only an authorized Administrator can host the Live Bingo Hall, and only one active Host is permitted at a time.
              </p>
            </div>

            {hostModalError && (
              <div className="relative z-10 mb-4 p-3 rounded-xl bg-red-950/85 border border-red-400/60 text-red-100 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span>{hostModalError}</span>
              </div>
            )}

            {hostStep === 'credentials' ? (
              <form onSubmit={handleHostCredentialsSubmit} className="relative z-10 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-100 mb-1">
                    AUTHORIZED ADMIN EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="juan.delacruz@company.com"
                    className="w-full rounded-xl bg-sky-950/65 border border-sky-300/50 px-4 py-3 text-sm text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-100 mb-1">
                    ADMIN PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl bg-sky-950/65 border border-sky-300/50 px-4 py-3 text-sm text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-black tracking-wider text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-sky-200 via-cyan-200 to-emerald-300 hover:from-white hover:to-emerald-200 shadow-xl shadow-sky-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'VERIFYING ADMIN...' : 'VERIFY & PROCEED TO MFA'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleHostMfaVerifyAndLaunch} className="relative z-10 space-y-4">
                {/* Signed-in Admin badge */}
                <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-300/40 flex items-center justify-between text-xs">
                  <span className="text-sky-200 font-mono truncate">
                    Admin: <b className="text-white">{user?.email || adminProfile?.email || adminEmail}</b>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-300/40 text-[10px] font-bold text-emerald-200">
                    {adminProfile?.role || 'ADMIN'}
                  </span>
                </div>

                {/* Show QR setup if this Admin has not enrolled TOTP yet */}
                {!isAlreadyEnrolled && (
                  <div className="p-3 rounded-2xl bg-sky-950/70 border border-sky-300/40 space-y-2 text-center">
                    <div className="text-[11px] font-bold text-sky-200 flex items-center justify-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>SCAN IN GOOGLE / MICROSOFT AUTHENTICATOR</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl inline-block mx-auto">
                      <img
                        src={qrCodeUrl}
                        alt="TOTP QR Code"
                        className="w-32 h-32 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-sky-100">
                      <span className="truncate max-w-[180px]">{enrollmentSecret}</span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-1 rounded bg-sky-800/60 hover:bg-sky-700 text-sky-100 cursor-pointer"
                        title="Copy Secret Key"
                      >
                        {copiedSecret ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-100 mb-1.5 flex items-center justify-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-200" />
                    <span>6-DIGIT AUTHENTICATOR MFA CODE</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-2xl bg-sky-950/75 border-2 border-sky-200/70 px-4 py-3.5 text-center font-mono font-black text-3xl tracking-[0.35em] text-sky-100 placeholder:text-sky-300/30 focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-4 rounded-2xl font-black tracking-wider text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-sky-200 via-cyan-200 to-emerald-300 hover:from-white hover:to-emerald-200 shadow-xl shadow-sky-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {loading ? 'VERIFYING MFA & CHECKING HOST LOCK...' : 'VERIFY MFA & LAUNCH CALLER STAGE'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

