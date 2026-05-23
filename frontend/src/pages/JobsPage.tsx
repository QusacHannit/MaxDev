import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SKILLS } from '../store/data';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';

const ITEMS_PER_PAGE = 8;

const JobsPage: React.FC = () => {
  const { jobs, users, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(500000);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const openJobs = useMemo(() => {
    return jobs.filter(j => {
      if (j.status !== 'open') return false;
      if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !j.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedSkills.length > 0 && !selectedSkills.every(s => j.skills.includes(s))) return false;
      if (j.budget < minBudget || j.budget > maxBudget) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, search, selectedSkills, minBudget, maxBudget]);

  const paginated = openJobs.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginated.length < openJobs.length;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSkills([]);
    setMinBudget(0);
    setMaxBudget(500000);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Биржа заказов</h1>
        <p className="text-slate-500">Найдено {openJobs.length} открытых заказов</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Поиск по заголовку или описанию..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={16} />}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
          <SlidersHorizontal size={16} />
          Фильтры
          {(selectedSkills.length > 0 || minBudget > 0 || maxBudget < 500000) && (
            <span className="ml-1 bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedSkills.length + (minBudget > 0 ? 1 : 0) + (maxBudget < 500000 ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'} w-full lg:w-64 shrink-0`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Фильтры</h2>
              <button onClick={clearFilters} className="text-xs text-violet-600 font-medium">Сбросить</button>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Навыки</h3>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                {SKILLS.slice(0, 20).map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Бюджет (₽)</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={10000}
                  value={maxBudget}
                  onChange={e => setMaxBudget(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0 ₽</span>
                  <span className="font-semibold text-violet-600">до {maxBudget.toLocaleString()} ₽</span>
                  <span>500 000 ₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1">
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                  {s}
                  <button onClick={() => toggleSkill(s)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4"></div>
              <p className="text-slate-500 text-lg font-medium">Заказы не найдены</p>
              <button onClick={clearFilters} className="mt-4 text-violet-600 font-semibold text-sm">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginated.map((job) => {
                  const client = users.find(u => u.id === job.clientId);
                  const alreadyApplied = job.applications?.some(a => a.freelancerId === currentUser?.id);
                  const daysLeft = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <Link key={job.id} to={`/job/${job.id}`}>
                      <Card hover>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {alreadyApplied && <Badge variant="success">Откликнулись</Badge>}
                              <span className="text-xs text-slate-400">
                                {new Date(job.createdAt).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{job.description}</p>

                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.slice(0, 5).map(s => <Badge key={s} variant="violet">{s}</Badge>)}
                              {job.skills.length > 5 && <Badge variant="default">+{job.skills.length - 5}</Badge>}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 sm:text-right">
                            <div>
                              <div className="flex items-center gap-1 text-violet-600 font-bold">
                                {/*<DollarSign size={14} />*/}
                                {job.budget.toLocaleString()} ₽
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                <Calendar size={12} />
                                {daysLeft > 0 ? `${daysLeft} дн.` : 'Просрочен'}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400">
                              {(job.applications || []).length} откл.
                            </div>
                            {client && (
                              <div className="flex items-center gap-1.5">
                                <Avatar alt={client.name} role={client.role} size="sm" className="!w-5 !h-5 !text-[10px] !ring-1 !ring-slate-200" />
                                <span className="text-xs text-slate-500 hidden sm:block">{client.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                    Загрузить ещё ({openJobs.length - paginated.length} осталось)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
