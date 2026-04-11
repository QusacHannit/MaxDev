import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Briefcase, Plus, Trash2, Save, Star, CheckCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SKILLS } from '../store/data';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { Avatar } from '../components/ui/Avatar';

interface ProfileForm {
  name: string;
  phone: string;
  bio: string;
  experience: string;
  hourlyRate: number;
}

const ProfilePage: React.FC = () => {
  const { currentUser, updateUser, jobs, getFreelancerReviews } = useApp();
  const [saved, setSaved] = useState(false);
  const [skills, setSkills] = useState<string[]>(currentUser?.skills || []);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolio, setPortfolio] = useState(currentUser?.portfolio || []);
  const [selectedSkill, setSelectedSkill] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
      experience: currentUser?.experience || '',
      hourlyRate: currentUser?.hourlyRate || 0,
    },
  });

  if (!currentUser) return null;

  const isFreelancer = currentUser.role === 'freelancer';
  const reviews = isFreelancer ? getFreelancerReviews(currentUser.id) : [];
  const myJobs = jobs.filter(j =>
    isFreelancer ? j.freelancerId === currentUser.id : j.clientId === currentUser.id
  );

  const onSubmit = (data: ProfileForm) => {
    updateUser({
      ...currentUser,
      name: data.name,
      phone: data.phone,
      bio: data.bio,
      experience: isFreelancer ? data.experience : currentUser.experience,
      hourlyRate: isFreelancer ? Number(data.hourlyRate) : currentUser.hourlyRate,
      skills: isFreelancer ? skills : currentUser.skills,
      portfolio: isFreelancer ? portfolio : currentUser.portfolio,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addSkill = () => {
    if (selectedSkill && !skills.includes(selectedSkill)) {
      setSkills([...skills, selectedSkill]);
      setSelectedSkill('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));

  const addPortfolioItem = () => {
    if (portfolioTitle.trim()) {
      setPortfolio([...portfolio, {
        id: `p_${Date.now()}`,
        title: portfolioTitle.trim(),
        url: portfolioUrl.trim() || undefined,
      }]);
      setPortfolioTitle('');
      setPortfolioUrl('');
    }
  };

  const removePortfolioItem = (id: string) => setPortfolio(portfolio.filter(p => p.id !== id));

  const roleLabel = currentUser.role === 'client' ? 'Клиент'
    : currentUser.role === 'freelancer' ? 'Фрилансер'
    : 'Администратор';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Мой профиль</h1>
        <p className="text-slate-500">Управляйте своими данными и настройками</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Avatar & Stats */}
        <div className="space-y-4">
          <Card>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar src={currentUser.avatar} alt={currentUser.name} size="xl" role={currentUser.role} className="!w-24 !h-24 !rounded-3xl ring-4 ring-violet-100 shadow-lg" />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{currentUser.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
                {roleLabel}
              </span>
              {isFreelancer && currentUser.rating !== undefined && currentUser.rating > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-slate-900">{currentUser.rating}</span>
                  <span className="text-xs text-slate-400">({currentUser.reviewsCount} отзывов)</span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Статистика</h3>
            <div className="space-y-3">
              {isFreelancer && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Завершено заказов</span>
                    <span className="font-bold text-slate-900">{currentUser.completedJobs || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Активных откликов</span>
                    <span className="font-bold text-slate-900">{currentUser.activeApplications || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Отзывов</span>
                    <span className="font-bold text-slate-900">{reviews.length}</span>
                  </div>
                </>
              )}
              {!isFreelancer && currentUser.role !== 'administrator' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Создано заказов</span>
                    <span className="font-bold text-slate-900">{myJobs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Завершено</span>
                    <span className="font-bold text-slate-900">{myJobs.filter(j => j.status === 'paid').length}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">На платформе с</span>
                <span className="font-bold text-slate-900 text-xs">
                  {new Date(currentUser.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2 space-y-6">
          {saved && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle size={16} />
              Изменения сохранены успешно!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic info */}
            <Card>
              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <User size={18} className="text-violet-600" />
                Основная информация
              </h3>
              <div className="space-y-4">
                <Input
                  label="Имя"
                  placeholder="Ваше имя"
                  icon={<User size={16} />}
                  error={errors.name?.message}
                  {...register('name', { required: 'Имя обязательно', minLength: { value: 2, message: 'Минимум 2 символа' } })}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
                    <Mail size={16} />
                    {currentUser.email}
                    <span className="ml-auto text-xs text-slate-400">(нельзя изменить)</span>
                  </div>
                </div>

                <Input
                  label="Телефон"
                  placeholder="+7 (999) 000-00-00"
                  icon={<Phone size={16} />}
                  {...register('phone')}
                />

                <Textarea
                  label="О себе"
                  placeholder="Расскажите о себе, опыте работы, специализации..."
                  rows={3}
                  {...register('bio')}
                />
              </div>
            </Card>

            {/* Freelancer extras */}
            {isFreelancer && (
              <>
                <Card>
                  <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Briefcase size={18} className="text-violet-600" />
                    Профессиональные данные
                  </h3>
                  <div className="space-y-4">
                    <Textarea
                      label="Опыт работы"
                      placeholder="Опишите ваш профессиональный опыт..."
                      rows={4}
                      {...register('experience')}
                    />
                    <Input
                      label="Ставка (₽/час)"
                      type="number"
                      placeholder="3000"
                      {...register('hourlyRate', { min: { value: 0, message: 'Минимум 0' } })}
                    />
                  </div>
                </Card>

                {/* Skills */}
                <Card>
                  <h3 className="font-bold text-slate-900 mb-5">Навыки</h3>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                    {skills.length === 0 && (
                      <p className="text-sm text-slate-400">Навыки не добавлены</p>
                    )}
                    {skills.map(skill => (
                      <span
                        key={skill}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-violet-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedSkill}
                      onChange={e => setSelectedSkill(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Выберите навык...</option>
                      {SKILLS.filter(s => !skills.includes(s)).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" onClick={addSkill} disabled={!selectedSkill}>
                      <Plus size={16} />
                      Добавить
                    </Button>
                  </div>
                </Card>

                {/* Portfolio */}
                <Card>
                  <h3 className="font-bold text-slate-900 mb-5">Портфолио</h3>
                  <div className="space-y-3 mb-4">
                    {portfolio.length === 0 && (
                      <p className="text-sm text-slate-400">Проекты не добавлены</p>
                    )}
                    {portfolio.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                          <Briefcase size={16} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{item.title}</p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-600 hover:underline truncate block"
                            >
                              {item.url}
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePortfolioItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-3">Добавить проект</p>
                    <Input
                      placeholder="Название проекта"
                      value={portfolioTitle}
                      onChange={e => setPortfolioTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Ссылка (необязательно)"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPortfolioItem}
                      disabled={!portfolioTitle.trim()}
                      className="w-full"
                    >
                      <Plus size={16} />
                      Добавить проект
                    </Button>
                  </div>
                </Card>
              </>
            )}

            <Button type="submit" className="w-full" size="lg">
              <Save size={18} />
              Сохранить изменения
            </Button>
          </form>

          {/* Reviews (freelancer only) */}
          {isFreelancer && reviews.length > 0 && (
            <Card>
              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                Отзывы клиентов
              </h3>
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star
                          key={i}
                          size={14}
                          className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-auto">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{review.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
