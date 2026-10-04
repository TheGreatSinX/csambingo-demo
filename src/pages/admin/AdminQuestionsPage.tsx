import React, { useEffect, useState } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Award
} from 'lucide-react';
import { 
  fetchQuestions, 
  saveQuestionItem, 
  deleteQuestionItem 
} from '../../services/adminService';
import { CMSQuestionItem } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<CMSQuestionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQ, setEditingQ] = useState<CMSQuestionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleOpenCreate = () => {
    sound.playClick();
    setEditingQ({
      id: `q_${Date.now()}`,
      question: '',
      answer: '',
      options: ['', '', '', ''],
      explanation: '',
      category: 'General Security',
      difficulty: 'beginner',
      points: 100,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ || !editingQ.question.trim() || !editingQ.answer.trim()) return;

    sound.playClick();
    await saveQuestionItem(editingQ);
    setIsModalOpen(false);
    setEditingQ(null);
    await loadQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    sound.playClick();
    await deleteQuestionItem(id);
    await loadQuestions();
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            CYBER CHALLENGE QUESTION BANK
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Create and maintain quiz-based challenges for Question Bingo game modes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NEW QUESTION</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#070c1a] border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions or answers..."
            className="w-full bg-[#050811] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No questions found. Click "NEW QUESTION" to create one.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-[#070c1a] border border-slate-800 hover:border-purple-500/40 p-5 rounded-2xl shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-500/30 text-purple-300">
                    {q.category}
                  </span>
                  <span className="font-mono text-xs text-yellow-400 font-bold">
                    +{q.points} PTS
                  </span>
                </div>

                <h3 className="font-cyber font-semibold text-base text-white mb-3">
                  {q.question}
                </h3>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-3 space-y-1 text-xs font-mono">
                  <div className="text-slate-400">CORRECT ANSWER:</div>
                  <div className="text-green-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{q.answer}</span>
                  </div>
                </div>

                {q.explanation && (
                  <p className="text-xs font-mono text-slate-400 line-clamp-2 mb-4">
                    <b>Rationale:</b> {q.explanation}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
                <span className="uppercase">{q.difficulty}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingQ(q);
                      setIsModalOpen(true);
                      sound.playClick();
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="Edit question"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1 text-slate-400 hover:text-red-400"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Question Modal */}
      {isModalOpen && editingQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070c1a] border border-purple-500/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="font-cyber font-bold text-lg text-white">
                {editingQ.question ? 'EDIT QUESTION' : 'NEW CYBER QUESTION'}
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
                <label className="block text-slate-300 mb-1">QUESTION PROMPT</label>
                <textarea
                  rows={2}
                  required
                  value={editingQ.question}
                  onChange={(e) => setEditingQ({ ...editingQ, question: e.target.value })}
                  placeholder="e.g. Which cryptographic protocol provides encryption in transit for web traffic?"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">CORRECT ANSWER</label>
                <input
                  type="text"
                  required
                  value={editingQ.answer}
                  onChange={(e) => setEditingQ({ ...editingQ, answer: e.target.value })}
                  placeholder="e.g. TLS (or HTTPS)"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">CATEGORY</label>
                <input
                  type="text"
                  required
                  value={editingQ.category}
                  onChange={(e) => setEditingQ({ ...editingQ, category: e.target.value })}
                  placeholder="e.g. Cryptography"
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">EXPLANATION</label>
                <textarea
                  rows={2}
                  value={editingQ.explanation}
                  onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
                  placeholder="Why this answer is correct..."
                  className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">POINTS</label>
                  <input
                    type="number"
                    value={editingQ.points}
                    onChange={(e) => setEditingQ({ ...editingQ, points: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">DIFFICULTY</label>
                  <select
                    value={editingQ.difficulty}
                    onChange={(e) => setEditingQ({ ...editingQ, difficulty: e.target.value as any })}
                    className="w-full bg-[#050811] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
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
                  SAVE QUESTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
