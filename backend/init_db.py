"""
MaxDev Platform - Database Initialization
Заполнение БД демо-данными при первом запуске
"""

from models import db, User, Job, Message, Review, Complaint, ActivityLog, Notification
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

def init_database(demo: bool = True):
    """Инициализация БД.

    demo=True  -> создаются администратор + демо-клиенты/фрилансеры/заказы
    demo=False -> создаётся только администратор
    """

    if User.query.first():
        return

    print("🔄 Инициализация базы данных...")

    admin = User(
        name='Администратор',
        email='admin@maxdev.ru',
        password_hash=generate_password_hash('admin123'),
        role='administrator'
    )

    db.session.add(admin)
    db.session.commit()

    if not demo:
        log = ActivityLog(
            action='DB_RESET',
            user_id=admin.id,
            details='База данных очищена. Оставлен только администратор.',
            timestamp=datetime.now()
        )
        db.session.add(log)
        db.session.commit()
        print("✅ База данных успешно инициализирована!")
        print(f"   - Пользователей: {User.query.count()}")
        print("\n🔐 Аккаунт администратора:")
        print("   Админ: admin@maxdev.ru / admin123")
        return

    # ==================== ПОЛЬЗОВАТЕЛИ ====================

    client1 = User(
        name='Иван Петров',
        email='ivan@example.com',
        password_hash=generate_password_hash('client123'),
        role='client'
    )

    client2 = User(
        name='Мария Сидорова',
        email='maria@example.com',
        password_hash=generate_password_hash('client123'),
        role='client'
    )

    freelancer1 = User(
        name='Алексей Кодеров',
        email='alex@example.com',
        password_hash=generate_password_hash('freelancer123'),
        role='freelancer'
    )

    freelancer2 = User(
        name='Ольга Дизайнова',
        email='olga@example.com',
        password_hash=generate_password_hash('freelancer123'),
        role='freelancer'
    )

    freelancer3 = User(
        name='Дмитрий Программист',
        email='dmitry@example.com',
        password_hash=generate_password_hash('freelancer123'),
        role='freelancer'
    )

    db.session.add_all([client1, client2, freelancer1, freelancer2, freelancer3])
    db.session.commit()
    
    # ==================== ЗАКАЗЫ ====================
    
    job1 = Job(
        title='Разработка сайта-визитки',
        description='Требуется создать современный сайт-визитку для малого бизнеса. Дизайн минималистичный, адаптивная вёрстка обязательна.',
        budget=15000,
        deadline=datetime.now() + timedelta(days=14),
        skills='HTML,CSS,JavaScript,React',
        status='open',
        client_id=client1.id
    )
    
    job2 = Job(
        title='Логотип для стартапа',
        description='Нужен креативный логотип для IT-стартапа в сфере финтех. Стиль — современный, минималистичный.',
        budget=8000,
        deadline=datetime.now() + timedelta(days=7),
        skills='Photoshop,Illustrator,Дизайн',
        status='in_progress',
        client_id=client2.id,
        freelancer_id=freelancer2.id,
        applicants=f'{freelancer2.id},{freelancer1.id}'
    )
    
    job3 = Job(
        title='Telegram-бот для автоматизации',
        description='Разработка бота для Telegram с функциями рассылки, опросов и интеграции с CRM.',
        budget=25000,
        deadline=datetime.now() + timedelta(days=21),
        skills='Python,Telegram API,SQLite',
        status='open',
        client_id=client1.id,
        applicants=f'{freelancer1.id}'
    )
    
    job4 = Job(
        title='Исправление багов на React сайте',
        description='Есть сайт на React, нужно исправить несколько багов в корзине и форме оплаты.',
        budget=5000,
        deadline=datetime.now() + timedelta(days=3),
        skills='React,JavaScript,Redux',
        status='paid',
        client_id=client2.id,
        freelancer_id=freelancer1.id
    )
    
    db.session.add_all([job1, job2, job3, job4])
    db.session.commit()
    
    # ==================== СООБЩЕНИЯ ====================
    
    msg1 = Message(
        job_id=job2.id,
        sender_id=client2.id,
        content='Здравствуйте! Когда сможете приступить к работе?',
        created_at=datetime.now() - timedelta(hours=5)
    )
    
    msg2 = Message(
        job_id=job2.id,
        sender_id=freelancer2.id,
        content='Добрый день! Готова начать прямо сейчас. Пришлю первые эскизы через 2 дня.',
        created_at=datetime.now() - timedelta(hours=4)
    )
    
    msg3 = Message(
        job_id=job2.id,
        sender_id=client2.id,
        content='Отлично! Вот макет с референсами.',
        file_url='https://example.com/files/references.pdf',
        created_at=datetime.now() - timedelta(hours=3)
    )
    
    msg4 = Message(
        job_id=job4.id,
        sender_id=freelancer1.id,
        content='Все баги исправлены. Тестируйте, пожалуйста.',
        created_at=datetime.now() - timedelta(days=1)
    )
    
    msg5 = Message(
        job_id=job4.id,
        sender_id=client2.id,
        content='Проверила — всё работает! Отлично, спасибо.',
        created_at=datetime.now() - timedelta(hours=12)
    )
    
    db.session.add_all([msg1, msg2, msg3, msg4, msg5])
    db.session.commit()
    
    # ==================== ОТЗЫВЫ ====================
    
    review1 = Review(
        job_id=job4.id,
        from_user_id=client2.id,
        to_user_id=freelancer1.id,
        rating=5,
        comment='Отличная работа! Быстро и качественно исправил все баги. Рекомендую!',
        created_at=datetime.now() - timedelta(hours=10)
    )
    
    review2 = Review(
        job_id=job4.id,
        from_user_id=freelancer1.id,
        to_user_id=client2.id,
        rating=5,
        comment='Приятно работать! Чёткое ТЗ, своевременная оплата.',
        created_at=datetime.now() - timedelta(hours=9)
    )
    
    db.session.add_all([review1, review2])
    db.session.commit()
    
    # ==================== ЖАЛОБЫ ====================
    
    complaint1 = Complaint(
        user_id=client1.id,
        target_user_id=freelancer3.id,
        reason='Фрилансер взял аванс и пропал. Не выходит на связь уже неделю.',
        status='pending'
    )
    
    db.session.add(complaint1)
    db.session.commit()
    
    # ==================== ЛОГИ ====================
    
    log1 = ActivityLog(
        action='REGISTER',
        user_id=admin.id,
        details='Создан аккаунт администратора',
        timestamp=datetime.now() - timedelta(days=30)
    )
    
    log2 = ActivityLog(
        action='REGISTER',
        user_id=client1.id,
        details=f'Новый клиент: {client1.name}',
        timestamp=datetime.now() - timedelta(days=20)
    )
    
    log3 = ActivityLog(
        action='JOB_CREATE',
        user_id=client1.id,
        details=f'Создан заказ: {job1.title}',
        timestamp=datetime.now() - timedelta(days=10)
    )
    
    log4 = ActivityLog(
        action='JOB_APPLY',
        user_id=freelancer1.id,
        details=f'Отклик на заказ: {job3.title}',
        timestamp=datetime.now() - timedelta(days=5)
    )
    
    log5 = ActivityLog(
        action='LOGIN',
        user_id=admin.id,
        details='Вход администратора',
        timestamp=datetime.now() - timedelta(hours=2)
    )
    
    db.session.add_all([log1, log2, log3, log4, log5])

    # ==================== УВЕДОМЛЕНИЯ ====================

    n1 = Notification(
        user_id=client1.id,
        title='Платформа готова к работе',
        message='Добро пожаловать в MaxDev. Создайте первый заказ и получите отклики.',
        type='info',
        is_read=False,
    )
    n2 = Notification(
        user_id=freelancer1.id,
        title='Новый заказ по вашим навыкам',
        message='Появился заказ с навыками React и JavaScript.',
        type='job',
        is_read=False,
    )
    db.session.add_all([n1, n2])
    db.session.commit()
    
    print("✅ База данных успешно инициализирована!")
    print(f"   - Пользователей: {User.query.count()}")
    print(f"   - Заказов: {Job.query.count()}")
    print(f"   - Сообщений: {Message.query.count()}")
    print(f"   - Отзывов: {Review.query.count()}")
    print(f"   - Жалоб: {Complaint.query.count()}")
    print(f"   - Логов: {ActivityLog.query.count()}")
    print("\n🔐 Тестовые аккаунты:")
    print("   Админ: admin@maxdev.ru / admin123")
    print("   Клиент: ivan@example.com / client123")
    print("   Фрилансер: alex@example.com / freelancer123")
