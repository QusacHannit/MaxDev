# MaxDev Platform

MaxDev — это веб-платформа для взаимодействия заказчиков, фрилансеров и администратора.

Проект состоит из двух частей:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Flask + SQLite + JWT

База данных хранится в файле:
- `backend/instance/maxdev.db`

---

## Что умеет сайт

### Для заказчика
- регистрация и вход
- создание публичных заказов
- персональные предложения фрилансерам
- выбор исполнителя
- чат по заказу
- отправка и скачивание файлов
- оплата через ЮKassa
- жалобы на пользователей
- отзывы на фрилансеров

### Для фрилансера
- просмотр заказов
- отклики на заказы
- принятие персональных предложений
- чат с заказчиком
- загрузка результата работы
- отзывы на заказчиков после принятия работы
- жалобы на пользователей

### Для администратора
- просмотр пользователей, заказов, жалоб и логов
- просмотр переписок и файлов по заказам
- блокировка и разблокировка пользователей
- экспорт и импорт SQLite-базы
- сброс базы данных

---

## Технологии

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router DOM
- Axios
- Lucide React

### Backend
- Python 3.10+
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Werkzeug
- python-dotenv

### База данных
- SQLite

### Платежи
- ЮKassa

---

# Полноценный запуск сайта с нуля

Ниже приведена полная инструкция для **Windows**.

---

## 1. Установить необходимое ПО

### 1.1. Установить Node.js
Скачать:
- https://nodejs.org/

Рекомендуется установить **LTS-версию**.

После установки проверьте в `CMD`:

```cmd
node -v
npm -v
```

Должны отображаться версии Node.js и npm.

---

### 1.2. Установить Python
Скачать:
- https://www.python.org/downloads/

Рекомендуемая версия:
- **Python 3.10 или выше**

При установке обязательно включите:
- **Add Python to PATH**

Проверка:

```cmd
python --version
pip --version
```

---

### 1.3. Установить Visual Studio Code
Скачать:
- https://code.visualstudio.com/

Рекомендуемые расширения:
- Python
- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

## 2. Открыть проект

Если проект уже распакован, откройте папку проекта.

Пример пути:

```cmd
C:\Projects\maxdev
```

---

## 3. Настроить переменные окружения

В корне проекта есть файл:
- `.env.example`

Создайте рядом файл:
- `.env`

Можно просто скопировать:

```cmd
copy .env.example .env
```

Или создать вручную.

### Пример содержимого `.env`

```env
VITE_API_URL=/api
FRONTEND_URL=http://localhost:5173
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

### Что означают эти поля
- `VITE_API_URL=/api` — фронтенд будет обращаться к Flask через прокси Vite
- `FRONTEND_URL=http://localhost:5173` — URL возврата после оплаты ЮKassa
- `YOOKASSA_SHOP_ID` — id магазина ЮKassa
- `YOOKASSA_SECRET_KEY` — секретный ключ ЮKassa

> Если ЮKassa пока не нужна, сайт можно запускать и без реальных ключей, но оплата работать не будет.

---

## 4. Установить зависимости фронтенда

Откройте `CMD` в корне проекта:

```cmd
cd C:\Projects\maxdev
npm install
```

Дождитесь завершения установки.

---

## 5. Установить зависимости бэкенда

Перейдите в папку `backend`:

```cmd
cd C:\Projects\maxdev\backend
pip install -r requirements.txt
```

### Рекомендуемый вариант — через виртуальное окружение

