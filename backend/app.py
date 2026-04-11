"""
MaxDev Platform - Flask Backend (исправленная версия)
"""
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import shutil
import uuid
import json
import base64
import urllib.request
import urllib.error
from dotenv import load_dotenv
from models import db, User, Job, Message, Review, Complaint, ActivityLog, Notification, Payment, EmailVerification
from init_db import init_database

# ── Загружаем переменные окружения ДО чтения SMTP/JWT ─────────────────────────
# Сначала backend/.env, затем корневой .env.
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# ── Email (SMTP) ──────────────────────────────────────────────────────────────
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import parseaddr

SMTP_HOST       = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT       = int(os.getenv('SMTP_PORT', 587))
SMTP_USER       = os.getenv('SMTP_USER', '').strip()
SMTP_PASSWORD   = os.getenv('SMTP_PASSWORD', '').strip()
SMTP_FROM       = os.getenv('SMTP_FROM', SMTP_USER).strip() or SMTP_USER
SMTP_USE_SSL    = os.getenv('SMTP_USE_SSL', 'auto').strip().lower()  # auto|true|false
SMTP_USE_STARTTLS = os.getenv('SMTP_USE_STARTTLS', 'auto').strip().lower()  # auto|true|false

def send_email(to: str, subject: str, html: str) -> bool:
    """
    Отправка письма через реальный SMTP-сервер.

    Поддержка:
    - Gmail / Google Workspace
    - Yandex 360
    - Mail.ru
    - любой SMTP с TLS/SSL

    В dev-режиме, если SMTP не настроен, письмо печатается в консоль,
    чтобы форма регистрации/сброса не ломалась во время локальной разработки.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f'\n[DEV EMAIL] To: {to}\nSubject: {subject}\n{html}\n')
        return True

    envelope_from = parseaddr(SMTP_FROM)[1] or SMTP_USER
    header_from = SMTP_FROM if '<' in SMTP_FROM else f'MaxDev <{SMTP_FROM}>'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = header_from
    msg['To'] = to
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    use_ssl = SMTP_USE_SSL == 'true' or (SMTP_USE_SSL == 'auto' and SMTP_PORT == 465)
    use_starttls = SMTP_USE_STARTTLS == 'true' or (SMTP_USE_STARTTLS == 'auto' and not use_ssl and SMTP_PORT in (587, 25))

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(envelope_from, [to], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
                server.ehlo()
                if use_starttls:
                    server.starttls()
                    server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(envelope_from, [to], msg.as_string())
        print(f'[EMAIL OK] {subject} -> {to}')
        return True
    except Exception as e:
        print(f'[EMAIL ERROR] {e}')  # Эта строка уже есть, но убедитесь, что она печатает полную ошибку
        return False

def generate_code() -> str:
    """Генерация случайного 6-значного кода"""
    return str(random.randint(100000, 999999))

def make_verify_html(code: str, purpose: str) -> str:
    """HTML-шаблон письма с кодом"""
    action = 'регистрации' if purpose == 'register' else 'сброса пароля'
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
                background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h2 style="color:#22c55e;margin:0 0 8px">MaxDev</h2>
      <p style="color:#94a3b8;margin:0 0 24px">Платформа для IT-фрилансеров</p>
      <p>Ваш код для <b>{action}</b>:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                  color:#22c55e;background:#1e293b;padding:16px 24px;
                  border-radius:8px;text-align:center;margin:16px 0;">
        {code}
      </div>
      <p style="color:#64748b;font-size:13px;">
        Код действует <b>15 минут</b>.<br>
        Если вы не запрашивали код — просто проигнорируйте это письмо.
      </p>
    </div>
    """

# Папка для загрузки файлов
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'exe'}

