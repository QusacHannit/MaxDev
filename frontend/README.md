# MaxDev Platform

Бдшка хранится в файле:
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


npm install в папке frontend


python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt это все в папке backend

python init_db.py


Если нужно полностью пересоздать базу данных заново:


del C:\Projects\maxdev\backend\instance\maxdev.db
python init_db.py


python app.py



Запустить frontend

npm run dev



Как войти в систему

После инициализации базы обычно доступны тестовые аккаунты.

## Администратор
- Email: `admin@maxdev.ru`
- Пароль: `admin123`