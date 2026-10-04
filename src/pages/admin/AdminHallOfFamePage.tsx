import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Search,
  RefreshCw,
  Award,
  Hash,
  Clock,
  Grid,
  Sparkles,
  Download,
  User
} from 'lucide-react';
import { fetchHallOfFameEntries } from '../../services/adminService';
import { HallOfFameEntry } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminHallOfFamePage: React.FC = () => {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patternFilter, setPatternFilter] = useState<string>('ALL');

  const loadHallOfFame = async () => {
    setLoading(true);
    sound.playClick();
    try {
      const data = await fetchHallOfFameEntries(200);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHallOfFame();
  }, []);

  const uniquePatterns = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.patternName) set.add(e.patternName);
    });
    return Array.from(set);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesPattern = patternFilter === 'ALL' || item.patternName === patternFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesPattern;
      return (
        item.playerNickname.toLowerCase().includes(q) ||
        item.gamePin.toLowerCase().includes(q) ||
        item.gameTitle.toLowerCase().includes(q) ||
        item.patternName.toLowerCase().includes(q) ||
        item.gameId.toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery, patternFilter]);

  const handleExportCsv = () => {
    sound.playClick();
    if (filteredEntries.length === 0) return;

    const headers = [
      'Winner Name',
      'Winning Pattern',
      'Score Awarded',
      'Rank',
      'Room PIN',
      'Game Session Title',
      'Round',
      'Balls Drawn',
      'Game Session ID',
      'Timestamp (ISO)'
    ];
    const rows = filteredEntries.map((e) => [
      `"${(e.playerNickname || '').replace(/"/g, '""')}"`,
      `"${(e.patternName || '').replace(/"/g, '""')}"`,
      e.scoreAwarded,
      e.rank,
      `"${e.gamePin}"`,
      `"${(e.gameTitle || '').replace(/"/g, '""')}"`,
      e.roundNumber || 1,
      e.totalDrawsAtWin || 0,
      `"${e.gameId}"`,
      `"${e.wonAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber_bingo_hall_of_fame_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a0f1f] border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cyber font-black text-2xl text-white tracking-wider">
                BINGO HALL OF FAME
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-400/50 text-amber-300">
                HISTORICAL WINNERS ARCHIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complete historical ledger of all verified Bingo winners, winning patterns, timestamps, and 6-digit Room PIN sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={filteredEntries.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={loadHallOfFame}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">TOTAL VERIFIED WINNERS</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{entries.length}</div>
          </div>
          <Award className="w-8 h-8 text-amber-400/40" />
        </div>

        <div className="bg-[#0a0f1f] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">UNIQUE ROOM PINS LOGGED</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {new Set(entries.map((e) => e.gamePin)).size}
            </div>
          </div>
          <Hash className="w-8 h-8 text-cyan-400/40" />
        </div>

        <div className="bg-[#0a0f1f] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">TOTAL POINTS AWARDED</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {entries.reduce((acc, e) => acc + (e.scoreAwarded || 0), 0).toLocaleString()} PTS
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-400/40" />
        </div>
      </div>

      {/* Search & Pattern Filter Bar */}
      <div className="bg-[#0a0f1f] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Winner Name, 6-Digit Room PIN, Pattern, or Session Title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">PATTERN:</span>
          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Patterns ({entries.length})</option>
            {uniquePatterns.map((pat) => (
              <option key={pat} value={pat}>
                {pat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Winners Table */}
      <div className="bg-[#0a0f1f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-xs font-mono text-amber-300">LOADING HALL OF FAME RECORDS...</div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Hall of Fame Winners Found</div>
            <div className="text-xs text-slate-500">
              Verified Bingo winners will automatically appear here with their player name, winning pattern, Room PIN, and session details.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="py-3.5 px-4">Rank & Winner</th>
                  <th className="py-3.5 px-4">Winning Pattern</th>
                  <th className="py-3.5 px-4">Room PIN</th>
                  <th className="py-3.5 px-4">Game Session Details</th>
                  <th className="py-3.5 px-4">Points</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Winner Name & Rank */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                          #{entry.rank || 1}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span>{entry.playerNickname}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{entry.playerId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Winning Pattern */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold text-xs">
                        <Grid className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{entry.patternName}</span>
                      </span>
                    </td>

                    {/* 6-Digit Room PIN */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/50 font-mono font-black text-sm tracking-widest text-amber-300">
                        {entry.gamePin}
                      </span>
                    </td>

                    {/* Game Session Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{entry.gameTitle}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Round #{entry.roundNumber || 1}</span>
                        <span>•</span>
                        <span>{entry.totalDrawsAtWin || 0} balls drawn</span>
                        <span>•</span>
                        <span className="text-slate-500 truncate max-w-[140px]" title={entry.gameId}>
                          {entry.gameId}
                        </span>
                      </div>
                    </td>

                    {/* Score Awarded */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-amber-400 text-sm">
                        +{entry.scoreAwarded} PTS
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{new Date(entry.wonAt).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
