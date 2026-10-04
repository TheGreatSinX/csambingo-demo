import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Copy, 
  Play, 
  Edit3,
  Trash2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { fetchGameTemplates, saveGameTemplate, deleteGameTemplate } from '../../services/adminService';
import { createGameRoom } from '../../services/gameService';
import { GameConfig, GameMode, ContentType } from '../../game/gameTypes';
import { DEFAULT_GAME_CONFIG, SYSTEM_PATTERNS } from '../../game/seedData';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';

export const AdminTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<GameConfig[]>([
    { ...DEFAULT_GAME_CONFIG, id: 'template_default_awareness' }
  ]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<GameConfig | null>(null);
  const [originalTemplateId, setOriginalTemplateId] = useState<string | undefined>(undefined);
  const [deletingTemplate, setDeletingTemplate] = useState<GameConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const { adminProfile } = useAuth();
  const navigate = useNavigate();

  const getTemplateId = (tmpl: GameConfig) => {
    if (tmpl.id) return tmpl.id;
    const cleanSlug = tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom';
    return `template_${cleanSlug}`;
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await fetchGameTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleLaunchTemplate = async (tmpl: GameConfig) => {
    setLaunchingId(tmpl.name);
    sound.playClick();
    try {
      const room = await createGameRoom(
        tmpl.name,
        tmpl,
        adminProfile?.id || 'admin_template',
        adminProfile?.email || 'admin@cyberbingo.internal'
      );
      navigate(`/host/${room.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLaunchingId(null);
    }
  };

  const handleCloneTemplate = async (tmpl: GameConfig) => {
    sound.playClick();
    const copyName = `${tmpl.name} (Copy)`;
    const cleanSlug = copyName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'copy';
    const cloned: GameConfig = {
      ...tmpl,
      id: `template_${cleanSlug}_${Date.now().toString(36).slice(-4)}`,
      name: copyName,
      version: (tmpl.version || 1) + 1,
    };
    await saveGameTemplate(cloned, adminProfile?.email || 'admin');
    await loadTemplates();
  };

  const handleOpenEdit = (tmpl: GameConfig) => {
    sound.playClick();
    const id = getTemplateId(tmpl);
    setOriginalTemplateId(id);
    setEditingTemplate({
      ...tmpl,
      id,
      board: { ...tmpl.board },
      draw: { ...tmpl.draw },
      rules: { ...tmpl.rules },
      scoring: { ...tmpl.scoring },
      winningPatterns: [...tmpl.winningPatterns],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name.trim()) return;
    setSaving(true);
    sound.playClick();
    try {
      await saveGameTemplate(
        {
          ...editingTemplate,
          name: editingTemplate.name.trim(),
          version: (editingTemplate.version || 1) + 1,
        },
        adminProfile?.email || 'admin',
        originalTemplateId
      );
      setEditingTemplate(null);
      setOriginalTemplateId(undefined);
      await loadTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    sound.playClick();
    const targetId = getTemplateId(deletingTemplate);
    try {
      await deleteGameTemplate(targetId, adminProfile?.email || 'admin');
      setTemplates((prev) => prev.filter((t) => getTemplateId(t) !== targetId));
      setDeletingTemplate(null);
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const toggleEditPattern = (patternId: string) => {
    if (!editingTemplate) return;
    const set = new Set(editingTemplate.winningPatterns);
    if (set.has(patternId)) {
      if (set.size > 1) set.delete(patternId);
    } else {
      set.add(patternId);
    }
    setEditingTemplate({
      ...editingTemplate,
      winningPatterns: Array.from(set),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            PRECONFIGURED GAME TEMPLATES
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Standardized blueprints for fast launching, editing, cloning, or deleting Bingo configurations.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            const newId = `template_custom_${Date.now().toString(36)}`;
            setOriginalTemplateId(undefined);
            setEditingTemplate({
              ...DEFAULT_GAME_CONFIG,
              id: newId,
              name: 'NEW CUSTOM BINGO TEMPLATE',
              description: 'Custom 75-Ball Bingo Hall configuration.',
            });
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NEW TEMPLATE</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tmpl) => {
          const tmplId = getTemplateId(tmpl);
          return (
            <div
              key={tmplId}
              className="bg-[#070c1a] border border-slate-800 hover:border-purple-500/40 p-5 rounded-2xl shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-cyber font-bold text-base text-white">{tmpl.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-500/30 text-purple-300">
                      {tmpl.board.rows}x{tmpl.board.columns}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(tmpl)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Edit template"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setDeletingTemplate(tmpl);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-400 mb-4 line-clamp-2">
                  {tmpl.description || 'Pre-configured cybersecurity bingo template.'}
                </p>

                <div className="space-y-1.5 bg-[#050914] p-3 rounded-xl border border-slate-800/80 font-mono text-xs mb-4">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Mode:</span>
                    <span className="text-cyan-400 font-bold uppercase">{tmpl.mode}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Content Pool:</span>
                    <span className="text-amber-300 uppercase">{tmpl.draw.contentType}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Draw Interval:</span>
                    <span className="text-white">{(tmpl.draw.intervalMs || 5000) / 1000}s</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Winning Patterns:</span>
                    <span className="text-green-400">{tmpl.winningPatterns.length} active</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCloneTemplate(tmpl)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clone configuration"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>CLONE</span>
                  </button>
                </div>

                <button
                  onClick={() => handleLaunchTemplate(tmpl)}
                  disabled={launchingId === tmpl.name}
                  className="px-3.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-black font-cyber font-bold text-xs tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{launchingId === tmpl.name ? 'LAUNCHING...' : 'LAUNCH'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#070c1a] border border-purple-500/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="font-cyber font-bold text-lg text-white">
                EDIT GAME TEMPLATE
              </h2>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">TEMPLATE NAME</label>
                <input
                  type="text"
                  required
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">GAME MODE</label>
                  <select
                    value={editingTemplate.mode}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, mode: e.target.value as GameMode })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="classic">Classic</option>
                    <option value="blackout">Blackout</option>
                    <option value="four_corners">Four Corners</option>
                    <option value="x_pattern">X Pattern</option>
                    <option value="custom">Custom Pattern</option>
                    <option value="cyber_grid">Cyber Grid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">CONTENT TYPE</label>
                  <select
                    value={editingTemplate.draw.contentType}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        draw: { ...editingTemplate.draw, contentType: e.target.value as ContentType },
                      })
                    }
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="numbers">75-Ball Numbers</option>
                    <option value="cyber_terms">Cyber Terms</option>
                    <option value="questions">Cyber Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">DRAW INTERVAL (SEC)</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={Math.round((editingTemplate.draw.intervalMs || 5000) / 1000)}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        draw: {
                          ...editingTemplate.draw,
                          intervalMs: Math.max(2, Number(e.target.value)) * 1000,
                        },
                      })
                    }
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">BASE WIN PTS</label>
                  <input
                    type="number"
                    min={10}
                    value={editingTemplate.scoring.baseWin}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        scoring: { ...editingTemplate.scoring, baseWin: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">1ST BONUS PTS</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTemplate.scoring.firstWinnerBonus}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        scoring: { ...editingTemplate.scoring, firstWinnerBonus: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">FALSE CLAIM PENALTY</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTemplate.rules.falseClaimPenalty}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        rules: { ...editingTemplate.rules, falseClaimPenalty: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5">ACTIVE WINNING PATTERNS</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-[#050811] border border-slate-800">
                  {SYSTEM_PATTERNS.map((pat) => {
                    const checked = editingTemplate.winningPatterns.includes(pat.id);
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => toggleEditPattern(pat.id)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          checked
                            ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="truncate">{pat.name}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070c1a] border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 mx-auto flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-cyber font-bold text-lg text-white">
              DELETE GAME TEMPLATE?
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Are you sure you want to permanently delete <b className="text-white">"{deletingTemplate.name}"</b>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTemplate(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs tracking-wider cursor-pointer shadow-lg shadow-red-600/30"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

