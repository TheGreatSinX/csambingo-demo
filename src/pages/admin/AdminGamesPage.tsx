import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Gamepad2, 
  PlusCircle, 
  Radio, 
  Users, 
  Trophy, 
  Pause, 
  Play, 
  Square, 
  Search, 
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LiveGame, GameStatus } from '../../game/gameTypes';
import { updateGameStatus } from '../../services/gameService';
import { sound } from '../../game/soundEngine';

export const AdminGamesPage: React.FC = () => {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LOBBY' | 'FINISHED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: LiveGame[] = [];
      snap.forEach(d => list.push(d.data() as LiveGame));
      setGames(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleStatusChange = async (gameId: string, status: GameStatus) => {
    sound.playClick();
    await updateGameStatus(gameId, status);
  };

  const filteredGames = games.filter(g => {
    const matchesFilter = filter === 'ALL' 
      ? true 
      : filter === 'ACTIVE' 
      ? g.status === 'ACTIVE' 
      : filter === 'LOBBY' 
      ? g.status === 'LOBBY' 
      : g.status === 'FINISHED' || g.status === 'ROUND_COMPLETE';

    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.pin.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
            GAME ROOMS DIRECTORY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time management and monitoring of all active, paused, and past game instances.
          </p>
        </div>

        <Link
          to="/admin/games/create"
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NEW GAME ROOM</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070c1a] border border-slate-800 p-3 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <div className="flex gap-1">
            {(['ALL', 'ACTIVE', 'LOBBY', 'FINISHED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === tab
                    ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
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
            placeholder="Search by title or PIN..."
            className="w-full bg-[#050811] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-[#070c1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#050914] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Game Title & PIN</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Players</th>
                <th className="py-3 px-4">Draws</th>
                <th className="py-3 px-4">Winners</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching games found.
                  </td>
                </tr>
              ) : (
                filteredGames.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-cyber font-bold text-sm text-white">{g.title}</div>
                      <div className="text-[11px] text-cyan-400">PIN: {g.pin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        g.status === 'ACTIVE'
                          ? 'bg-green-950 text-green-400 border border-green-500/30'
                          : g.status === 'LOBBY'
                          ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{g.playerCount || 0}</td>
                    <td className="py-3 px-4">{g.drawCount || 0}</td>
                    <td className="py-3 px-4 text-yellow-400">{g.winners?.length || 0}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/host/${g.id}`)}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold"
                      >
                        HOST CONSOLE
                      </button>

                      {g.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(g.id, 'PAUSED')}
                          className="px-2 py-1 rounded bg-yellow-950 hover:bg-yellow-900 border border-yellow-500/40 text-yellow-300 text-xs"
                          title="Pause game"
                        >
                          PAUSE
                        </button>
                      )}

                      {g.status === 'PAUSED' && (
                        <button
                          onClick={() => handleStatusChange(g.id, 'ACTIVE')}
                          className="px-2 py-1 rounded bg-green-950 hover:bg-green-900 border border-green-500/40 text-green-300 text-xs"
                          title="Resume game"
                        >
                          RESUME
                        </button>
                      )}

                      {g.status !== 'FINISHED' && (
                        <button
                          onClick={() => handleStatusChange(g.id, 'FINISHED')}
                          className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs"
                          title="End game"
                        >
                          END
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
