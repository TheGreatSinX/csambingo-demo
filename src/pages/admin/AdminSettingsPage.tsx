import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Database, 
  AlertTriangle,
  Server,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Layout,
  CheckCircle2
} from 'lucide-react';
import { 
  seedInitialDataIfEmpty, 
  resetEntireDatabase,
  ADMIN_SIDEBAR_ITEMS,
  getHiddenSidebarPaths,
  setHiddenSidebarPaths
} from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';

export const AdminSettingsPage: React.FC = () => {
  const { adminProfile } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [hiddenPaths, setHiddenPathsState] = useState<string[]>(() => getHiddenSidebarPaths());

  const handleSeed = async () => {
    setSeeding(true);
    sound.playClick();
    try {
      await seedInitialDataIfEmpty(true);
      setSeedDone(true);
      setTimeout(() => setSeedDone(false), 3000);
    } finally {
      setSeeding(false);
    }
  };

  const handleConfirmResetDatabase = async () => {
    setResetting(true);
    sound.playClick();
    try {
      await resetEntireDatabase(adminProfile?.email || 'webdev.cybernetics@gmail.com');
      setConfirmResetOpen(false);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setResetting(false);
    }
  };

  const toggleSidebarItem = (path: string) => {
    sound.playClick();
    const exists = hiddenPaths.includes(path);
    const next = exists
      ? hiddenPaths.filter((p) => p !== path)
      : [...hiddenPaths, path];
    setHiddenPathsState(next);
    setHiddenSidebarPaths(next);
  };

  const handleShowAllSidebarItems = () => {
    sound.playClick();
    setHiddenPathsState([]);
    setHiddenSidebarPaths([]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-purple-500/20 pb-4">
        <h1 className="font-cyber font-bold text-2xl text-white tracking-wide">
          SECURITY POSTURE & SYSTEM SETTINGS
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Cryptographic controls, multi-factor enforcement, side panel visibility customization, and database management.
        </p>
      </div>

      {/* Side Panel Navigation Visibility Control Div */}
      <div className="bg-[#070c1a] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-cyber font-bold text-base text-white flex items-center gap-2">
              <Layout className="w-4 h-4 text-cyan-400" />
              <span>SIDE PANEL NAVIGATION VISIBILITY</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Toggle any side panel navigation item below to show or hide it in the Administrator Console sidebar.
            </p>
          </div>

          {hiddenPaths.length > 0 && (
            <button
              onClick={handleShowAllSidebarItems}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>SHOW ALL ({hiddenPaths.length} HIDDEN)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADMIN_SIDEBAR_ITEMS.map((item) => {
            const isHidden = hiddenPaths.includes(item.path);
            return (
              <div
                key={item.path}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isHidden
                    ? 'bg-slate-950/70 border-slate-800/80 opacity-65'
                    : 'bg-slate-900/70 border-purple-500/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-cyber font-bold text-xs text-white truncate flex items-center gap-1.5">
                    <span>{item.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {isHidden ? 'Hidden in sidebar' : 'Visible in sidebar'}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!item.canHide}
                  onClick={() => toggleSidebarItem(item.path)}
                  aria-label={`Toggle ${item.label} visibility`}
                  title={!item.canHide ? 'Core settings route remains visible' : isHidden ? 'Click to show in side panel' : 'Click to hide from side panel'}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    !item.canHide
                      ? 'bg-slate-800/60 border border-slate-700 text-slate-500 cursor-not-allowed'
                      : isHidden
                      ? 'bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 cursor-pointer'
                      : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 cursor-pointer'
                  }`}
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>HIDDEN</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>VISIBLE</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Policy 1: Multi-Factor Authentication */}
        <div className="bg-[#070c1a] border border-green-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-cyber font-bold text-sm text-green-300">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span>MFA ENFORCEMENT</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-950 border border-green-500/40 text-green-400 font-bold">
              ACTIVE & ENFORCED
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            All administrative console routes (/admin/*) require two-factor challenge verification. Unverified sessions are prevented from accessing administrative resources.
          </p>
        </div>

        {/* Policy 2: Role-Based Authorization */}
        <div className="bg-[#070c1a] border border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-cyber font-bold text-sm text-purple-300">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
              {adminProfile?.role || 'SUPER_ADMIN'}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Current authenticated session: <b>{adminProfile?.email}</b>. Authorized roles: SUPER_ADMIN, GAME_ADMIN, CONTENT_ADMIN, ANALYTICS_ADMIN.
          </p>
        </div>

        {/* Policy 3: Anti-Cheat & Server Authority */}
        <div className="bg-[#070c1a] border border-cyan-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-cyber font-bold text-sm text-cyan-300">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>SERVER AUTHORITY</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold">
              ZERO TRUST
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            All Bingo claims, official draws, card validations, and point tallying are computed authoritatively against the database draw history. Client manipulation is blocked and penalized.
          </p>
        </div>

        {/* Policy 4: Security Rules Version */}
        <div className="bg-[#070c1a] border border-yellow-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-cyber font-bold text-sm text-yellow-300">
              <Key className="w-5 h-5 text-yellow-400" />
              <span>FIRESTORE RULES</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-950 border border-yellow-500/40 text-yellow-400 font-bold">
              RULES_VERSION = '2'
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Firestore Security Rules actively protect collections against unauthorized writes, shadow fields, and identity spoofing. Catch-all deny rule enabled.
          </p>
        </div>

      </div>

      {/* Database Management & Reset Tools */}
      <div className="bg-[#070c1a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="font-cyber font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-purple-400" />
          <span>DATABASE MANAGEMENT, RE-SEEDING & FACTORY RESET</span>
        </h2>

        <p className="text-xs font-mono text-slate-400 leading-relaxed">
          Re-sync default cybersecurity terminology, questions bank, system winning patterns, and hall themes, or perform a full Factory Reset to purge all rooms and restore the clean default database state.
        </p>

        {resetDone && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Database has been completely reset and restored to factory default seed data!</span>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding || resetting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'SYNCING DATABASE...' : seedDone ? 'DATABASE SYNCED SUCCESSFULLY' : 'RE-SYNC CORE DATASETS'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setConfirmResetOpen(true);
            }}
            disabled={resetting || seeding}
            className="px-5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-600 border border-red-500/50 text-red-200 hover:text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-900/20 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{resetting ? 'RESETTING DATABASE...' : 'RESET DATABASE'}</span>
          </button>
        </div>
      </div>

      {/* Confirm Reset Database Modal */}
      {confirmResetOpen && (
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
                disabled={resetting}
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleConfirmResetDatabase}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{resetting ? 'RESETTING...' : 'YES, RESET DATABASE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

