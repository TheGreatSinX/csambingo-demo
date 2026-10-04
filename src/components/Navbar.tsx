import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Radio, 
  Settings, 
  LogOut, 
  UserCheck,
  Menu,
  X,
  Mic,
  MicOff
} from 'lucide-react';
import { sound } from '../game/soundEngine';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [muted, setMuted] = useState(sound.getIsMuted());
  const [voiceOn, setVoiceOn] = useState(sound.getVoiceEnabled());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, role, logout } = useAuth();

  const toggleSound = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    if (!next) sound.playClick();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    sound.setVoiceEnabled(next);
    setVoiceOn(next);
    sound.playClick();
  };

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0b0e1a]/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Classic Bingo Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1"
            onClick={() => sound.playClick()}
          >
            <div className="flex items-center -space-x-1.5">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center border border-white/60 shadow">B</span>
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center border border-white/60 shadow">I</span>
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center border border-white/60 shadow">N</span>
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center border border-white/60 shadow">G</span>
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center border border-white/60 shadow">O</span>
            </div>
            <div>
              <div className="flex items-start gap-1">
                <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 leading-tight">
                  CLASSIC BINGO
                </span>
                <sup className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-sm -mt-0.5 select-none">
                  Cyber Edition
                </sup>
              </div>
              <div className="text-[10px] font-mono text-amber-400/80 tracking-widest -mt-0.5">
                75-BALL GRAND HALL
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                isCurrent('/') 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm' 
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
              }`}
              onClick={() => sound.playClick()}
            >
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" />
                PLAY BINGO
              </span>
            </Link>

            <Link
              to="/host"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                location.pathname.startsWith('/host')
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900'
              }`}
              onClick={() => sound.playClick()}
            >
              <span className="flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                CALLER STAGE (HOST)
              </span>
            </Link>

            <Link
              to="/admin/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                location.pathname.startsWith('/admin')
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-purple-300 hover:bg-slate-900'
              }`}
              onClick={() => sound.playClick()}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                HALL MANAGER
              </span>
            </Link>
          </nav>

          {/* Right Controls: Voice Caller + Audio + Auth Info */}
          <div className="flex items-center gap-2">
            {/* Voice Caller Announcer Toggle */}
            <button
              onClick={toggleVoice}
              aria-label={voiceOn ? 'Disable caller voice announcement' : 'Enable caller voice announcement'}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                voiceOn && !muted
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-500 hover:text-slate-300'
              }`}
              title={voiceOn ? 'Voice Caller Active ("B-12!")' : 'Voice Caller Off'}
            >
              {voiceOn && !muted ? <Mic className="w-3.5 h-3.5 text-amber-400" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">CALLER</span>
            </button>

            {/* Audio SFX Toggle */}
            <button
              onClick={toggleSound}
              aria-label={muted ? 'Unmute bingo sound effects' : 'Mute bingo sound effects'}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
              title={muted ? 'Sound Effects Muted' : 'Sound Effects Active'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-amber-400 bg-slate-900 border border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 bg-[#0b0e1a] space-y-2">
            <Link
              to="/"
              className="block px-3 py-2 rounded text-sm font-bold text-slate-200 hover:bg-amber-950/50 hover:text-amber-300"
              onClick={() => { setMobileMenuOpen(false); sound.playClick(); }}
            >
              PLAY BINGO (SOLO OR JOIN PIN)
            </Link>
            <Link
              to="/host"
              className="block px-3 py-2 rounded text-sm font-bold text-slate-200 hover:bg-emerald-950/50 hover:text-emerald-300"
              onClick={() => { setMobileMenuOpen(false); sound.playClick(); }}
            >
              CALLER STAGE (HOST ROOM)
            </Link>
            <Link
              to="/admin/dashboard"
              className="block px-3 py-2 rounded text-sm font-bold text-slate-200 hover:bg-purple-950/50 hover:text-purple-300"
              onClick={() => { setMobileMenuOpen(false); sound.playClick(); }}
            >
              HALL MANAGER CONSOLE
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
