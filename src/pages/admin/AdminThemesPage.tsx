import React, { useEffect, useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Eye, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { fetchThemes, saveTheme } from '../../services/adminService';
import { DEFAULT_THEMES } from '../../game/seedData';
import { ThemeConfig } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminThemesPage: React.FC = () => {
  const [themes, setThemes] = useState<ThemeConfig[]>(DEFAULT_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>({ ...DEFAULT_THEMES[0] });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const data = await fetchThemes();
      setThemes(data);
      if (data.length > 0) setSelectedTheme({ ...data[0] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    await saveTheme(selectedTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    await loadThemes();
  };

  const handleSelectPreset = (th: ThemeConfig) => {
    sound.playClick();
    setSelectedTheme({ ...th });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-purple-500/20 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            THEME & VISUAL IDENTITY STUDIO
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Data-driven visual engine: customize colors, typography, glowing borders, and cell radius with real-time preview.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-mono text-green-400 bg-green-950 px-3 py-1.5 rounded-lg border border-green-500/40 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            THEME CONFIGURATION PERSISTED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Color Controls (6 cols) */}
        <div className="lg:col-span-6 bg-[#070c1a] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-cyber font-bold text-base text-purple-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>THEME PARAMETERS</span>
            </div>

            {/* Preset Selector */}
            <div className="flex gap-1.5">
              {DEFAULT_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleSelectPreset(th)}
                  className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                  style={{ backgroundColor: th.primaryColor }}
                  title={th.name}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveTheme} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">THEME NAME</label>
              <input
                type="text"
                required
                value={selectedTheme.name}
                onChange={(e) => setSelectedTheme({ ...selectedTheme, name: e.target.value })}
                className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">PRIMARY ACCENT (NEON)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTheme.primaryColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, primaryColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedTheme.primaryColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, primaryColor: e.target.value })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">SECONDARY (SUCCESS / GLOW)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTheme.secondaryColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, secondaryColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedTheme.secondaryColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, secondaryColor: e.target.value })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">BACKGROUND COLOR</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTheme.backgroundColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, backgroundColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedTheme.backgroundColor}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, backgroundColor: e.target.value })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">CARD TILE BACKGROUND</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTheme.cardBackground}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, cardBackground: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedTheme.cardBackground}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, cardBackground: e.target.value })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">CORNER RADIUS</label>
              <div className="flex gap-2">
                {['0.25rem', '0.5rem', '0.75rem', '1rem'].map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setSelectedTheme({ ...selectedTheme, cellRadius: rad })}
                    className={`px-3 py-1.5 rounded-lg border text-xs ${
                      selectedTheme.cellRadius === rad
                        ? 'bg-purple-950 border-purple-400 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {rad}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              SAVE THEME CONFIGURATION
            </button>
          </form>
        </div>

        {/* Right Column: Live Interactive Card Preview (6 cols) */}
        <div className="lg:col-span-6 bg-[#070c1a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="font-cyber font-bold text-base text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>LIVE BOARD VISUAL PREVIEW</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                ACTIVE
              </span>
            </div>

            {/* Preview Box styled directly using selectedTheme */}
            <div 
              className="p-6 rounded-2xl border transition-all duration-300"
              style={{
                backgroundColor: selectedTheme.backgroundColor,
                borderColor: selectedTheme.primaryColor + '50',
                boxShadow: `0 0 25px ${selectedTheme.primaryColor}25`,
              }}
            >
              <div 
                className="font-cyber font-bold text-center text-sm mb-4 tracking-wider"
                style={{ color: selectedTheme.primaryColor }}
              >
                CYBER BINGO // LIVE PREVIEW
              </div>

              {/* Sample 3x3 Preview Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {[
                  { label: 'PHISHING', marked: true },
                  { label: 'ZERO TRUST', marked: false },
                  { label: 'FIREWALL', marked: true },
                  { label: 'SIEM', marked: false },
                  { label: '0-DAY FREE', marked: true, isFree: true },
                  { label: 'RANSOMWARE', marked: true },
                  { label: 'MFA', marked: false },
                  { label: 'VPN', marked: true },
                  { label: 'SOC', marked: false },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="aspect-square flex flex-col items-center justify-center p-2 text-center border font-cyber font-bold text-[10px] sm:text-xs transition-all"
                    style={{
                      borderRadius: selectedTheme.cellRadius,
                      backgroundColor: c.marked ? selectedTheme.primaryColor + '20' : selectedTheme.cardBackground,
                      borderColor: c.marked ? selectedTheme.primaryColor : '#1e293b',
                      color: c.marked ? '#ffffff' : '#94a3b8',
                      boxShadow: c.marked ? `0 0 12px ${selectedTheme.primaryColor}40` : 'none',
                    }}
                  >
                    {c.isFree && <Sparkles className="w-3.5 h-3.5 mb-1 text-purple-400" />}
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[11px] font-mono text-slate-500">
            Preview updates in real-time. Changes will be reflected on all player and host displays.
          </div>
        </div>

      </div>

    </div>
  );
};
