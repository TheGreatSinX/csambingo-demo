import React from 'react';

export interface ClassicBingoBallProps {
  value: string | number;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  animated?: boolean;
  className?: string;
}

export function getBallInfo(val: string | number): { letter: string; num: number; colorClass: string; bgGradient: string; textClass: string } {
  let num = typeof val === 'number' ? val : parseInt(val.toString().replace(/\D/g, ''), 10);
  if (isNaN(num)) num = 1;

  if (num <= 15) {
    return {
      letter: 'B',
      num,
      colorClass: 'border-red-400 shadow-red-500/40',
      bgGradient: 'from-red-500 via-red-600 to-rose-800',
      textClass: 'text-red-600',
    };
  }
  if (num <= 30) {
    return {
      letter: 'I',
      num,
      colorClass: 'border-amber-400 shadow-amber-500/40',
      bgGradient: 'from-amber-400 via-amber-500 to-yellow-700',
      textClass: 'text-amber-700',
    };
  }
  if (num <= 45) {
    return {
      letter: 'N',
      num,
      colorClass: 'border-blue-400 shadow-blue-500/40',
      bgGradient: 'from-blue-400 via-blue-600 to-indigo-800',
      textClass: 'text-blue-600',
    };
  }
  if (num <= 60) {
    return {
      letter: 'G',
      num,
      colorClass: 'border-emerald-400 shadow-emerald-500/40',
      bgGradient: 'from-emerald-400 via-emerald-600 to-teal-800',
      textClass: 'text-emerald-700',
    };
  }
  return {
    letter: 'O',
    num,
    colorClass: 'border-purple-400 shadow-purple-500/40',
    bgGradient: 'from-purple-400 via-purple-600 to-fuchsia-800',
    textClass: 'text-purple-700',
  };
}

export const ClassicBingoBall: React.FC<ClassicBingoBallProps> = ({
  value,
  label,
  size = 'md',
  animated = false,
  className = '',
}) => {
  const info = getBallInfo(value);
  const displayLabel = label || `${info.letter}-${info.num}`;

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    giant: 'w-32 h-32 text-4xl',
  };

  const innerPlateSizes = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-10 h-10 text-base',
    xl: 'w-15 h-15 text-xl font-black',
    giant: 'w-20 h-20 text-2xl font-black',
  };

  return (
    <div
      className={`relative rounded-full select-none shrink-0 flex items-center justify-center p-1 font-bold shadow-xl border-2 transition-transform ${sizeClasses[size]} ${info.colorClass} bg-gradient-to-br ${info.bgGradient} ${animated ? 'animate-bounce' : ''} ${className}`}
      style={{
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.3)',
      }}
      title={displayLabel}
    >
      {/* Specular Highlight Sphere Shine */}
      <div className="absolute top-1 left-2 w-1/3 h-1/4 bg-white/40 rounded-full blur-[1px] pointer-events-none transform -rotate-45" />

      {/* Inner White Plate with Ball Number */}
      <div
        className={`rounded-full bg-white flex flex-col items-center justify-center shadow-inner ${innerPlateSizes[size]}`}
      >
        <span className="text-[0.6em] leading-none uppercase tracking-tighter text-slate-500 font-extrabold -mb-0.5">
          {info.letter}
        </span>
        <span className={`leading-none font-black ${info.textClass}`}>
          {info.num}
        </span>
      </div>
    </div>
  );
};