def allowed_file(filename):
    """Проверка расширения файла"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ── JWT секретный ключ ─────────────────────────────────────────────────────────
# Берётся из переменной окружения JWT_SECRET_KEY.
# Если переменная не задана — сервер НЕ запустится (raise RuntimeError).
# Это защищает от случайного запуска в продакшне без настроенного .env.
_jwt_secret = os.getenv('JWT_SECRET_KEY')
if not _jwt_secret:
    raise RuntimeError(
        '\n\n❌ JWT_SECRET_KEY не задан!\n'
        'Добавьте в backend/.env строку:\n'
        '    JWT_SECRET_KEY=ваш-длинный-случайный-ключ-минимум-32-символа\n'
        'Сгенерировать: python -c "import secrets; print(secrets.token_hex(32))"\n'
    )

# ── Flask приложение ───────────────────────────────────────────────────────────
app = Flask(__name__)

# URI базы данных — можно переопределить через DATABASE_URL в .env
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///maxdev.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT конфигурация — ключ строго из .env
app.config['JWT_SECRET_KEY'] = _jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(
    days=int(os.getenv('JWT_EXPIRES_DAYS', 7))
)

db.init_app(app)
allowed_origins = [o.strip() for o in os.getenv('FRONTEND_URL', 'http://localhost:5173').split(',') if o.strip()]
CORS(app, supports_credentials=True, origins=["*"])
jwt = JWTManager(app)

with app.app_context():
    db.create_all()
    # Создаём папку для загрузок если не существует
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    init_database()

def add_log(action, user_id=None, details=''):
    log = ActivityLog(action=action, user_id=user_id, details=details)
    db.session.add(log)
    db.session.commit()


def add_notification(user_id: int, title: str, message: str, type_: str = 'info', link: str = None):
    """Создаёт уведомление для конкретного пользователя. Лимит: 15 уведомлений."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link,
        type=type_,
        is_read=False,
    )
    db.session.add(notification)
    db.session.commit()

    # Лимит 15 уведомлений — удаляем самые старые
    MAX_NOTIFICATIONS = 15
    count = Notification.query.filter_by(user_id=user_id).count()
    if count > MAX_NOTIFICATIONS:
        # Находим самые старые уведомления, которые нужно удалить
        excess = count - MAX_NOTIFICATIONS
        old_notifications = Notification.query.filter_by(user_id=user_id)\
            .order_by(Notification.created_at.asc()).limit(excess).all()
        for old in old_notifications:
            db.session.delete(old)
        db.session.commit()


# ------------------- YOOKASSA HELPERS -------------------

def get_yookassa_credentials():
    """Берём данные магазина из переменных окружения.
    ЮKassa требует выполнять запросы только с сервера.
    """
    shop_id = os.getenv('YOOKASSA_SHOP_ID')
    secret_key = os.getenv('YOOKASSA_SECRET_KEY')
    if not shop_id or not secret_key:
        raise RuntimeError('ЮKassa не настроена: укажите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY')
    return shop_id, secret_key


