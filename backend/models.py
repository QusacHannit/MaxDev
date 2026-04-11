"""
MaxDev Platform - SQLAlchemy модели
Определение структуры таблиц SQLite базы данных
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Инициализация SQLAlchemy
db = SQLAlchemy()

# ==================== USER MODEL ====================

class User(db.Model):
    """Модель пользователя (клиент, фрилансер или администратор)"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'client', 'freelancer', 'administrator'
    blocked        = db.Column(db.Boolean, default=False)
    block_reason   = db.Column(db.Text, nullable=True)
    email_verified = db.Column(db.Boolean, default=False)  # подтверждён ли email
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связи
    jobs_as_client = db.relationship('Job', foreign_keys='Job.client_id', backref='client', lazy=True)
    jobs_as_freelancer = db.relationship('Job', foreign_keys='Job.freelancer_id', backref='freelancer', lazy=True)
    messages = db.relationship('Message', backref='sender', lazy=True)
    reviews_sent = db.relationship('Review', foreign_keys='Review.from_user_id', backref='from_user', lazy=True)
    reviews_received = db.relationship('Review', foreign_keys='Review.to_user_id', backref='to_user', lazy=True)
    
    def to_dict(self):
        """Преобразование модели в словарь для JSON"""
        return {
            'id':            self.id,
            'name':          self.name,
            'email':         self.email,
            'role':          self.role,
            'blocked':       self.blocked,
            'blockReason':   self.block_reason,
            'emailVerified': bool(self.email_verified),
            'createdAt':     self.created_at.isoformat() if self.created_at else None,
        }

# ==================== JOB MODEL ====================

class Job(db.Model):
    """Модель заказа"""
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.DateTime, nullable=True)
    skills = db.Column(db.Text, nullable=True)  # Хранится как строка через запятую
    status = db.Column(db.String(20), default='open')  # 'open', 'in_progress', 'done', 'paid'
    applicants = db.Column(db.Text, default='')  # ID откликнувшихся через запятую
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    freelancer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связи
    messages = db.relationship('Message', backref='job', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='job', lazy=True)
    
    def get_applicants(self):
        """Получить список ID откликнувшихся"""
        if not self.applicants:
            return []
        return [int(x) for x in self.applicants.split(',') if x]
    
    def to_dict(self):
        """Преобразование в словарь.
        applicants — список объектов {id, name, email, role} для фронтенда,
        чтобы клиент мог видеть карточки откликнувшихся фрилансеров.
        """
        # Получаем данные об откликнувшихся
        applicant_ids = self.get_applicants()
        applicants_data = []
        for uid in applicant_ids:
            user = User.query.get(uid)
            if user:
                applicants_data.append({
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                })
        
        # Получаем данные о клиенте
        client_data = None
        if self.client_id:
            c = User.query.get(self.client_id)
            if c:
                client_data = {'id': c.id, 'name': c.name, 'email': c.email, 'role': c.role}
        
        # Получаем данные о фрилансере
        freelancer_data = None
        if self.freelancer_id:
            f = User.query.get(self.freelancer_id)
            if f:
                freelancer_data = {'id': f.id, 'name': f.name, 'email': f.email, 'role': f.role}
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'budget': self.budget,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'skills': self.skills.split(',') if self.skills else [],
            'status': self.status,
            'applicants': applicant_ids,
            'applicantsData': applicants_data,
            'clientId': self.client_id,
            'clientData': client_data,
            'freelancerId': self.freelancer_id,
            'freelancerData': freelancer_data,
            'createdAt': self.created_at.isoformat()
        }

# ==================== MESSAGE MODEL ====================

class Message(db.Model):
    """Модель сообщения в чате заказа"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Преобразование в словарь.
        Включает senderData — имя и роль отправителя,
        чтобы чат мог отображать имена даже без полного списка пользователей.
        """
        sender_data = None
        if self.sender_id:
            s = User.query.get(self.sender_id)
            if s:
                sender_data = {'id': s.id, 'name': s.name, 'role': s.role}
        
        # Извлекаем имя файла из URL
        file_name = None
        if self.file_url:
            file_name = self.file_url.split('/')[-1]
        
        return {
            'id': self.id,
            'jobId': self.job_id,
            'senderId': self.sender_id,
            'content': self.content,
            'fileUrl': self.file_url,
            'fileName': file_name,
            'senderData': sender_data,
            'createdAt': self.created_at.isoformat()
        }

# ==================== REVIEW MODEL ====================

class Review(db.Model):
    """Модель отзыва"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'jobId': self.job_id,
            'fromUserId': self.from_user_id,
            'toUserId': self.to_user_id,
            'rating': self.rating,
            'comment': self.comment,
            'createdAt': self.created_at.isoformat()
        }

# ==================== COMPLAINT MODEL ====================

class Complaint(db.Model):
    """Модель жалобы"""
    __tablename__ = 'complaints'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'resolved', 'rejected'
    admin_response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'targetUserId': self.target_user_id,
            'jobId': self.job_id,
            'reason': self.reason,
            'status': self.status,
            'adminResponse': self.admin_response,
            'createdAt': self.created_at.isoformat()
        }

# ==================== ACTIVITY LOG MODEL ====================

class ActivityLog(db.Model):
    """Модель журнала активности"""
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(50), nullable=False)  # 'LOGIN', 'REGISTER', 'JOB_CREATE' и т.д.
    user_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Преобразование в словарь"""
        return {
            'id': self.id,
            'action': self.action,
            'userId': self.user_id,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }


# ==================== NOTIFICATION MODEL ====================

class Notification(db.Model):
    """Уведомления для клиентов и фрилансеров"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(32), default='info')
    link = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'link': self.link,
            'isRead': self.is_read,
            'createdAt': self.created_at.isoformat(),
        }


# ==================== PAYMENT MODEL ====================

class Payment(db.Model):
    """Платёж через ЮKassa для конкретного заказа."""
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    provider = db.Column(db.String(32), default='yookassa')
    external_payment_id = db.Column(db.String(120), nullable=False, unique=True)
    status = db.Column(db.String(32), default='pending')
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(8), default='RUB')
    confirmation_url = db.Column(db.String(1000), nullable=True)
    return_url = db.Column(db.String(1000), nullable=True)
    paid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'jobId': self.job_id,
            'clientId': self.client_id,
            'provider': self.provider,
            'externalPaymentId': self.external_payment_id,
            'status': self.status,
            'amount': self.amount,
            'currency': self.currency,
            'confirmationUrl': self.confirmation_url,
            'returnUrl': self.return_url,
            'paid': self.paid,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }

# ==================== EMAIL VERIFICATION MODEL ====================

class EmailVerification(db.Model):
    """
    Модель для хранения кодов подтверждения email.
    Код действует 15 минут, после чего становится недействительным.
    """
    __tablename__ = 'email_verifications'

    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), nullable=False, index=True)
    code       = db.Column(db.String(6), nullable=False)   # 6-значный код
    purpose    = db.Column(db.String(20), nullable=False)  # 'register' | 'reset'
    used       = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_valid(self):
        """Проверяем, что код не использован и не истёк"""
        return not self.used and datetime.utcnow() < self.expires_at

    def to_dict(self):
        return {
            'id':        self.id,
            'email':     self.email,
            'purpose':   self.purpose,
            'used':      self.used,
            'expiresAt': self.expires_at.isoformat(),
        }
