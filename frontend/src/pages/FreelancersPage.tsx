import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SKILLS } from '../store/data';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';

const ITEMS_PER_PAGE = 8;

const FreelancersPage: React.FC = () => {
  const { users } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRate, setMaxRate] = useState(10000);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const freelancers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'freelancer') return false;
      if (u.isBlocked) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))) return false;
      if (selectedSkills.length > 0 && !selectedSkills.every(s => u.skills?.includes(s))) return false;
      if ((u.rating || 0) < minRating) return false;
      if ((u.hourlyRate || 0) > maxRate) return false;
      return true;
    });
  }, [users, search, selectedSkills, minRating, maxRate]);

  const paginated = freelancers.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginated.length < freelancers.length;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSkills([]);
    setMinRating(0);
    setMaxRate(10000);
    setPage(1);
  };

  const popularSkills = SKILLS.slice(0, 16);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Каталог исполнителей</h1>
        <p className="text-slate-500">Найдено {freelancers.length} специалистов</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Поиск по имени или навыкам..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            icon={<Search size={16} />}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal size={16} />
          Фильтры
          {(selectedSkills.length > 0 || minRating > 0 || maxRate < 10000) && (
            <span className="ml-1 bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedSkills.length + (minRating > 0 ? 1 : 0) + (maxRate < 10000 ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'} w-full lg:w-64 shrink-0`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Фильтры</h2>
              <button onClick={clearFilters} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                Сбросить
              </button>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Навыки</h3>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {popularSkills.map(skill => (
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

            {/* Rating */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Минимальный рейтинг</h3>
              <div className="flex flex-wrap items-center gap-2">
                {[0, 3, 4, 4.5, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                      minRating === r ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-50'
                    }`}
                  >
                    {r === 0 ? 'Любой' : (
                      <>
                        <Star size={10} className="fill-current" />
                        {r}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Макс. ставка (₽/час)</h3>
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={maxRate}
                onChange={e => setMaxRate(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 000 ₽</span>
                <span className="font-semibold text-violet-600">{maxRate.toLocaleString()} ₽</span>
                <span>10 000 ₽</span>
              </div>
            </div>
          </div>
        </div>

        {/* Freelancer grid */}
        <div className="flex-1">
          {/* Active filters */}
          {(selectedSkills.length > 0 || minRating > 0 || maxRate < 10000) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                  {s}
                  <button onClick={() => toggleSkill(s)}><X size={12} /></button>
                </span>
              ))}
              {minRating > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  ⭐ {minRating}+
                  <button onClick={() => setMinRating(0)}><X size={12} /></button>
                </span>
              )}
              {maxRate < 10000 && (
                <span className="flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                  до {maxRate.toLocaleString()} ₽/ч
                  <button onClick={() => setMaxRate(10000)}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-slate-300 text-6xl mb-4"></div>
              <p className="text-slate-500 text-lg font-medium">Специалисты не найдены</p>
              <p className="text-slate-400 text-sm mt-2">Попробуйте изменить параметры поиска</p>
              <button onClick={clearFilters} className="mt-4 text-violet-600 font-semibold text-sm hover:text-violet-700">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map((f) => (
                  <Card key={f.id} hover className="!p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar src={f.avatar} alt={f.name} size="lg" role={f.role} className="!rounded-2xl ring-2 ring-violet-100" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{f.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StarRating rating={f.rating || 0} size={12} />
                          <span className="text-xs font-semibold text-slate-700">{f.rating || 0}</span>
                          <span className="text-xs text-slate-400">({f.reviewsCount || 0})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{f.completedJobs || 0} заказов</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {f.skills?.slice(0, 4).map(s => (
                        <Badge key={s} variant="violet">{s}</Badge>
                      ))}
                      {(f.skills?.length || 0) > 4 && (
                        <Badge variant="default">+{(f.skills?.length || 0) - 4}</Badge>
                      )}
                    </div>

                    {f.bio && (
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{f.bio || f.experience}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-violet-600">
                        {f.hourlyRate?.toLocaleString()} ₽/час
                      </div>
                      <Link to={`/freelancer/${f.id}`}>
                        <button className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                          Смотреть профиль
                        </button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                    Загрузить ещё ({freelancers.length - paginated.length} осталось)
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

export default FreelancersPage;
