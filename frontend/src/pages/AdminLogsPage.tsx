import React, { useState } from 'react';
import { Activity, Search, Download } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { ActivityLog } from '../types';
import { cn } from '../utils/cn';

const LOG_CONFIG: Record<ActivityLog['type'], { label: string; color: string; bg: string }> = {
  auth:       { label: 'AUTH',    color: 'text-green-400',   bg: 'bg-green-950/40 border-green-900/40' },
  register:   { label: 'REG',     color: 'text-violet-400',  bg: 'bg-violet-950/40 border-violet-900/40' },
  block:      { label: 'BLOCK',   color: 'text-red-400',     bg: 'bg-red-950/40 border-red-900/40' },
  unblock:    { label: 'UNBLOCK', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-900/40' },
  job_create: { label: 'JOB+',    color: 'text-sky-400',     bg: 'bg-sky-950/40 border-sky-900/40' },
  job_delete: { label: 'JOB-',    color: 'text-orange-400',  bg: 'bg-orange-950/40 border-orange-900/40' },
  apply:      { label: 'APPLY',   color: 'text-cyan-400',    bg: 'bg-cyan-950/40 border-cyan-900/40' },
  accept:     { label: 'ACCEPT',  color: 'text-teal-400',    bg: 'bg-teal-950/40 border-teal-900/40' },
  done:       { label: 'DONE',    color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-900/40' },
  paid:       { label: 'PAID',    color: 'text-yellow-400',  bg: 'bg-yellow-950/40 border-yellow-900/40' },
  complaint:  { label: 'FLAG',    color: 'text-rose-400',    bg: 'bg-rose-950/40 border-rose-900/40' },
  system:     { label: 'SYS',     color: 'text-gray-400',    bg: 'bg-gray-900/60 border-gray-800/40' },
};

const ALL_TYPES = Object.keys(LOG_CONFIG) as ActivityLog['type'][];

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU');
};

const AdminLogsPage: React.FC = () => {
  const { activityLogs } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ActivityLog['type'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;

  const filtered = activityLogs.filter(log => {
    const matchType = filterType === 'all' || log.type === filterType;
    const matchSearch = !search.trim() ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      (log.userName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const text = filtered.map(log => {
      const cfg = LOG_CONFIG[log.type];
      return `[${formatDateTime(log.createdAt)}] [${cfg.label}] ${log.message}${log.userName ? ` @${log.userName}` : ''}`;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maxdev_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
          <Activity size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-green-400 font-mono">Журнал активности</h1>
          <p className="text-green-700/70 font-mono text-sm">{activityLogs.length} записей · все события платформы</p>
        </div>
        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-950/50 border border-green-800 text-green-400 rounded-xl hover:bg-green-950 hover:border-green-600 transition-all text-sm font-mono"
        >
          <Download size={15} />
          Экспорт
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Search size={15} />
          </div>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по сообщению или пользователю..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 font-mono"
          />
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value as ActivityLog['type'] | 'all'); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-700 font-mono"
        >
          <option value="all">Все типы ({activityLogs.length})</option>
          {ALL_TYPES.map(t => {
            const cfg = LOG_CONFIG[t];
            const count = activityLogs.filter(l => l.type === t).length;
            return (
              <option key={t} value={t}>[{cfg.label}] {t} ({count})</option>
            );
          })}
        </select>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TYPES.filter(t => activityLogs.filter(l => l.type === t).length > 0).map(t => {
          const cfg = LOG_CONFIG[t];
          const count = activityLogs.filter(l => l.type === t).length;
          return (
            <button
              key={t}
              onClick={() => { setFilterType(filterType === t ? 'all' : t); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all',
                cfg.bg,
                filterType === t ? `${cfg.color} ring-1 ring-current` : `${cfg.color} opacity-60 hover:opacity-100`
              )}
            >
              <span>{cfg.label}</span>
              <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Logs table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/80">
                <th className="text-left px-4 py-3 text-green-600 w-40">Время</th>
                <th className="text-left px-4 py-3 text-green-600 w-24">Тип</th>
                <th className="text-left px-4 py-3 text-green-600">Событие</th>
                <th className="text-left px-4 py-3 text-green-600 w-36 hidden lg:table-cell">Пользователь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-600">
                    Записей не найдено
                  </td>
                </tr>
              )}
              {paginated.map(log => {
                const cfg = LOG_CONFIG[log.type] || LOG_CONFIG.system;
                return (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-600 tabular-nums">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('font-bold', cfg.color)}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">{log.message}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden lg:table-cell">
                      {log.userName ? `@${log.userName}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-600 font-mono">
              {filtered.length} записей · страница {page} из {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 text-xs font-mono transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 text-xs font-mono transition-colors"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

      {activityLogs.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-600 font-mono">Журнал активности пуст</p>
          <p className="text-gray-700 text-sm font-mono mt-1">События будут появляться по мере работы платформы</p>
        </div>
      )}
    </div>
  );
};

export default AdminLogsPage;