```cmd
cd C:\Projects\maxdev\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Если используется виртуальное окружение, перед каждым запуском бэкенда его нужно активировать:

```cmd
cd C:\Projects\maxdev\backend
.venv\Scripts\activate
```

---

## 6. Создать или пересоздать базу данных

Если вы запускаете проект впервые, выполните:

```cmd
cd C:\Projects\maxdev\backend
python init_db.py
```

Если нужно полностью пересоздать базу данных заново:

```cmd
del C:\Projects\maxdev\backend\instance\maxdev.db
cd C:\Projects\maxdev\backend
python init_db.py
```

После этого будет создан файл:

```cmd
backend\instance\maxdev.db
```

---

## 7. Запустить Flask backend

Откройте **первое окно CMD**:

```cmd
cd C:\Projects\maxdev\backend
python run.py
```

Или:

```cmd
cd C:\Projects\maxdev\backend
python app.py
```

После запуска должно появиться примерно такое сообщение:

```cmd
🚀 MaxDev Backend Server
📍 Server: http://localhost:5000
```

**Важно:** это окно нельзя закрывать, пока вы пользуетесь сайтом.

---

## 8. Запустить frontend

Откройте **второе окно CMD**:

```cmd
cd C:\Projects\maxdev
npm run dev
```

После запуска Vite покажет адрес, обычно:

```cmd
http://localhost:5173
```

---

## 9. Открыть сайт

Откройте в браузере:

```text
http://localhost:5173
```

---

# Как войти в систему

После инициализации базы обычно доступны тестовые аккаунты.

## Администратор
- Email: `admin@maxdev.ru`
- Пароль: `admin123`

Если вы пересоздавали базу специальным сценарием, набор тестовых пользователей может отличаться.

---

# Как проверить, что всё работает

## Проверка backend
Откройте в браузере:

```text
http://localhost:5000/api
```

Если сервер работает, вы увидите ответ API.

## Проверка frontend
Откройте:

```text
http://localhost:5173
```

Если интерфейс открылся — фронтенд работает.

## Проверка базы данных
Проверьте наличие файла:

```text
backend/instance/maxdev.db
```

---

# Запуск в правильном порядке

Правильная последовательность такая:

1. установить Node.js и Python
2. создать `.env`
3. выполнить `npm install`
4. выполнить `pip install -r requirements.txt`
5. выполнить `python init_db.py`
6. запустить backend: `python run.py`
7. запустить frontend: `npm run dev`
8. открыть `http://localhost:5173`

---

# Сборка production-версии фронтенда

Если нужно собрать фронтенд:

```cmd
cd C:\Projects\maxdev
npm run build
```

После этого собранные файлы появятся в папке:

```text
dist/
```

---

# Работа с резервной копией базы данных

## Экспорт
В аккаунте администратора:
1. открыть панель управления
2. перейти к разделу базы данных
3. нажать экспорт

Скачивается **настоящий SQLite-файл `.db`**.

## Импорт
1. войти как администратор
2. открыть раздел базы данных
3. выбрать импорт
4. загрузить `.db` файл

---

# Оплата через ЮKassa

Для работы оплаты обязательно нужны:
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`

Они должны быть указаны в `.env`.

### Сценарий оплаты
1. фрилансер сдаёт работу
2. заказчик нажимает оплату
3. сайт переводит пользователя на ЮKassa
4. после оплаты пользователь возвращается обратно на сайт
5. сайт проверяет статус платежа
6. заказ получает статус оплаченного

---

# Частые проблемы и решения

## 1. Не запускается frontend
Проверьте:

```cmd
node -v
npm -v
```

И повторно установите зависимости:

```cmd
npm install
```

---

## 2. Не запускается backend
Проверьте:

```cmd
python --version
pip --version
```

И переустановите зависимости:

```cmd
cd backend
pip install -r requirements.txt
```

---

## 3. Ошибка подключения к API
Проверьте:
- backend действительно запущен на `http://localhost:5000`
- frontend действительно запущен на `http://localhost:5173`
- `vite.config.ts` проксирует `/api` на Flask

---

## 4. Не работает вход
Проверьте:
- существует ли база `backend/instance/maxdev.db`
- запускали ли вы `python init_db.py`
- корректны ли логин и пароль

---

## 5. Не работает ЮKassa
Проверьте:
- указаны ли `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
- перезапущен ли backend после изменения `.env`
- используете ли тестовые ключи для разработки

---

# Структура проекта

```text
maxdev/
├─ backend/
│  ├─ app.py
│  ├─ run.py
│  ├─ init_db.py
│  ├─ models.py
│  ├─ requirements.txt
│  ├─ README.md
│  └─ instance/
│     └─ maxdev.db
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ pages/
│  ├─ store/
│  ├─ types/
│  └─ App.tsx
├─ .env.example
├─ package.json
├─ vite.config.ts
└─ README.md
```

---

# Кратко: самый быстрый способ запуска

## Окно 1
```cmd
cd C:\Projects\maxdev\backend
python init_db.py
python run.py
```

## Окно 2
```cmd
cd C:\Projects\maxdev
npm install
npm run dev
```

## Открыть в браузере
```text
http://localhost:5173
```

---

Если нужно, я могу следующим сообщением ещё отдельно сделать **очень короткий README в формате “5 шагов для преподавателя”** без длинных пояснений.