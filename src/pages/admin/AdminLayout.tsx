import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gamepad2, 
  PlusCircle, 
  FileText, 
  HelpCircle, 
  Grid, 
  Palette, 
  Sliders, 
  BarChart2, 
  FileCode2, 
  Settings, 
  LogOut, 
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../game/soundEngine';
import { getHiddenSidebarPaths } from '../../services/adminService';

export const AdminLayout: React.FC = () => {
  const { loading, adminProfile, isAdmin, mfaVerified, logout } = useAuth();
  const location = useLocation();
  const [hiddenPaths, setHiddenPaths] = useState<string[]>(() => getHiddenSidebarPaths());

  useEffect(() => {
    const handleVisibilityChange = () => {
      setHiddenPaths(getHiddenSidebarPaths());
    };
    window.addEventListener('admin-sidebar-visibility-changed', handleVisibilityChange);
    return () => window.removeEventListener('admin-sidebar-visibility-changed', handleVisibilityChange);
  }, []);

  if (loading && !adminProfile) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-mono text-xs text-purple-300 tracking-wider">VERIFYING ADMINISTRATOR SESSION...</div>
      </div>
    );
  }

  // If user is not authenticated or not an admin, redirect to admin login
  if (!adminProfile || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user is admin but MFA is required and not verified, redirect to /admin/mfa
  if (adminProfile.mfaEnforced && !mfaVerified) {
    return <Navigate to="/admin/mfa" replace />;
  }

  const navLinks = [
    { path: '/admin/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { path: '/admin/games', label: 'Active Games', icon: Gamepad2 },
    { path: '/admin/games/create', label: 'Game Builder', icon: PlusCircle },
    { path: '/admin/content', label: 'Content CMS', icon: FileText },
    { path: '/admin/questions', label: 'Questions Bank', icon: HelpCircle },
    { path: '/admin/patterns', label: 'Pattern Editor', icon: Grid },
    { path: '/admin/themes', label: 'Theme Editor', icon: Palette },
    { path: '/admin/templates', label: 'Game Templates', icon: Sliders },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin/audit', label: 'Audit Trail', icon: FileCode2 },
    { path: '/admin/settings', label: 'Security & System', icon: Settings },
  ].filter(item => !hiddenPaths.includes(item.path));

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-200 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#070b18] border-r border-purple-500/20 flex flex-col shrink-0">
        
        {/* Admin Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cyber font-bold text-sm text-purple-300 tracking-wider">CLASSIC BINGO</span>
                <sup className="text-[8px] font-mono font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 select-none">
                  Cyber Edition
                </sup>
              </div>
              <div className="text-[10px] font-mono text-slate-400">HALL MANAGER SOC</div>
            </div>
          </div>
        </div>

        {/* Admin Profile Chip */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-purple-950/30 border border-purple-500/30 font-mono text-xs space-y-1">
          <div className="flex items-center justify-between text-purple-300 font-semibold">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              {adminProfile.role}
            </span>
            <span className="text-[10px] text-green-400 bg-green-950/60 px-1.5 py-0.5 rounded border border-green-500/40">
              MFA ON
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={adminProfile.email}>
            {adminProfile.email}
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => sound.playClick()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-cyber text-xs tracking-wider transition-all ${
                  active
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 font-bold cyber-glow-purple'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-cyber text-slate-400 hover:text-cyan-300 bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 transition-colors"
          >
            <span>← PUBLIC GAME GATEWAY</span>
          </Link>

          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-cyber text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/60 border border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>TERMINATE SESSION</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto cyber-grid-bg">
        <Outlet />
      </main>

    </div>
  );
};
