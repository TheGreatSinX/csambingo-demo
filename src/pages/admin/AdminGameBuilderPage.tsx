import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Layers, 
  Grid, 
  FileText, 
  Trophy, 
  Clock, 
  Palette, 
  Eye, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  AlertCircle
} from 'lucide-react';
import { GameConfig, GameMode, ContentType, ThemeConfig } from '../../game/gameTypes';
import { DEFAULT_GAME_CONFIG, DEFAULT_THEMES, SYSTEM_PATTERNS } from '../../game/seedData';
import { createGameRoom } from '../../services/gameService';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';

export const AdminGameBuilderPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<GameConfig>({ ...DEFAULT_GAME_CONFIG });
  const [gameTitle, setGameTitle] = useState('CYBER SECURITY AWARENESS BINGO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { adminProfile } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 7;

  const handleNext = () => {
    sound.playClick();
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    sound.playClick();
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    sound.playClick();

    try {
      const createdGame = await createGameRoom(
        gameTitle,
        config,
        adminProfile?.id || 'admin_builder',
        adminProfile?.email || 'admin@cyberbingo.internal'
      );
      sound.playCellMark();
      navigate(`/host/${createdGame.id}`);
    } catch (err: any) {
      console.error(err);
      sound.playError();
      setError(err.message || 'Failed to publish game configuration.');
      setSubmitting(false);
    }
  };

  const togglePattern = (patternId: string) => {
    const list = new Set(config.winningPatterns);
    if (list.has(patternId)) {
      list.delete(patternId);
    } else {
      list.add(patternId);
    }
    setConfig({ ...config, winningPatterns: Array.from(list) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Wizard Header & Progress Bar */}
      <div className="bg-[#070c1a] border border-purple-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-purple-400 tracking-wider">VISUAL GAME ENGINE BUILDER</div>
            <h1 className="font-cyber font-extrabold text-2xl text-white tracking-wide">
              CREATE CONFIGURATION-DRIVEN BINGO
            </h1>
          </div>
          <div className="font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            STEP {step} OF {totalSteps}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step indicator labels */}
        <div className="hidden sm:grid grid-cols-7 gap-1 mt-3 text-center text-[10px] font-mono text-slate-400">
          <span className={step >= 1 ? 'text-purple-300 font-bold' : ''}>1. GENERAL</span>
          <span className={step >= 2 ? 'text-purple-300 font-bold' : ''}>2. BOARD</span>
          <span className={step >= 3 ? 'text-purple-300 font-bold' : ''}>3. CONTENT</span>
          <span className={step >= 4 ? 'text-purple-300 font-bold' : ''}>4. PATTERNS</span>
          <span className={step >= 5 ? 'text-purple-300 font-bold' : ''}>5. SCORING</span>
          <span className={step >= 6 ? 'text-purple-300 font-bold' : ''}>6. THEME</span>
          <span className={step >= 7 ? 'text-purple-300 font-bold' : ''}>7. PREVIEW</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Step Container */}
      <div className="bg-[#070c1a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl min-h-[420px] flex flex-col justify-between">
        
        {/* STEP 1: General Info & Game Mode */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 1: GAME IDENTITY & GAME MODE
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">GAME TITLE</label>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">GAME MODE</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'classic', name: 'Classic Bingo', desc: 'Any completed row, column, or diagonal line.' },
                    { id: 'blackout', name: 'Blackout', desc: 'Every single cell on the board must be marked.' },
                    { id: 'four_corners', name: 'Four Corners', desc: 'Mark all 4 outer corner cells of the board.' },
                    { id: 'horizontal', name: 'Horizontal Only', desc: 'Only completed horizontal rows win.' },
                    { id: 'vertical', name: 'Vertical Only', desc: 'Only completed vertical columns win.' },
                    { id: 'x_mode', name: 'X-Pattern', desc: 'Both intersecting diagonal lines must be completed.' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setConfig({ ...config, mode: m.id as GameMode })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        config.mode === m.id
                          ? 'bg-purple-950/60 border-purple-400 text-white cyber-glow-purple'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-cyber font-bold text-xs text-purple-300 mb-1">{m.name}</div>
                      <div className="text-[11px] font-mono leading-tight">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Board Dimensions & Free Space */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 2: BOARD DIMENSIONS & SPECIAL CELLS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">BOARD GRID SIZE</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '3 × 3 (Speed)', rows: 3, cols: 3 },
                    { label: '4 × 4 (Compact)', rows: 4, cols: 4 },
                    { label: '5 × 5 (Standard)', rows: 5, cols: 5 },
                  ].map((sz) => (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        board: { ...config.board, rows: sz.rows, columns: sz.cols }
                      })}
                      className={`p-3 rounded-xl border text-center font-mono text-xs ${
                        config.board.rows === sz.rows
                          ? 'bg-purple-950 border-purple-400 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">FREE SPACE BEHAVIOR</label>
                <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.board.freeSpace}
                      onChange={(e) => setConfig({
                        ...config,
                        board: { ...config.board, freeSpace: e.target.checked }
                      })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-400"
                    />
                    <span className="text-slate-200">Include Center Free Space</span>
                  </label>

                  {config.board.freeSpace && (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">FREE SPACE LABEL</label>
                      <input
                        type="text"
                        value={config.board.freeSpaceLabel || '0-DAY FREE'}
                        onChange={(e) => setConfig({
                          ...config,
                          board: { ...config.board, freeSpaceLabel: e.target.value }
                        })}
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Content Pool */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 3: CONTENT POOL & CARDS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { 
                  type: 'cyber_terms', 
                  title: 'Cybersecurity Concepts', 
                  desc: 'Draws core SOC concepts: PHISHING, ZERO TRUST, MFA, FIREWALL, EDR, SIEM, etc.' 
                },
                { 
                  type: 'numbers', 
                  title: 'Traditional Numbers (1-75)', 
                  desc: 'Classic numerical draw partitioned into columns B, I, N, G, O.' 
                },
                { 
                  type: 'questions', 
                  title: 'Security Challenge Questions', 
                  desc: 'Interactive cybersecurity questions where correct answers mark the cells.' 
                },
              ].map((c) => (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => setConfig({
                    ...config,
                    draw: { ...config.draw, contentType: c.type as ContentType }
                  })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.draw.contentType === c.type
                      ? 'bg-purple-950/60 border-purple-400 text-white cyber-glow-purple'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-cyber font-bold text-sm text-purple-300 mb-1">{c.title}</div>
                  <div className="text-xs font-mono leading-relaxed">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Winning Patterns */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 4: SELECT WINNING PATTERNS
            </h2>

            <p className="text-xs font-mono text-slate-400">
              Select one or more valid winning patterns. Players completing any checked pattern will be eligible for server-verified Bingo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_PATTERNS.map((p) => {
                const checked = config.winningPatterns.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePattern(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                      checked
                        ? 'bg-purple-950/60 border-purple-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-1 rounded border-slate-700 text-purple-600 focus:ring-purple-400"
                    />
                    <div>
                      <div className="font-cyber font-bold text-xs text-purple-300">{p.name}</div>
                      <div className="text-[11px] font-mono leading-tight text-slate-400">{p.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Scoring & Timing */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 5: SCORING, TIMING & PENALTIES
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">BASE WIN POINTS</label>
                <input
                  type="number"
                  value={config.scoring.baseWin}
                  onChange={(e) => setConfig({
                    ...config,
                    scoring: { ...config.scoring, baseWin: parseInt(e.target.value, 10) || 100 }
                  })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">1ST WINNER BONUS</label>
                <input
                  type="number"
                  value={config.scoring.firstWinnerBonus}
                  onChange={(e) => setConfig({
                    ...config,
                    scoring: { ...config.scoring, firstWinnerBonus: parseInt(e.target.value, 10) || 100 }
                  })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">FALSE CLAIM PENALTY</label>
                <input
                  type="number"
                  value={config.scoring.falseClaimPenalty}
                  onChange={(e) => setConfig({
                    ...config,
                    scoring: { ...config.scoring, falseClaimPenalty: parseInt(e.target.value, 10) || 25 }
                  })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">AUTO-DRAW INTERVAL (SECONDS)</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      draw: { ...config.draw, intervalMs: sec * 1000 }
                    })}
                    className={`px-4 py-2 rounded-lg font-mono text-xs border ${
                      config.draw.intervalMs === sec * 1000
                        ? 'bg-purple-950 border-purple-400 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Theme Selection */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2">
              STEP 6: VISUAL IDENTITY & THEME
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEFAULT_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setConfig({ ...config, theme: th })}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    config.theme.id === th.id
                      ? 'bg-purple-950/60 border-purple-400 text-white cyber-glow-purple'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-cyber font-bold text-sm text-white mb-1">{th.name}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: th.primaryColor }} />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: th.secondaryColor }} />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: th.accentColor }} />
                    </div>
                  </div>
                  {config.theme.id === th.id && <Check className="w-5 h-5 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Live Preview & Publish */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="font-cyber font-bold text-lg text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>STEP 7: CONFIGURATION SUMMARY & PREVIEW</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500">TITLE: </span>
                <span className="text-white font-bold">{gameTitle}</span>
              </div>
              <div>
                <span className="text-slate-500">GRID: </span>
                <span className="text-cyan-400">{config.board.rows} × {config.board.columns}</span>
              </div>
              <div>
                <span className="text-slate-500">CONTENT: </span>
                <span className="text-purple-400 uppercase">{config.draw.contentType}</span>
              </div>
              <div>
                <span className="text-slate-500">PATTERNS: </span>
                <span className="text-green-400">{config.winningPatterns.length} active</span>
              </div>
              <div>
                <span className="text-slate-500">BASE SCORING: </span>
                <span className="text-yellow-400">+{config.scoring.baseWin} pts (1st bonus +{config.scoring.firstWinnerBonus})</span>
              </div>
              <div>
                <span className="text-slate-500">THEME: </span>
                <span className="text-white">{config.theme.name}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/40 text-green-300 text-xs font-mono">
              Ready to publish! Publishing generates a 6-digit Game PIN, freezes an immutable configuration snapshot, and immediately launches the Host Command Console.
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-cyber flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-cyber font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>NEXT STEP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-black text-xs font-cyber font-extrabold tracking-wider flex items-center gap-2 shadow-lg shadow-green-500/30 transition-all cursor-pointer"
            >
              {submitting ? (
                <span className="font-mono">PUBLISHING SNAPSHOT...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>PUBLISH & GENERATE GAME PIN</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
