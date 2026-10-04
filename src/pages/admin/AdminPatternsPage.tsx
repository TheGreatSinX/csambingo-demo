import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  fetchWinningPatterns, 
  saveWinningPattern, 
  deleteWinningPattern 
} from '../../services/adminService';
import { WinningPattern } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminPatternsPage: React.FC = () => {
  const [patterns, setPatterns] = useState<WinningPattern[]>([]);
  const [activeEditorGrid, setActiveEditorGrid] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(5).fill(false))
  );
  const [patternName, setPatternName] = useState('');
  const [patternDesc, setPatternDesc] = useState('');
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const data = await fetchWinningPatterns();
      setPatterns(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, []);

  const toggleEditorCell = (r: number, c: number) => {
    sound.playClick();
    const next = activeEditorGrid.map((row, ri) => 
      row.map((val, ci) => (ri === r && ci === c ? !val : val))
    );
    setActiveEditorGrid(next);
  };

  const handleClearGrid = () => {
    sound.playClick();
    setActiveEditorGrid(Array(5).fill(null).map(() => Array(5).fill(false)));
  };

  const handleSavePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patternName.trim()) return;

    sound.playClick();

    // Extract cell coordinates [r, c]
    const cells: [number, number][] = [];
    activeEditorGrid.forEach((row, r) => {
      row.forEach((isMarked, c) => {
        if (isMarked) cells.push([r, c]);
      });
    });

    if (cells.length === 0) {
      alert('Please click at least one cell on the grid to create a pattern shape.');
      return;
    }

    const patternId = editingPatternId || `pat_${Date.now()}`;
    const newPattern: WinningPattern = {
      id: patternId,
      name: patternName.trim(),
      description: patternDesc.trim() || `Custom pattern with ${cells.length} coordinates`,
      rows: 5,
      cols: 5,
      cells,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    await saveWinningPattern(newPattern);
    setPatternName('');
    setPatternDesc('');
    setEditingPatternId(null);
    handleClearGrid();
    await loadPatterns();
  };

  const handleSelectToEdit = (p: WinningPattern) => {
    sound.playClick();
    setPatternName(p.name);
    setPatternDesc(p.description);
    setEditingPatternId(p.id);

    const next = Array(5).fill(null).map(() => Array(5).fill(false));
    p.cells.forEach(([r, c]) => {
      if (r < 5 && c < 5) next[r][c] = true;
    });
    setActiveEditorGrid(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pattern from the system?')) return;
    sound.playClick();
    await deleteWinningPattern(id);
    await loadPatterns();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-purple-500/20 pb-4">
        <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
          VISUAL WINNING PATTERN DESIGNER
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Interactive no-code grid editor to design and register custom mathematical winning shapes for Cyber Bingo games.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Clickable Grid Editor (5 cols) */}
        <div className="lg:col-span-5 bg-[#070c1a] border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-cyber font-bold text-base text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{editingPatternId ? 'EDIT PATTERN MATRIX' : 'NEW PATTERN MATRIX'}</span>
            </div>
            <button
              onClick={handleClearGrid}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              CLEAR GRID
            </button>
          </div>

          {/* 5x5 Clickable Grid */}
          <div className="flex justify-center py-2">
            <div className="grid grid-cols-5 gap-2.5 bg-[#050811] p-4 rounded-2xl border border-slate-800 shadow-inner">
              {activeEditorGrid.map((row, r) => 
                row.map((isCellActive, c) => (
                  <button
                    key={`${r}_${c}`}
                    type="button"
                    onClick={() => toggleEditorCell(r, c)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-mono text-xs font-bold transition-all transform hover:scale-105 active:scale-95 border cursor-pointer ${
                      isCellActive
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400 text-white cyber-glow-purple'
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                    }`}
                  >
                    {isCellActive ? '■' : '□'}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="text-center text-[11px] font-mono text-slate-500">
            Click on cells above to toggle on/off for this winning pattern.
          </div>

          {/* Form */}
          <form onSubmit={handleSavePattern} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">PATTERN NAME</label>
              <input
                type="text"
                required
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="e.g. Cyber Shield, Letter Z, Diamond"
                className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">DESCRIPTION</label>
              <input
                type="text"
                value={patternDesc}
                onChange={(e) => setPatternDesc(e.target.value)}
                placeholder="e.g. Center shield formation protecting perimeter"
                className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              {editingPatternId ? 'UPDATE PATTERN DEFINITION' : 'SAVE WINNING PATTERN'}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Winning Patterns Library (7 cols) */}
        <div className="lg:col-span-7 bg-[#070c1a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-cyber font-bold text-base text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>REGISTERED PATTERNS ({patterns.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
            {patterns.map((p) => {
              // Build miniature 5x5 preview
              const cellSet = new Set(p.cells.map(([r, c]) => `${r}_${c}`));

              return (
                <div
                  key={p.id}
                  className="bg-[#050914] border border-slate-800 hover:border-purple-500/40 p-4 rounded-xl flex flex-col justify-between transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-cyber font-bold text-sm text-white">{p.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400 line-clamp-2 mt-0.5">
                        {p.description}
                      </p>
                    </div>

                    {/* Mini visual representation */}
                    <div className="grid grid-cols-5 gap-0.5 w-12 h-12 bg-slate-950 p-1 rounded border border-slate-800 shrink-0">
                      {Array(25).fill(0).map((_, idx) => {
                        const r = Math.floor(idx / 5);
                        const c = idx % 5;
                        const isFilled = cellSet.has(`${r}_${c}`);
                        return (
                          <div
                            key={idx}
                            className={`w-full h-full rounded-[1px] ${
                              isFilled ? 'bg-purple-400' : 'bg-slate-900'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                    <span className="text-slate-500">
                      {p.isSystem ? 'SYSTEM BUILT-IN' : 'CUSTOM PATTERN'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectToEdit(p)}
                        className="p-1 text-slate-400 hover:text-cyan-400"
                        title="Load into editor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!p.isSystem && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete pattern"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
