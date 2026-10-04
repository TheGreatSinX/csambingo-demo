import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Check, 
  X,
  Database
} from 'lucide-react';
import { 
  fetchContentItems, 
  saveContentItem, 
  deleteContentItem,
  seedInitialDataIfEmpty 
} from '../../services/adminService';
import { CMSContentItem } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminContentPage: React.FC = () => {
  const [items, setItems] = useState<CMSContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState<CMSContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchContentItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category || 'General')))];

  const handleOpenCreate = () => {
    sound.playClick();
    setEditingItem({
      id: `term_${Date.now()}`,
      term: '',
      category: 'Network Security',
      description: '',
      difficulty: 'beginner',
      tags: [],
      active: true,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.term.trim()) return;

    sound.playClick();
    await saveContentItem({
      ...editingItem,
      term: editingItem.term.trim().toUpperCase(),
    });

    setIsModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this concept from the CMS?')) return;
    sound.playClick();
    await deleteContentItem(id);
    await loadItems();
  };

  const filteredItems = items.filter(i => {
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;
    const matchesSearch = i.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            CYBERSECURITY CONTENT CMS
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Authoritative concept bank for terminology Bingo cards and educational draws.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <button
              onClick={async () => {
                await seedInitialDataIfEmpty();
                await loadItems();
              }}
              className="px-3 py-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>POPULATE SEED TERMS</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD CONCEPT</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070c1a] border border-slate-800 p-3 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
                  categoryFilter === cat
                    ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search concepts or definitions..."
            className="w-full bg-[#050811] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Content Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No terms found. Click "ADD CONCEPT" to create one or use the default dataset.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#070c1a] border border-slate-800 hover:border-purple-500/40 p-4 rounded-xl shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-cyber font-bold text-base text-white tracking-wide">
                    {item.term}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 border border-purple-500/30 text-purple-300">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] font-mono">
                <span className="text-slate-500 uppercase">{item.difficulty}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                      sound.playClick();
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="Edit concept"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-red-400"
                    title="Delete concept"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070c1a] border border-purple-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="font-cyber font-bold text-lg text-white">
                {editingItem.term ? `EDIT: ${editingItem.term}` : 'CREATE NEW CONCEPT'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">TERM / CONCEPT (UPPERCASE)</label>
                <input
                  type="text"
                  required
                  value={editingItem.term}
                  onChange={(e) => setEditingItem({ ...editingItem, term: e.target.value })}
                  placeholder="e.g. ZERO TRUST"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">CATEGORY</label>
                <input
                  type="text"
                  required
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Network Security"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">DESCRIPTION / EXPLANATION</label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Clear educational description for the term..."
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">DIFFICULTY</label>
                <select
                  value={editingItem.difficulty}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    difficulty: e.target.value as any 
                  })}
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold tracking-wider"
                >
                  SAVE CONCEPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
