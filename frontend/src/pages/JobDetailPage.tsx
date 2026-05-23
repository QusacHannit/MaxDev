import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Calendar, DollarSign, CheckCircle, Clock, User,
  MessageSquare, AlertTriangle, Star, ArrowRight, CreditCard
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Chat from '../components/Chat';
import StarRating from '../components/ui/StarRating';
import Textarea from '../components/ui/Textarea';
import { Avatar } from '../components/ui/Avatar';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'violet' | 'danger' | 'default'; icon: React.ReactNode }> = {
  open: { label: 'Открыт', variant: 'success'},
  in_progress: { label: 'В работе', variant: 'info',},
  done: { label: 'Ожидает приёмки', variant: 'warning', icon: <AlertTriangle size={14} /> },
  paid: { label: 'Оплачено', variant: 'violet'},
  cancelled: { label: 'Отменён', variant: 'danger', icon: <AlertTriangle size={14} /> },
};

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    getJobById, getUserById, currentUser,
    applyToJob, acceptApplication, markJobDone,
    sendToRevision, payJob, checkPaymentStatus, addReview, getFreelancerReviews,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [applyModal, setApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Dedicated loading states per action to prevent button spam
  const [applying, setApplying] = useState(false);
  const [acceptingApp, setAcceptingApp] = useState<string | null>(null); // freelancerId being accepted
  const [markingDone, setMarkingDone] = useState(false);
  const [acceptingWork, setAcceptingWork] = useState(false);
  const [sendingRevision, setSendingRevision] = useState(false);

  // Ref to prevent double-clicks
  const applyLock = useRef(false);

  const job = getJobById(id || '');
  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-slate-900">Заказ не найден</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-violet-600 font-semibold">← Назад</button>
      </div>
    );
  }

  const client = getUserById(job.clientId);
  const freelancer = job.freelancerId ? getUserById(job.freelancerId) : null;
  const statusInfo = STATUS_MAP[job.status] || STATUS_MAP.open;
  const daysLeft = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const isClient = currentUser?.id === job.clientId;
  const isFreelancer = currentUser?.id === job.freelancerId;
  const isAdmin = currentUser?.role === 'administrator';

  // Strict check: already applied?
  const alreadyApplied = (job.applications || []).some(a => a.freelancerId === currentUser?.id);
  const isOfferedToCurrentFreelancer = currentUser?.role === 'freelancer' && !!job.isOffered && job.freelancerId === currentUser?.id;
  // Отклик доступен только для обычного публичного заказа.
  // Если заказ персонально предложен фрилансеру, он должен либо принять, либо отказаться — без повторного отклика.
  const canApply = currentUser?.role === 'freelancer'
    && job.status === 'open'
    && !alreadyApplied
    && currentUser?.id !== job.clientId
    && !isOfferedToCurrentFreelancer;

  const hasReviewed = getFreelancerReviews(job.freelancerId || '').some(r => r.jobId === job.id);

  // Чат доступен клиенту, выбранному фрилансеру и администратору.
  const showChatTab = (isClient || isFreelancer || isAdmin) && (job.status === 'in_progress' || job.status === 'done' || job.status === 'paid' || !!job.freelancerId);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'chat' && showChatTab) {
      setActiveTab('chat');
      return;
    }
    setActiveTab('info');
  }, [searchParams, showChatTab]);

  useEffect(() => {
    if (searchParams.get('payment') === 'return' && isClient) {
      handleCheckPayment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isClient, job.id]);

  const handleApply = async () => {
    if (!applyMessage.trim() || applyLock.current || applying) return;

    applyLock.current = true;
    setApplying(true);
    setApplyModal(false);

    const success = await applyToJob(job.id, applyMessage);

    if (!success) {
      console.warn('Already applied or job is no longer open');
    }

    setApplyMessage('');
    setApplying(false);
    applyLock.current = false;
  };

  const handleAcceptApplication = async (fId: string) => {
    if (acceptingApp) return;
    setAcceptingApp(fId);
    try {
      await acceptApplication(job.id, fId);
    } finally {
      // Always unlock button even if API returns 4xx/5xx
      setAcceptingApp(null);
    }
  };

  const handleMarkDone = async () => {
    if (markingDone) return;
    setMarkingDone(true);
    await markJobDone(job.id);
    setMarkingDone(false);
  };

  const handleAcceptWork = async () => {
    if (acceptingWork) return;
    setPaymentError('');
    setPaymentInfo('');
    setAcceptingWork(true);
    try {
      await payJob(job.id);
    } catch (error: any) {
      setPaymentError(error?.response?.data?.message || 'Не удалось создать платёж в ЮKassa. Проверьте настройки магазина.');
    } finally {
      setAcceptingWork(false);
    }
  };

  const handleCheckPayment = async () => {
    if (checkingPayment) return;
    setPaymentError('');
    setPaymentInfo('');
    setCheckingPayment(true);
    try {
      const result = await checkPaymentStatus(job.id);
      if (result.status === 'succeeded' || result.jobStatus === 'paid') {
        setPaymentInfo('Платёж подтверждён. Заказ успешно оплачен через ЮKassa.');
        setReviewModal(true);
      } else if (result.status === 'pending') {
        setPaymentInfo('Платёж ещё обрабатывается. Если вы уже оплатили, нажмите «Проверить статус» позже.');
      } else if (result.status === 'canceled') {
        setPaymentError('Платёж был отменён. Вы можете попробовать снова.');
      } else if (result.message) {
        setPaymentError(result.message);
      }
    } catch (error: any) {
      setPaymentError(error?.response?.data?.message || 'Не удалось проверить статус оплаты.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleRevision = async () => {
    if (sendingRevision) return;
    setSendingRevision(true);
    await sendToRevision(job.id);
    setSendingRevision(false);
  };

  const handleReview = () => {
    if (!currentUser || !job.freelancerId) return;
    addReview({
      fromUserId: currentUser.id,
      toUserId: job.freelancerId,
      clientId: currentUser.id,
      freelancerId: job.freelancerId,
      jobId: job.id,
      rating: reviewRating,
      text: reviewText,
    });
    setReviewModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
      >
        ← Назад
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Tabs — admin only sees info, no chat */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'info' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {/*<CheckCircle size={15} />*/} Информация
            </button>
            {showChatTab ? (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'chat' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {/*<MessageSquare size={15} />*/} Чат
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-slate-300 cursor-not-allowed">
                {/*<MessageSquare size={15} />*/} Чат
              </div>
            )}
          </div>

          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Job header */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={statusInfo.variant}>
                        <span className="flex items-center gap-1">{statusInfo.icon}{statusInfo.label}</span>
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Создан {new Date(job.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{job.title}</h1>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/*<div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                      <DollarSign size={16} className="text-violet-600" />
                    </div>*/}
                    <div>
                      <p className="text-xs text-slate-400">Бюджет</p>
                      <p className="font-bold text-slate-900">{job.budget.toLocaleString()} ₽</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/*<div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
                      <Calendar size={16} className="text-sky-600" />
                    </div>*/}
                    <div>
                      <p className="text-xs text-slate-400">Срок</p>
                      <p className="font-bold text-slate-900">
                        {new Date(job.deadline).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/*<div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Clock size={16} className="text-emerald-600" />
                    </div>*/}
                    <div>
                      <p className="text-xs text-slate-400">Осталось</p>
                      <p className={`font-bold ${daysLeft < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {daysLeft > 0 ? `${daysLeft} дней` : 'Просрочен'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Skills */}
              <Card>
                <h2 className="font-bold text-slate-900 mb-3">Требуемые навыки</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-medium border border-violet-100">{s}</span>
                  ))}
                </div>
              </Card>

              {/* Freelancer info (if assigned) */}
              {freelancer && (
                <Card>
                  <h2 className="font-bold text-slate-900 mb-4">Исполнитель</h2>
                  <div className="flex items-center gap-4">
                    <Avatar alt={freelancer.name} role={freelancer.role} size="lg" className="!w-14 !h-14 !rounded-2xl !text-xl ring-2 ring-violet-100" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{freelancer.name}</h3>
                      <StarRating rating={freelancer.rating || 0} size={14} className="mt-0.5" />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {freelancer.skills?.slice(0, 3).map(s => <Badge key={s} variant="violet">{s}</Badge>)}
                      </div>
                    </div>
                    {!isAdmin && (
                      <Link to={`/freelancer/${freelancer.id}`}>
                        <Button variant="outline" size="sm">
                          Профиль <ArrowRight size={14} />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              )}

              {/* Applications (for client only) */}
              {isClient && job.status === 'open' && !job.isOffered && (job.applications || []).length > 0 && (
                <Card>
                  <h2 className="font-bold text-slate-900 mb-4">
                    Отклики ({(job.applications || []).length})
                  </h2>
                  <div className="space-y-4">
                    {(job.applications || []).map(app => {
                      const f = getUserById(app.freelancerId);
                      if (!f) return null;
                      const isBeingAccepted = acceptingApp === f.id;
                      return (
                        <div key={app.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <Avatar alt={f.name} role={f.role} size="md" className="!w-11 !h-11 !rounded-xl !text-sm ring-1 ring-violet-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link to={`/freelancer/${f.id}`} className="font-semibold text-slate-900 hover:text-violet-700 transition-colors">
                                {f.name}
                              </Link>
                              <StarRating rating={f.rating || 0} size={12} />
                              <span className="text-xs text-slate-500">{f.rating}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{app.message}</p>
                            <div className="flex flex-wrap gap-1">
                              {f.skills?.slice(0, 3).map(s => <Badge key={s} variant="violet">{s}</Badge>)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAcceptApplication(f.id)}
                            loading={isBeingAccepted}
                            disabled={!!acceptingApp}
                          >
                            {isBeingAccepted ? 'Выбор...' : 'Выбрать'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Admin sees applications count but not details */}
              {isAdmin && (job.applications || []).length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={18} className="text-violet-500" />
                    <p className="font-semibold">Откликов на заказ: {(job.applications || []).length}</p>
                  </div>
                </Card>
              )}

              {/* No applications yet */}
              {isClient && job.status === 'open' && !job.isOffered && (job.applications || []).length === 0 && (
                <Card className="text-center py-8">
                  <User className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="text-slate-500">Откликов пока нет</p>
                  <p className="text-xs text-slate-400 mt-1">Заказ опубликован и ожидает исполнителей</p>
                </Card>
              )}
            </div>
          ) : activeTab === 'chat' && showChatTab ? (
            <Card className="!p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Чат по заказу</h2>
                <p className="text-xs text-slate-400 mt-0.5">Сообщения обновляются автоматически</p>
              </div>
              <div className="p-4">
                <Chat jobId={job.id} />
              </div>
            </Card>
          ) : null}
        </div>

        {/* Right sidebar — actions */}
        <div className="space-y-4">
          {/* Admin notice */}
          {isAdmin && (
            <Card className="!p-4 bg-amber-50 border-amber-100">
              <div className="flex items-start gap-2 text-amber-700">
                <Shield size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Режим администратора</p>
                  <p className="text-xs mt-0.5 text-amber-600">
                    Вы просматриваете заказ в режиме наблюдения
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Client actions */}
          {isClient && (
            <Card>
              <h3 className="font-bold text-slate-900 mb-4">Управление заказом</h3>
              <div className="space-y-3">
                {job.status === 'done' && (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 mb-2">
                      Исполнитель сдал работу. Проверьте результат в чате, затем оплатите заказ через ЮKassa.
                    </div>
                    {paymentInfo && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                        {paymentInfo}
                      </div>
                    )}
                    {paymentError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                        {paymentError}
                      </div>
                    )}
                    <Button className="w-full" variant="success" onClick={handleAcceptWork} loading={acceptingWork}>
                      <CreditCard size={16} />
                      Оплатить через ЮKassa
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleCheckPayment} loading={checkingPayment}>
                      Проверить статус оплаты
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleRevision} loading={sendingRevision}>
                      Отправить на доработку
                    </Button>
                  </>
                )}
                {job.status === 'in_progress' && (
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sky-700">
                    Заказ в работе. Общайтесь с исполнителем в чате.
                  </div>
                )}
                {job.status === 'paid' && !hasReviewed && job.freelancerId && (
                  <Button className="w-full" variant="outline" onClick={() => setReviewModal(true)}>
                    <Star size={16} />
                    Оставить отзыв
                  </Button>
                )}
                {job.status === 'paid' && hasReviewed && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 text-center">
                    Отзыв оставлен. Спасибо!
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Freelancer actions */}
          {isFreelancer && (
            <Card>
              <h3 className="font-bold text-slate-900 mb-4">Действия</h3>
              <div className="space-y-3">
                {job.status === 'in_progress' && (
                  <>
                    <Button className="w-full" variant="success" onClick={handleMarkDone} loading={markingDone}>
                      {/*<CheckCircle size={16} />*/}
                      Сдать работу
                    </Button>
                    <p className="text-xs text-slate-400 text-center">После сдачи клиент проверит результат</p>
                  </>
                )}
                {job.status === 'done' && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                    Работа сдана. Ждём проверки клиентом.
                  </div>
                )}
                {job.status === 'paid' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                    ✅ Заказ оплачен! Поздравляем!
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Offered job actions for the targeted freelancer */}
          {isOfferedToCurrentFreelancer && job.status === 'open' && (
            <Card className="border-2 border-violet-300 bg-violet-50/40">
              <h3 className="font-bold text-slate-900 mb-2">Вам предложили этот заказ</h3>
              <p className="text-sm text-slate-600 mb-4">
                Если вы согласны, заказ сразу будет принят в работу без повторного отклика.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  className="w-full"
                  variant="success"
                  onClick={() => handleAcceptApplication(currentUser!.id)}
                  loading={acceptingApp === currentUser?.id}
                  disabled={!!acceptingApp}
                >
                  Принять заказ
                </Button>
              </div>
            </Card>
          )}

          {/* Apply button for freelancers */}
          {canApply && (
            <Card>
              <h3 className="font-bold text-slate-900 mb-3">Откликнуться</h3>
              <p className="text-sm text-slate-500 mb-4">
                Расскажите клиенту почему именно вы подходите для этого проекта
              </p>
              <Button
                className="w-full"
                onClick={() => setApplyModal(true)}
                disabled={applying}
                loading={applying}
              >
                Откликнуться на заказ
              </Button>
            </Card>
          )}

          {/* Already applied indicator */}
          {alreadyApplied && currentUser?.role === 'freelancer' && !isFreelancer && !isOfferedToCurrentFreelancer && (
            <Card>
              <div className="text-center">
                {/*<CheckCircle className="mx-auto text-emerald-500 mb-2" size={28} />*/}
                <p className="font-semibold text-slate-900">Вы откликнулись</p>
                <p className="text-sm text-slate-500 mt-1">Ожидайте решения клиента</p>
              </div>
            </Card>
          )}

          {/* Client info */}
          <Card className="!p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Заказчик</h3>
            {client && (
              <Link to={`/client/${client.id}`} className="flex items-center gap-3 group hover:bg-slate-50 rounded-xl p-1 -m-1 transition-colors">
                <Avatar alt={client.name} role={client.role} size="md" className="!w-10 !h-10 !text-sm ring-2 ring-slate-100" />
                <div>
                  <p className="font-semibold text-sm text-violet-600 group-hover:text-violet-700">{client.name}</p>
                  <p className="text-xs text-slate-400">Клиент • Нажмите для просмотра</p>
                </div>
              </Link>
            )}
          </Card>

          {/* Job meta */}
          <Card className="!p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Детали заказа</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Бюджет</span>
                <span className="font-semibold text-violet-600">{job.budget.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Дедлайн</span>
                <span className="font-semibold text-slate-900">{new Date(job.deadline).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Откликов</span>
                <span className="font-semibold text-slate-900">{(job.applications || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Статус</span>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={applyModal} onClose={() => !applying && setApplyModal(false)} title="Откликнуться на заказ">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
            <p className="text-sm text-violet-600 font-semibold">{job.budget.toLocaleString()} ₽</p>
          </div>
          <Textarea
            label="Сопроводительное сообщение"
            placeholder="Расскажите о своём опыте, почему вы подходите для этого проекта, сроки выполнения..."
            rows={5}
            value={applyMessage}
            onChange={e => setApplyMessage(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setApplyModal(false)} disabled={applying}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              loading={applying}
              disabled={!applyMessage.trim() || applying}
            >
              Отправить отклик
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Оставить отзыв">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Как прошла работа с {freelancer?.name}?</p>
          <div className="flex items-center justify-center gap-2 py-2">
            <StarRating
              rating={reviewRating}
              size={32}
              interactive
              onChange={setReviewRating}
            />
          </div>
          <Textarea
            label="Комментарий"
            placeholder="Расскажите о качестве работы, коммуникации, соблюдении сроков..."
            rows={4}
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setReviewModal(false)}>Пропустить</Button>
            <Button className="flex-1" onClick={handleReview} disabled={!reviewText.trim()}>
              Оставить отзыв
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Shield icon inline since we use it in the admin notice
function Shield({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default JobDetailPage;
