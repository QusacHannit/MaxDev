export type UserRole = 'client' | 'freelancer' | 'administrator';
export type JobStatus = 'open' | 'in_progress' | 'done' | 'paid' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  skills?: string[];
  experience?: string;
  portfolio?: PortfolioItem[];
  rating?: number;
  reviewsCount?: number;
  hourlyRate?: number;
  bio?: string;
  phone?: string;
  isBlocked?: boolean;
  blockReason?: string;
  completedJobs?: number;
  activeApplications?: number;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  url?: string;
  image?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  skills: string[];
  clientId: string;
  freelancerId?: string;
  /** Персонально предложенный заказ конкретному фрилансеру */
  isOffered?: boolean;
  status: JobStatus;
  applications?: Application[];
  createdAt: string;
  files?: string[];
}

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  jobId: string;
  senderId: string;
  text: string;
  file?: string;
  fileName?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  clientId: string;
  freelancerId: string;
  jobId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'job' | 'message' | 'complaint' | 'review';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'auth' | 'register' | 'block' | 'unblock' | 'job_create' | 'job_delete' | 'apply' | 'accept' | 'done' | 'paid' | 'complaint' | 'system';
  message: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}
