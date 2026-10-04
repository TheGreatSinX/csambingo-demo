import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Radio, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity, 
  Database,
  PlusCircle,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Grid,
  Palette,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { 
  fetchAnalyticsSummary, 
  fetchAuditLogs, 
  seedInitialDataIfEmpty,
  resetEntireDatabase,
  appendAuditLog
} from '../../services/adminService';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LiveGame, AuditLogItem, GameStatus } from '../../game/gameTypes';
import { createGameRoom, addDemoBots, updateGameStatus } from '../../services/gameService';
import { DEFAULT_GAME_CONFIG } from '../../game/seedData';
import { sound } from '../../game/soundEngine';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalGames: 0,
    activeGames: 0,
    completedGames: 0,
    totalPlayers: 0,
    totalWinners: 0,
    totalDraws: 0,
    patternFrequency: {} as Record<string, number>,
  });
  const [activeRooms, setActiveRooms] = useState<LiveGame[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [launchingQuickRoom, setLaunchingQuickRoom] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  const { adminProfile } = useAuth();
  const navigate = useNavigate();

  const handleConfirmResetDb = async () => {
    setResettingDb(true);
    sound.playClick();
    try {
      await resetEntireDatabase(adminProfile?.email || 'webdev.cybernetics@gmail.com');
      setConfirmResetModal(false);
      await loadAuxiliaryData();
    } catch (err) {
      console.error('Reset database failed:', err);
    } finally {
      setResettingDb(false);
    }
  };

  const loadAuxiliaryData = async () => {
    try {
      const [summary, logs] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchAuditLogs(8),
      ]);
      setStats(summary);
      setRecentLogs(logs);
    } catch (err) {
      console.warn('Dashboard summary load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuxiliaryData();

    // Real-time listener for games on the dashboard
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(8));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rooms: LiveGame[] = [];
        snap.forEach((d) => rooms.push(d.data() as LiveGame));
        setActiveRooms(rooms);
        // Recompute live KPI metrics dynamically from snapshot when available
        fetchAnalyticsSummary().then(setStats).catch(() => {});
        setLoading(false);
      },
      (err) => {
        console.warn('Live games snapshot warning:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    sound.playClick();
    try {
      await seedInitialDataIfEmpty(true);
      await appendAuditLog({
        actorId: adminProfile?.id || 'admin',
        actorEmail: adminProfile?.email || 'webdev.cybernetics@gmail.com',
        action: 'DATABASE_SEED_SYNCED',
        resource: 'firestore/seedData',
      });
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3500);
      await loadAuxiliaryData();
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickLaunchHall = async () => {
    setLaunchingQuickRoom(true);
    sound.playClick();
    try {
      const hostId = adminProfile?.id || `admin_host_${Date.now()}`;
      const newGame = await createGameRoom(
        'CLASSIC 75-BALL BINGO — CYBER EDITION',
        DEFAULT_GAME_CONFIG,
        hostId,
        adminProfile?.email || 'webdev.cybernetics@gmail.com'
      );
      await addDemoBots(newGame.id, 4);
      await loadAuxiliaryData();
      navigate(`/host/${newGame.id}`);
    } catch (err) {
      console.error('Quick launch error:', err);
    } finally {
      setLaunchingQuickRoom(false);
    }
  };

  const handleRoomStatusToggle = async (room: LiveGame, nextStatus: GameStatus) => {
    sound.playClick();
    await updateGameStatus(room.id, nextStatus, adminProfile?.id || 'admin');
    await loadAuxiliaryData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner / Headline */}
      <div className="bg-gradient-to-r from-[#090f24] via-[#0d1530] to-[#090f24] border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-cyber font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
              HALL MANAGER & SOC DASHBOARD
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 text-cyan-300">
              Cyber Edition
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ALL SYSTEMS ONLINE
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1.5">
            Real-time control center for 75-Ball Bingo Halls, custom winning patterns, content sets, and server-authoritative claim verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              setConfirmResetModal(true);
            }}
            disabled={resettingDb || seeding}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Purge rooms and reset database to factory defaults"
          >
            <Trash2 className="w-4 h-4" />
            <span>{resettingDb ? 'RESETTING...' : 'RESET DATABASE'}</span>
          </button>

          <button
            onClick={handleSeedData}
            disabled={seeding || resettingDb}
            className="px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync default 75-ball patterns, themes, terms, and templates"
          >
            {seedSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Database className={`w-4 h-4 text-purple-400 ${seeding ? 'animate-spin' : ''}`} />
            )}
            <span>{seeding ? 'SYNCING...' : seedSuccess ? 'DATA SYNCED!' : 'SYNC DEFAULT DATA'}</span>
          </button>

          <button
            onClick={handleQuickLaunchHall}
            disabled={launchingQuickRoom}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{launchingQuickRoom ? 'OPENING HALL...' : 'QUICK LAUNCH 75-BALL HALL'}</span>
          </button>

          <Link
            to="/admin/games/create"
            onClick={() => sound.playClick()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>CUSTOM GAME BUILDER</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Games */}
        <div className="bg-[#070c1a] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
            <span>ACTIVE BINGO HALLS</span>
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-white">
            {stats.activeGames}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {stats.totalGames} total rooms created ({stats.completedGames} finished)
          </div>
        </div>

        {/* Total Players */}
        <div className="bg-[#070c1a] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2">
            <span>TOTAL PLAYERS</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-white">
            {stats.totalPlayers}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Connected cards across all sessions
          </div>
        </div>

        {/* Total Winners */}
        <div className="bg-[#070c1a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
            <span>VERIFIED BINGOS</span>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-white">
            {stats.totalWinners}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Server-validated winning claims
          </div>
        </div>

        {/* Total Draws */}
        <div className="bg-[#070c1a] border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-purple-400 mb-2">
            <span>OFFICIAL BALLS DRAWN</span>
            <Radio className="w-4 h-4" />
          </div>
          <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-white">
            {stats.totalDraws}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            B-I-N-G-O balls & terms called
          </div>
        </div>

      </div>

      {/* Quick Admin Module Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/patterns"
          onClick={() => sound.playClick()}
          className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 hover:border-amber-500/40 flex items-center gap-3 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Pattern Editor</div>
            <div className="text-[10px] font-mono text-slate-400">5×5 Custom Grids</div>
          </div>
        </Link>

        <Link
          to="/admin/themes"
          onClick={() => sound.playClick()}
          className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 hover:border-cyan-500/40 flex items-center gap-3 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Hall Themes</div>
            <div className="text-[10px] font-mono text-slate-400">Colors & Styling</div>
          </div>
        </Link>

        <Link
          to="/admin/content"
          onClick={() => sound.playClick()}
          className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 hover:border-purple-500/40 flex items-center gap-3 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Content CMS</div>
            <div className="text-[10px] font-mono text-slate-400">Terms & Pools</div>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          onClick={() => sound.playClick()}
          className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 hover:border-emerald-500/40 flex items-center gap-3 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Hall Analytics</div>
            <div className="text-[10px] font-mono text-slate-400">Win Distribution</div>
          </div>
        </Link>
      </div>

      {/* Main Grid: Active Game Rooms vs Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Game Rooms Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#070c1a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-cyber font-bold text-base text-white">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LIVE & RECENT BINGO ROOMS</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { sound.playClick(); loadAuxiliaryData(); }}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Refresh metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link to="/admin/games" className="text-xs font-mono text-cyan-400 hover:underline">
                Manage All ({stats.totalGames}) →
              </Link>
            </div>
          </div>

          {activeRooms.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs font-mono text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-3">
              <div>No active Bingo halls found yet.</div>
              <button
                onClick={handleQuickLaunchHall}
                disabled={launchingQuickRoom}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>LAUNCH INSTANT 75-BALL HALL</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
                >
                  <div>
                    <div className="font-cyber font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                      <span>{room.title}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                        PIN: {room.pin}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span>{room.playerCount || 0} players</span>
                      <span>•</span>
                      <span>{room.drawCount || 0} balls called</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{room.winners?.length || 0} winners</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      room.status === 'ACTIVE' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : room.status === 'LOBBY'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        : room.status === 'PAUSED'
                        ? 'bg-orange-950 text-orange-400 border border-orange-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {room.status}
                    </span>

                    {room.status === 'LOBBY' && (
                      <button
                        onClick={() => handleRoomStatusToggle(room, 'ACTIVE')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Start calling balls"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>START</span>
                      </button>
                    )}

                    {room.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRoomStatusToggle(room, 'PAUSED')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Pause game"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        <span>PAUSE</span>
                      </button>
                    )}

                    {room.status === 'PAUSED' && (
                      <button
                        onClick={() => handleRoomStatusToggle(room, 'ACTIVE')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Resume game"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>RESUME</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/host/${room.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>CALLER STAGE</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => navigate(`/game/${room.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-colors cursor-pointer"
                      title="Open player card in this room"
                    >
                      JOIN CARD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Audit Log Stream (5 cols) */}
        <div className="lg:col-span-5 bg-[#070c1a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-cyber font-bold text-base text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>SECURITY & AUDIT STREAM</span>
            </div>
            <Link to="/admin/audit" className="text-xs font-mono text-purple-400 hover:underline">
              Full Log →
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-purple-300 font-bold truncate">{log.action}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Target: <span className="text-slate-300">{log.resource}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Actor: {log.actorEmail}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Confirm Reset Database Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070c1a] border-2 border-red-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-950/90 border border-red-500/50 mx-auto flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-cyber font-bold text-xl text-white">
              CONFIRM DATABASE RESET
            </h3>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              This will purge all active and past Bingo game rooms, custom templates, and custom edits, and restore the database to its clean factory seed state.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={resettingDb}
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={resettingDb}
                onClick={handleConfirmResetDb}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{resettingDb ? 'RESETTING...' : 'YES, RESET DATABASE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

