import React, { useEffect, useState } from 'react';
import { 
  FileCode2, 
  Search, 
  ShieldCheck, 
  Filter, 
  Calendar,
  User,
  RotateCw
} from 'lucide-react';
import { fetchAuditLogs } from '../../services/adminService';
import { AuditLogItem } from '../../game/gameTypes';
import { sound } from '../../game/soundEngine';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actionTypes = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))];

  const filteredLogs = logs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="font-cyber font-bold text-2xl text-white tracking-wide flex items-center gap-3">
            <span>IMMUTABLE SECURITY AUDIT TRAIL</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300">
              APPEND-ONLY LOG
            </span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Complete cryptographic audit log recording administrator sign-ins, game configurations, state transitions, and content mutations.
          </p>
        </div>

        <button
          onClick={() => { sound.playClick(); loadLogs(); }}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>REFRESH LOG</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070c1a] border border-slate-800 p-3 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex gap-1">
            {actionTypes.slice(0, 6).map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-colors ${
                  actionFilter === act
                    ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {act}
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
            placeholder="Search action or actor..."
            className="w-full bg-[#050811] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#070c1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#050914] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 text-[11px]">
                      {l.actorEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {l.resource}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px] font-mono truncate max-w-xs">
                      {l.metadata ? JSON.stringify(l.metadata) : '—'}
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
