import React, { useEffect } from 'react';
import { Trophy, Award, Zap, CheckCircle2, X } from 'lucide-react';
import { fireCyberConfetti } from './ConfettiEffect';
import { sound } from '../game/soundEngine';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerNickname: string;
  patternName: string;
  scoreAwarded: number;
  rank: number;
  isSelf: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  onClose,
  winnerNickname,
  patternName,
  scoreAwarded,
  rank,
  isSelf,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playBingoVictory();
      fireCyberConfetti();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rankBadges: Record<number, { text: string; color: string; border: string }> = {
    1: { text: '1ST PLACE BINGO', color: 'from-amber-400 to-yellow-500', border: 'border-yellow-400' },
    2: { text: '2ND PLACE BINGO', color: 'from-slate-200 to-slate-400', border: 'border-slate-300' },
    3: { text: '3RD PLACE BINGO', color: 'from-amber-600 to-amber-800', border: 'border-amber-600' },
  };

  const badge = rankBadges[rank] || {
    text: `WINNER #${rank}`,
    color: 'from-cyan-400 to-blue-500',
    border: 'border-cyan-400',
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div 
        className={`relative w-full max-w-lg bg-[#070c1a] border-2 ${badge.border} rounded-2xl p-6 sm:p-8 text-center cyber-glow-cyan shadow-2xl overflow-hidden`}
      >
        {/* Subtle Cyber scanline background */}
        <div className="absolute inset-0 pointer-events-none cyber-grid-bg opacity-30" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close winner celebration modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Visual Header */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center animate-pulse">
          <Trophy className="w-10 h-10 text-cyan-300 animate-bounce" />
        </div>

        {/* Rank Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-cyan-300 mb-3 tracking-widest uppercase">
          <Award className="w-3.5 h-3.5 text-yellow-400" />
          <span>{badge.text}</span>
        </div>

        {/* Main Banner Headline */}
        <h2 
          id="winner-title"
          className="font-cyber font-extrabold text-3xl sm:text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-green-300 to-emerald-400 mb-2 uppercase"
        >
          {isSelf ? 'BINGO ACHIEVED!' : 'BINGO DETECTED!'}
        </h2>

        {/* Nickname */}
        <div className="text-xl sm:text-2xl font-cyber text-slate-100 font-semibold mb-4 tracking-wide">
          {winnerNickname}
        </div>

        {/* Winning Pattern & Points Breakdown */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 mb-6 space-y-2 text-left">
          <div className="flex justify-between items-center text-sm font-mono border-b border-slate-800 pb-2">
            <span className="text-slate-400">Winning Pattern:</span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400 inline" />
              {patternName}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-slate-800 pb-2">
            <span className="text-slate-400">Validation Status:</span>
            <span className="text-cyan-400 font-bold">AUTHORITATIVE VALIDATED</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono pt-1">
            <span className="text-slate-400">Score Awarded:</span>
            <span className="text-xl text-yellow-400 font-bold flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              +{scoreAwarded} PTS
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-xl font-cyber font-bold tracking-wider text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-green-400 hover:from-cyan-300 hover:to-green-300 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          RETURN TO OPERATIONS GRID
        </button>
      </div>
    </div>
  );
};
