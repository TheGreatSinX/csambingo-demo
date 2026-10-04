import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  LogOut, 
  UserCheck,
  Mic,
  MicOff
} from 'lucide-react';
import { sound } from '../game/soundEngine';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [muted, setMuted] = useState(sound.getIsMuted());
  const [voiceOn, setVoiceOn] = useState(sound.getVoiceEnabled());
  const [globalPlayersMuted, setGlobalPlayersMuted] = useState(sound.getGlobalMuteAllPlayers());
  const location = useLocation();
  const { user, isAdmin, role, logout } = useAuth();

  React.useEffect(() => {
    return sound.subscribe(() => {
      setMuted(sound.getIsMuted());
      setVoiceOn(sound.getVoiceEnabled());
      setGlobalPlayersMuted(sound.getGlobalMuteAllPlayers());
    });
  }, []);

  const isHostOrAdminView =
    location.pathname.startsWith('/host') || location.pathname.startsWith('/admin');
  const isCallerMutedByAdmin = globalPlayersMuted && !isHostOrAdminView;

  const toggleSound = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    if (!next) sound.playClick();
  };

  const toggleVoice = () => {
    if (isCallerMutedByAdmin) return;
    const next = !voiceOn;
    sound.setVoiceEnabled(next);
    setVoiceOn(next);
    sound.playClick();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b0e1a]/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Classic Bingo Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1 min-w-0"
            onClick={() => sound.playClick()}
          >
            <div className="flex items-center -space-x-1.5 shrink-0">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border border-white/60 shadow">B</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs flex items-center justify-center border border-white/60 shadow">I</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border border-white/60 shadow">N</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border border-white/60 shadow">G</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white font-black text-[10px] sm:text-xs flex items-center justify-center border border-white/60 shadow">O</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-start gap-1">
                <span className="font-extrabold text-sm sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 leading-tight truncate">
                  CLASSIC BINGO
                </span>
                <sup className="hidden xs:inline-block sm:inline-block text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-sm -mt-0.5 select-none shrink-0">
                  Cyber Edition
                </sup>
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono text-amber-400/80 tracking-widest -mt-0.5 truncate">
                75-BALL GRAND HALL
              </div>
            </div>
          </Link>

          {/* Right Controls: Voice Caller + Sound Icon + Gear Icon + Auth Info */}
          <div className="flex items-center gap-2">
            {/* Voice Caller Announcer Toggle */}
            <button
              onClick={toggleVoice}
              disabled={isCallerMutedByAdmin}
              aria-label={voiceOn && !muted && !isCallerMutedByAdmin ? 'Disable caller voice announcement' : 'Enable caller voice announcement'}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isCallerMutedByAdmin
                  ? 'bg-red-950/40 border-red-500/30 text-red-300/70 cursor-not-allowed'
                  : voiceOn && !muted
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60 cursor-pointer'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-500 hover:text-slate-300 cursor-pointer'
              }`}
              title={
                isCallerMutedByAdmin
                  ? 'Voice Caller muted on Player screens by Administrator (Host Caller announces exclusively)'
                  : voiceOn
                  ? 'Voice Caller Active ("B 12")'
                  : 'Voice Caller Off'
              }
            >
              {voiceOn && !muted && !isCallerMutedByAdmin ? (
                <Mic className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isCallerMutedByAdmin ? 'CALLER (HOST ONLY)' : 'CALLER'}</span>
            </button>

            {/* Audio SFX Toggle (Remains active so players can still hear their own dauber pop/click sounds) */}
            <button
              onClick={toggleSound}
              aria-label={muted ? 'Unmute bingo sound effects' : 'Mute bingo sound effects'}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
              title={muted ? 'Sound Effects Muted' : 'Sound Effects Active (Dauber & Click SFX)'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Admin Console Gear Icon (Directly after Sound Icon) */}
            <Link
              to="/admin/dashboard"
              onClick={() => sound.playClick()}
              aria-label="Administrator Console"
              title="Administrator Console"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                location.pathname.startsWith('/admin')
                  ? 'bg-purple-950/70 border-purple-400/60 text-purple-300 shadow-sm'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Admin Status Chip */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-[11px] font-mono text-purple-300">
                <UserCheck className="w-3 h-3 text-purple-400" />
                <span>{role}</span>
              </div>
            )}

            {/* Logout button if authenticated */}
            {user && (
              <button
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-red-400 rounded border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">EXIT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

