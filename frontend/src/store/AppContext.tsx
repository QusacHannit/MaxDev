/**
 * MaxDev Platform - Application Context
 * 
 * ГЛОБАЛЬНЫЙ КОНТЕКСТ ПРИЛОЖЕНИЯ
 * =============================
 * 
 * Этот файл управляет всем состоянием приложения и взаимодействует с бэкендом.
 * 
 * АРХИТЕКТУРА:
 * - Frontend (React) -> API Client (Axios) -> Backend (Flask) -> Database (SQLite)
 * - Все данные хранятся на сервере в файле backend/instance/maxdev.db
 * - Фронтенд не хранит бизнес-данные локально (только JWT токен)
 * 
 * КАК РАБОТАЕТ:
 * 1. При загрузке проверяется токен в localStorage
 * 2. Если токен есть - запрашиваем данные пользователя с /api/auth/me
 * 3. Все операции (создание заказа, отклик и т.д.) идут через API
 * 4. После каждой операции данные перезагружаются с сервера
 * 
 * ТЕХНОЛОГИИ:
 * - React Context API для глобального состояния
 * - Axios для HTTP запросов
 * - JWT токены для аутентификации
 * - Flask REST API на бэкенде
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Job, Message, Review, Complaint, ActivityLog, NotificationItem } from '../types';
import { authApi, usersApi, jobsApi, messagesApi, reviewsApi, complaintsApi, adminApi, logsApi, notificationsApi } from '../api/client';

// ============================================================================
// ТИПЫ
// ============================================================================

export type LoginResult = 'wrong_credentials' | 'blocked' | 'ok';

interface AppContextType {
  // Состояние
  isLoading: boolean;
  dbSize: string;
  adminStats: { users: number; jobs: number; messages: number; reviews: number; complaints: number; logs: number };
  currentUser: User | null;

  // Auth методы
  login: (email: string, password: string) => Promise<{ result: LoginResult; user?: User }>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: 'client' | 'freelancer', verifyToken?: string) => Promise<boolean>;

  // Users
  users: User[];
  updateUser: (user: User) => Promise<void>;
  blockUser: (userId: string, reason: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  refreshUsers: () => Promise<void>;
  loadAdminData: () => Promise<void>;

  // Jobs
  jobs: Job[];
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'applications' | 'status'>) => Promise<Job>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  getJobById: (id: string) => Job | undefined;
  applyToJob: (jobId: string, message: string) => Promise<boolean>;
  acceptApplication: (jobId: string, freelancerId: string) => Promise<void>;
  markJobDone: (jobId: string) => Promise<void>;
  acceptWork: (jobId: string) => Promise<void>;
  sendToRevision: (jobId: string) => Promise<void>;
  payJob: (jobId: string) => Promise<void>;
  checkPaymentStatus: (jobId: string) => Promise<{ status: string; jobStatus?: string; message?: string }>;
  refreshJobs: () => Promise<void>;

  // Messages
  messages: Message[];
  sendMessage: (jobId: string, text: string, file?: File) => Promise<void>;
  getJobMessages: (jobId: string) => Message[];
  refreshMessages: (jobId: string) => Promise<void>;

  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getFreelancerReviews: (freelancerId: string) => Review[];
  refreshReviews: () => Promise<void>;

  // Complaints
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => Promise<{ ok: boolean; message: string }>;
  resolveComplaint: (id: string) => Promise<void>;
  dismissComplaint: (id: string) => Promise<void>;
  refreshComplaints: () => Promise<void>;

  // Activity Logs
  activityLogs: ActivityLog[];
  addLog: (type: ActivityLog['type'], message: string, userId?: string, userName?: string) => void;
  refreshLogs: () => Promise<void>;

  // Backup
  exportBackupFile: () => Promise<void>;
  importBackupFile: (file: File) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  refreshNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Конвертирует числовой ID в строковый (бэкенд использует int, фронтенд string)
 */
const numToId = (n: number | string): string => String(n);

/**
 * Конвертирует строковый ID в числовой для API
 */
const idToNum = (id: string): number => parseInt(id, 10);

/**
 * Преобразует серверный код действия лога в тип, понятный фронтенду.
 * Бэкенд отдаёт action вроде LOGIN / JOB_CREATE / BACKUP_EXPORT,
 * а UI ожидает type вроде auth / job_create / system.
 */
