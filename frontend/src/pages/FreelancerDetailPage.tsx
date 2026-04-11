import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink, Briefcase, Star, Clock, Flag, AlertCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { complaintsApi } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

const FreelancerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getUserById, currentUser, getFreelancerReviews, users, addComplaint } = useApp();
  const navigate = useNavigate();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintNotice, setComplaintNotice] = useState<string>('');
  // Скрываем кнопку "Пожаловаться" если уже есть активная жалоба
  const [hasPendingComplaint, setHasPendingComplaint] = useState(false);
  const [checkingComplaint, setCheckingComplaint] = useState(true);

  const freelancer = getUserById(id || '');
  const reviews = getFreelancerReviews(id || '');
  const reviewers = reviews.map(r => ({
    review: r,
    client: users.find(u => u.id === r.clientId),
  }));

  // Проверяем наличие активной жалобы при загрузке страницы
  useEffect(() => {
    const checkComplaint = async () => {
      if (!currentUser || !id || currentUser.id === id) {
        setCheckingComplaint(false);
        return;
      }
      try {
        const hasPending = await complaintsApi.checkPending(Number(id));
        setHasPendingComplaint(hasPending);
      } catch {
        // Если ошибка — показываем кнопку на всякий случай
      }
      setCheckingComplaint(false);
    };
    checkComplaint();
  }, [currentUser, id]);

  if (!freelancer || freelancer.role !== 'freelancer') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-slate-900">Профиль не найден</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-violet-600 font-semibold">← Назад</button>
      </div>
    );
  }

  const handleHire = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/create-job?freelancerId=${freelancer.id}`);
  };

  const handleComplaint = async () => {
    if (!currentUser || !complaintText.trim()) return;
    const result = await addComplaint({ reporterId: currentUser.id, targetId: freelancer.id, reason: complaintText });
    setComplaintNotice(result.message);
    if (result.ok) {
      setComplaintOpen(false);
      setComplaintText('');
      // После успешной отправки — скрываем кнопку
      setHasPendingComplaint(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
      >
        ← Назад к каталогу
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: profile info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar src={freelancer.avatar} alt={freelancer.name} size="xl" role={freelancer.role} className="!rounded-2xl ring-4 ring-violet-100" />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">{freelancer.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={freelancer.rating || 0} size={18} />
                      <span className="font-bold text-slate-700">{freelancer.rating || 0}</span>
                      <span className="text-slate-400 text-sm">({freelancer.reviewsCount || 0} отзывов)</span>
                    </div>
                    <p className="text-slate-500 mt-2 text-sm">{freelancer.bio || freelancer.experience?.slice(0, 100)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-violet-600">
                      {freelancer.hourlyRate?.toLocaleString()} ₽
                    </div>
                    <div className="text-sm text-slate-400">за час</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                  {freelancer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {freelancer.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail size={14} className="text-slate-400" />
                    {freelancer.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} className="text-slate-400" />
                    {freelancer.completedJobs || 0} выполненных заказов
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Навыки</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills?.map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-medium border border-violet-100">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Experience */}
          {freelancer.experience && (
            <Card>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Опыт работы</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{freelancer.experience}</p>
            </Card>
          )}

          {/* Portfolio */}
          {(freelancer.portfolio?.length || 0) > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Портфолио</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {freelancer.portfolio?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                        <ExternalLink size={14} className="text-violet-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">{item.title}</span>
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-violet-600 hover:text-violet-700 text-xs font-medium shrink-0 ml-2 flex items-center gap-1">
                        Открыть <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Отзывы</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{freelancer.rating}</span>
                  <span className="text-slate-400 text-sm">({reviews.length})</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm">Отзывов пока нет</p>
            ) : (
              <div className="space-y-4">
                {reviewers.map(({ review, client }) => (
                  <div key={review.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {client?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{client?.name || 'Аноним'}</p>
                        <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <StarRating rating={review.rating} size={14} className="ml-auto" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: action panel */}
        <div className="space-y-4">
          <Card>
            <div className="text-center mb-6">
              <div className="text-3xl font-extrabold text-violet-600 mb-1">
                {freelancer.hourlyRate?.toLocaleString()} ₽/ч
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Clock size={16} className="mx-auto text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-900">{freelancer.activeApplications || 0}</span>
                  <p className="text-xs text-slate-400">активных</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Briefcase size={16} className="mx-auto text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-900">{freelancer.completedJobs || 0}</span>
                  <p className="text-xs text-slate-400">выполнено</p>
                </div>
              </div>
            </div>

            {currentUser && currentUser.role === 'client' && (
              <Button className="w-full mb-3" size="lg" onClick={handleHire}>
                <Briefcase size={16} />
                Предложить заказ
              </Button>
            )}

            {/* Уведомление о жалобе на рассмотрении */}
            {hasPendingComplaint && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={14} />
                Жалоба на рассмотрении
              </div>
            )}

            {complaintNotice && !hasPendingComplaint && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {complaintNotice}
              </div>
            )}

            {!currentUser && (
              <Link to="/login">
                <Button className="w-full mb-3" size="lg">
                  Войдите для заказа
                </Button>
              </Link>
            )}

            {/* Кнопка "Пожаловаться" — скрывается если уже есть активная жалоба */}
            {currentUser && currentUser.id !== freelancer.id && !hasPendingComplaint && !checkingComplaint && (
              <button
                onClick={() => setComplaintOpen(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors w-full justify-center mt-2"
              >
                <Flag size={12} />
                Пожаловаться
              </button>
            )}
          </Card>

          <Card className="!p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Контакты</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" />
                <span className="truncate">{freelancer.email}</span>
              </div>
              {freelancer.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {freelancer.phone}
                </div>
              )}
            </div>
          </Card>

          {(freelancer.skills?.length || 0) > 0 && (
            <Card className="!p-4">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Навыки</h3>
              <div className="flex flex-wrap gap-1">
                {freelancer.skills?.map(s => <Badge key={s} variant="violet">{s}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Complaint modal */}
      <Modal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} title="Пожаловаться">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Опишите причину жалобы на пользователя {freelancer.name}:</p>
          <textarea
            value={complaintText}
            onChange={e => setComplaintText(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={4}
            placeholder="Опишите проблему..."
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setComplaintOpen(false)}>Отмена</Button>
            <Button variant="danger" className="flex-1" onClick={handleComplaint}>Отправить жалобу</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FreelancerDetailPage;
