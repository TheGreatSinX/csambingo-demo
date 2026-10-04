import React from 'react';
import { BingoCell } from '../game/gameTypes';
import { Star } from 'lucide-react';
import { sound } from '../game/soundEngine';

export interface DauberColor {
  id: string;
  name: string;
  inkClass: string;
  ringClass: string;
  swatchClass: string;
}

export const DAUBER_COLORS: DauberColor[] = [
  {
    id: 'crimson',
    name: 'Cherry Red',
    inkClass: 'bg-red-500/75 text-white',
    ringClass: 'ring-4 ring-red-400/80 shadow-red-500/50',
    swatchClass: 'bg-red-500',
  },
  {
    id: 'amber',
    name: 'Golden Honey',
    inkClass: 'bg-amber-400/80 text-slate-950 font-black',
    ringClass: 'ring-4 ring-amber-300/80 shadow-amber-400/50',
    swatchClass: 'bg-amber-400',
  },
  {
    id: 'emerald',
    name: 'Lucky Emerald',
    inkClass: 'bg-emerald-500/75 text-white',
    ringClass: 'ring-4 ring-emerald-400/80 shadow-emerald-500/50',
    swatchClass: 'bg-emerald-500',
  },
  {
    id: 'royal',
    name: 'Royal Blue',
    inkClass: 'bg-blue-600/75 text-white',
    ringClass: 'ring-4 ring-blue-400/80 shadow-blue-500/50',
    swatchClass: 'bg-blue-500',
  },
  {
    id: 'magenta',
    name: 'Neon Magenta',
    inkClass: 'bg-fuchsia-500/75 text-white',
    ringClass: 'ring-4 ring-fuchsia-400/80 shadow-fuchsia-500/50',
    swatchClass: 'bg-fuchsia-500',
  },
  {
    id: 'cyan',
    name: 'Vivid Cyan',
    inkClass: 'bg-cyan-400/80 text-slate-950 font-black',
    ringClass: 'ring-4 ring-cyan-300/80 shadow-cyan-400/50',
    swatchClass: 'bg-cyan-400',
  },
];

interface ClassicBingoCardProps {
  card: BingoCell[][];
  markedKeys: Set<string>;
  drawnValuesSet: Set<string>;
  onCellClick: (cell: BingoCell) => void;
  cardIndex?: number;
  dauberColor?: DauberColor;
  highlightMatches?: boolean;
  disabled?: boolean;
}

export const ClassicBingoCard: React.FC<ClassicBingoCardProps> = ({
  card,
  markedKeys,
  drawnValuesSet,
  onCellClick,
  cardIndex = 1,
  dauberColor = DAUBER_COLORS[0],
  highlightMatches = true,
  disabled = false,
}) => {
  const colHeaders = [
    { letter: 'B', bg: 'bg-red-600 text-white', border: 'border-red-400/60' },
    { letter: 'I', bg: 'bg-amber-500 text-slate-950 font-black', border: 'border-amber-400/60' },
    { letter: 'N', bg: 'bg-blue-600 text-white', border: 'border-blue-400/60' },
    { letter: 'G', bg: 'bg-emerald-600 text-white', border: 'border-emerald-400/60' },
    { letter: 'O', bg: 'bg-purple-600 text-white', border: 'border-purple-400/60' },
  ];

  return (
    <div className="bg-[#11162b] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md max-w-md mx-auto select-none">
      {/* Card Header Tag */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300/80 font-bold">
          BINGO CARD #{cardIndex}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span>75-BALL CLASSIC</span>
        </div>
      </div>

      {/* Iconic B - I - N - G - O Column Headers */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        {colHeaders.map((col) => (
          <div
            key={col.letter}
            className={`py-2 text-center rounded-xl font-black text-xl sm:text-2xl shadow-lg border ${col.bg} ${col.border}`}
          >
            {col.letter}
          </div>
        ))}
      </div>

      {/* 5x5 Grid Cells */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {card.map((rowCells, r) =>
          rowCells.map((cell, c) => {
            const key = `${r}_${c}`;
            const isMarked = cell.isFree || markedKeys.has(key);
            const isDrawn = !cell.isFree && drawnValuesSet.has(cell.value.trim().toUpperCase());
            const needsDaub = !cell.isFree && isDrawn && !isMarked && highlightMatches;

            return (
              <button
                key={cell.id || key}
                type="button"
                onClick={() => {
                  if (!disabled) onCellClick(cell);
                }}
                disabled={disabled}
                className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all duration-150 border cursor-pointer ${
                  cell.isFree
                    ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/25 to-amber-600/30 border-amber-400/80 text-amber-300 shadow-md ring-2 ring-amber-400/50'
                    : isMarked
                    ? 'bg-slate-900/90 border-slate-700'
                    : needsDaub
                    ? 'bg-amber-950/40 border-amber-400 animate-pulse ring-2 ring-amber-400/60 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                {/* Free space star and label */}
                {cell.isFree ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-300 animate-spin-slow" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-amber-200 mt-0.5">
                      FREE
                    </span>
                  </div>
                ) : (
                  <>
                    {/* The Number */}
                    <span className="font-extrabold text-base sm:text-xl tracking-tight text-white z-0">
                      {cell.displayLabel}
                    </span>

                    {/* Needs Daub Indicator Pulse */}
                    {needsDaub && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-ping" />
                    )}
                  </>
                )}

                {/* Ink Dauber Stamp Overlay */}
                {isMarked && !cell.isFree && (
                  <div
                    className={`absolute inset-1 sm:inset-1.5 rounded-full flex items-center justify-center shadow-lg transform scale-105 pointer-events-none transition-all duration-200 ${dauberColor.inkClass} ${dauberColor.ringClass}`}
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 3px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Dauber Stamp Number Accent */}
                    <span className="font-black text-sm sm:text-base opacity-95">
                      {cell.displayLabel}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
