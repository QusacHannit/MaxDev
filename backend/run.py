"""
MaxDev Platform - Development Server
Упрощённый запуск сервера для разработки
"""

from app import app

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 MaxDev Backend Server")
    print("="*60)
    print("📍 Server: http://localhost:5000")
    print("📊 API Docs: http://localhost:5000/api")
    print("🔐 Demo Admin: admin@maxdev.ru / admin123")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
