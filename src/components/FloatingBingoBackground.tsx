import React from 'react';

interface FloatingBallProps {
  number: number | string;
  color: 'blue' | 'red' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'pink';
  size?: number;
  crowned?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BALL_GRADIENTS: Record<FloatingBallProps['color'], { main: string; rim: string; shadow: string }> = {
  blue: {
    main: 'radial-gradient(circle at 32% 28%, #60a5fa 0%, #2563eb 48%, #1e3a8a 88%, #0f172a 100%)',
    rim: '#3b82f6',
    shadow: 'rgba(37, 99, 235, 0.45)',
  },
  red: {
    main: 'radial-gradient(circle at 32% 28%, #f87171 0%, #dc2626 48%, #7f1d1d 88%, #450a0a 100%)',
    rim: '#ef4444',
    shadow: 'rgba(220, 38, 38, 0.45)',
  },
  emerald: {
    main: 'radial-gradient(circle at 32% 28%, #4ade80 0%, #16a34a 48%, #065f46 88%, #022c22 100%)',
    rim: '#10b981',
    shadow: 'rgba(16, 185, 129, 0.45)',
  },
  purple: {
    main: 'radial-gradient(circle at 32% 28%, #c084fc 0%, #9333ea 48%, #581c87 88%, #2e1065 100%)',
    rim: '#a855f7',
    shadow: 'rgba(147, 51, 234, 0.45)',
  },
  amber: {
    main: 'radial-gradient(circle at 32% 28%, #fde047 0%, #f59e0b 48%, #b45309 88%, #451a03 100%)',
    rim: '#f59e0b',
    shadow: 'rgba(245, 158, 11, 0.45)',
  },
  cyan: {
    main: 'radial-gradient(circle at 32% 28%, #67e8f9 0%, #0891b2 48%, #164e63 88%, #083344 100%)',
    rim: '#06b6d4',
    shadow: 'rgba(6, 182, 212, 0.45)',
  },
  pink: {
    main: 'radial-gradient(circle at 32% 28%, #f472b6 0%, #db2777 48%, #831843 88%, #500724 100%)',
    rim: '#ec4899',
    shadow: 'rgba(236, 72, 153, 0.45)',
  },
};

const Glossy3DBall: React.FC<FloatingBallProps> = ({
  number,
  color,
  size = 84,
  crowned = false,
  className = '',
  style,
}) => {
  const palette = BALL_GRADIENTS[color];
  const innerSize = Math.round(size * 0.56);
  const fontSize = Math.round(size * 0.28);

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {/* Golden Royal Crown (inspired by reference images #2 & #3) */}
      {crowned && (
        <svg
          viewBox="0 0 120 80"
          className="absolute left-1/2 -translate-x-1/2 drop-shadow-[0_6px_12px_rgba(245,158,11,0.5)] z-20"
          style={{
            width: Math.round(size * 0.85),
            height: Math.round(size * 0.58),
            top: -Math.round(size * 0.42),
            transform: 'translateX(-50%) rotate(-5deg)',
          }}
        >
          <defs>
            <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="goldBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          {/* Back spikes */}
          <polygon points="32,62 24,22 48,48" fill="#ca8a04" opacity="0.85" />
          <polygon points="88,62 96,22 72,48" fill="#ca8a04" opacity="0.85" />
          {/* Main front crown spikes */}
          <path
            d="M14,62 L6,20 L36,45 L60,8 L84,45 L114,20 L106,62 Z"
            fill="url(#goldCrownGrad)"
            stroke="#fef08a"
            strokeWidth="2"
          />
          {/* Crown pearls on tips */}
          <circle cx="6" cy="18" r="4.5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="24" cy="20" r="3.5" fill="#fde047" />
          <circle cx="60" cy="6" r="5.5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="96" cy="20" r="3.5" fill="#fde047" />
          <circle cx="114" cy="18" r="4.5" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
          {/* Crown golden band */}
          <rect x="12" y="60" width="96" height="14" rx="5" fill="url(#goldBaseGrad)" stroke="#fef08a" strokeWidth="1.5" />
          <line x1="16" y1="67" x2="104" y2="67" stroke="#fef9c3" strokeWidth="1.5" opacity="0.7" />
        </svg>
      )}

      {/* 3D Glossy Sphere Body */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: palette.main,
          boxShadow: `0 16px 35px ${palette.shadow}, inset -6px -8px 18px rgba(0,0,0,0.55), inset 4px 4px 12px rgba(255,255,255,0.45)`,
        }}
      >
        {/* Top-left specular gloss reflection */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-white/80 to-transparent pointer-events-none"
          style={{
            width: Math.round(size * 0.42),
            height: Math.round(size * 0.22),
            top: Math.round(size * 0.08),
            left: Math.round(size * 0.16),
            transform: 'rotate(-24deg)',
            filter: 'blur(1px)',
          }}
        />

        {/* White circular number badge with double ring */}
        <div
          className="rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-200 flex items-center justify-center shadow-inner relative"
          style={{
            width: innerSize,
            height: innerSize,
            border: `2.5px solid ${palette.rim}`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.35)',
          }}
        >
          <span
            className="font-black text-slate-900 tracking-tighter leading-none"
            style={{ fontSize }}
          >
            {number}
          </span>
        </div>
      </div>
    </div>
  );
};

