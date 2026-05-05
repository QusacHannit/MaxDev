import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Search, Briefcase, TrendingUp, CheckCircle,
  Clock, Star, ArrowRight, Users, FileText
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import { Avatar } from '../components/ui/Avatar';

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'default' | 'violet' | 'danger' }> = {
    open: { label: 'Открыт', variant: 'success' },
    in_progress: { label: 'В работе', variant: 'info' },
    done: { label: 'Готово', variant: 'warning' },
    paid: { label: 'Оплачено', variant: 'violet' },
    cancelled: { label: 'Отменён', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
};

const ClientHome: React.FC = () => {
  const { currentUser, users, jobs, reviews } = useApp();
  const myJobs = jobs.filter(j => j.clientId === currentUser?.id);
  const activeJobs = myJobs.filter(j => j.status === 'open' || j.status === 'in_progress');
  const recentReviews = reviews.slice(-3).reverse();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-violet-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Добро пожаловать, {currentUser?.name}! 👋</h1>
            <p className="text-white/80">Найдите лучшего исполнителя для вашего проекта</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/create-job"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg text-sm"
            >
              <PlusCircle size={16} />
              Создать заказ
            </Link>
            <Link
              to="/freelancers"
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              <Search size={16} />
              Найти исполнителя
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего заказов', value: myJobs.length, icon: <Briefcase className="text-violet-500" size={22} />, bg: 'bg-violet-50' },
          { label: 'Активных', value: activeJobs.length, icon: <Clock className="text-sky-500" size={22} />, bg: 'bg-sky-50' },
          { label: 'Завершено', value: myJobs.filter(j => j.status === 'paid').length, icon: <CheckCircle className="text-emerald-500" size={22} />, bg: 'bg-emerald-50' },
          { label: 'Исполнители', value: users.filter(u => u.role === 'freelancer').length, icon: <Users className="text-amber-500" size={22} />, bg: 'bg-amber-50' },
        ].map((s) => (
          <Card key={s.label} className="!p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Мои заказы</h2>
            <Link to="/my-jobs" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              Все <ArrowRight size={14} />
            </Link>
          </div>
          {myJobs.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-500 mb-4">У вас пока нет заказов</p>
              <Link to="/create-job">
                <button className="px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-xl text-sm hover:bg-violet-700 transition-colors">
                  Создать первый заказ
                </button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {myJobs.slice(0, 4).map((job) => (
                <Link key={job.id} to={`/job/${job.id}`}>
                  <Card hover className="!p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(job.status)}
                          <span className="text-xs text-slate-400">
                            {new Date(job.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{job.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sm font-bold text-violet-600">
                          {job.budget.toLocaleString()} ₽
                        </div>
                        <div className="text-xs text-slate-400">
                          {(job.applications || []).length} откл.
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Reviews */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Отзывы</h2>
          <div className="space-y-3">
            {recentReviews.map((r) => {
              const freelancer = users.find(u => u.id === r.freelancerId);
              return (
                <Card key={r.id} className="!p-4">
                  <div className="flex items-center gap-2 mb-2">
                <Avatar alt={freelancer?.name || 'Пользователь'} role={freelancer?.role} size="sm" className="!w-7 !h-7 !text-[11px] !ring-1 !ring-white shadow-sm" />
                    <span className="text-sm font-semibold text-slate-900">{freelancer?.name}</span>
                    <StarRating rating={r.rating} size={12} className="ml-auto" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{r.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const FreelancerHome: React.FC = () => {
  const { currentUser, jobs, users } = useApp();
  const openJobs = jobs.filter(j => j.status === 'open');
  const myApplications = jobs.filter(j => j.applications?.some(a => a.freelancerId === currentUser?.id));
  const activeJobs = jobs.filter(j => j.freelancerId === currentUser?.id && j.status === 'in_progress');

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-violet-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Привет, {currentUser?.name}! 🚀</h1>
            <p className="text-white/80">Сегодня новые заказы ждут вас</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg text-sm"
            >
              <Search size={16} />
              Найти заказы
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Моё портфолио
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Откликов', value: currentUser?.activeApplications || 0, icon: <TrendingUp className="text-violet-500" size={22} />, bg: 'bg-violet-50' },
          { label: 'В работе', value: activeJobs.length, icon: <Clock className="text-sky-500" size={22} />, bg: 'bg-sky-50' },
          { label: 'Выполнено', value: currentUser?.completedJobs || 0, icon: <CheckCircle className="text-emerald-500" size={22} />, bg: 'bg-emerald-50' },
          { label: 'Рейтинг', value: currentUser?.rating || '—', icon: <Star className="text-amber-500" size={22} />, bg: 'bg-amber-50' },
        ].map((s) => (
          <Card key={s.label} className="!p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Рекомендуемые заказы</h2>
            <Link to="/jobs" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              Все <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {openJobs.slice(0, 5).map((job) => {
              const client = users.find(u => u.id === job.clientId);
              const alreadyApplied = job.applications?.some(a => a.freelancerId === currentUser?.id);
              const isOfferedToMe = !!job.isOffered && job.freelancerId === currentUser?.id;
              return (
                <Link key={job.id} to={`/job/${job.id}`}>
                  <Card hover className={`!p-4 ${isOfferedToMe ? 'ring-2 ring-violet-500 border-violet-300 bg-violet-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-slate-500 truncate mb-2">{job.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 3).map(s => <Badge key={s} variant="violet">{s}</Badge>)}
                          {isOfferedToMe && <Badge variant="default" className="border border-violet-400 text-violet-700 bg-white">Предложен вам</Badge>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-violet-600">{job.budget.toLocaleString()} ₽</div>
                        <div className="text-xs text-slate-400 mt-1">{client?.name}</div>
                        {alreadyApplied && (
                          <Badge variant="success" className="mt-1">Откликнулись</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile completeness */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Профиль</h3>
            <div className="flex items-center gap-3 mb-4">
              <Avatar alt={currentUser?.name || 'Пользователь'} role={currentUser?.role} size="lg" className="!w-14 !h-14 !rounded-full !text-xl ring-2 ring-violet-200" />
              <div>
                <p className="font-semibold text-slate-900">{currentUser?.name}</p>
                <StarRating rating={currentUser?.rating || 0} size={14} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Email подтверждён</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                {(currentUser?.skills?.length || 0) > 0
                  ? <CheckCircle size={14} className="text-emerald-500" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
                <span>Навыки заполнены</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                {currentUser?.experience
                  ? <CheckCircle size={14} className="text-emerald-500" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
                <span>Опыт работы</span>
              </div>
            </div>
            <Link
              to="/profile"
              className="mt-4 flex items-center justify-center gap-1 w-full py-2.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors"
            >
              Заполнить профиль <ArrowRight size={14} />
            </Link>
          </Card>

          {/* My applications */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Мои отклики</h2>
            {myApplications.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-slate-500 text-sm">Откликов пока нет</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myApplications.slice(0, 3).map((job) => {
                  const app = job.applications?.find(a => a.freelancerId === currentUser?.id);
                  return (
                    <Link key={job.id} to={`/job/${job.id}`}>
                      <Card hover className="!p-3">
                        <p className="font-semibold text-sm text-slate-900 mb-1 truncate">{job.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{job.budget.toLocaleString()} ₽</span>
                          <Badge variant={app?.status === 'accepted' ? 'success' : app?.status === 'rejected' ? 'danger' : 'default'}>
                            {app?.status === 'accepted' ? 'Принят' : app?.status === 'rejected' ? 'Отклонён' : 'Ожидание'}
                          </Badge>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {currentUser.role === 'client' && <ClientHome />}
      {currentUser.role === 'freelancer' && <FreelancerHome />}
      {currentUser.role === 'administrator' && (
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Панель администратора</h1>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
          >
            Перейти в панель управления
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
