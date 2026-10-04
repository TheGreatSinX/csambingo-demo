import React from 'react';
import { DrawItem } from '../game/gameTypes';
import { getBallInfo } from './ClassicBingoBall';

interface ClassicFlashboardProps {
  draws: DrawItem[];
  compact?: boolean;
}

export const ClassicFlashboard: React.FC<ClassicFlashboardProps> = ({ draws, compact = false }) => {
  const drawnNumbersSet = new Set<number>();
  draws.forEach((d) => {
    const n = parseInt(d.value.replace(/\D/g, ''), 10);
    if (!isNaN(n)) drawnNumbersSet.add(n);
  });

  const latestDraw = draws[draws.length - 1];
  const latestNum = latestDraw ? parseInt(latestDraw.value.replace(/\D/g, ''), 10) : null;

  const rows = [
    { letter: 'B', min: 1, max: 15, bg: 'bg-red-600', text: 'text-red-400', border: 'border-red-500/40' },
    { letter: 'I', min: 16, max: 30, bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40' },
    { letter: 'N', min: 31, max: 45, bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/40' },
    { letter: 'G', min: 46, max: 60, bg: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    { letter: 'O', min: 61, max: 75, bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500/40' },
  ];

  return (
    <div className="bg-[#0b1021] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
            MASTER FLASHBOARD
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          <span className="font-bold text-amber-400">{draws.length}</span> / 75 CALLED
        </div>
      </div>

      {/* Grid of B - I - N - G - O rows */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.letter} className="flex items-center gap-1.5 sm:gap-2">
            {/* Column Letter Badge */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg ${row.bg} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md`}
            >
              {row.letter}
            </div>

            {/* Numbers 15 in this row */}
            <div className="grid grid-cols-15 gap-1 flex-1">
              {Array.from({ length: 15 }, (_, i) => row.min + i).map((num) => {
                const isDrawn = drawnNumbersSet.has(num);
                const isLatest = latestNum === num;

                return (
                  <div
                    key={num}
                    className={`aspect-square flex items-center justify-center rounded text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                      isLatest
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50 scale-110 ring-2 ring-white z-10 font-extrabold animate-pulse'
                        : isDrawn
                        ? `${row.bg} text-white shadow-md font-bold`
                        : 'bg-slate-900/60 text-slate-600 border border-slate-800/80 hover:text-slate-400'
                    }`}
                    title={`${row.letter}-${num}${isDrawn ? ' (Called)' : ''}`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
