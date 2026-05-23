import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Briefcase, Flag, BarChart2, Shield,
  UserX, UserCheck, Trash2, Search, CheckCircle,
  XCircle, Clock, AlertTriangle, TrendingUp, DollarSign, Eye,
  Database, Download, Upload, RotateCcw, HardDrive,
  CheckSquare, Info, MessageSquare, Paperclip
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Job } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

type AdminTab = 'stats' | 'users' | 'jobs' | 'complaints' | 'backup';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'violet' | 'danger' | 'default' }> = {
  open: { label: 'Открыт', variant: 'success' },
  in_progress: { label: 'В работе', variant: 'info' },
  done: { label: 'Ожидает приёмки', variant: 'warning' },
  paid: { label: 'Оплачено', variant: 'violet' },
  cancelled: { label: 'Отменён', variant: 'danger' },
};

const AdminPage: React.FC = () => {
  // Чтение tab из URL параметров
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as AdminTab | null;

  const {
    users, jobs, complaints, messages, reviews,
    blockUser, unblockUser, deleteJob, resolveComplaint, dismissComplaint,
    getUserById, refreshMessages,
    exportBackupFile, importBackupFile, resetToDefaults,
    dbSize,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>(urlTab || 'stats');
  
  // Обновление tab при изменении URL
  useEffect(() => {
    if (urlTab && ['stats', 'users', 'jobs', 'complaints', 'backup'].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Загрузка сообщений при выборе заказа администратором
  useEffect(() => {
    let interval: any;
    if (selectedJob) {
      refreshMessages(selectedJob.id);
      interval = setInterval(() => {
        refreshMessages(selectedJob.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedJob, refreshMessages]);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block modal state
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');

  // Stats
  const totalUsers = users.length;
  const totalFreelancers = users.filter(u => u.role === 'freelancer').length;
  const totalClients = users.filter(u => u.role === 'client').length;
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress').length;
  const paidJobs = jobs.filter(j => j.status === 'paid').length;
  const totalRevenue = jobs.filter(j => j.status === 'paid').reduce((acc, j) => acc + j.budget, 0);
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;

  // DB size from context (SQLite)
  const dbSizeDisplay = dbSize || '0 B';

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.role !== 'administrator' &&
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
       u.email.toLowerCase().includes(userSearch.toLowerCase()))
    ), [users, userSearch]);

  const filteredJobs = useMemo(() =>
    jobs.filter(j =>
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.description.toLowerCase().includes(jobSearch.toLowerCase())
    ), [jobs, jobSearch]);

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'stats', label: 'Статистика', icon: <BarChart2 size={16} /> },
    { key: 'users', label: 'Пользователи', icon: <Users size={16} />, badge: totalUsers },
    { key: 'jobs', label: 'Заказы', icon: <Briefcase size={16} />, badge: totalJobs },
    { key: 'complaints', label: 'Жалобы', icon: <Flag size={16} />, badge: pendingComplaints || undefined },
    { key: 'backup', label: 'База данных', icon: <Database size={16} /> },
  ];

  const handleExport = async () => {
    try {
      setBackupStatus({ type: 'info', msg: 'Создание резервной копии...' });
      await exportBackupFile();
      setBackupStatus({ type: 'success', msg: 'Резервная копия успешно скачана!' });
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      setBackupStatus({ type: 'error', msg: 'Ошибка при создании резервной копии.' });
    }
    setTimeout(() => setBackupStatus(null), 4000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupStatus({ type: 'info', msg: 'Загрузка резервной копии...' });
    const ok = await importBackupFile(file);
    if (ok) {
      setBackupStatus({ type: 'success', msg: 'Резервная копия успешно восстановлена!' });
    } else {
      setBackupStatus({ type: 'error', msg: 'Ошибка: файл повреждён или имеет неверный формат.' });
    }
    setTimeout(() => setBackupStatus(null), 5000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    await resetToDefaults();
    setShowResetConfirm(false);
    setBackupStatus({ type: 'info', msg: 'База данных сброшена к заводским настройкам.' });
    setTimeout(() => setBackupStatus(null), 4000);
  };

  const handleBlockConfirm = async () => {
    if (!blockTarget) return;
    if (!blockReason.trim()) {
      setBlockError('Укажите причину блокировки');
      return;
    }
    await blockUser(blockTarget.id, blockReason.trim());
    setBlockTarget(null);
    setBlockReason('');
    setBlockError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
          <Shield size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-green-400 font-mono">Панель администратора</h1>
          <p className="text-green-700/70 font-mono text-sm">Управление платформой MaxDev</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all font-mono ${
              tab === t.key
                ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-md shadow-green-900/30'
                : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-green-800 hover:text-green-500'
            }`}
          >
            {t.icon}
            {t.label}
            {t.badge !== undefined && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                tab === t.key ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Всего пользователей', value: totalUsers, icon: <Users size={20} />, color: 'violet', sub: `${totalFreelancers} фриланс. · ${totalClients} клиент.` },
              { label: 'Всего заказов', value: totalJobs, icon: <Briefcase size={20} />, color: 'sky', sub: `${openJobs} открытых` },
              { label: 'Выполнено заказов', value: paidJobs, icon: <CheckCircle size={20} />, color: 'emerald', sub: `${inProgressJobs} в работе` },
              { label: 'Оборот платформы', value: `${totalRevenue.toLocaleString()} ₽`, icon: <DollarSign size={20} />, color: 'amber', sub: 'по завершённым' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                {/*<div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === 'violet' ? 'bg-violet-950 text-violet-400' :
                  stat.color === 'sky' ? 'bg-sky-950 text-sky-400' :
                  stat.color === 'emerald' ? 'bg-emerald-950 text-emerald-400' :
                  'bg-amber-950 text-amber-400'
                }`}>
                  {stat.icon}
                </div>*/}
                <p className="text-2xl font-extrabold text-white font-mono">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-green-400 font-mono mb-5 flex items-center gap-2">
                {/*<TrendingUp size={18} />*/}
                Распределение заказов по статусу
              </h3>
              <div className="space-y-3">
                {Object.entries(STATUS_MAP).map(([key, info]) => {
                  const count = jobs.filter(j => j.status === key).length;
                  const pct = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{info.label}</span>
                        <span className="font-semibold text-gray-300 font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            info.variant === 'success' ? 'bg-emerald-500' :
                            info.variant === 'info' ? 'bg-sky-500' :
                            info.variant === 'warning' ? 'bg-amber-500' :
                            info.variant === 'violet' ? 'bg-violet-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-green-400 font-mono mb-5 flex items-center gap-2">
                {/*<Users size={18} />*/}
                Пользователи по роли
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Фрилансеры', count: totalFreelancers, color: 'bg-violet-500' },
                  { label: 'Клиенты', count: totalClients, color: 'bg-sky-500' },
                ].map(item => {
                  const pct = totalUsers > 1 ? Math.round((item.count / (totalUsers - 1)) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-gray-300 font-mono">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <h4 className="text-sm font-semibold text-gray-400 font-mono mb-3">Топ фрилансеры по рейтингу</h4>
                <div className="space-y-2">
                  {users
                    .filter(u => u.role === 'freelancer' && (u.rating || 0) > 0)
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 3)
                    .map(u => (
                      <div key={u.id} className="flex items-center gap-2">
                        <Avatar role={u.role} size="sm" />
                        <span className="text-sm text-gray-300 flex-1 truncate">{u.name}</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">★ {u.rating}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="mb-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </div>
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 font-mono"
              />
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950">
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Пользователь</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Email</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Роль</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Статус</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Дата</th>
                    <th className="text-right px-4 py-3.5 font-semibold text-green-600 font-mono">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-600 font-mono">Пользователи не найдены</td>
                    </tr>
                  )}
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar role={user.role} size="sm" />
                          <span className="font-medium text-gray-200">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono ${
                          user.role === 'client' ? 'bg-sky-950 text-sky-400' : 'bg-violet-950 text-violet-400'
                        }`}>
                          {user.role === 'client' ? 'Клиент' : 'Фрилансер'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlocked ? (
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-950 text-red-400 font-mono">Заблокирован</span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-400 font-mono">Активен</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {user.isBlocked ? (
                            <button
                              onClick={() => { unblockUser(user.id); }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 rounded-lg hover:bg-emerald-900/50 transition-colors font-mono"
                            >
                              <UserCheck size={13} />
                              Разблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockTarget({ id: user.id, name: user.name })}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/50 rounded-lg hover:bg-red-900/50 transition-colors font-mono"
                            >
                              <UserX size={13} />
                              Заблокировать
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {tab === 'jobs' && (
        <div>
          <div className="mb-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </div>
              <input
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 font-mono"
              />
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950">
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Заказ</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Клиент</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Бюджет</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Статус</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-green-600 font-mono">Отклики</th>
                    <th className="text-right px-4 py-3.5 font-semibold text-green-600 font-mono">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-600 font-mono">Заказы не найдены</td>
                    </tr>
                  )}
                  {filteredJobs.map(job => {
                    const client = getUserById(job.clientId);
                    return (
                      <tr key={job.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-200 truncate max-w-xs">{job.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{new Date(job.createdAt).toLocaleDateString('ru-RU')}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{client?.name}</td>
                        <td className="px-4 py-3 font-mono text-green-400 font-semibold">{job.budget.toLocaleString()} ₽</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_MAP[job.status]?.variant || 'default'}>
                            {STATUS_MAP[job.status]?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-300 font-mono">{(job.applications || []).length}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-400 bg-green-950/50 rounded-lg hover:bg-green-900/50 transition-colors font-mono"
                            >
                              <Eye size={13} />
                              Просмотр
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/50 rounded-lg hover:bg-red-900/50 transition-colors font-mono"
                            >
                              <Trash2 size={13} />
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {tab === 'complaints' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="space-y-4">
            {complaints.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500 font-mono">Жалоб нет</p>
              </div>
            )}
            {complaints.map(c => {
              const reporter = getUserById(c.reporterId);
              const target = getUserById(c.targetId);
              return (
                <div key={c.id} className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono ${
                          c.status === 'pending' ? 'bg-amber-950 text-amber-400' :
                          c.status === 'resolved' ? 'bg-emerald-950 text-emerald-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {c.status === 'pending' ? 'На рассмотрении' : c.status === 'resolved' ? 'Рассмотрена' : 'Отклонена'}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {new Date(c.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-500">От:</span> {reporter?.name} → <span className="text-gray-500">на:</span> {target?.name}
                      </p>
                      <p className="text-sm text-gray-400">{c.reason}</p>
                    </div>
                    {c.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { resolveComplaint(c.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/50 rounded-lg hover:bg-emerald-900/50 transition-colors"
                        >
                          {/*<CheckCircle size={13} />*/}
                          Решить
                        </button>
                        <button
                          onClick={() => { dismissComplaint(c.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                        >
                          {/*<XCircle size={13} />*/}
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {tab === 'backup' && (
        <div className="space-y-6">
          {backupStatus && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              backupStatus.type === 'success' ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' :
              backupStatus.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-400' :
              'bg-sky-950/40 border-sky-900/50 text-sky-400'
            }`}>
              {backupStatus.type === 'success' ? <CheckSquare size={18} /> :
               backupStatus.type === 'error' ? <AlertTriangle size={18} /> :
               <Info size={18} />}
              <span className="text-sm font-medium font-mono">{backupStatus.msg}</span>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-green-400 font-mono mb-1 flex items-center gap-2">
              {/*<HardDrive size={18} />*/}
              Управление базой данных
            </h3>
            <p className="text-sm text-gray-600 mb-6 font-mono">Данные хранятся в серверной SQLite базе данных</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Пользователи', value: users.length, icon: '' },
                { label: 'Заказы', value: jobs.length, icon: '' },
                { label: 'Сообщения', value: messages.length, icon: '' },
                { label: 'Отзывы', value: reviews.length, icon: '' },
                { label: 'Жалобы', value: complaints.length, icon: '' },
              ].map(item => (
                <div key={item.label} className={`${
                  item.label === 'Пользователи' ? 'bg-violet-950/30 text-violet-400 border-violet-900/40' :
                  item.label === 'Заказы' ? 'bg-sky-950/30 text-sky-400 border-sky-900/40' :
                  item.label === 'Сообщения' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' :
                  item.label === 'Отзывы' ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' :
                  'bg-red-950/30 text-red-400 border-red-900/40'
                } border rounded-xl p-3 text-center font-mono`}>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-2xl font-extrabold">{item.value}</div>
                  <div className="text-xs font-medium mt-0.5 opacity-75">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-950 rounded-xl font-mono">
              <Database size={15} className="text-green-600" />
              <span>Размер данных: <span className="font-semibold text-green-400">{dbSizeDisplay}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="bg-gray-900 border border-gray-800 hover:border-green-800 rounded-2xl p-6 text-center cursor-pointer group transition-colors"
              onClick={handleExport}
            >
              <div className="w-14 h-14 bg-green-950 group-hover:bg-green-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <Download size={24} className="text-green-400" />
              </div>
              <h3 className="font-bold text-gray-200 font-mono mb-2">Экспорт данных</h3>
              <p className="text-sm text-gray-500 mb-4">Скачать резервную копию базы данных в формате SQLite (.db)</p>
              <button className="w-full py-2.5 bg-green-950 hover:bg-green-900 text-green-400 font-semibold rounded-xl text-sm font-mono transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Скачать копию
              </button>
            </div>

            <div
              className="bg-gray-900 border border-gray-800 hover:border-sky-800 rounded-2xl p-6 text-center cursor-pointer group transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 bg-sky-950 group-hover:bg-sky-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <Upload size={24} className="text-sky-400" />
              </div>
              <h3 className="font-bold text-gray-200 font-mono mb-2">Импорт данных</h3>
              <p className="text-sm text-gray-500 mb-4">Восстановить данные из файла SQLite (.db)</p>
              <button className="w-full py-2.5 bg-sky-950 hover:bg-sky-900 text-sky-400 font-semibold rounded-xl text-sm font-mono transition-colors flex items-center justify-center gap-2">
                <Upload size={16} />
                Загрузить копию
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db,.json"
                onChange={handleImport}
                className="hidden"
              />
            </div>

            <div
              className="bg-gray-900 border border-gray-800 hover:border-red-800 rounded-2xl p-6 text-center cursor-pointer group transition-colors"
              onClick={() => setShowResetConfirm(true)}
            >
              <div className="w-14 h-14 bg-red-950 group-hover:bg-red-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <RotateCcw size={24} className="text-red-400" />
              </div>
              <h3 className="font-bold text-gray-200 font-mono mb-2">Сброс данных</h3>
              <p className="text-sm text-gray-500 mb-4">Вернуть БД к демо-данным. Все изменения будут утеряны!</p>
              <button className="w-full py-2.5 bg-red-950 hover:bg-red-900 text-red-400 font-semibold rounded-xl text-sm font-mono transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={16} />
                Сбросить БД
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK USER MODAL */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBlockTarget(null)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-red-900/50 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-950 border border-red-800 rounded-2xl flex items-center justify-center">
                  <UserX size={22} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white font-mono">Блокировка пользователя</h2>
                  <p className="text-sm text-gray-500">{blockTarget.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 font-mono mb-2">
                  Причина блокировки <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={e => { setBlockReason(e.target.value); setBlockError(''); }}
                  rows={4}
                  placeholder="Укажите причину блокировки пользователя..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 resize-none transition-colors font-mono"
                />
                {blockError && (
                  <p className="text-xs text-red-500 mt-1 font-mono">{blockError}</p>
                )}
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl mb-5">
                <p className="text-xs text-amber-400 font-mono">
                  ⚠️ Пользователь получит уведомление с причиной блокировки при следующей попытке войти.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBlockTarget(null)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm font-mono transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBlockConfirm}
                  className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl text-sm font-mono transition-colors flex items-center justify-center gap-2"
                >
                  <UserX size={16} />
                  Заблокировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job detail modal - ADMIN CAN SEE CHAT AND FILES */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title="Детали заказа (режим администратора)"
      >
        {selectedJob && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={STATUS_MAP[selectedJob.status]?.variant || 'default'}>
                  {STATUS_MAP[selectedJob.status]?.label}
                </Badge>
                <span className="text-xs text-slate-400">
                  {new Date(selectedJob.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedJob.title}</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-line">{selectedJob.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
                <DollarSign size={16} className="text-violet-600" />
                <div>
                  <p className="text-xs text-slate-400">Бюджет</p>
                  <p className="font-bold text-slate-900">{selectedJob.budget.toLocaleString()} ₽</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-xl">
                <Clock size={16} className="text-sky-600" />
                <div>
                  <p className="text-xs text-slate-400">Дедлайн</p>
                  <p className="font-bold text-slate-900">{new Date(selectedJob.deadline).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Навыки</p>
              <div className="flex flex-wrap gap-2">
                {selectedJob.skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">{s}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Участники</p>
              <div className="space-y-2">
                {(() => {
                  const client = getUserById(selectedJob.clientId);
                  const freelancer = selectedJob.freelancerId ? getUserById(selectedJob.freelancerId) : null;
                  return (
                    <>
                      {client && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Avatar role={client.role} size="md" />
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{client.name}</p>
                            <p className="text-xs text-slate-400">Заказчик</p>
                          </div>
                        </div>
                      )}
                      {freelancer && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Avatar role={freelancer.role} size="md" />
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{freelancer.name}</p>
                            <p className="text-xs text-slate-400">Исполнитель</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* ADMIN CAN SEE CHAT */}
            <div>
              {(() => {
                const jobMessages = messages.filter(m => m.jobId === selectedJob.id);
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={16} className="text-slate-600" />
                      <p className="text-sm font-semibold text-slate-700">Переписка ({jobMessages.length} сообщений)</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-80 overflow-y-auto p-4">
                      {jobMessages.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Сообщений нет</p>
                      ) : (
                        <div className="space-y-3">
                          {jobMessages.map(msg => {
                            const sender = getUserById(msg.senderId);
                            return (
                              <div key={msg.id} className="flex items-start gap-3">
                                <Avatar role={sender?.role} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-semibold text-slate-900">{sender?.name}</span>
                                    <span className="text-xs text-slate-500">
                                      {new Date(msg.createdAt).toLocaleString('ru-RU')}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{msg.text}</p>
                                    {msg.file && (
                                      <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-600">
                                        <Paperclip size={12} />
                                        <a href={msg.file} target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-800">
                                          {msg.fileName || 'Файл'}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">
                ✓ Администратор имеет полный доступ к переписке и файлам
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setSelectedJob(null)}>
              Закрыть
            </Button>
          </div>
        )}
      </Modal>

      {/* Reset confirm modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Подтверждение сброса"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 mb-1">Это действие необратимо!</p>
              <p className="text-sm text-red-700">
                Все текущие данные (пользователи, заказы, сообщения, отзывы) будут удалены и заменены
                исходными демо-данными. Рекомендуем сначала сделать экспорт.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>
              Отмена
            </Button>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Сбросить базу данных
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;