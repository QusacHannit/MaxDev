# ⚡ MaxDev — Быстрый старт

## Шаг 1 — Создать файл с секретами

```cmd
cd backend
copy .env.example .env
```

Открыть `backend/.env` в редакторе и заполнить:

### Обязательно — JWT ключ
```cmd
python -c "import secrets; print(secrets.token_hex(32))"
```
Скопируйте вывод и вставьте в `backend/.env`:
```
JWT_SECRET_KEY=вставьте-сюда-сгенерированный-ключ
```

### Опционально — Email (для верификации)
```
SMTP_USER=ваш@gmail.com
SMTP_PASSWORD=пароль-приложения-gmail
```

### Опционально — ЮKassa (для платежей)
```
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=ваш-secret-key
```

---

## Шаг 2 — Установить зависимости

**Терминал 1 (бэкенд):**
```cmd
cd backend
pip install -r requirements.txt
python init_db.py
python app.py
```

**Терминал 2 (фронтенд):**
```cmd
npm install
npm run dev
```

---

## Шаг 3 — Открыть сайт

```
http://localhost:5173
```

Войти как администратор:
- Email: `admin@maxdev.ru`
- Пароль: `admin123`

---

## Структура .env файлов

| Файл | Назначение |
|------|-----------|
| `backend/.env` | Секреты сервера (JWT, SMTP, ЮKassa) |
| `.env` | URL API для фронтенда |
| `.env.example` | Шаблон для заполнения |

---

## Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|-------------|----------|
| `JWT_SECRET_KEY` | ✅ ДА | Секретный ключ для JWT токенов |
| `FRONTEND_URL` | ✅ ДА | URL фронтенда (для CORS и ЮKassa) |
| `DATABASE_URL` | нет | Путь к БД (по умолчанию SQLite) |
| `JWT_EXPIRES_DAYS` | нет | Срок токена в днях (по умолчанию 7) |
| `SMTP_HOST` | нет | SMTP сервер (по умолчанию Gmail) |
| `SMTP_PORT` | нет | SMTP порт (по умолчанию 587) |
| `SMTP_USER` | нет | Email отправителя |
| `SMTP_PASSWORD` | нет | Пароль приложения |
| `SMTP_FROM` | нет | Имя отправителя |
| `YOOKASSA_SHOP_ID` | нет | ID магазина ЮKassa |
| `YOOKASSA_SECRET_KEY` | нет | Секретный ключ ЮKassa |
| `VITE_API_URL` | нет | URL API для фронтенда (фронт .env) |
