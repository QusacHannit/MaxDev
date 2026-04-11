import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, ArrowRight, DollarSign, MessageSquare } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Job } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

type Tab = 'applications' | 'offered' | 'active' | 'completed';

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'violet' | 'danger' | 'default' }> = {
    open: { label: 'Открыт', variant: 'success' },
    in_progress: { label: 'В работе', variant: 'info' },
    done: { label: 'Ожидает приёмки', variant: 'warning' },
    paid: { label: 'Оплачено', variant: 'violet' },
    cancelled: { label: 'Отменён', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
};

const ClientMyJobs: React.FC<{ initialTab?: 'active' | 'in_progress' | 'done' }> = ({ initialTab = 'active' }) => {
  const { jobs, currentUser, getUserById } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'active' | 'in_progress' | 'done'>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const switchTab = (nextTab: 'active' | 'in_progress' | 'done') => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', nextTab);
    setSearchParams(params, { replace: true });
  };

  const myJobs = jobs.filter(j => j.clientId === currentUser?.id);
  const tabs: { key: typeof tab; label: string; icon: React.ReactNode; jobs: Job[] }[] = [
    { key: 'active', label: 'Активные', icon: <Briefcase size={15} />, jobs: myJobs.filter(j => j.status === 'open') },
    { key: 'in_progress', label: 'В работе', icon: <Clock size={15} />, jobs: myJobs.filter(j => j.status === 'in_progress' || j.status === 'done') },
    { key: 'done', label: 'Завершённые', icon: <CheckCircle size={15} />, jobs: myJobs.filter(j => j.status === 'paid' || j.status === 'cancelled') },
  ];

  const currentTabJobs = tabs.find(t => t.key === tab)?.jobs || [];

  return (
    <div>
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5">
              {t.jobs.length}
            </span>
          </button>
        ))}
      </div>

      {currentTabJobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 font-medium">Нет заказов в этой категории</p>
          {tab === 'active' && (
            <Link to="/create-job" className="mt-4 inline-flex items-center gap-1 px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-xl text-sm hover:bg-violet-700 transition-colors">
              Создать заказ
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentTabJobs.map(job => {
            const freelancer = job.freelancerId ? getUserById(job.freelancerId) : null;
            return (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusBadge(job.status)}
                      <span className="text-xs text-slate-400">
                        {new Date(job.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{job.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-violet-600">
                        <DollarSign size={13} />
                        {job.budget.toLocaleString()} ₽
                      </span>
                      <span className="text-slate-400">до {new Date(job.deadline).toLocaleDateString('ru-RU')}</span>
                      {freelancer && (
                        <span className="flex items-center gap-1.5">
                          <Avatar alt={freelancer.name} role={freelancer.role} size="sm" className="!w-5 !h-5 !text-[10px] !ring-1 !ring-slate-200" />
                          <span className="text-slate-600">{freelancer.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link to={`/job/${job.id}`}>
                      <button className="flex items-center gap-1 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                        Просмотреть <ArrowRight size={12} />
                      </button>
                    </Link>
                    {job.status === 'open' && (job.applications || []).length > 0 && (
                      <Link to={`/job/${job.id}`}>
                        <button className="flex items-center gap-1 px-4 py-2 border border-violet-200 text-violet-600 text-xs font-semibold rounded-xl hover:bg-violet-50 transition-colors w-full justify-center">
                          <MessageSquare size={12} />
                          {(job.applications || []).length} откл.
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FreelancerMyJobs: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'applications' }) => {
  const { jobs, currentUser, getUserById } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', nextTab);
    setSearchParams(params, { replace: true });
  };

  const myApplicationJobs = jobs.filter(j => j.applications?.some(a => a.freelancerId === currentUser?.id));
  const offeredJobs = jobs.filter(j => j.isOffered && j.freelancerId === currentUser?.id && j.status === 'open');
  const activeJobs = jobs.filter(j => j.freelancerId === currentUser?.id && (j.status === 'in_progress' || j.status === 'done'));
  const completedJobs = jobs.filter(j => j.freelancerId === currentUser?.id && j.status === 'paid');

  const tabs: { key: Tab; label: string; icon: React.ReactNode; jobs: Job[] }[] = [
    { key: 'applications', label: 'Мои отклики', icon: <MessageSquare size={15} />, jobs: myApplicationJobs },
    { key: 'offered', label: 'Предложенные', icon: <Briefcase size={15} />, jobs: offeredJobs },
    { key: 'active', label: 'В работе', icon: <Clock size={15} />, jobs: activeJobs },
    { key: 'completed', label: 'Завершённые', icon: <CheckCircle size={15} />, jobs: completedJobs },
  ];

  const currentTabJobs = tabs.find(t => t.key === tab)?.jobs || [];

  return (
    <div>
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5">
              {t.jobs.length}
            </span>
          </button>
        ))}
      </div>

      {currentTabJobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 font-medium">
            {tab === 'offered' ? 'Нет предложенных заказов' : 'Нет данных в этой категории'}
          </p>
          {tab === 'applications' && (
            <Link to="/jobs" className="mt-4 inline-flex items-center gap-1 px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-xl text-sm hover:bg-violet-700 transition-colors">
              Найти заказы
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentTabJobs.map(job => {
            const client = getUserById(job.clientId);
            const myApp = job.applications?.find(a => a.freelancerId === currentUser?.id);

            return (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusBadge(job.status)}
                      {myApp && (
                        <Badge variant={myApp.status === 'accepted' ? 'success' : myApp.status === 'rejected' ? 'danger' : 'default'}>
                          {myApp.status === 'accepted' ? 'Принят' : myApp.status === 'rejected' ? 'Отклонён' : 'Ожидание'}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{job.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 font-semibold text-violet-600">
                        <DollarSign size={13} />
                        {job.budget.toLocaleString()} ₽
                      </span>
                      <span className="text-slate-400">до {new Date(job.deadline).toLocaleDateString('ru-RU')}</span>
                      {client && (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Avatar alt={client.name} role={client.role} size="sm" className="!w-5 !h-5 !text-[10px] !ring-1 !ring-slate-200" />
                          {client.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/job/${job.id}`} className="shrink-0">
                    <button className="flex items-center gap-1 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                      Просмотреть <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MyJobsPage: React.FC = () => {
  const { currentUser } = useApp();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');

  const clientInitialTab = useMemo<'active' | 'in_progress' | 'done'>(() => {
    if (tabParam === 'in_progress' || tabParam === 'done' || tabParam === 'active') return tabParam;
    return 'active';
  }, [tabParam]);

  const freelancerInitialTab = useMemo<Tab>(() => {
    if (tabParam === 'offered' || tabParam === 'active' || tabParam === 'completed' || tabParam === 'applications') return tabParam;
    return 'applications';
  }, [tabParam]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Мои заказы</h1>
        <p className="text-slate-500">
          {currentUser?.role === 'client' ? 'Управляйте своими заказами и исполнителями' : 'Ваши отклики и активные проекты'}
        </p>
      </div>

      {currentUser?.role === 'client' && <ClientMyJobs initialTab={clientInitialTab} />}
      {currentUser?.role === 'freelancer' && <FreelancerMyJobs initialTab={freelancerInitialTab} />}
    </div>
  );
};

export default MyJobsPage;