const mapLogActionToType = (action?: string): ActivityLog['type'] => {
  switch ((action || '').toUpperCase()) {
    case 'LOGIN':
    case 'LOGOUT':
      return 'auth';
    case 'REGISTER':
      return 'register';
    case 'BLOCK':
      return 'block';
    case 'UNBLOCK':
      return 'unblock';
    case 'JOB_CREATE':
      return 'job_create';
    case 'JOB_DELETE':
      return 'job_delete';
    case 'JOB_APPLY':
      return 'apply';
    case 'JOB_ASSIGN':
      return 'accept';
    case 'JOB_COMPLETE':
    case 'JOB_DONE':
      return 'done';
    case 'JOB_PAID':
    case 'PAYMENT':
      return 'paid';
    case 'COMPLAINT':
      return 'complaint';
    default:
      return 'system';
  }
};

/**
 * Нормализует лог с сервера к формату фронтенда.
 * Исправляет расхождения по полям:
 * - action -> type/rawAction
 * - details -> message
 * - timestamp -> createdAt
 */
const normalizeLog = (log: any): ActivityLog & { rawAction?: string } => ({
  id: numToId(log.id),
  type: log.type ? log.type : mapLogActionToType(log.action),
  message: log.message || log.details || log.action || 'Системное событие',
  userId: log.userId ? numToId(log.userId) : log.user_id ? numToId(log.user_id) : undefined,
  userName: log.userName || log.user_name || undefined,
  createdAt: log.createdAt || log.created_at || log.timestamp || new Date().toISOString(),
  rawAction: log.rawAction || log.action || undefined,
});

/**
 * Приводит пользователя с сервера к формату фронтенда.
 * Бэкенд отдаёт blocked/blockReason, а UI ожидает isBlocked/blockReason.
 */
const normalizeUser = (user: any): User => ({
  ...user,
  id: numToId(user.id),
  isBlocked: Boolean(user.isBlocked ?? user.blocked),
  blockReason: user.blockReason ?? user.block_reason ?? undefined,
  skills: Array.isArray(user.skills)
    ? user.skills
    : typeof user.skills === 'string' && user.skills.length > 0
      ? user.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
  rating: typeof user.rating === 'number' ? user.rating : 0,
  completedJobs: typeof user.completedJobs === 'number' ? user.completedJobs : 0,
  activeApplications: typeof user.activeApplications === 'number' ? user.activeApplications : 0,
  avatar:
    user.avatar ||
    (user.role === 'administrator'
      ? 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=administrator&backgroundColor=000000&primaryColor=00ff00'
      : 'https://api.dicebear.com/7.x/identicon/svg?seed=maxdev-user&backgroundColor=b6e3f4'),
});

/**
 * Фронтенд ожидает applications как массив объектов,
 * а сервер сейчас отдаёт applicants как массив числовых ID.
 */
/**
 * normalizeJob: преобразует данные заказа с сервера в формат фронтенда.
 * 
 * Сервер теперь отдаёт:
 *   applicants: [3, 5] — массив ID
 *   applicantsData: [{id, name, email, role}, ...] — данные об откликнувшихся
 *   clientData: {id, name, email, role} — данные о клиенте
 *   freelancerData: {id, name, email, role} — данные об исполнителе
 * 
 * Фронтенд ожидает:
 *   applications: [{id, jobId, freelancerId, message, status, createdAt}, ...]
 * 
 * Также собирает массив «встроенных пользователей» — чтобы их можно было
 * добавить в users state и getUserById мог их найти.
 */
