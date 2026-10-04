import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { findGameByPin, createGameRoom, updateGameStatus } from '../services/gameService';
import { DEFAULT_GAME_CONFIG } from '../game/seedData';
import { sound } from '../game/soundEngine';
import { ClassicBingoBall } from '../components/ClassicBingoBall';
import { FloatingBingoBackground } from '../components/FloatingBingoBackground';

type QuickPatternPreset = 'standard' | 'x_pattern' | 'postage' | 'blackout';

export const HomePage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<QuickPatternPreset>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter a 6-digit Bingo Hall PIN.');
      sound.playError();
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter your player nickname.');
      sound.playError();
      return;
    }

    setLoading(true);
    setError(null);
    sound.playClick();

    try {
      const cleanPin = pin.replace(/\D/g, '');
      const game = await findGameByPin(cleanPin);

      if (!game) {
        setError(`No active Bingo game found with PIN ${cleanPin}. Check the code with your Caller.`);
        sound.playError();
        setLoading(false);
        return;
      }

      if (game.status === 'FINISHED' || game.status === 'CANCELLED') {
        setError('This Bingo game has already concluded.');
        sound.playError();
        setLoading(false);
        return;
      }

      localStorage.setItem(`cyber_bingo_nick_${game.id}`, nickname.trim());
      navigate(`/game/${game.id}`);
    } catch (err: any) {
      setError('Connection interrupted. Please check your internet and try again.');
      sound.playError();
    } finally {
      setLoading(false);
    }
  };

  // Play Instant Classic Bingo right now as a Player (with auto-caller)
  const handlePlaySoloWithBots = async () => {
    setLoading(true);
    setError(null);
    sound.playClick();

    try {
      const hostId = `solo_host_${Date.now()}`;
      const cfg = getConfigForPreset(selectedPreset);
      const newGame = await createGameRoom(
        cfg.name,
        cfg,
        hostId,
        'caller@classicbingo.hall'
      );
      await updateGameStatus(newGame.id, 'ACTIVE', hostId);

      const playerName = nickname.trim() || 'Player 1';
      localStorage.setItem(`cyber_bingo_nick_${newGame.id}`, playerName);
      localStorage.setItem(`classic_bingo_solo_${newGame.id}`, 'true');
      navigate(`/game/${newGame.id}`);
    } catch (err: any) {
      console.error(err);
      setError('Could not start game room. Please try again.');
      sound.playError();
    } finally {
      setLoading(false);
    }
  };

  // Launch Host Caller Console for Multiplayer Hall
  const handleHostBingoHall = async () => {
    setLoading(true);
    setError(null);
    sound.playClick();

    try {
      const hostId = `host_${Date.now()}`;
      const cfg = getConfigForPreset(selectedPreset);
      const newGame = await createGameRoom(
        cfg.name,
        cfg,
        hostId,
        'caller@classicbingo.hall'
      );
      navigate(`/host/${newGame.id}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to open Caller Stage. Please try again.');
      sound.playError();
    } finally {
      setLoading(false);
    }
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
            Step into the grand Bingo Hall! Play authentic 75-ball <strong className="text-amber-300">B-I-N-G-O</strong> with real ink daubers, a live voice caller, master flashboard, and classic winning patterns. Play solo right away or host a live room for friends!
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

          {/* Primary Action Buttons: Play Now or Host Stage */}
          <div className="pt-1 flex flex-wrap gap-3.5">
            <button
              onClick={handlePlaySoloWithBots}
              disabled={loading}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black tracking-wide text-base flex items-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>PLAY CLASSIC BINGO NOW</span>
            </button>

            <button
              onClick={handleHostBingoHall}
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
                disabled={loading || pin.length < 4}
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
              Don't have a PIN? Click <strong className="text-amber-300">Play Classic Bingo Now</strong> on the left to play immediately!
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
