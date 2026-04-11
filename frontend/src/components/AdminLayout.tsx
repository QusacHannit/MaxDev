import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Terminal, Shield,
  LogOut, ChevronRight, Activity, Menu, X,
  Flag
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { ActivityLog } from '../types';
import { cn } from '../utils/cn';
import { Avatar } from './ui/Avatar';

// Matrix canvas background
const MatrixCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコサシスセソ█▓▒░∂∆∑Ω';
    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,180,50,0.18)';
      ctx.font = `${fontSize}px monospace`;
      cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(1);
      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 60);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-100"
      style={{ opacity: 0.07 }}
    />
  );
};

// Log type labels & colors
const LOG_CONFIG: Record<ActivityLog['type'], { label: string; color: string }> = {
  auth:       { label: 'AUTH',    color: 'text-green-400' },
  register:   { label: 'REG',     color: 'text-violet-400' },
  block:      { label: 'BLOCK',   color: 'text-red-400' },
  unblock:    { label: 'UNBLOCK', color: 'text-emerald-400' },
  job_create: { label: 'JOB+',    color: 'text-sky-400' },
  job_delete: { label: 'JOB-',    color: 'text-orange-400' },
  apply:      { label: 'APPLY',   color: 'text-cyan-400' },
  accept:     { label: 'ACCEPT',  color: 'text-teal-400' },
  done:       { label: 'DONE',    color: 'text-amber-400' },
  paid:       { label: 'PAID',    color: 'text-yellow-400' },
  complaint:  { label: 'FLAG',    color: 'text-rose-400' },
  system:     { label: 'SYS',     color: 'text-gray-400' },
};

const formatTime = (iso?: string) => {
  if (!iso) return '--:--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Admin Navbar
const AdminNavbar: React.FC = () => {
  const { currentUser, logout, complaints } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingComplaints = complaints.filter((c: any) => c.status === 'pending').length;
  const alerts = pendingComplaints;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { to: '/', label: 'Консоль', icon: <Terminal size={15} /> },
    { to: '/admin', label: 'Управление', icon: <Shield size={15} /> },
    { to: '/admin-logs', label: 'Логи', icon: <Activity size={15} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/80 border-b border-green-900/40 backdrop-blur-xl shadow-lg shadow-green-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30">
              <Shield size={16} className="text-black" />
            </div>
            <div className="font-mono font-extrabold">
              <span className="text-green-400">Max</span>
              <span className="text-white">Dev</span>
              <span className="text-green-600 text-xs ml-1">ADMIN</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all duration-200',
                  isActive(link.to) && link.to !== '/'
                    ? 'bg-green-900/50 text-green-400 border border-green-800/60'
                    : location.pathname === '/' && link.to === '/'
                    ? 'bg-green-900/50 text-green-400 border border-green-800/60'
                    : 'text-gray-500 hover:text-green-400 hover:bg-green-900/20'
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Time */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {currentTime.toLocaleTimeString('ru-RU')}
            </div>

            {/* Alerts */}
            {alerts > 0 && (
              <Link
                to="/admin"
                className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/50 hover:border-red-600 transition-colors"
              >
                <Flag size={14} className="text-red-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {alerts}
                </span>
              </Link>
            )}

            {/* User */}
            {currentUser && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-900/60 border border-gray-800 rounded-lg">
                <Avatar alt={currentUser.name} role={currentUser.role} size="sm" className="!w-6 !h-6 !text-[10px] !ring-1 !ring-green-800" />
                <span className="hidden sm:block text-xs font-mono text-green-400 max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <span className="hidden sm:block text-[10px] font-mono text-green-700 bg-green-950 px-1.5 py-0.5 rounded">
                  ROOT
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-950/60 hover:border-red-700 transition-all text-xs font-mono"
            >
              <LogOut size={14} />
              <span className="hidden sm:block">Выход</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-gray-800 text-gray-400 hover:text-green-400 hover:border-green-800 transition-colors"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-green-900/30 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono text-gray-400 hover:text-green-400 hover:bg-green-900/20 transition-colors"
              >
                {link.icon}
                {link.label}
                <ChevronRight size={14} className="ml-auto" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

// Admin footer with live logs
const AdminFooter: React.FC = () => {
  const { activityLogs } = useApp();
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const recentLogs = activityLogs.slice(0, expanded ? 30 : 5);

  useEffect(() => {
    if (expanded && logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [expanded, activityLogs.length]);

  return (
    <footer className="border-t border-green-900/30 bg-black/60 backdrop-blur-sm font-mono text-xs mt-8">
      {/* Log header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-3 text-green-600 hover:text-green-400 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Activity size={13} className="text-green-500" />
            <span className="text-green-500 font-semibold">SYSTEM LOG</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-600">{activityLogs.length} записей</span>
            {activityLogs.length > 0 && (
              <span className="text-gray-700">
                — последнее: {formatTime(activityLogs[0]?.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-400">
            <span>{expanded ? 'Свернуть' : 'Развернуть'}</span>
            <ChevronRight
              size={13}
              className={cn('transition-transform duration-200', expanded ? 'rotate-90' : '')}
            />
          </div>
        </button>

        {/* Log entries */}
        {expanded && (
          <div
            ref={logRef}
            className="pb-4 max-h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin"
          >
            {recentLogs.length === 0 && (
              <div className="text-gray-700 py-4 text-center">Логи отсутствуют</div>
            )}
            {recentLogs.map((log) => {
              const cfg = LOG_CONFIG[log.type] || LOG_CONFIG.system;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-1 border-b border-green-900/10 last:border-0"
                >
                  <span className="text-gray-700 shrink-0 tabular-nums w-20">
                    {formatTime(log.createdAt)}
                  </span>
                  <span className={cn('shrink-0 w-16 font-bold', cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="text-gray-400 break-words min-w-0">{log.message}</span>
                  {log.userName && (
                    <span className="text-gray-600 shrink-0 hidden lg:block">@{log.userName}</span>
                  )}
                </div>
              );
            })}
            {activityLogs.length > 30 && (
              <div className="text-center text-gray-700 pt-2">
                + ещё {activityLogs.length - 30} записей (экспортируйте БД для полного просмотра)
              </div>
            )}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between py-2 border-t border-green-900/20 text-gray-700">
          <span>MaxDev Admin Console v1.2.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-800">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main AdminLayout wrapper
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950 relative flex flex-col">
      {/* Matrix background */}
      <MatrixCanvas />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,70,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,70,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Navbar */}
      <div className="relative z-10">
        <AdminNavbar />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Footer with logs */}
      <div className="relative z-10">
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;
