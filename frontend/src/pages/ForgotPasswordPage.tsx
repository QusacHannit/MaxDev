/**
 * ForgotPasswordPage — страница восстановления пароля.
 *
 * Шаги:
 *  1. Ввод email → запрос кода
 *  2. Ввод 6-значного кода из письма
 *  3. Ввод нового пароля
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle, Sun, Moon } from 'lucide-react';
import { authApi } from '../api/client';
import { useTheme } from '../store/ThemeContext';

type Step = 'email' | 'code' | 'password' | 'done';

export const ForgotPasswordPage: React.FC = () => {
  const navigate     = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark       = theme === 'dark';

  const [step,         setStep]         = useState<Step>('email');
  const [email,        setEmail]        = useState('');
  const [code,         setCode]         = useState('');
  const [password,     setPassword]     = useState('');
  const [password2,    setPassword2]    = useState('');
  const [verifyToken,  setVerifyToken]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [resendTimer,  setResendTimer]  = useState(0);

  // ── шаг 1: запросить код ──────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Введите email'); return; }
    setLoading(true);
    try {
      await authApi.sendCode({ email: email.trim().toLowerCase(), purpose: 'reset' });
      setStep('code');
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  // ── шаг 2: проверить код ──────────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Код должен содержать 6 цифр'); return; }
    setLoading(true);
    try {
      const data = await authApi.verifyCode({ email, code, purpose: 'reset' });
      setVerifyToken(data.verifyToken);
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или просроченный код');
    } finally {
      setLoading(false);
    }
  };

  // ── шаг 3: установить новый пароль ───────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6)   { setError('Пароль должен быть не менее 6 символов'); return; }
    if (password !== password2) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, password, verifyToken });
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  // ── повторная отправка кода ────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendCode({ email, purpose: 'reset' });
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  // ── вспомогательные стили ─────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 to-purple-50';
  const card  = isDark ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'bg-white text-gray-900';
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500';
  const label = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${bg}`}>
      {/* переключатель темы */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors
          ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                   : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 ${card}`}>
        {/* заголовок */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Восстановление пароля</h1>
          <p className={`text-sm mt-1 ${label}`}>
            {step === 'email'    && 'Введите email — отправим код подтверждения'}
            {step === 'code'     && `Введите код из письма на ${email}`}
            {step === 'password' && 'Придумайте новый пароль'}
            {step === 'done'     && 'Пароль успешно изменён!'}
          </p>
        </div>

        {/* STEP 1: email */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${label}`}>Email</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${label}`} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors outline-none ${input}`}
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60
                         text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>
        )}

        {/* STEP 2: code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${label}`}>6-значный код</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl
                            font-mono tracking-[0.4em] transition-colors outline-none ${input}`}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60
                         text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Проверка...' : 'Подтвердить код'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || loading}
              className={`w-full text-sm transition-colors ${
                resendTimer > 0 ? 'text-gray-400 cursor-not-allowed'
                                : 'text-purple-500 hover:text-purple-600 cursor-pointer'
              }`}
            >
              {resendTimer > 0 ? `Повторная отправка через ${resendTimer} с.` : 'Отправить код повторно'}
            </button>
          </form>
        )}

        {/* STEP 3: new password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${label}`}>Новый пароль</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${label}`} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors outline-none ${input}`}
                  required
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${label}`}>Повторите пароль</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${label}`} />
                <input
                  type="password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Повторите пароль"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors outline-none ${input}`}
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60
                         text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
            </button>
          </form>
        )}

        {/* STEP 4: done */}
        {step === 'done' && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <p className="font-medium">Пароль успешно изменён!</p>
            <p className={`text-sm ${label}`}>Теперь вы можете войти с новым паролем.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700
                         text-white rounded-lg font-medium transition-colors"
            >
              Войти
            </button>
          </div>
        )}

        {/* ссылка назад */}
        {step !== 'done' && (
          <div className="mt-6 text-center">
            <Link to="/login" className={`text-sm flex items-center justify-center gap-1
              ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              <ArrowLeft size={14} /> Вернуться ко входу
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