const normalizeJob = (job: any): Job & { _embeddedUsers?: any[] } => {
  const applicantIds = Array.isArray(job.applicants)
    ? job.applicants
    : Array.isArray(job.applications)
      ? job.applications
      : [];

  // Данные об откликнувшихся (если сервер прислал)
  const applicantsData: any[] = Array.isArray(job.applicantsData) ? job.applicantsData : [];

  const normalizedStatus =
    job.status === 'completed' ? 'done' :
    job.status === 'accepted' ? 'in_progress' :
    job.status || 'open';

  // Собираем встроенных пользователей (клиент, фрилансер, откликнувшиеся)
  const embeddedUsers: any[] = [];
  if (job.clientData) embeddedUsers.push(job.clientData);
  if (job.freelancerData) embeddedUsers.push(job.freelancerData);
  applicantsData.forEach((u: any) => embeddedUsers.push(u));

  const normalizedFreelancerId = job.freelancerId || job.freelancer_id
    ? numToId(job.freelancerId ?? job.freelancer_id)
    : undefined;

  return {
    ...job,
    id: numToId(job.id),
    clientId: numToId(job.clientId ?? job.client_id),
    freelancerId: normalizedFreelancerId,
    isOffered: !!normalizedFreelancerId && normalizedStatus === 'open',
    status: normalizedStatus,
    skills: Array.isArray(job.skills)
      ? job.skills
      : typeof job.skills === 'string' && job.skills.length > 0
        ? job.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    applications: applicantIds.map((applicantId: number | string, index: number) => {
      // Ищем данные об откликнувшемся в applicantsData
      const userData = applicantsData.find((u: any) => String(u.id) === String(applicantId));
      return {
        id: `${job.id}-app-${applicantId}-${index}`,
        jobId: numToId(job.id),
        freelancerId: numToId(applicantId),
        message: userData ? `${userData.name} откликнулся на заказ` : 'Отклик на заказ',
        status: String(job.freelancerId ?? job.freelancer_id) === String(applicantId) ? 'accepted' : 'pending',
        createdAt: job.createdAt || job.created_at || new Date().toISOString(),
      };
    }),
    _embeddedUsers: embeddedUsers,
  };
};

/**
 * Сервер отдаёт content/fileUrl, а UI использует text/file.
 */
/**
 * normalizeMessage: преобразует сообщение с сервера в формат фронтенда.
 * Сервер отдаёт content/fileUrl/senderData, а UI использует text/file.
 * Также сохраняет _senderData для добавления отправителя в users state.
 */
const normalizeMessage = (message: any): Message & { _senderData?: any } => ({
  ...message,
  id: numToId(message.id),
  jobId: numToId(message.jobId ?? message.job_id),
  senderId: numToId(message.senderId ?? message.sender_id),
  text: message.text ?? message.content ?? '',
  file: message.file ?? message.fileUrl ?? message.file_url ?? undefined,
  fileName: message.fileName ?? undefined,
  _senderData: message.senderData ?? undefined,
  createdAt: message.createdAt || message.created_at || new Date().toISOString(),
});

const normalizeReview = (review: any): Review => ({
  ...review,
  id: numToId(review.id),
  fromUserId: numToId(review.fromUserId ?? review.from_user_id ?? review.clientId),
  toUserId: numToId(review.toUserId ?? review.to_user_id ?? review.freelancerId),
  clientId: numToId(review.clientId ?? review.fromUserId ?? review.from_user_id),
  freelancerId: numToId(review.freelancerId ?? review.toUserId ?? review.to_user_id),
  jobId: numToId(review.jobId ?? review.job_id),
  text: review.text ?? review.comment ?? '',
  createdAt: review.createdAt || review.created_at || new Date().toISOString(),
});

const normalizeComplaint = (complaint: any): Complaint => ({
  ...complaint,
  id: numToId(complaint.id),
  reporterId: numToId(complaint.reporterId ?? complaint.userId ?? complaint.user_id),
  targetId: complaint.targetId || complaint.targetUserId || complaint.target_user_id
    ? numToId(complaint.targetId ?? complaint.targetUserId ?? complaint.target_user_id)
    : '',
  status: complaint.status === 'rejected' ? 'dismissed' : complaint.status,
  createdAt: complaint.createdAt || complaint.created_at || new Date().toISOString(),
});

const normalizeNotification = (item: any): NotificationItem => ({
  id: numToId(item.id),
  userId: numToId(item.userId ?? item.user_id),
  title: item.title || 'Уведомление',
  message: item.message || '',
  type: (item.type || 'info') as NotificationItem['type'],
  isRead: Boolean(item.isRead ?? item.is_read),
  // Use backend deep link first; fallback only if link is absent.
  link:
    item.link ||
    (item.type === 'message'
      ? '/my-jobs'
      : item.type === 'job'
        ? '/my-jobs'
        : item.type === 'review'
          ? '/profile'
          : item.type === 'complaint'
            ? '/profile'
            : '/'),
  createdAt: item.createdAt || item.created_at || new Date().toISOString(),
});