interface FloatingCardProps {
  title?: string;
  headerBg: string;
  cardBg: string;
  accentColor: string;
  numbers: (number | string)[][];
  className?: string;
  style?: React.CSSProperties;
}

const FloatingBingoCard: React.FC<FloatingCardProps> = ({
  title = 'BINGO',
  headerBg,
  cardBg,
  accentColor,
  numbers,
  className = '',
  style,
}) => {
  return (
    <div
      className={`rounded-xl p-2.5 shadow-2xl border border-white/25 select-none pointer-events-none ${className}`}
      style={{
        background: cardBg,
        width: 156,
        boxShadow: '0 22px 45px rgba(0,0,0,0.55)',
        ...style,
      }}
    >
      {/* Card BINGO Header */}
      <div
        className="text-center font-black tracking-widest text-lg py-1 rounded-t-lg mb-1.5 drop-shadow"
        style={{
          background: headerBg,
          color: '#fde047',
          textShadow: '0 2px 4px rgba(0,0,0,0.45)',
        }}
      >
        {title}
      </div>

      {/* 5x5 Mini Grid */}
      <div className="grid grid-cols-5 gap-1 bg-white/95 p-1.5 rounded-lg">
        {numbers.flat().map((val, idx) => {
          const isFree = val === 'FREE';
          return (
            <div
              key={idx}
              className="aspect-square rounded flex items-center justify-center font-mono font-bold text-[9px]"
              style={{
                backgroundColor: isFree ? accentColor : '#f8fafc',
                color: isFree ? '#ffffff' : '#1e3a8a',
                border: `1px solid ${accentColor}40`,
              }}
            >
              {isFree ? '★' : val}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FloatingGoldCoin: React.FC<{
  size?: number;
  tilt?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ size = 54, tilt = 0, className = '', style }) => {
  return (
    <div
      className={`select-none pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${tilt}deg)`,
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]">
        <defs>
          <radialGradient id="coinFace" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        {/* Outer 3D Gold Rim */}
        <circle cx="50" cy="50" r="46" fill="url(#coinRim)" stroke="#fef08a" strokeWidth="2" />
        {/* Inner Recessed Face */}
        <circle cx="50" cy="50" r="36" fill="url(#coinFace)" stroke="#b45309" strokeWidth="2" />
        {/* Star / Dollar Emblem */}
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fill="#92400e"
          fontSize="38"
          fontWeight="900"
          fontFamily="sans-serif"
          opacity="0.75"
        >
          ★
        </text>
        <text
          x="48"
          y="61"
          textAnchor="middle"
          fill="#fef9c3"
          fontSize="38"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          ★
        </text>
      </svg>
    </div>
  );
};

const FloatingPrizeWheel: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => {
  const segments = 12;
  return (
    <div
      className={`select-none pointer-events-none relative ${className}`}
      style={{ width: 170, height: 190, ...style }}
    >
      {/* Stand Base */}
      <svg viewBox="0 0 180 200" className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]">
        <defs>
          <linearGradient id="wheelGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        {/* Pedestal Stand */}
        <path d="M55,190 L125,190 L108,145 L72,145 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="44" y="186" width="92" height="8" rx="4" fill="#334155" />

        {/* Spinning Wheel Group */}
        <g className="origin-[90px_86px] animate-spin-slow">
          <circle cx="90" cy="86" r="76" fill="url(#wheelGoldRim)" stroke="#fef08a" strokeWidth="2.5" />
          <circle cx="90" cy="86" r="66" fill="#ffffff" />

          {Array.from({ length: segments }).map((_, i) => {
            const startAngle = (i * 360) / segments;
            const endAngle = ((i + 1) * 360) / segments;
            const rad1 = (startAngle * Math.PI) / 180;
            const rad2 = (endAngle * Math.PI) / 180;
            const x1 = 90 + 66 * Math.cos(rad1);
            const y1 = 86 + 66 * Math.sin(rad1);
            const x2 = 90 + 66 * Math.cos(rad2);
            const y2 = 86 + 66 * Math.sin(rad2);
            const isRed = i % 2 === 0;
            return (
              <path
                key={i}
                d={`M90,86 L${x1},${y1} A66,66 0 0,1 ${x2},${y2} Z`}
                fill={isRed ? '#dc2626' : '#f8fafc'}
                stroke="#e2e8f0"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Rim studs */}
          {Array.from({ length: 12 }).map((_, i) => {
            const rad = ((i * 30) * Math.PI) / 180;
            const cx = 90 + 71 * Math.cos(rad);
            const cy = 86 + 71 * Math.sin(rad);
            return <circle key={i} cx={cx} cy={cy} r="2" fill="#fef9c3" />;
          })}

          {/* Center Gold Cap */}
          <circle cx="90" cy="86" r="14" fill="url(#wheelGoldRim)" stroke="#fef9c3" strokeWidth="2" />
        </g>

        {/* Top Pointer Flapper */}
        <polygon points="90,20 83,6 97,6" fill="#0f172a" stroke="#fde047" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export const FloatingBingoBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Center Radial Cyber-Hall Glow Spotlight (matches Image #4 & #1) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.38) 0%, rgba(124, 58, 237, 0.22) 45%, rgba(15, 23, 42, 0) 72%)',
        }}
      />

      {/* Fanned Colorful Bingo Cards in the Upper-Left & Lower-Right Background (matches Image #1 & #3) */}
      <div className="hidden sm:block absolute top-[12%] left-[3%] opacity-40 lg:opacity-55 animate-float-slow">
        <div className="relative">
          <FloatingBingoCard
            title="BINGO"
            headerBg="linear-gradient(135deg, #d97706, #f59e0b)"
            cardBg="linear-gradient(180deg, #f59e0b, #ea580c)"
            accentColor="#d97706"
            numbers={[
              [12, 21, 34, 52, 68],
              [4, 19, 41, 59, 73],
              [9, 28, 'FREE', 49, 64],
              [15, 22, 39, 55, 70],
              [2, 17, 44, 60, 75],
            ]}
            style={{ transform: 'rotate(-16deg) translate(-24px, 12px) scale(0.88)' }}
          />
          <FloatingBingoCard
            title="BINGO"
            headerBg="linear-gradient(135deg, #be185d, #ec4899)"
            cardBg="linear-gradient(180deg, #db2777, #9d174d)"
            accentColor="#db2777"
            numbers={[
              [7, 16, 38, 47, 63],
              [11, 29, 42, 58, 72],
              [3, 24, 'FREE', 51, 69],
              [14, 30, 33, 46, 61],
              [8, 20, 45, 53, 74],
            ]}
            style={{
              position: 'absolute',
              top: 0,
              left: 38,
              transform: 'rotate(14deg) translate(22px, 10px) scale(0.88)',
            }}
          />
          <FloatingBingoCard
            title="BINGO"
            headerBg="linear-gradient(135deg, #0d9488, #06b6d4)"
            cardBg="linear-gradient(180deg, #14b8a6, #0284c7)"
            accentColor="#0d9488"
            numbers={[
              [12, 27, 38, 56, 68],
              [5, 19, 30, 52, 74],
              [13, 25, 'FREE', 48, 65],
              [1, 22, 35, 59, 70],
              [9, 18, 41, 50, 62],
            ]}
            style={{
              position: 'relative',
              transform: 'rotate(-2deg)',
            }}
          />
        </div>
      </div>

      {/* Crowned Royal Bingo Ball "77" (matches Image #2) */}
      <div
        className="absolute top-[11%] right-[6%] sm:right-[9%] opacity-75 sm:opacity-90 animate-float-slow"
        style={{ animationDelay: '0.4s' }}
      >
        <Glossy3DBall number={77} color="blue" size={102} crowned={true} />
      </div>

      {/* Crowned Lucky Green Ball "6" (matches Image #3) */}
      <div
        className="hidden md:block absolute bottom-[12%] left-[7%] opacity-75 animate-float-reverse"
        style={{ animationDelay: '1.2s' }}
      >
        <Glossy3DBall number={6} color="emerald" size={88} crowned={true} />
      </div>

      {/* Glossy Red Ball "33" & "14" (matches Image #1 & #2) */}
      <div
        className="absolute top-[52%] left-[2%] sm:left-[4%] opacity-65 sm:opacity-80 animate-float-diagonal"
        style={{ animationDelay: '0.8s' }}
      >
        <Glossy3DBall number={33} color="red" size={76} />
      </div>

      {/* Glossy Purple Ball "5" / "31" (matches Image #1 & #4) */}
      <div
        className="absolute top-[24%] left-[44%] hidden lg:block opacity-60 animate-float-reverse"
        style={{ animationDelay: '1.7s' }}
      >
        <Glossy3DBall number={31} color="purple" size={68} />
      </div>

      {/* Glossy Golden-Yellow Ball "43" / "88" (matches Image #2 & #4) */}
      <div
        className="absolute bottom-[8%] right-[16%] sm:right-[22%] opacity-70 sm:opacity-85 animate-float-slow"
        style={{ animationDelay: '0.9s' }}
      >
        <Glossy3DBall number={43} color="amber" size={84} />
      </div>

      {/* Glossy Dark Teal Ball "39" (matches Image #4) */}
      <div
        className="hidden xl:block absolute top-[15%] left-[32%] opacity-55 animate-float-diagonal"
        style={{ animationDelay: '2.1s' }}
      >
        <Glossy3DBall number={39} color="cyan" size={74} />
      </div>

      {/* Glossy Pink Ball "56" in distance (matches Image #4) */}
      <div
        className="hidden sm:block absolute bottom-[28%] left-[26%] opacity-45 animate-float-slow"
        style={{ animationDelay: '2.6s', filter: 'blur(0.5px)' }}
      >
        <Glossy3DBall number={56} color="pink" size={50} />
      </div>

      {/* Glossy Blue Ball "24" (matches Image #1) */}
      <div
        className="hidden lg:block absolute bottom-[18%] right-[42%] opacity-55 animate-float-reverse"
        style={{ animationDelay: '1.5s' }}
      >
        <Glossy3DBall number={24} color="blue" size={64} />
      </div>

      {/* Floating Carnival Prize Wheel in Bottom-Right Background (matches Image #3) */}
      <div
        className="hidden md:block absolute bottom-[6%] right-[2%] opacity-45 lg:opacity-60 animate-float-reverse"
        style={{ animationDelay: '0.6s' }}
      >
        <FloatingPrizeWheel />
      </div>

      {/* Floating 3D Gold Coins & Confetti Ribbons (matches Image #1, #3, #4) */}
      <FloatingGoldCoin
        size={58}
        tilt={-18}
        className="absolute top-[7%] left-[23%] opacity-65 animate-float-coin"
        style={{ animationDelay: '0.2s' }}
      />
      <FloatingGoldCoin
        size={46}
        tilt={24}
        className="absolute top-[36%] right-[3%] opacity-60 animate-float-coin"
        style={{ animationDelay: '1.4s' }}
      />
      <FloatingGoldCoin
        size={64}
        tilt={-12}
        className="hidden sm:block absolute bottom-[9%] left-[32%] opacity-55 animate-float-coin"
        style={{ animationDelay: '2.2s' }}
      />
      <FloatingGoldCoin
        size={40}
        tilt={35}
        className="hidden lg:block absolute top-[8%] right-[28%] opacity-50 animate-float-coin"
        style={{ animationDelay: '0.9s' }}
      />

      {/* Golden Confetti Swirl Ribbons (matches Image #4) */}
      <svg
        viewBox="0 0 200 200"
        className="hidden sm:block absolute top-[4%] right-[36%] w-28 h-28 opacity-45 animate-float-diagonal"
      >
        <defs>
          <linearGradient id="goldRibbon1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path
          d="M20,40 Q60,10 90,50 T160,60 L145,85 Q100,75 75,45 T10,65 Z"
          fill="url(#goldRibbon1)"
        />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="hidden sm:block absolute bottom-[22%] left-[14%] w-24 h-24 opacity-40 animate-float-slow"
        style={{ animationDelay: '1.8s' }}
      >
        <path
          d="M30,120 Q80,60 130,110 T180,80 L165,105 Q115,130 75,90 T20,145 Z"
          fill="url(#goldRibbon1)"
        />
      </svg>
    </div>
  );
};
