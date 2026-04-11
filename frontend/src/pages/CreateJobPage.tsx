import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PlusCircle, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { SKILLS } from '../store/data';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

interface JobForm {
  title: string;
  description: string;
  budget: number;
  deadline: string;
}

const CreateJobPage: React.FC = () => {
  const { createJob, currentUser, getUserById } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFreelancerId = searchParams.get('freelancerId');
  const preselectedFreelancer = preselectedFreelancerId ? getUserById(preselectedFreelancerId) : null;

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<JobForm>();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const onSubmit = async (data: JobForm) => {
    if (!currentUser) return;
    setLoading(true);
    const job = await createJob({
      title: data.title,
      description: data.description,
      budget: Number(data.budget),
      deadline: data.deadline,
      skills: selectedSkills,
      clientId: currentUser.id,
      freelancerId: preselectedFreelancerId || undefined,
    });
    navigate(`/job/${job.id}`);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Создать заказ</h1>
        <p className="text-slate-500">Опишите задачу и найдите идеального исполнителя</p>
      </div>

      {preselectedFreelancer && (
        <Card className="mb-6 !p-4 border-violet-200 bg-violet-50">
          <div className="flex items-center gap-3">
            <Avatar alt={preselectedFreelancer.name} role={preselectedFreelancer.role} size="lg" className="!w-12 !h-12 !rounded-xl !text-lg ring-2 ring-violet-200" />
            <div>
              <p className="text-sm text-violet-600 font-medium">Исполнитель предвыбран</p>
              <p className="font-bold text-slate-900">{preselectedFreelancer.name}</p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <div className="space-y-6">
            <Input
              label="Заголовок заказа"
              placeholder="Например: Разработка лендинга на React"
              icon={<Briefcase size={16} />}
              error={errors.title?.message}
              {...register('title', {
                required: 'Заголовок обязателен',
                minLength: { value: 10, message: 'Минимум 10 символов' },
              })}
            />

            <Textarea
              label="Подробное описание"
              placeholder="Опишите задачу максимально подробно: что нужно сделать, каков ожидаемый результат, какие технологии использовать..."
              rows={6}
              error={errors.description?.message}
              {...register('description', {
                required: 'Описание обязательно',
                minLength: { value: 30, message: 'Минимум 30 символов' },
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Бюджет (₽)"
                type="number"
                placeholder="50000"
                icon={<DollarSign size={16} />}
                error={errors.budget?.message}
                {...register('budget', {
                  required: 'Бюджет обязателен',
                  min: { value: 1000, message: 'Минимум 1000 ₽' },
                })}
              />

              <Input
                label="Срок выполнения"
                type="date"
                icon={<Calendar size={16} />}
                error={errors.deadline?.message}
                min={new Date().toISOString().split('T')[0]}
                {...register('deadline', {
                  required: 'Укажите срок',
                })}
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Требуемые навыки
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {selectedSkills.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">Выберите хотя бы один навык</p>
              )}
            </div>

            {/* File attachment hint */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <p className="text-sm text-slate-500 text-center">
                📎 Прикрепление файлов (ТЗ, макеты) доступно после создания заказа в чате
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-2 flex-1"
                loading={loading}
                disabled={selectedSkills.length === 0}
              >
                <PlusCircle size={18} />
                Опубликовать заказ
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateJobPage;
