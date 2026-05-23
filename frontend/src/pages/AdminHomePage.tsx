import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Briefcase, Flag, Database,
  TrendingUp, CheckCircle,
  Terminal, Activity, Lock, Eye, ChevronRight,
  Zap, Server, GitBranch
} from 'lucide-react';
import { useApp } from '../store/AppContext';

// Animated typing effect
const TypeWriter: React.FC<{ text: string; speed?: number; className?: string }> = ({
  text, speed = 35, className = ''
}) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse text-green-400">█</span>}
    </span>
  );
};

// Blinking dot
const Blinker: React.FC<{ color?: string }> = ({ color = 'bg-green-400' }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`} />
);

const AdminHomePage: React.FC = () => {
  const { currentUser, users, jobs, complaints, activityLogs, adminStats, loadAdminData } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Админская сводка обновляется отдельно, чтобы счётчики отображались сразу
    loadAdminData();
    const timer = setInterval(() => loadAdminData(), 5000);
    return () => clearInterval(timer);
  }, [loadAdminData]);

  const totalUsers = users.filter(u => u.role !== 'administrator').length;
  const blockedUsers = users.filter(u => u.isBlocked).length;
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const pendingComplaints = complaints.filter((c: any) => c.status === 'pending').length;
  const totalRevenue = jobs.filter(j => j.status === 'paid').reduce((s, j) => s + j.budget, 0);

  const timeStr = currentTime.toLocaleTimeString('ru-RU');
  const dateStr = currentTime.toLocaleDateString('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const recentLogs = activityLogs.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Top terminal bar */}
      <div className="flex items-center justify-between mb-8 p-3 bg-black/60 border border-green-900/50 rounded-xl font-mono text-xs backdrop-blur-sm">
        <div className="flex items-center gap-3 text-green-400">
          <Terminal size={14} />
          <span>maxdev@admin:~$</span>
          <span className="text-green-300 opacity-70">sudo system-monitor --live</span>
        </div>
        <div className="flex items-center gap-4 text-green-600">
          <div className="flex items-center gap-1.5">
            <Blinker />
            <span className="text-green-400">{timeStr}</span>
          </div>
          <span className="hidden sm:block text-green-700 truncate max-w-xs">{dateStr}</span>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="relative mb-8 p-8 bg-black/70 border border-green-800/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl shadow-green-900/20">
        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-green-500/50 rounded-tl" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-green-500/50 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-green-500/50 rounded-bl" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-green-500/50 rounded-br" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Shield size={28} className="text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Blinker color="bg-green-400" />
                  <span className="text-green-500 text-xs font-mono uppercase tracking-widest">Система авторизована</span>
                </div>
                <p className="text-gray-500 text-sm font-mono">Уровень доступа: <span className="text-green-400">ROOT</span></p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black mb-3 font-mono">
              <span className="text-gray-500">{'> '}</span>
              <span className="text-white">Добро пожаловать,{' '}</span>
              <span className="text-green-400">{currentUser?.name}</span>
            </h1>

            <p className="text-gray-400 font-mono text-sm max-w-xl">
              <TypeWriter
                text="Система MaxDev работает в штатном режиме. Все сервисы активны. Полный доступ предоставлен."
                speed={25}
              />
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 text-sm font-mono"
            >
              {/*<Terminal size={16} />*/}
              Панель управления
              {/*<ChevronRight size={16} />*/}
            </Link>
            <Link
              to="/admin-logs"
              className="flex items-center gap-2 px-6 py-3 border border-green-800 hover:border-green-600 text-green-400 hover:text-green-300 rounded-xl transition-all text-sm font-mono"
            >
              {/*<Activity size={16} />*/}
              Журнал активности ({activityLogs.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Live stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Пользователей',
            value: totalUsers,
            sub: `${blockedUsers} заблокировано`,
            //icon: <Users size={20} />,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-800/40',
            dot: 'bg-violet-400',
          },
          {
            label: 'Открытых заказов',
            value: openJobs,
            sub: `${activeJobs} в работе`,
            //icon: <Briefcase size={20} />,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10 border-sky-800/40',
            dot: 'bg-sky-400',
          },
          {
            label: 'Оборот платформы',
            value: `${totalRevenue.toLocaleString()} ₽`,
            sub: 'завершённые проекты',
            //icon: <TrendingUp size={20} />,
            color: 'text-green-400',
            bg: 'bg-green-500/10 border-green-800/40',
            dot: 'bg-green-400',
          },
          {
            label: 'Сообщений в системе',
              value: adminStats.messages,
            sub: 'приватные переписки',
            //icon: <Lock size={20} />,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-800/40',
            dot: 'bg-amber-400',
          },
          {
            label: 'Жалобы',
            value: pendingComplaints,
            sub: `${complaints.length} всего`,
            //icon: <Flag size={20} />,
            color: pendingComplaints > 0 ? 'text-red-400' : 'text-emerald-400',
            bg: pendingComplaints > 0 ? 'bg-red-500/10 border-red-800/40' : 'bg-emerald-500/10 border-emerald-800/40',
            dot: pendingComplaints > 0 ? 'bg-red-400' : 'bg-emerald-400',
          },
          {
            label: 'Всего заказов',
            value: jobs.length,
            sub: `${jobs.filter(j => j.status === 'paid').length} выполнено`,
            //icon: <Activity size={20} />,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10 border-pink-800/40',
            dot: 'bg-pink-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} border rounded-2xl p-5 backdrop-blur-sm`}
          >
            {/*<div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <Blinker color={stat.dot} />
            </div>*/}
            <div className={`text-3xl font-black font-mono mb-1 ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-gray-300 text-sm font-medium">{stat.label}</div>
            <div className="text-gray-600 text-xs mt-0.5 font-mono">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* System status + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* System status */}
        <div className="bg-black/70 border border-green-900/40 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-green-400 font-bold font-mono mb-5 flex items-center gap-2">
            {/*<Server size={16} />*/}
            Состояние системы
          </h2>
          <div className="space-y-3">
            {[
              { name: 'API Gateway', status: 'online', latency: '12ms' },
              { name: 'SQLite Database (server)', status: 'online', latency: '1ms' },
              { name: 'Файловое хранилище', status: 'online', latency: '8ms' },
              { name: 'Система уведомлений', status: 'online', latency: '5ms' },
              { name: 'Чат-сервер', status: 'online', latency: '23ms' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between py-2 border-b border-green-900/20 last:border-0">
                <div className="flex items-center gap-3">
                  <Blinker color="bg-green-400" />
                  <span className="text-gray-300 text-sm font-mono">{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs font-mono">{service.latency}</span>
                  <span className="text-green-400 text-xs font-mono font-bold uppercase">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-black/70 border border-green-900/40 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-green-400 font-bold font-mono mb-5 flex items-center gap-2">
            {/*<Zap size={16} />*/}
            Быстрые действия
          </h2>
          <div className="space-y-3">
            {[
              { to: '/admin?tab=users', label: 'Управление пользователями', icon: <Users size={16} />, desc: `${totalUsers} пользователей`, color: 'text-violet-400 border-violet-900/50 hover:border-violet-600/50' },
              { to: '/admin?tab=jobs', label: 'Просмотр всех заказов', icon: <Briefcase size={16} />, desc: `${jobs.length} заказов`, color: 'text-sky-400 border-sky-900/50 hover:border-sky-600/50' },
              { to: '/admin?tab=complaints', label: 'Жалобы', icon: <Flag size={16} />, desc: `${pendingComplaints} ожидает`, color: pendingComplaints > 0 ? 'text-red-400 border-red-900/50 hover:border-red-600/50' : 'text-gray-500 border-gray-800/50' },
              { to: '/admin?tab=backup', label: 'Резервное копирование', icon: <Database size={16} />, desc: 'SQLite экспорт / импорт', color: 'text-green-400 border-green-900/50 hover:border-green-600/50' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={`flex items-center justify-between p-3 border rounded-xl transition-all group ${action.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    {action.icon}
                  </div>
                  <span className="text-gray-300 group-hover:text-white text-sm font-mono transition-colors">
                    {action.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs font-mono">{action.desc}</span>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity log */}
      <div className="bg-black/70 border border-green-900/40 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-green-400 font-bold font-mono flex items-center gap-2">
            {/*<GitBranch size={16} />*/}
            Последние события
          </h2>
          <Link
            to="/admin-logs"
            className="text-xs text-green-700 hover:text-green-500 font-mono transition-colors flex items-center gap-1"
          >
            Все логи <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-2 font-mono text-xs">
          {recentLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-700">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-green-500">[{timeStr}]</span>
                <span className="text-green-600">SYSTEM</span>
                <span className="text-green-400">Система запущена. Ожидание событий... <span className="animate-pulse">█</span></span>
              </div>
            </div>
          ) : (
            <>
              {recentLogs.map((log) => {
                const colors: Record<string, string> = {
                  auth: 'text-green-400', register: 'text-violet-400', block: 'text-red-400',
                  unblock: 'text-emerald-400', job_create: 'text-sky-400', job_delete: 'text-orange-400',
                  apply: 'text-cyan-400', accept: 'text-teal-400', done: 'text-amber-400',
                  paid: 'text-yellow-400', appeal: 'text-pink-400', complaint: 'text-rose-400',
                  system: 'text-gray-400',
                };
                const labels: Record<string, string> = {
                  auth: 'AUTH', register: 'REG', block: 'BLOCK', unblock: 'UNBLK',
                  job_create: 'JOB+', job_delete: 'JOB-', apply: 'APPLY', accept: 'ACPT',
                  done: 'DONE', paid: 'PAID', appeal: 'APPL', complaint: 'FLAG', system: 'SYS',
                };
                const color = colors[log.type] || 'text-gray-400';
                const label = labels[log.type] || 'SYS';
                const parsedDate = log.createdAt ? new Date(log.createdAt) : null;
                const time = parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleTimeString('ru-RU')
                  : '--:--:--';
                return (
                  <div key={log.id} className="flex items-start gap-4 py-1.5 border-b border-green-900/20 last:border-0">
                    <span className="text-gray-700 shrink-0 tabular-nums">[{time}]</span>
                    <span className={`${color} shrink-0 w-12`}>{label}</span>
                    <span className="text-gray-400">{log.message}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-2 text-green-500">
                <span>[{timeStr}]</span>
                <span className="text-green-600">SYSTEM</span>
                <span className="text-green-400">
                  Мониторинг активен <span className="animate-pulse">█</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 flex items-center justify-between text-xs font-mono text-gray-700">
        <div className="flex items-center gap-2">
          <Eye size={12} />
          <span>MaxDev Admin Console v1.2.0</span>
        </div>
        <div className="flex items-center gap-2">
          {/*<CheckCircle size={12} className="text-green-700" />*/}
          <span>Все системы в норме</span>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