// ============================================================================
// PROVIDER
// ============================================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dbSize, setDbSize] = useState('0 B');
  const [adminStats, setAdminStats] = useState({ users: 0, jobs: 0, messages: 0, reviews: 0, complaints: 0, logs: 0 });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Инициализация при загрузке - проверяем токен
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('maxdev_token');
        if (token) {
          const user = await authApi.getCurrentUser();
          // Конвертируем id в строку для совместимости с фронтендом
          setCurrentUser({ ...user, id: numToId(user.id) });
        }
      } catch (error) {
        localStorage.removeItem('maxdev_token');
        console.warn('Токен недействителен');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Обновление данных
  // Загрузка всех данных для админа (вызывается вручную)
  const loadAdminData = useCallback(async () => {
    console.log('[DEBUG] loadAdminData called');
    if (currentUser?.role !== 'administrator') {
      console.log('[DEBUG] Не админ - пропуск загрузки');
      return;
    }
    
    try {
      // Загружаем все данные последовательно для надежности
      console.log('[DEBUG] Загрузка пользователей...');
      const usersData = await usersApi.getAll();
      console.log('[DEBUG] Пользователей загружено:', usersData.length);
      setUsers(usersData.map(normalizeUser));
    } catch (e) {
      console.error('[DEBUG] Ошибка загрузки users:', e);
      // Пробуем через /auth/me чтобы проверить токен
      try {
        const me = await authApi.getCurrentUser();
        console.log('[DEBUG] Текущий пользователь:', me);
      } catch (e2) {
        console.error('[DEBUG] Токен не работает:', e2);
      }
    }

    try {
      console.log('[DEBUG] Загрузка жалоб...');
      const complaintsData = await complaintsApi.getAll();
      console.log('[DEBUG] Жалоб загружено:', complaintsData.length);
      setComplaints(complaintsData.map(normalizeComplaint));
    } catch (e) {
      console.error('[DEBUG] Ошибка загрузки complaints:', e);
    }

    try {
      console.log('[DEBUG] Загрузка логов...');
      const logsData = await logsApi.getAll();
      console.log('[DEBUG] Логов загружено:', logsData.length);
      setActivityLogs(logsData.map(normalizeLog));
    } catch (e) {
      console.error('[DEBUG] Ошибка загрузки logs:', e);
    }

    try {
      console.log('[DEBUG] Загрузка статистики...');
      const stats = await adminApi.getStats();
      setAdminStats(stats);
      setDbSize(`${Math.round((stats.users * 500 + stats.jobs * 1000 + stats.messages * 200) / 1024)} KB`);
    } catch (e) {
      console.error('[DEBUG] Ошибка загрузки stats:', e);
    }
    
    console.log('[DEBUG] loadAdminData завершен');
  }, [currentUser]);

  /**
   * Загрузка пользователей.
   * Администратор — получает ВСЕХ пользователей через /api/users.
   * Клиент/фрилансер — получает фрилансеров через /api/freelancers
   * + данные о себе уже есть в currentUser.
   * Это нужно для отображения откликов, чата и карточек исполнителей.
   */
  const refreshUsers = useCallback(async () => {
    try {
      if (currentUser?.role === 'administrator') {
        // Админ видит всех
        const data = await usersApi.getAll();
        setUsers(data.map(normalizeUser));
      } else if (currentUser) {
        // Клиент/фрилансер — загружаем фрилансеров + себя
        const freelancersData = await usersApi.getFreelancers();
        const normalized = freelancersData.map(normalizeUser);
        
        // Добавляем текущего пользователя если его нет в списке
        setUsers(prev => {
          const map = new Map<string, User>();
          // Сохраняем всех ранее загруженных (чтобы не терять клиентов)
          prev.forEach((u: User) => map.set(u.id, u));
          // Перезаписываем фрилансерами с сервера
          normalized.forEach((u: User) => map.set(u.id, u));
          // Гарантируем что текущий пользователь есть
          if (currentUser && !map.has(currentUser.id)) {
            map.set(currentUser.id, currentUser);
          }
          return Array.from(map.values());
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  }, [currentUser]);

  /**
   * Загрузка заказов.
   * Также извлекает встроенных пользователей (clientData, freelancerData, applicantsData)
   * и добавляет их в users state — чтобы getUserById мог найти клиента/фрилансера
   * при отображении откликов и чата.
   */
  const refreshJobs = useCallback(async () => {
    try {
      const data = await jobsApi.getAll();
      const normalizedJobs = data.map(normalizeJob);
      
      // Собираем встроенных пользователей из всех заказов
      const embeddedUsers: any[] = [];
      normalizedJobs.forEach((j: any) => {
        if (j._embeddedUsers) {
          embeddedUsers.push(...j._embeddedUsers);
        }
      });
      
      // Добавляем встроенных пользователей в users state (не перезаписываем существующих)
      if (embeddedUsers.length > 0) {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach((u: User) => map.set(u.id, u));
          embeddedUsers.forEach((u: any) => {
            const normalized = normalizeUser(u);
            // Не перезаписываем если уже есть более полные данные
            if (!map.has(normalized.id)) {
              map.set(normalized.id, normalized);
            }
          });
          return Array.from(map.values());
        });
      }
      
      setJobs(normalizedJobs);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  }, []);

  /**
   * Загрузка сообщений для заказа.
   * Также извлекает данные отправителей (senderData) и добавляет их в users state,
   * чтобы чат мог отобразить имена и аватары.
   */
  const refreshMessages = useCallback(async (jobId: string) => {
    try {
      const data = await messagesApi.getByJob(idToNum(jobId));
      const converted = data.map(normalizeMessage);
      
      // Добавляем отправителей сообщений в users state
      const senderUsers: any[] = [];
      converted.forEach((m: any) => {
        if (m._senderData) {
          senderUsers.push(m._senderData);
        }
      });
      if (senderUsers.length > 0) {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach((u: User) => map.set(u.id, u));
          senderUsers.forEach((u: any) => {
            const normalized = normalizeUser(u);
            if (!map.has(normalized.id)) {
              map.set(normalized.id, normalized);
            }
          });
          return Array.from(map.values());
        });
      }
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.jobId !== jobId);
        return [...filtered, ...converted];
      });
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const data = await reviewsApi.getAll();
      setReviews(data.map(normalizeReview));
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
    }
  }, []);

  const refreshComplaints = useCallback(async () => {
    try {
      if (currentUser?.role === 'administrator') {
        const data = await complaintsApi.getAll();
        setComplaints(data.map(normalizeComplaint));
      }
    } catch (error) {
      console.error('Ошибка загрузки жалоб:', error);
    }
  }, [currentUser]);

  const refreshLogs = useCallback(async () => {
    try {
      if (currentUser?.role === 'administrator') {
        const data = await logsApi.getAll();
        setActivityLogs(data.map(normalizeLog));
      }
    } catch (error) {
      console.error('Ошибка загрузки логов:', error);
    }
  }, [currentUser]);

  const refreshData = useCallback(async () => {
    console.log('[DEBUG] refreshData called');
    try {
      await Promise.all([
        refreshJobs(),
        refreshReviews(),
        refreshUsers(),
        refreshComplaints(),
        refreshLogs(),
      ]);
      try {
        if (currentUser?.role === 'administrator') {
          const stats = await adminApi.getStats();
          setAdminStats(stats);
          setDbSize(`${Math.round((stats.users * 500 + stats.jobs * 1000 + stats.messages * 200) / 1024)} KB`);
        }
      } catch (e) {
        console.log('[DEBUG] Ошибка получения статистики:', e);
      }
    } catch (e) {
      console.error('[DEBUG] Ошибка в refreshData:', e);
    }
  }, [refreshJobs, refreshReviews, refreshUsers, refreshComplaints, refreshLogs, currentUser]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data.map(normalizeNotification));
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  }, [currentUser]);

  const markNotificationsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Ошибка отметки уведомлений:', error);
    }
  }, [currentUser]);

  // Очистить все уведомления
  const clearNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
    } catch (error) {
      console.error('Ошибка очистки уведомлений:', error);
    }
  }, [currentUser]);

  // Удалить одно уведомление
  const deleteNotification = useCallback(async (id: string) => {
    if (!currentUser) return;
    try {
      await notificationsApi.deleteOne(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !isLoading) {
      refreshData();
      refreshNotifications();
    }
  }, [currentUser, isLoading, refreshData, refreshNotifications]);

  useEffect(() => {
    if (!currentUser || isLoading) return;
    const timer = setInterval(() => {
      refreshNotifications();
      if (currentUser.role === 'administrator') {
        refreshLogs();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [currentUser, isLoading, refreshNotifications, refreshLogs]);

  const addLog = useCallback(() => {}, []);

  // ========================================================================
  // AUTH
  // ========================================================================

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('maxdev_token', data.token);
      const user = { ...data.user, id: numToId(data.user.id) };
      setCurrentUser(user);
      return { result: 'ok' as LoginResult, user };
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error === 'blocked') {
        return { 
          result: 'blocked' as LoginResult, 
          user: { id: '', name: '', email, role: 'client', blockReason: err.response.data.blockReason } as User
        };
      }
      return { result: 'wrong_credentials' as LoginResult };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('maxdev_token');
    setCurrentUser(null);
    setUsers([]);
    setJobs([]);
    setMessages([]);
    setReviews([]);
    setComplaints([]);
    setActivityLogs([]);
    setNotifications([]);
    setAdminStats({ users: 0, jobs: 0, messages: 0, reviews: 0, complaints: 0, logs: 0 });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: 'client' | 'freelancer', verifyToken?: string) => {
    try {
      const data = await authApi.register({ name, email, password, role, verifyToken });
      localStorage.setItem('maxdev_token', data.token);
      setCurrentUser({ ...data.user, id: numToId(data.user.id) });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ========================================================================
  // USERS
  // ========================================================================

  const updateUser = useCallback(async (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
  }, [currentUser]);

  const blockUser = useCallback(async (userId: string, reason: string) => {
    await usersApi.block(idToNum(userId), reason);
    await refreshUsers();
  }, [refreshUsers]);

  const unblockUser = useCallback(async (userId: string) => {
    await usersApi.unblock(idToNum(userId));
    await refreshUsers();
  }, [refreshUsers]);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  // ========================================================================
  // JOBS
  // ========================================================================

  const createJob = useCallback(async (jobData: Omit<Job, 'id' | 'createdAt' | 'applications' | 'status'>) => {
    const newJob = await jobsApi.create({
      title: jobData.title,
      description: jobData.description,
      budget: jobData.budget,
      deadline: jobData.deadline,
      skills: jobData.skills,
      freelancerId: jobData.freelancerId ? idToNum(jobData.freelancerId) : undefined,
    });
    await refreshJobs();
    return { ...newJob, id: numToId(newJob.id), clientId: numToId(newJob.clientId) };
  }, [refreshJobs]);

  const updateJob = useCallback(async () => {
    await refreshJobs();
  }, [refreshJobs]);

  const deleteJob = useCallback(async (jobId: string) => {
    await jobsApi.delete(idToNum(jobId));
    await refreshJobs();
  }, [refreshJobs]);

  const getJobById = useCallback((id: string) => {
    return jobs.find(j => j.id === id);
  }, [jobs]);

  const applyToJob = useCallback(async (jobId: string, _message: string) => {
    try {
      await jobsApi.apply(idToNum(jobId));
      await refreshJobs();
      return true;
    } catch {
      return false;
    }
  }, [refreshJobs]);

  const acceptApplication = useCallback(async (jobId: string, freelancerId: string) => {
    await jobsApi.selectFreelancer(idToNum(jobId), idToNum(freelancerId));
    await refreshJobs();
  }, [refreshJobs]);

  /**
   * Фрилансер сдаёт работу → статус done
   */
  const markJobDone = useCallback(async (jobId: string) => {
    await jobsApi.complete(idToNum(jobId));
    await refreshJobs();
  }, [refreshJobs]);

  /**
   * Клиент принимает работу → статус paid
   */
  const acceptWork = useCallback(async (jobId: string) => {
    await jobsApi.acceptWork(idToNum(jobId));
    await refreshJobs();
  }, [refreshJobs]);

  /**
   * Клиент отправляет на доработку → статус in_progress
   */
  const sendToRevision = useCallback(async (jobId: string) => {
    await jobsApi.revision(idToNum(jobId));
    await refreshJobs();
  }, [refreshJobs]);

  /**
   * Создаёт платёж в ЮKassa и перенаправляет пользователя на confirmation_url.
   */
  const payJob = useCallback(async (jobId: string) => {
    const result = await jobsApi.pay(idToNum(jobId));
    if (result.confirmationUrl) {
      window.location.href = result.confirmationUrl;
      return;
    }
    await refreshJobs();
  }, [refreshJobs]);

  /**
   * Проверяет статус последнего платежа по заказу после возврата пользователя.
   */
  const checkPaymentStatus = useCallback(async (jobId: string) => {
    const result = await jobsApi.getPaymentStatus(idToNum(jobId));
    await refreshJobs();
    await refreshNotifications();
    return {
      status: result.status,
      jobStatus: result.jobStatus,
      message: result.message,
    };
  }, [refreshJobs, refreshNotifications]);

  // ========================================================================
  // MESSAGES
  // ========================================================================

  const sendMessage = useCallback(async (jobId: string, text: string, file?: File) => {
    await messagesApi.send(idToNum(jobId), text, file);
    await refreshMessages(jobId);
  }, [refreshMessages]);

  const getJobMessages = useCallback((jobId: string) => {
    return messages.filter(m => m.jobId === jobId);
  }, [messages]);

  // ========================================================================
  // REVIEWS
  // ========================================================================

  const addReview = useCallback(async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    await reviewsApi.create({
      jobId: idToNum(reviewData.jobId),
      toUserId: idToNum(reviewData.freelancerId),
      rating: reviewData.rating,
      comment: reviewData.text,
    });
    await refreshReviews();
  }, [refreshReviews]);

  const getFreelancerReviews = useCallback((freelancerId: string) => {
    return reviews.filter(r => r.freelancerId === freelancerId);
  }, [reviews]);

  // ========================================================================
  // COMPLAINTS
  // ========================================================================

  const addComplaint = useCallback(async (complaintData: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => {
    try {
      await complaintsApi.create({
        targetUserId: complaintData.targetId ? idToNum(complaintData.targetId) : undefined,
        reason: complaintData.reason,
      });
      await refreshComplaints();
      return { ok: true, message: 'Жалоба отправлена. Жалоба на рассмотрении.' };
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409 && message) {
        return { ok: false, message };
      }
      return { ok: false, message: 'Не удалось отправить жалобу. Попробуйте позже.' };
    }
  }, [refreshComplaints]);

  const resolveComplaint = useCallback(async (id: string) => {
    await complaintsApi.resolve(idToNum(id), { status: 'resolved' });
    await refreshComplaints();
  }, [refreshComplaints]);

  const dismissComplaint = useCallback(async (id: string) => {
    await complaintsApi.resolve(idToNum(id), { status: 'dismissed' });
    await refreshComplaints();
  }, [refreshComplaints]);

  // ========================================================================
  // BACKUP
  // ========================================================================

  const exportBackupFile = useCallback(async () => {
    await adminApi.exportBackup();
  }, []);

  const importBackupFileHandler = useCallback(async (file: File) => {
    try {
      await adminApi.importBackup(file);
      await refreshData();
      return true;
    } catch {
      return false;
    }
  }, [refreshData]);

  const resetToDefaults = useCallback(async () => {
    await adminApi.resetDatabase();
    await refreshData();
  }, [refreshData]);

  // ========================================================================
  // PROVIDER VALUE
  // ========================================================================

  return (
    <AppContext.Provider value={{
      isLoading, dbSize, currentUser, login, logout, register,
      adminStats,
      users, updateUser, blockUser, unblockUser, getUserById, refreshUsers, loadAdminData,
      jobs, createJob, updateJob, deleteJob, getJobById, applyToJob,
      acceptApplication, markJobDone, acceptWork, sendToRevision, payJob, checkPaymentStatus, refreshJobs,
      messages, sendMessage, getJobMessages, refreshMessages,
      reviews, addReview, getFreelancerReviews, refreshReviews,
      complaints, addComplaint, resolveComplaint, dismissComplaint, refreshComplaints,
      activityLogs, addLog, refreshLogs,
      notifications, refreshNotifications, markNotificationsRead, clearNotifications, deleteNotification,
      exportBackupFile, importBackupFile: importBackupFileHandler, resetToDefaults, refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};