def yookassa_request(method: str, path: str, payload: dict | None = None, use_idempotence: bool = False):
    """Минимальный HTTP-клиент для ЮKassa без внешних зависимостей."""
    shop_id, secret_key = get_yookassa_credentials()
    auth = base64.b64encode(f'{shop_id}:{secret_key}'.encode('utf-8')).decode('utf-8')
    headers = {
        'Authorization': f'Basic {auth}',
        'Content-Type': 'application/json',
    }
    if use_idempotence:
        headers['Idempotence-Key'] = str(uuid.uuid4())

    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(
        url=f'https://api.yookassa.ru/v3{path}',
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        raw_body = exc.read().decode('utf-8') if exc.fp else ''
        try:
            details = json.loads(raw_body) if raw_body else {}
        except Exception:
            details = {'description': raw_body}
        raise RuntimeError(details.get('description') or details.get('error') or 'Ошибка ЮKassa')


def build_payment_return_url(job_id: int):
    """Ссылка возврата пользователя после оплаты.
    По документации ЮKassa на return_url нужно проверять статус платежа отдельно.
    """
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    return f'{frontend_url}/job/{job_id}?payment=return'


def mark_job_as_paid(job: Job, client_user_id: int | None = None):
    """Применяет успешную оплату к заказу ровно один раз."""
    if job.status == 'paid':
        return

    job.status = 'paid'
    db.session.commit()

    if job.freelancer_id:
        add_notification(
            user_id=job.freelancer_id,
            title='Оплата через ЮKassa прошла успешно',
            message=f'Клиент оплатил заказ "{job.title}". Средства подтверждены.',
            type_='job',
            link=f'/job/{job.id}',
        )

    add_log('PAYMENT', client_user_id or job.client_id, f'YooKassa payment succeeded for job: {job.title}')

# ------------------- AUTH -------------------

@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    """
    Отправить код подтверждения на email.
    purpose = 'register' | 'reset'
    При регистрации проверяем, что email свободен.
    При сбросе — что пользователь существует.
    """
    data    = request.json or {}
    email   = (data.get('email') or '').strip().lower()
    purpose = data.get('purpose', 'register')  # register | reset

    if not email:
        return jsonify({'error': 'Email обязателен'}), 400

    if purpose == 'register':
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Этот email уже зарегистрирован'}), 400
    elif purpose == 'reset':
        if not User.query.filter_by(email=email).first():
            return jsonify({'error': 'Пользователь с таким email не найден'}), 404
    else:
        return jsonify({'error': 'Неверный тип запроса'}), 400

    # Инвалидируем старые коды для этого email + purpose
    old_codes = EmailVerification.query.filter_by(email=email, purpose=purpose, used=False).all()
    for c in old_codes:
        c.used = True
    db.session.commit()

    # Генерируем новый код
    code    = generate_code()
    expires = datetime.utcnow() + timedelta(minutes=15)
    ev = EmailVerification(email=email, code=code, purpose=purpose, expires_at=expires)
    db.session.add(ev)
    db.session.commit()

    # Отправляем письмо
    subject = 'Ваш код для MaxDev'
    html    = make_verify_html(code, purpose)
    ok      = send_email(email, subject, html)

    if not ok:
        return jsonify({'error': 'Не удалось отправить письмо. Проверьте SMTP-настройки.'}), 500

    add_log('EMAIL_CODE', None, f'Sent {purpose} code to {email}')
    return jsonify({'message': 'Код отправлен на ваш email', 'dev': not bool(SMTP_USER)})


@app.route('/api/auth/verify-code', methods=['POST'])
def verify_code():
    """
    Проверить код подтверждения.
    Используется перед регистрацией (purpose=register) или сбросом пароля (purpose=reset).
    Возвращает одноразовый токен для дальнейшего действия.
    """
    data    = request.json or {}
    email   = (data.get('email') or '').strip().lower()
    code    = (data.get('code') or '').strip()
    purpose = data.get('purpose', 'register')

    ev = EmailVerification.query.filter_by(
        email=email, code=code, purpose=purpose
    ).order_by(EmailVerification.created_at.desc()).first()

    if not ev or not ev.is_valid():
        return jsonify({'error': 'Неверный или просроченный код'}), 400

    # Помечаем как использованный
    ev.used = True
    db.session.commit()

    # Выдаём короткоживущий токен-подтверждение (10 минут)
    verify_token = create_access_token(
        identity=f'verify:{purpose}:{email}',
        expires_delta=timedelta(minutes=10)
    )
    return jsonify({'verifyToken': verify_token})


@app.route('/api/auth/register', methods=['POST'])
def register():
    """
    Регистрация пользователя строго через подтверждённый email.
    Пользователь обязан сначала получить код, подтвердить его и передать verifyToken.
    """
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    verify_token = data.get('verifyToken', '')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email уже зарегистрирован'}), 400

    if not verify_token:
        return jsonify({'error': 'Для регистрации нужно подтвердить email'}), 400

    try:
        from flask_jwt_extended import decode_token
        decoded = decode_token(verify_token)
        identity = decoded.get('sub', '')
        if identity != f'verify:register:{email}':
            raise ValueError('wrong identity')
    except Exception:
        return jsonify({'error': 'Токен подтверждения недействителен или истёк'}), 400

    user = User(
        name=data['name'],
        email=email,
        password_hash=generate_password_hash(data['password']),
        role=data['role'],
        email_verified=True,
    )
    db.session.add(user)
    db.session.commit()

    add_log('REGISTER', user.id, f"New user: {user.name} ({user.role})")
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Сброс пароля по верифицированному токену.
    Требует verifyToken из /api/auth/verify-code (purpose=reset).
    """
    data         = request.json or {}
    email        = (data.get('email') or '').strip().lower()
    new_password = data.get('password', '')
    verify_token = data.get('verifyToken', '')

    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Пароль должен быть не менее 6 символов'}), 400

    # Проверяем verify-токен
    try:
        from flask_jwt_extended import decode_token
        decoded  = decode_token(verify_token)
        identity = decoded.get('sub', '')
        if identity != f'verify:reset:{email}':
            raise ValueError('wrong identity')
    except Exception:
        return jsonify({'error': 'Токен сброса недействителен или истёк'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    add_log('RESET_PASSWORD', user.id, f'Password reset for {email}')
    return jsonify({'message': 'Пароль успешно изменён'})


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    user = User.query.filter_by(email=(data.get('email') or '').strip().lower()).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Неверный email или пароль'}), 401
    if user.blocked:
        return jsonify({'error': 'blocked', 'blockReason': user.block_reason}), 403
    add_log('LOGIN', user.id, f"Login: {user.name}")
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()})


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

# ------------------- USERS -------------------
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users/<int:user_id>/block', methods=['POST'])
@jwt_required()
def block_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.json
    user.blocked = True
    user.block_reason = data.get('reason', 'Violation of platform rules')
    db.session.commit()
    add_log('BLOCK', current_user_id, f"Blocked {user.name}: {user.block_reason}")
    return jsonify(user.to_dict())

@app.route('/api/users/<int:user_id>/unblock', methods=['POST'])
@jwt_required()
def unblock_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.blocked = False
    user.block_reason = None
    db.session.commit()
    add_log('UNBLOCK', current_user_id, f"Unblocked {user.name}")
    return jsonify(user.to_dict())

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    db.session.delete(user)
    db.session.commit()
    add_log('DELETE_USER', current_user_id, f"Deleted user {user.name}")
    return jsonify({'message': 'User deleted'})

@app.route('/api/freelancers', methods=['GET'])
def get_freelancers():
    freelancers = User.query.filter_by(role='freelancer', blocked=False).all()
    return jsonify([f.to_dict() for f in freelancers])

# Получить профиль любого пользователя по ID (для просмотра профиля заказчика/фрилансера)
@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

# ------------------- JOBS -------------------
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    # Optional JWT: guests see only public jobs, authenticated users get role-aware visibility.
    verify_jwt_in_request(optional=True)
    identity = get_jwt_identity()

    query = Job.query
    if identity:
        current_user_id = int(identity)
        current_user = User.query.get(current_user_id)
        if current_user and current_user.role == 'administrator':
            jobs = query.order_by(Job.created_at.desc()).all()
            return jsonify([j.to_dict() for j in jobs])

        # Private offers (job.freelancer_id set) are visible only to client, target freelancer, admin.
        jobs = query.filter(
            (Job.freelancer_id.is_(None)) |
            (Job.client_id == current_user_id) |
            (Job.freelancer_id == current_user_id)
        ).order_by(Job.created_at.desc()).all()
        return jsonify([j.to_dict() for j in jobs])

    # Guest mode: only public jobs
    jobs = query.filter(Job.freelancer_id.is_(None)).order_by(Job.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])

@app.route('/api/jobs', methods=['POST'])
@jwt_required()
def create_job():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'client':
        return jsonify({'error': 'Only clients can create jobs'}), 403

    data = request.json
    target_freelancer_id = data.get('freelancerId')
    if target_freelancer_id is not None:
        target_freelancer = User.query.get(int(target_freelancer_id))
        if not target_freelancer or target_freelancer.role != 'freelancer':
            return jsonify({'error': 'Target freelancer not found'}), 404

    job = Job(
        title=data['title'],
        description=data['description'],
        budget=data['budget'],
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
        skills=','.join(data.get('skills', [])),
        client_id=current_user_id,
        freelancer_id=int(target_freelancer_id) if target_freelancer_id is not None else None,
    )
    db.session.add(job)
    db.session.commit()

    # Notification for private direct offer
    if target_freelancer_id is not None:
        add_notification(
            user_id=int(target_freelancer_id),
            title='Новое персональное предложение',
            message=f'Клиент предложил вам заказ "{job.title}".',
            type_='job',
            link='/my-jobs?tab=offered',
        )

    add_log('JOB_CREATE', current_user_id, f"Created job: {job.title}")
    return jsonify(job.to_dict()), 201

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Private offer access control.
    if job.freelancer_id is not None:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if not identity:
            return jsonify({'error': 'Forbidden'}), 403
        current_user_id = int(identity)
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'Forbidden'}), 403
        if current_user.role != 'administrator' and current_user_id not in {job.client_id, job.freelancer_id}:
            return jsonify({'error': 'Forbidden'}), 403

    return jsonify(job.to_dict())

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.client_id != current_user_id and current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(job)
    db.session.commit()
    add_log('JOB_DELETE', current_user_id, f"Deleted job: {job.title}")
    return jsonify({'message': 'Job deleted'})

@app.route('/api/jobs/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_job(job_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'freelancer':
        return jsonify({'error': 'Only freelancers can apply'}), 403

    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.freelancer_id and job.freelancer_id != current_user_id:
        return jsonify({'error': 'This offer is private'}), 403
    if current_user_id in job.get_applicants():
        return jsonify({'error': 'Already applied'}), 400
    applicants = job.get_applicants()
    applicants.append(current_user_id)
    job.applicants = ','.join(map(str, applicants))
    db.session.commit()
    add_notification(
        user_id=job.client_id,
        title='Новый отклик на заказ',
        message=f'На заказ "{job.title}" поступил новый отклик.',
        type_='job',
        link=f'/job/{job.id}',
    )
    add_log('JOB_APPLY', current_user_id, f"Applied to job: {job.title}")
    return jsonify(job.to_dict())

@app.route('/api/jobs/<int:job_id>/select-freelancer', methods=['POST'])
@jwt_required()
def select_freelancer(job_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    data = request.json
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    freelancer_id = None

    # Case 1: client explicitly chooses a freelancer from applicants.
    if job.client_id == current_user_id:
        freelancer_id = data.get('freelancerId')
        if freelancer_id is None:
            return jsonify({'error': 'freelancerId is required'}), 400

    # Case 2: freelancer accepts a direct private offer assigned to them.
    elif current_user and current_user.role == 'freelancer' and job.freelancer_id == current_user_id and job.status == 'open':
        freelancer_id = current_user_id

    else:
        return jsonify({'error': 'Forbidden'}), 403

    job.freelancer_id = int(freelancer_id)
    job.status = 'in_progress'
    db.session.commit()
    add_notification(
        user_id=job.freelancer_id,
        title='Вас выбрали исполнителем',
        message=f'Вы назначены исполнителем по заказу "{job.title}".',
        type_='job',
        link=f'/job/{job.id}',
    )
    add_log('JOB_ASSIGN', current_user_id, f"Assigned freelancer to job: {job.title}")
    return jsonify(job.to_dict())

@app.route('/api/jobs/<int:job_id>/complete', methods=['POST'])
@jwt_required()
def complete_job(job_id):
    current_user_id = int(get_jwt_identity())
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    job.status = 'done'
    db.session.commit()
    add_notification(
        user_id=job.client_id,
        title='Работа сдана',
        message=f'Исполнитель отметил заказ "{job.title}" как готовый.',
        type_='job',
        link=f'/job/{job.id}',
    )
    add_log('JOB_COMPLETE', current_user_id, f"Freelancer submitted work: {job.title}")
    return jsonify(job.to_dict())

@app.route('/api/jobs/<int:job_id>/accept-work', methods=['POST'])
@jwt_required()
def accept_work(job_id):
    current_user_id = int(get_jwt_identity())
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.client_id != current_user_id:
        return jsonify({'error': 'Forbidden'}), 403
    job.status = 'paid'
    db.session.commit()
    if job.freelancer_id:
        add_notification(
            user_id=job.freelancer_id,
            title='Работа принята',
            message=f'Клиент принял и оплатил заказ "{job.title}".',
            type_='job',
            link=f'/job/{job.id}',
        )
    add_log('JOB_ACCEPTED', current_user_id, f"Client accepted work: {job.title}")
    return jsonify(job.to_dict())

@app.route('/api/jobs/<int:job_id>/revision', methods=['POST'])
@jwt_required()
def send_to_revision(job_id):
    current_user_id = int(get_jwt_identity())
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.client_id != current_user_id:
        return jsonify({'error': 'Forbidden'}), 403
    job.status = 'in_progress'
    db.session.commit()
    if job.freelancer_id:
        add_notification(
            user_id=job.freelancer_id,
            title='Заказ отправлен на доработку',
            message=f'Клиент отправил заказ "{job.title}" на доработку.',
            type_='job',
            link=f'/job/{job.id}',
        )
    add_log('JOB_REVISION', current_user_id, f"Client sent job to revision: {job.title}")
    return jsonify(job.to_dict())


# ------------------- YOOKASSA PAYMENTS -------------------
@app.route('/api/jobs/<int:job_id>/pay', methods=['POST'])
@jwt_required()
def create_job_payment(job_id):
    """Создание платежа в ЮKassa.
    Клиент может оплатить заказ только после сдачи работы (status=done).
    """
    current_user_id = int(get_jwt_identity())
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job.client_id != current_user_id:
        return jsonify({'error': 'Forbidden'}), 403
    if job.status == 'paid':
        return jsonify({'error': 'already_paid', 'message': 'Заказ уже оплачен'}), 400
    if job.status != 'done':
        return jsonify({'error': 'payment_not_allowed', 'message': 'Оплата доступна только после сдачи работы'}), 400

    latest_payment = Payment.query.filter_by(job_id=job.id, client_id=current_user_id)\
        .order_by(Payment.created_at.desc()).first()

    # Если есть ещё не завершённый платёж — просто вернём его ссылку повторно.
    if latest_payment and latest_payment.status == 'pending' and latest_payment.confirmation_url:
        return jsonify(latest_payment.to_dict())

    try:
        response = yookassa_request(
            'POST',
            '/payments',
            payload={
                'amount': {
                    'value': f'{job.budget:.2f}',
                    'currency': 'RUB',
                },
                'capture': True,
                'confirmation': {
                    'type': 'redirect',
                    'return_url': build_payment_return_url(job.id),
                },
                'description': f'Оплата заказа #{job.id}: {job.title[:100]}',
                'metadata': {
                    'job_id': str(job.id),
                    'client_id': str(job.client_id),
                    'freelancer_id': str(job.freelancer_id or ''),
                },
            },
            use_idempotence=True,
        )
    except RuntimeError as exc:
        return jsonify({'error': 'payment_provider_error', 'message': str(exc)}), 503

    payment = Payment(
        job_id=job.id,
        client_id=current_user_id,
        external_payment_id=response['id'],
        status=response.get('status', 'pending'),
        amount=job.budget,
        currency=response.get('amount', {}).get('currency', 'RUB'),
        confirmation_url=response.get('confirmation', {}).get('confirmation_url'),
        return_url=build_payment_return_url(job.id),
        paid=bool(response.get('paid', False)),
    )
    db.session.add(payment)
    db.session.commit()

    add_log('PAYMENT_CREATE', current_user_id, f'Created YooKassa payment for job: {job.title}')
    return jsonify(payment.to_dict()), 201


@app.route('/api/jobs/<int:job_id>/payment-status', methods=['GET'])
@jwt_required()
def get_job_payment_status(job_id):
    """Проверка статуса последнего платежа по заказу.
    Вызывается после возврата пользователя с return_url.
    """
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    allowed = (
        current_user.role == 'administrator' or
        job.client_id == current_user_id or
        job.freelancer_id == current_user_id
    )
    if not allowed:
        return jsonify({'error': 'Forbidden'}), 403

    payment = Payment.query.filter_by(job_id=job.id).order_by(Payment.created_at.desc()).first()
    if not payment:
        return jsonify({'status': 'none', 'jobStatus': job.status, 'payment': None})

    try:
        response = yookassa_request('GET', f'/payments/{payment.external_payment_id}')
    except RuntimeError as exc:
        return jsonify({
            'status': payment.status,
            'jobStatus': job.status,
            'payment': payment.to_dict(),
            'message': str(exc),
        }), 503

    payment.status = response.get('status', payment.status)
    payment.paid = bool(response.get('paid', False)) or payment.status == 'succeeded'
    payment.confirmation_url = response.get('confirmation', {}).get('confirmation_url') or payment.confirmation_url
    db.session.commit()

    if payment.status == 'succeeded' and job.status != 'paid':
        mark_job_as_paid(job, job.client_id)
        db.session.refresh(job)

    return jsonify({
        'status': payment.status,
        'jobStatus': job.status,
        'payment': payment.to_dict(),
    })

# ------------------- MESSAGES -------------------
@app.route('/api/jobs/<int:job_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(job_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if (job.client_id != current_user_id and 
        job.freelancer_id != current_user_id and 
        current_user.role != 'administrator'):
        return jsonify({'error': 'Forbidden'}), 403
    messages = Message.query.filter_by(job_id=job_id).order_by(Message.created_at.asc()).all()
    return jsonify([m.to_dict() for m in messages])

@app.route('/api/jobs/<int:job_id>/messages', methods=['POST'])
@jwt_required()
def send_message(job_id):
    """Отправка сообщения с поддержкой загрузки файлов"""
    current_user_id = int(get_jwt_identity())
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Проверяем доступ к чату
    current_user = User.query.get(current_user_id)
    if (job.client_id != current_user_id and 
        job.freelancer_id != current_user_id and 
        current_user.role != 'administrator'):
        return jsonify({'error': 'Forbidden'}), 403
    
    # Обработка файла если есть
    file_url = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename and allowed_file(file.filename):
            # Генерируем уникальное имя файла
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            # Сохраняем относительный путь
            file_url = f"/api/files/{filename}"
    
    # Получаем текст сообщения
    content = request.form.get('content', '')
    
    message = Message(
        job_id=job_id,
        sender_id=current_user_id,
        content=content,
        file_url=file_url
    )
    db.session.add(message)
    db.session.commit()

    # Уведомление второму участнику диалога
    receiver_id = None
    if current_user_id == job.client_id and job.freelancer_id:
        receiver_id = job.freelancer_id
    elif current_user_id == job.freelancer_id:
        receiver_id = job.client_id

    if receiver_id:
        add_notification(
            user_id=receiver_id,
            title='Новое сообщение в чате',
            message=f'Новый комментарий по заказу "{job.title}".',
            type_='message',
            link=f'/job/{job.id}?tab=chat',
        )

    return jsonify(message.to_dict()), 201

# ------------------- REVIEWS -------------------
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews])

@app.route('/api/reviews', methods=['POST'])
@jwt_required()
def create_review():
    current_user_id = int(get_jwt_identity())
    data = request.json
    job_id = data['jobId']
    to_user_id = data['toUserId']
    
    # Проверка заказа
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Проверка: текущий пользователь должен быть участником заказа
    if job.client_id != current_user_id and job.freelancer_id != current_user_id:
        return jsonify({'error': 'Forbidden'}), 403
    
    # Проверка: нельзя оставить отзыв самому себе
    if to_user_id == current_user_id:
        return jsonify({'error': 'Cannot review yourself'}), 400
    
    # Проверка: получатель отзыва должен быть вторым участником заказа
    if job.client_id == current_user_id:
        # Заказчик оставляет отзыв → получатель должен быть фрилансером
        if to_user_id != job.freelancer_id:
            return jsonify({'error': 'Invalid review target'}), 400
        # Заказчик может оставить отзыв когда работа сдана (done) или принята (paid)
        if job.status not in ['done', 'paid']:
            return jsonify({'error': 'review_not_allowed', 'message': 'Отзыв можно оставить только после сдачи работы'}), 400
    elif job.freelancer_id == current_user_id:
        # Фрилансер оставляет отзыв → получатель должен быть заказчиком
        if to_user_id != job.client_id:
            return jsonify({'error': 'Invalid review target'}), 400
        # Фрилансер может оставить отзыв только после принятия работы заказчиком (paid)
        if job.status != 'paid':
            return jsonify({'error': 'review_not_allowed', 'message': 'Отзыв можно оставить только после принятия работы заказчиком'}), 400
    
    # Проверка: не оставлял ли уже отзыв
    existing_review = Review.query.filter_by(
        job_id=job_id,
        from_user_id=current_user_id,
        to_user_id=to_user_id
    ).first()
    if existing_review:
        return jsonify({'error': 'review_exists', 'message': 'Вы уже оставили отзыв на этого пользователя'}), 400
    
    review = Review(
        job_id=job_id,
        from_user_id=current_user_id,
        to_user_id=to_user_id,
        rating=data['rating'],
        comment=data['comment']
    )
    db.session.add(review)
    db.session.commit()
    
    # Уведомление пользователю, которому оставили отзыв
    add_notification(
        user_id=to_user_id,
        title='Новый отзыв о вас',
        message=f'Пользователь оставил отзыв о вашей работе.',
        type_='review',
        link=f'/profile',
    )
    
    return jsonify(review.to_dict()), 201

# ------------------- COMPLAINTS -------------------
@app.route('/api/complaints', methods=['GET'])
@jwt_required()
def get_complaints():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    return jsonify([c.to_dict() for c in complaints])

@app.route('/api/complaints', methods=['POST'])
@jwt_required()
def create_complaint():
    current_user_id = int(get_jwt_identity())
    data = request.json
    target_user_id = data.get('targetUserId')

    # Anti-spam rule: one active complaint per target user.
    if target_user_id is not None:
        existing_pending = Complaint.query.filter_by(
            user_id=current_user_id,
            target_user_id=target_user_id,
            status='pending',
        ).first()
        if existing_pending:
            return jsonify({
                'error': 'pending_exists',
                'message': 'Жалоба на рассмотрении',
                'complaint': existing_pending.to_dict(),
            }), 409

    complaint = Complaint(
        user_id=current_user_id,
        target_user_id=target_user_id,
        job_id=data.get('jobId'),
        reason=data['reason']
    )
    db.session.add(complaint)
    db.session.commit()
    add_log('COMPLAINT', current_user_id, f"Complaint: {complaint.reason[:50]}")
    return jsonify(complaint.to_dict()), 201

@app.route('/api/complaints/<int:complaint_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_complaint(complaint_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    data = request.json
    complaint.status = data['status']
    complaint.admin_response = data.get('response', '')
    db.session.commit()

    if complaint.status == 'resolved':
        add_notification(
            user_id=complaint.user_id,
            title='Жалоба рассмотрена',
            message='Спасибо за обращение. Жалоба рассмотрена, по нарушителю приняты меры.',
            type_='complaint',
            link='/my-jobs',
        )
    elif complaint.status == 'dismissed':
        add_notification(
            user_id=complaint.user_id,
            title='Жалоба отклонена',
            message='Жалоба рассмотрена, но нарушений не выявлено. Спасибо за обращение.',
            type_='complaint',
            link='/my-jobs',
        )

    return jsonify(complaint.to_dict())

# Check if user has pending complaint against a target
@app.route('/api/complaints/check/<int:target_id>', methods=['GET'])
@jwt_required()
def check_complaint(target_id):
    current_user_id = int(get_jwt_identity())
    existing = Complaint.query.filter_by(
        user_id=current_user_id,
        target_user_id=target_id,
        status='pending',
    ).first()
    return jsonify({'hasPending': existing is not None})


# ------------------- NOTIFICATIONS -------------------
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())
    notifications = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).limit(15).all()
    return jsonify([n.to_dict() for n in notifications])


@app.route('/api/notifications/read-all', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    current_user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=current_user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'ok'})


@app.route('/api/notifications', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Удалить все уведомления текущего пользователя."""
    current_user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=current_user_id).delete()
    db.session.commit()
    add_log('NOTIFICATIONS_CLEAR', current_user_id, 'Cleared all notifications')
    return jsonify({'message': 'All notifications cleared'})


