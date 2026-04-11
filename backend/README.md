# MaxDev Backend

Backend проекта MaxDev написан на **Flask** и работает с базой данных **SQLite**.

Файл базы данных:
- `backend/instance/maxdev.db`

---

## Технологии

- Python 3.10+
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Werkzeug
- python-dotenv
- SQLite

---

## Что делает backend

Backend отвечает за:
- регистрацию и вход пользователей
- JWT-аутентификацию
- работу с заказами
- отклики фрилансеров
- чат и обмен файлами
- отзывы
- жалобы
- уведомления
- админ-панель
- экспорт и импорт SQLite-базы
- оплату через ЮKassa

---

# Пошаговый запуск backend

## 1. Установить Python
Скачать:
- https://www.python.org/downloads/

Проверка:

```cmd
python --version
pip --version
```

---

## 2. Перейти в папку backend

```cmd
cd C:\Projects\maxdev\backend
```

---

## 3. Установить зависимости

### Вариант без виртуального окружения

```cmd
pip install -r requirements.txt
```

### Рекомендуемый вариант — виртуальное окружение

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 4. Настроить переменные окружения

Создайте файл `.env` в корне проекта или рядом с backend.

Минимальный пример:

```env
FRONTEND_URL=http://localhost:5173
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

Если ЮKassa не используется, сайт можно запускать без реальных ключей, но оплата работать не будет.

---

## 5. Создать базу данных

```cmd
python init_db.py
```

После этого появится файл:

```text
backend/instance/maxdev.db
```

---

## 6. Запустить сервер

```cmd
python run.py
```

Или:

```cmd
python app.py
```

После запуска сервер будет доступен по адресу:

```text
http://localhost:5000
```

---

# Пересоздание базы данных

Если нужно удалить старую базу и создать новую:

```cmd
del instance\maxdev.db
python init_db.py
```

После этого заново запустите сервер:

```cmd
python run.py
```

---

# Проверка backend

## Проверка запуска API
Откройте в браузере:

```text
http://localhost:5000/api
```

## Проверка БД
Проверьте наличие файла:

```text
instance/maxdev.db
```

---

# Основные API endpoints

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Users
- `GET /api/users`
- `POST /api/users/<id>/block`
- `POST /api/users/<id>/unblock`
- `DELETE /api/users/<id>`
- `GET /api/freelancers`
- `GET /api/users/<id>/profile`

## Jobs
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/<id>`
- `DELETE /api/jobs/<id>`
- `POST /api/jobs/<id>/apply`
- `POST /api/jobs/<id>/select-freelancer`
- `POST /api/jobs/<id>/complete`
- `POST /api/jobs/<id>/accept-work`
- `POST /api/jobs/<id>/send-to-revision`

## Messages
- `GET /api/jobs/<id>/messages`
- `POST /api/jobs/<id>/messages`
- `GET /api/files/<filename>`

## Reviews
- `GET /api/reviews`
- `POST /api/reviews`

## Complaints
- `GET /api/complaints`
- `POST /api/complaints`
- `POST /api/complaints/<id>/resolve`

## Notifications
- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `DELETE /api/notifications`
- `DELETE /api/notifications/<id>`

## Admin
- `GET /api/logs`
- `GET /api/admin/stats`
- `GET /api/admin/backup`
- `POST /api/admin/backup`
- `POST /api/admin/reset`

## Payments
- `POST /api/jobs/<id>/pay`
- `GET /api/payments/<payment_id>/status`

---

# JWT авторизация

Для защищённых endpoints нужен заголовок:

```text
Authorization: Bearer <token>
```

Токен выдаётся после логина или регистрации.

---

# ЮKassa

Для работы оплаты backend использует:
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `FRONTEND_URL`

Сценарий:
1. backend создаёт платёж в ЮKassa
2. получает `confirmation_url`
3. frontend переводит туда пользователя
4. после оплаты пользователь возвращается на сайт
5. backend проверяет статус платежа
6. заказ получает статус `paid`

---

# Частые проблемы

## Flask не запускается
Проверьте установку зависимостей:

```cmd
pip install -r requirements.txt
```

## Нет базы данных
Создайте её:

```cmd
python init_db.py
```

## Не работает JWT
Проверьте, что фронтенд передаёт токен в заголовке `Authorization`.

## Не работает ЮKassa
Проверьте переменные окружения и перезапустите backend.

---

# Быстрый запуск backend

```cmd
cd C:\Projects\maxdev\backend
pip install -r requirements.txt
python init_db.py
python run.py
```

После этого backend будет работать на:

```text
http://localhost:5000
```