import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Code2, Mail, Lock, LogIn, AlertCircle, ShieldX, X, Moon, Sun } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTheme } from '../store/ThemeContext';
import { cn } from '../utils/cn';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockedUser, setBlockedUser] = useState<{ id: string; name: string; reason?: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    const { result, user } = await login(data.email, data.password);
    if (result === 'ok') {
      navigate('/');
    } else if (result === 'blocked' && user) {
      setBlockedUser({ id: user.id, name: user.name, reason: user.blockReason });
    } else {
      setError('Неверный email или пароль');
    }
    setLoading(false);
  };


  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 transition-colors duration-300',
      isDark ? 'theme-dark bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-violet-50 via-white to-indigo-50'
    )}>
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'fixed right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
          isDark
            ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
        )}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        {isDark ? 'Светлая' : 'Тёмная'}
      </button>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Code2 size={24} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              MaxDev
            </span>
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-slate-900">Добро пожаловать</h1>
          <p className="mt-2 text-slate-500">Войдите в свой аккаунт</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.ru"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email обязателен',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Некорректный email' },
              })}
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password', {
                required: 'Пароль обязателен',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              })}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              <LogIn size={18} />
              Войти
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-slate-400 hover:text-violet-500 transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>
          <div className="mt-3 text-center text-sm text-slate-500">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              Зарегистрироваться
            </Link>
          </div>

        </div>
      </div>

      {/* BLOCKED ACCOUNT MODAL */}
      {blockedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-gray-950 border border-red-900/60 rounded-3xl shadow-2xl shadow-red-900/30 overflow-hidden">
            {/* Red glow top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
            
            <div className="p-8">
              {/* Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-700/50 flex items-center justify-center">
                  <ShieldX size={36} className="text-red-500" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white text-center mb-2">
                Аккаунт заблокирован
              </h2>
              <p className="text-gray-400 text-center text-sm mb-6">
                Администратор платформы MaxDev заблокировал ваш аккаунт
              </p>

              {/* Block reason */}
              <div className="bg-red-950/40 border border-red-900/40 rounded-2xl p-4 mb-6">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">
                  Причина блокировки
                </p>
                <p className="text-red-200 text-sm">
                  {blockedUser.reason || 'Причина не указана'}
                </p>
              </div>

              <button
                onClick={() => setBlockedUser(null)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;