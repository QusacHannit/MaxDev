/**
 * ClientDetailPage — страница профиля заказчика
 * Доступна фрилансерам для просмотра информации о клиенте,
 * его рейтинга, отзывов и подачи жалоб.
 * Также фрилансер может оставить отзыв заказчику после принятия работы (статус paid).
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Briefcase, Star, Clock, Flag, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { complaintsApi } from '../api/client';
import Card from '../components/ui/Card';
import StarRating from '../components/ui/StarRating';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getUserById, currentUser, reviews, users, jobs, addComplaint, addReview } = useApp();
  const navigate = useNavigate();
  
  // Состояние жалобы
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintNotice, setComplaintNotice] = useState('');
  const [hasPendingComplaint, setHasPendingComplaint] = useState(false);
  const [checkingComplaint, setCheckingComplaint] = useState(true);
  
  // Состояние отзыва
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Получаем данные клиента
  const client = getUserById(id || '');

  // Отзывы О клиенте (от фрилансеров) — ищем где toUserId === id (кому оставили отзыв)
  const clientReviews = reviews.filter(r => r.toUserId === id);

  // Средний рейтинг клиента
  const avgRating = clientReviews.length > 0
    ? Math.round((clientReviews.reduce((sum, r) => sum + r.rating, 0) / clientReviews.length) * 10) / 10
    : 0;

  // Заказы этого клиента
  const clientJobs = jobs.filter(j => j.clientId === id);
  const completedJobs = clientJobs.filter(j => j.status === 'done' || j.status === 'paid').length;
  const activeJobs = clientJobs.filter(j => j.status === 'open' || j.status === 'in_progress').length;

  // Проверяем наличие активной жалобы и возможность оставить отзыв
  useEffect(() => {
    const checkData = async () => {
      if (!currentUser || !id || currentUser.id === id) {
        setCheckingComplaint(false);
        setCanReview(false);
        return;
      }
      try {
        const hasPending = await complaintsApi.checkPending(Number(id));
        setHasPendingComplaint(hasPending);
        
        // Проверяем, есть ли завершённые заказы с этим клиентом где работа принята (paid)
        const completedJobsWithClient = jobs.filter(
          j => j.clientId === id && 
               j.freelancerId === currentUser.id && 
               j.status === 'paid'
        );
        // Проверяем, оставлял ли уже отзыв этому клиенту
        const hasReview = reviews.some(
          r => r.fromUserId === currentUser.id && r.toUserId === id
        );
        // Можно оставить отзыв если есть хотя бы один завершённый заказ и ещё не оставляли отзыв
        setCanReview(completedJobsWithClient.length > 0 && !hasReview);
      } catch {
        // Если ошибка — показываем кнопки
      }
      setCheckingComplaint(false);
    };
    checkData();
  }, [currentUser, id, reviews, jobs]);

  // Обработчик жалобы
  const handleComplaint = async () => {
    if (!currentUser || !client || !complaintText.trim()) return;
    const result = await addComplaint({
      reporterId: currentUser.id,
      targetId: client.id,
      reason: complaintText,
    });
    setComplaintNotice(result.message);
    if (result.ok) {
      setComplaintOpen(false);
      setComplaintText('');
      setHasPendingComplaint(true);
    }
  };

  // Дата регистрации
  const registeredDate = client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Не указана';

  // Если клиент не найден
  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-slate-900">Профиль не найден</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-violet-600 font-semibold">
          ← Назад
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
      >
        ← Назад
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая часть — основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Шапка профиля */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar
                src={client.avatar}
                alt={client.name}
                size="xl"
                role={client.role}
                className="!rounded-2xl ring-4 ring-blue-100"
              />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">{client.name}</h1>
                    <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                      Заказчик
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={avgRating} size={18} />
                      <span className="font-bold text-slate-700">{avgRating}</span>
                      <span className="text-slate-400 text-sm">
                        ({clientReviews.length} отзывов)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Mail size={14} className="text-slate-400" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />
                    На платформе с {registeredDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} className="text-slate-400" />
                    {clientJobs.length} заказов создано
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Статистика */}
          <Card>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Статистика</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <div className="text-2xl font-extrabold text-blue-600">{clientJobs.length}</div>
                <div className="text-xs text-slate-500 mt-1">Всего заказов</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <div className="text-2xl font-extrabold text-green-600">{completedJobs}</div>
                <div className="text-xs text-slate-500 mt-1">Завершено</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-4 text-center border border-violet-100">
                <div className="text-2xl font-extrabold text-violet-600">{activeJobs}</div>
                <div className="text-xs text-slate-500 mt-1">Активных</div>
              </div>
            </div>
          </Card>

          {/* Отзывы о клиенте */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Отзывы о заказчике</h2>
              {clientReviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{avgRating}</span>
                  <span className="text-slate-400 text-sm">({clientReviews.length})</span>
                </div>
              )}
            </div>

            {clientReviews.length === 0 ? (
              <p className="text-slate-500 text-sm">Отзывов пока нет</p>
            ) : (
              <div className="space-y-4">
                {clientReviews.map((review) => {
                  const reviewer = users.find((u) => u.id === review.fromUserId);
                  return (
                    <div
                      key={review.id}
                      className="border-b border-slate-100 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {reviewer?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {reviewer?.name || 'Аноним'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <StarRating rating={review.rating} size={14} className="ml-auto" />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Правая часть — действия */}
        <div className="space-y-4">
          {/* Карточка рейтинга */}
          <Card>
            <div className="text-center mb-4">
              <StarRating rating={avgRating} size={24} className="justify-center" />
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{avgRating} / 5</div>
              <div className="text-sm text-slate-400">{clientReviews.length} отзывов</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mt-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Clock size={16} className="mx-auto text-slate-400 mb-1" />
                <span className="font-semibold text-slate-900">{activeJobs}</span>
                <p className="text-xs text-slate-400">активных</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Briefcase size={16} className="mx-auto text-slate-400 mb-1" />
                <span className="font-semibold text-slate-900">{completedJobs}</span>
                <p className="text-xs text-slate-400">завершено</p>
              </div>
            </div>
          </Card>

          {/* Контакты */}
          <Card className="!p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Контакты</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" />
                <span className="truncate">{client.email}</span>
              </div>
            </div>
          </Card>

          {/* Жалоба */}
          {hasPendingComplaint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle size={14} />
              Жалоба на рассмотрении
            </div>
          )}

          {complaintNotice && !hasPendingComplaint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {complaintNotice}
            </div>
          )}

          {currentUser &&
            currentUser.id !== client.id &&
            !hasPendingComplaint &&
            !checkingComplaint && (
              <button
                onClick={() => setComplaintOpen(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors w-full justify-center mt-2"
              >
                <Flag size={12} />
                Пожаловаться
              </button>
            )}
          
          {/* Кнопка оставить отзыв */}
          {currentUser &&
            currentUser.id !== client.id &&
            canReview &&
            !checkingComplaint && (
              <button
                onClick={() => setReviewOpen(true)}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors w-full justify-center mt-2"
              >
                <Star size={12} />
                Оставить отзыв
              </button>
            )}
        </div>
      </div>

      {/* Модальное окно жалобы */}
      <Modal
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        title="Пожаловаться"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Опишите причину жалобы на заказчика {client.name}:
          </p>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={4}
            placeholder="Опишите проблему..."
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setComplaintOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleComplaint}
            >
              Отправить жалобу
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно отзыва */}
      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Оставить отзыв"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ваш отзыв о заказчике {client.name}:
          </p>
          
          {/* Рейтинг */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Оценка:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= reviewRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Текст отзыва */}
          <textarea
            value={reviewText}
            onChange={(e) => {
              setReviewText(e.target.value);
              if (reviewError) setReviewError('');
            }}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={4}
            placeholder="Напишите ваш отзыв..."
          />

          {reviewError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {reviewError}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setReviewOpen(false);
                setReviewError('');
              }}
              disabled={reviewSubmitting}
            >
              Отмена
            </Button>
            <Button
              className="flex-1"
              loading={reviewSubmitting}
              disabled={reviewSubmitting || !reviewText.trim()}
              onClick={async () => {
                if (!currentUser || !reviewText.trim() || !id) return;
                setReviewSubmitting(true);
                setReviewError('');
                try {
                  // Находим любой завершённый и принятый заказ с этим клиентом
                  const completedJob = jobs.find(
                    j => j.clientId === id && 
                         j.freelancerId === currentUser.id && 
                         j.status === 'paid'
                  );
                  if (!completedJob) {
                    setReviewError('Нет принятого заказа, по которому можно оставить отзыв.');
                    return;
                  }

                  await addReview({
                    jobId: String(completedJob.id),
                    fromUserId: currentUser.id,
                    toUserId: id,
                    clientId: currentUser.id,
                    freelancerId: id,
                    rating: reviewRating,
                    text: reviewText.trim(),
                  });
                  setReviewOpen(false);
                  setReviewText('');
                  setReviewRating(5);
                  setCanReview(false);
                } catch (error: any) {
                  setReviewError(error?.response?.data?.message || 'Не удалось отправить отзыв.');
                } finally {
                  setReviewSubmitting(false);
                }
              }}
            >
              Отправить отзыв
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetailPage;
