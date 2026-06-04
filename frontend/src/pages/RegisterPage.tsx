/**
 * RegisterPage — регистрация с подтверждением email.
 *
 * Шаги:
 *  1. Заполнение формы (имя, email, пароль, роль)
 *  2. Ввод 6-значного кода из письма
 *  3. Финальная регистрация с verifyToken
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, Lock, User, Moon, Sun, KeyRound } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTheme } from '../store/ThemeContext';
import { authApi } from '../api/client';

type Step = 'form' | 'code';

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useApp();
  const { isDark, toggleTheme }    = useTheme();
  const navigate                   = useNavigate();

  // шаг
  const [step,        setStep]        = useState<Step>('form');
  // поля формы
  const [role,        setRole]        = useState<'client' | 'freelancer'>('client');
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  // верификация
  const [code,        setCode]        = useState('');
  // согласие
  const [agreed,      setAgreed]      = useState(false);

  const [resendTimer, setResendTimer] = useState(0);
  // UI
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  // ── Шаг 1: валидация + отправка кода ─────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) { setError('Имя должно быть не менее 2 символов'); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim()))      { setError('Некорректный email');                  return; }
    if (password.length < 6)                      { setError('Пароль должен быть не менее 6 символов'); return; }
    if (password !== confirm)                     { setError('Пароли не совпадают');                 return; }
    if (!agreed)                                  { setError('Необходимо согласиться с условиями');  return; }

    setLoading(true);
    try {
      await authApi.sendCode({ email: email.trim().toLowerCase(), purpose: 'register' });
      setStep('code');
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  // ── Шаг 2: проверка кода → получение verifyToken → регистрация ───────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Введите 6-значный код'); return; }
    setLoading(true);
    try {
      // 2a. Верифицируем код
      const vData = await authApi.verifyCode({
        email: email.trim().toLowerCase(),
        code,
        purpose: 'register',
      });
      const vToken: string = vData.verifyToken;

      // 2b. Регистрируем с verifyToken
      const ok = await registerUser(name.trim(), email.trim().toLowerCase(), password, role, vToken);
      if (ok) {
        navigate('/');
      } else {
        setError('Пользователь с таким email уже существует');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или просроченный код');
    } finally {
      setLoading(false);
    }
  };

  // ── Повторная отправка кода ────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authApi.sendCode({ email: email.trim().toLowerCase(), purpose: 'register' });
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  // ── стили ─────────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 to-purple-50';
  const card  = isDark ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'bg-white text-gray-900 shadow-xl';
  const inp   = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
    : 'bg-gray-50  border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500';
  const lbl   = isDark ? 'text-gray-400' : 'text-gray-600';
  const roleBtn = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
      active
        ? 'bg-purple-600 border-purple-600 text-white'
        : isDark
          ? 'border-gray-700 text-gray-400 hover:border-gray-500'
          : 'border-gray-300 text-gray-600 hover:border-gray-400'
    }`;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${bg}`}>
      {/* переключатель темы */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors
          ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                   : 'bg-white  text-gray-600 hover:bg-gray-100 shadow'}`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className={`w-full max-w-md rounded-2xl p-8 ${card}`}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Регистрация в MaxDev</h1>
          <p className={`text-sm mt-1 ${lbl}`}>
            {step === 'form' ? 'Создайте аккаунт разработчика' : `Введите код из письма на ${email}`}
          </p>
        </div>

        {/* ── ШАГ 1: форма ── */}
        {step === 'form' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            {/* роль */}
            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>Я хочу</label>
              <div className="flex gap-2">
                <button type="button" className={roleBtn(role === 'client')}
                  onClick={() => setRole('client')}>Найти исполнителя</button>
                <button type="button" className={roleBtn(role === 'freelancer')}
                  onClick={() => setRole('freelancer')}>Работать фрилансером</button>
              </div>
            </div>

            {/* имя */}
            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>Имя</label>
              <div className="relative">
                <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${lbl}`} />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${inp}`}
                />
              </div>
            </div>

            {/* email */}
            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>Email</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${lbl}`} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${inp}`}
                />
              </div>
            </div>

            {/* пароль */}
            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>Пароль</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${lbl}`} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${inp}`}
                />
              </div>
            </div>

            {/* подтверждение */}
            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>Подтвердите пароль</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${lbl}`} />
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${inp}`}
                />
              </div>
            </div>

            {/* согласие с условиями */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-purple-600"
              />
              <label htmlFor="agree-terms" className={`text-xs ${lbl}`}>
                Я соглашаюсь на{' '}
                <a href="/terms" target="_blank" className="text-purple-500 hover:underline">
                  обработку персональных данных
                </a>{' '}
                и принимаю{' '}
                <a href="/terms" target="_blank" className="text-purple-500 hover:underline">
                  условия пользовательского соглашения
                </a>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60
                         text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Отправка кода...' : 'Получить код подтверждения'}
            </button>
          </form>
        )}

        {/* ── ШАГ 2: ввод кода ── */}
        {step === 'code' && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className={`text-sm text-center py-3 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-blue-50 text-blue-700'}`}>
              <KeyRound size={16} className="inline mr-1" />
              Код отправлен на <b>{email}</b>. Действует 15 минут.
            </div>

            <div>
              <label className={`block text-sm mb-1 ${lbl}`}>6-значный код</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl
                            font-mono tracking-[0.4em] outline-none transition-colors ${inp}`}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60
                         text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Проверка...' : 'Подтвердить и зарегистрироваться'}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => { setStep('form'); setCode(''); setError(''); }}
                className={`${lbl} hover:underline`}
              >← Изменить данные</button>
              <button
                type="button" onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-500 hover:underline'}
              >
                {resendTimer > 0 ? `Повтор через ${resendTimer}с` : 'Отправить снова'}
              </button>
            </div>
          </form>
        )}

        {/* ссылка на вход */}
        <p className={`text-center text-sm mt-6 ${lbl}`}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-purple-500 hover:text-purple-600 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;