@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Удалить одно конкретное уведомление."""
    current_user_id = int(get_jwt_identity())
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if notification.user_id != current_user_id:
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(notification)
    db.session.commit()
    return jsonify({'message': 'Notification deleted'})

# ------------------- LOGS -------------------
@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_logs():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(500).all()
    return jsonify([l.to_dict() for l in logs])

# ------------------- BACKUP -------------------
@app.route('/api/admin/backup', methods=['GET'])
@jwt_required()
def export_backup():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    db_path = os.path.join(os.getcwd(), 'instance', 'maxdev.db')
    if not os.path.exists(db_path):
        return jsonify({'error': 'Database not found'}), 404
    add_log('BACKUP_EXPORT', current_user_id, "Exported backup")
    return send_file(db_path, as_attachment=True, download_name=f'maxdev_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db', mimetype='application/octet-stream')

@app.route('/api/admin/backup', methods=['POST'])
@jwt_required()
def import_backup():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if not file.filename.endswith('.db'):
        return jsonify({'error': 'Invalid file format, need .db'}), 400
    db_path = os.path.join(os.getcwd(), 'instance', 'maxdev.db')
    backup_path = os.path.join(os.getcwd(), 'instance', f'maxdev_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db')
    if os.path.exists(db_path):
        shutil.copy(db_path, backup_path)
    file.save(db_path)
    add_log('BACKUP_IMPORT', current_user_id, "Imported backup")
    return jsonify({'message': 'Database restored'})

@app.route('/api/admin/reset', methods=['POST'])
@jwt_required()
def reset_database():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    db.drop_all()
    db.create_all()
    init_database(demo=False)
    return jsonify({'message': 'Database reset. Only administrator account remains.'})

# ------------------- STATS -------------------
@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role != 'administrator':
        return jsonify({'error': 'Forbidden'}), 403
    stats = {
        'users': User.query.count(),
        'jobs': Job.query.count(),
        'messages': Message.query.count(),
        'reviews': Review.query.count(),
        'complaints': Complaint.query.filter_by(status='pending').count(),
        'logs': ActivityLog.query.count()
    }
    return jsonify(stats)

# ------------------- FILES -------------------
@app.route('/api/files/<filename>', methods=['GET'])
def download_file(filename):
    """Скачивание файла из чата"""
    # Проверяем что файл существует
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Отправляем файл
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
