/**
 * MaxDev Platform - API Client
 * Клиент для взаимодействия с Flask бэкендом
 */

import axios from 'axios';
import type { User, Job, Message, Review, Complaint, ActivityLog, NotificationItem } from '../types';

// Базовый URL API (через прокси Vite)
// При использовании прокси запросы к /api будут перенаправляться на localhost:5000
// Это позволяет избежать проблем с CORS
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Создание axios инстанса с автоматической подстановкой токена
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления JWT токена ко всем запросам
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('maxdev_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API Request] Token added:', config.url);
  } else {
    console.log('[API Request] No token for:', config.url);
  }
  return config;
});

// Интерсептор для обработки ошибок аутентификации и отладки
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Логируем все ошибки для отладки
    console.log('[API Error]', error.config?.url, error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // Если токен невалиден - удаляем его и перенаправляем на логин
      localStorage.removeItem('maxdev_token');
      window.location.href = '/login';
    }
    
    // Для 422 ошибок - возвращаем пустой массив вместо провала
    if (error.response?.status === 422) {
      console.warn('[API] 422 ошибка - возможно проблема с JWT');
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION ====================

export const authApi = {
  /** Отправить код подтверждения на email */
  sendCode: async (data: { email: string; purpose: 'register' | 'reset' }) => {
    const response = await apiClient.post('/auth/send-code', data);
    return response.data;
  },

  /** Проверить код и получить verifyToken */
  verifyCode: async (data: { email: string; code: string; purpose: 'register' | 'reset' }) => {
    const response = await apiClient.post('/auth/verify-code', data);
    return response.data; // { verifyToken }
  },

  /** Сбросить пароль с помощью verifyToken */
  resetPassword: async (data: { email: string; password: string; verifyToken: string }) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  /** Регистрация нового пользователя (с verifyToken или без) */
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'freelancer';
    verifyToken?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /** Вход в систему */
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  /** Получение текущего пользователя */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// ==================== USERS ====================

export const usersApi = {
  /**
   * Получение всех пользователей (только админ)
   */
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  /**
   * Блокировка пользователя
   */
  block: async (userId: number, reason: string): Promise<User> => {
    const response = await apiClient.post(`/users/${userId}/block`, { reason });
    return response.data;
  },

  /**
   * Разблокировка пользователя
   */
  unblock: async (userId: number): Promise<User> => {
    const response = await apiClient.post(`/users/${userId}/unblock`);
    return response.data;
  },

  /**
   * Удаление пользователя
   */
  delete: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },

  /**
   * Получение списка фрилансеров
   */
  getFreelancers: async (): Promise<User[]> => {
    const response = await apiClient.get('/freelancers');
    return response.data;
  },

  /**
   * Получение профиля пользователя по ID
   */
  getProfile: async (userId: number): Promise<any> => {
    const response = await apiClient.get(`/users/${userId}/profile`);
    return response.data;
  },
};

// ==================== JOBS ====================

export const jobsApi = {
  /**
   * Получение всех заказов
   */
  getAll: async (): Promise<Job[]> => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  /**
   * Получение заказа по ID
   */
  getById: async (jobId: number): Promise<Job> => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Создание нового заказа
   */
  create: async (data: {
    title: string;
    description: string;
    budget: number;
    deadline?: string;
    skills?: string[];
    freelancerId?: number;
  }): Promise<Job> => {
    const response = await apiClient.post('/jobs', data);
    return response.data;
  },

  /**
   * Удаление заказа
   */
  delete: async (jobId: number): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}`);
  },

  /**
   * Отклик на заказ
   */
  apply: async (jobId: number): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${jobId}/apply`);
    return response.data;
  },

  /**
   * Выбор исполнителя
   */
  selectFreelancer: async (jobId: number, freelancerId: number): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${jobId}/select-freelancer`, {
      freelancerId,
    });
    return response.data;
  },

  /**
   * Завершение заказа (фрилансер сдаёт работу)
   */
  complete: async (jobId: number): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${jobId}/complete`);
    return response.data;
  },

  /**
   * Принять работу (legacy/manual сценарий).
   * В основном интерфейсе теперь используется pay() через ЮKassa.
   */
  acceptWork: async (jobId: number): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${jobId}/accept-work`);
    return response.data;
  },

  /**
   * Отправить на доработку (клиент возвращает, статус → in_progress)
   */
  revision: async (jobId: number): Promise<Job> => {
    const response = await apiClient.post(`/jobs/${jobId}/revision`);
    return response.data;
  },

  /**
   * Создать платёж в ЮKassa и получить confirmation_url.
   */
  pay: async (jobId: number): Promise<{
    status: string;
    confirmationUrl?: string;
    externalPaymentId?: string;
    amount?: number;
  }> => {
    const response = await apiClient.post(`/jobs/${jobId}/pay`);
    return response.data;
  },

  /**
   * Проверить статус последнего платежа по заказу.
   */
  getPaymentStatus: async (jobId: number): Promise<{
    status: 'none' | 'pending' | 'succeeded' | 'canceled' | string;
    jobStatus: string;
    message?: string;
    payment?: {
      id: number;
      externalPaymentId: string;
      confirmationUrl?: string;
      status: string;
      paid: boolean;
    } | null;
  }> => {
    const response = await apiClient.get(`/jobs/${jobId}/payment-status`);
    return response.data;
  },
};

// ==================== MESSAGES ====================

export const messagesApi = {
  /**
   * Получение сообщений по заказу
   */
  getByJob: async (jobId: number): Promise<Message[]> => {
    const response = await apiClient.get(`/jobs/${jobId}/messages`);
    return response.data;
  },

  /**
   * Отправка сообщения с файлом
   */
  send: async (jobId: number, content: string, file?: File): Promise<Message> => {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);
    
    const response = await apiClient.post(`/jobs/${jobId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ==================== REVIEWS ====================

export const reviewsApi = {
  /**
   * Получение всех отзывов
   */
  getAll: async (): Promise<Review[]> => {
    const response = await apiClient.get('/reviews');
    return response.data;
  },

  /**
   * Создание отзыва
   */
  create: async (data: {
    jobId: number;
    toUserId: number;
    rating: number;
    comment: string;
  }): Promise<Review> => {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },
};

// ==================== COMPLAINTS ====================

export const complaintsApi = {
  /**
   * Получение всех жалоб (админ)
   */
  getAll: async (): Promise<Complaint[]> => {
    const response = await apiClient.get('/complaints');
    return response.data;
  },

  /**
   * Подача жалобы
   */
  create: async (data: {
    targetUserId?: number;
    jobId?: number;
    reason: string;
  }): Promise<Complaint> => {
    const response = await apiClient.post('/complaints', data);
    return response.data;
  },

  /**
   * Рассмотрение жалобы
   */
  resolve: async (
    complaintId: number,
    data: { status: string; response?: string }
  ): Promise<Complaint> => {
    const response = await apiClient.post(`/complaints/${complaintId}/resolve`, data);
    return response.data;
  },

  /**
   * Проверка наличия активной жалобы на пользователя
   */
  checkPending: async (targetUserId: number): Promise<boolean> => {
    const response = await apiClient.get(`/complaints/check/${targetUserId}`);
    return response.data.hasPending;
  },
};

// ==================== ACTIVITY LOGS ====================

export const logsApi = {
  /**
   * Получение журнала активности (админ)
   */
  getAll: async (): Promise<ActivityLog[]> => {
    const response = await apiClient.get('/logs');
    return response.data;
  },
};

// ==================== NOTIFICATIONS ====================

export const notificationsApi = {
  getAll: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  /** Удалить все уведомления */
  deleteAll: async (): Promise<void> => {
    await apiClient.delete('/notifications');
  },

  /** Удалить одно уведомление по ID */
  deleteOne: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

// ==================== ADMIN ====================

export const adminApi = {
  /**
   * Получение статистики
   */
  getStats: async (): Promise<{
    users: number;
    jobs: number;
    messages: number;
    reviews: number;
    complaints: number;
    logs: number;
  }> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  /**
   * Экспорт базы данных (скачивание .db файла)
   */
  exportBackup: async (): Promise<void> => {
    const response = await apiClient.get('/admin/backup', {
      responseType: 'blob',
    });
    
    // Создание ссылки для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maxdev_backup_${new Date().toISOString().split('T')[0]}.db`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /**
   * Импорт базы данных (загрузка .db файла)
   */
  importBackup: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    
    await apiClient.post('/admin/backup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Сброс БД к демо-данным
   */
  resetDatabase: async (): Promise<void> => {
    await apiClient.post('/admin/reset');
  },
};
