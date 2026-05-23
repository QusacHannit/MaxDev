import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Code2, Menu, X, LogOut, User, Briefcase, PlusCircle,
  Search, Shield, ChevronDown, Bell, Database, Terminal, CheckCheck, Moon, Sun
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTheme } from '../store/ThemeContext';
import { cn } from '../utils/cn';
import { Avatar } from './ui/Avatar';

interface NavbarProps {
  dark?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ dark = false }) => {
  const { currentUser, logout, notifications, markNotificationsRead, clearNotifications, deleteNotification } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const showNotifications = currentUser?.role === 'client' || currentUser?.role === 'freelancer';
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const latestNotifications = notifications.slice(0, 15);
  const showThemeToggle = !dark;

  const ThemeToggleButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border transition-all duration-200',
        mobile ? 'w-full px-3 py-2.5 text-sm font-medium' : 'p-2.5',
        isDark
          ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800 hover:border-slate-600'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
      )}
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {isDark ? <Sun size={mobile ? 16 : 18} /> : <Moon size={mobile ? 16 : 18} />}
      {mobile && <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>}
    </button>
  );

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  // Закрытие уведомлений по клику вне окна
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationsOpen) return;
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notificationsOpen]);

  // Закрытие меню профиля по клику вне окна
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileOpen) return;
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileOpen]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // Styles based on dark mode
  const navBg = dark
    ? 'bg-gray-950/90 border-green-900/30 backdrop-blur-xl shadow-lg shadow-green-900/10'
    : 'bg-white/80 border-slate-100 backdrop-blur-xl shadow-sm';

  const linkBase = dark
    ? 'text-gray-400 hover:bg-green-900/30 hover:text-green-400'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  const linkActive = dark
    ? 'bg-green-900/40 text-green-400 border border-green-800/60'
    : 'bg-violet-100 text-violet-700';

  const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ to, children, icon }) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive(to) ? linkActive : linkBase,
        dark && 'font-mono'
      )}
    >
      {icon}
      {children}
    </Link>
  );

  const getNavLinks = () => {
    if (!currentUser) return null;

    if (currentUser.role === 'client') {
      return (
        <>
          <NavLink to="/freelancers" icon={<Search size={16} />}>Найти исполнителя</NavLink>
          <NavLink to="/my-jobs" icon={<Briefcase size={16} />}>Мои заказы</NavLink>
          <NavLink to="/create-job" icon={<PlusCircle size={16} />}>Создать заказ</NavLink>
        </>
      );
    }

    if (currentUser.role === 'freelancer') {
      return (
        <>
          <NavLink to="/jobs" icon={<Search size={16} />}>Найти заказы</NavLink>
          <NavLink to="/my-jobs" icon={<Briefcase size={16} />}>Мои заказы</NavLink>
          <NavLink to="/profile" icon={<User size={16} />}>Портфолио</NavLink>
        </>
      );
    }

    if (currentUser.role === 'administrator') {
      return (
        <>
          <NavLink to="/" icon={<Terminal size={16} />}>Консоль</NavLink>
          <NavLink to="/admin" icon={<Shield size={16} />}>Управление</NavLink>
          <NavLink to="/admin" icon={<Database size={16} />}>База данных</NavLink>
        </>
      );
    }
  };

  return (
    <nav className={cn('sticky top-0 z-40 border-b', navBg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/*
          <Link to="/" className="flex items-center gap-2 group">
            {dark ? (
              <>
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Code2 size={20} className="text-black" />
                </div>
                <span className="text-xl font-extrabold font-mono text-green-400">
                  MaxDev
                </span>
                <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-green-700 ml-1">
                  <span className="animate-pulse">█</span>
                  ADMIN
                </span>
              </>
            ) : (
              <>
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-violet-200 transition-all duration-200">
                  <Code2 size={20} className="text-white" />
                </div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  MaxDev
                </span>
              </>
            )}
          </Link>
          */}

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {getNavLinks()}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {showThemeToggle && <ThemeToggleButton />}
            {currentUser ? (
              <>
                {/* Bell */}
                {showNotifications && (
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className={cn(
                        'p-2 rounded-xl transition-colors relative',
                        dark ? 'hover:bg-green-900/30 text-green-700' : 'hover:bg-slate-100 text-slate-500'
                      )}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className={cn(
                        'absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl z-50 overflow-hidden',
                        dark ? 'bg-gray-900 border-green-900/50 shadow-green-900/20' : 'bg-white border-slate-100'
                      )}>
                        {/* Заголовок с кнопками */}
                        <div className={cn('px-4 py-3 flex items-center justify-between border-b', dark ? 'border-green-900/30' : 'border-slate-100')}>
                          <span className={cn('text-sm font-semibold', dark ? 'text-green-400 font-mono' : 'text-slate-900')}>
                            Уведомления ({notifications.length}/15)
                          </span>
                          <div className="flex items-center gap-2">
                            {/* Прочитать все */}
                            {unreadCount > 0 && (
                              <button
                                onClick={async () => { await markNotificationsRead(); }}
                                className={cn('text-xs inline-flex items-center gap-1', dark ? 'text-green-600 hover:text-green-400 font-mono' : 'text-violet-600 hover:text-violet-700')}
                                title="Прочитать все"
                              >
                                <CheckCheck size={12} />
                              </button>
                            )}
                            {/* Очистить все */}
                            {notifications.length > 0 && (
                              <button
                                onClick={async () => {
                                  await clearNotifications();
                                }}
                                className={cn('text-xs inline-flex items-center gap-1', dark ? 'text-red-600 hover:text-red-400 font-mono' : 'text-red-500 hover:text-red-700')}
                                title="Очистить все уведомления"
                              >
                                <X size={12} />
                                Очистить
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Список уведомлений */}
                        <div className="max-h-80 overflow-y-auto">
                          {latestNotifications.length === 0 ? (
                            <div className={cn('px-4 py-8 text-center text-sm', dark ? 'text-gray-600 font-mono' : 'text-slate-500')}>
                              Уведомлений пока нет
                            </div>
                          ) : (
                            latestNotifications.map((n) => (
                              <div
                                key={n.id}
                                className={cn(
                                  'relative group flex items-start border-b last:border-0 transition-colors',
                                  dark ? 'border-green-900/20' : 'border-slate-100',
                                  !n.isRead && (dark ? 'bg-green-950/20' : 'bg-violet-50/60'),
                                  dark ? 'hover:bg-green-900/20' : 'hover:bg-slate-50'
                                )}
                              >
                                {/* Основной контент — кликабельный */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!n.isRead) { await markNotificationsRead(); }
                                    navigate(n.link || '/my-jobs');
                                    setNotificationsOpen(false);
                                  }}
                                  className="flex-1 text-left px-4 py-3"
                                >
                                  <p className={cn('text-sm font-semibold pr-5', dark ? 'text-gray-300' : 'text-slate-800')}>{n.title}</p>
                                  <p className={cn('text-xs mt-1', dark ? 'text-gray-500' : 'text-slate-500')}>{n.message}</p>
                                </button>

                                {/* Кнопка удаления одного уведомления */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await deleteNotification(n.id);
                                  }}
                                  className={cn(
                                    'absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                                    dark ? 'hover:bg-red-900/30 text-red-500' : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                                  )}
                                  title="Удалить уведомление"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl transition-colors',
                      dark ? 'hover:bg-green-900/30' : 'hover:bg-slate-100'
                    )}
                  >
                    <Avatar src={currentUser.avatar} alt={currentUser.name} size="sm" role={currentUser.role} className={cn('ring-2', dark ? 'ring-green-800' : 'ring-violet-200')} />
                    <span className={cn('text-sm font-medium max-w-[120px] truncate', dark ? 'text-gray-300 font-mono' : 'text-slate-700')}>
                      {currentUser.name}
                    </span>
                    <ChevronDown size={14} className={cn('transition-transform', profileOpen && 'rotate-180', dark ? 'text-green-700' : 'text-slate-400')} />
                  </button>

                  {profileOpen && (
                    <div className={cn(
                      'absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl py-2 z-50 border',
                      dark
                        ? 'bg-gray-900 border-green-900/50 shadow-green-900/30'
                        : 'bg-white border-slate-100'
                    )}>
                      <div className={cn('px-4 py-2 border-b mb-1', dark ? 'border-green-900/30' : 'border-slate-100')}>
                        <p className={cn('text-xs', dark ? 'text-green-700 font-mono' : 'text-slate-500')}>Вы вошли как</p>
                        <p className={cn('text-sm font-semibold truncate', dark ? 'text-green-400 font-mono' : 'text-slate-900')}>{currentUser.email}</p>
                        <span className={cn('text-xs font-medium', dark ? 'text-green-600 font-mono' : 'text-violet-600')}>
                          {currentUser.role === 'client' ? 'Клиент' : currentUser.role === 'freelancer' ? 'Фрилансер' : '★ Администратор'}
                        </span>
                      </div>

                      {currentUser.role !== 'administrator' && (
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                            dark
                              ? 'text-gray-400 hover:bg-green-900/30 hover:text-green-400 font-mono'
                              : 'text-slate-700 hover:bg-violet-50 hover:text-violet-700'
                          )}
                        >
                          <User size={16} />
                          Мой профиль
                        </Link>
                      )}

                      {currentUser.role === 'administrator' && (
                        <>
                          <Link
                            to="/"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-green-900/30 hover:text-green-400 transition-colors font-mono"
                          >
                            <Terminal size={16} />
                            Консоль
                          </Link>
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-green-900/30 hover:text-green-400 transition-colors font-mono"
                          >
                            <Shield size={16} />
                            Панель управления
                          </Link>
                        </>
                      )}

                      <hr className={cn('my-1', dark ? 'border-green-900/30' : 'border-slate-100')} />
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          dark
                            ? 'text-red-500 hover:bg-red-900/20 font-mono'
                            : 'text-red-600 hover:bg-red-50'
                        )}
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-violet-700 transition-colors"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-violet-200"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            {showThemeToggle && <ThemeToggleButton />}
            <button
              className={cn(
                'p-2 rounded-xl transition-colors',
                dark ? 'hover:bg-green-900/30 text-green-700' : 'hover:bg-slate-100 text-slate-600'
              )}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={cn(
          'md:hidden border-t py-4 px-4 space-y-2',
          dark ? 'border-green-900/30 bg-gray-950' : 'border-slate-100 bg-white'
        )}>
          {currentUser ? (
            <>
              <div className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl mb-3',
                dark ? 'bg-green-900/20 border border-green-900/30' : 'bg-slate-50'
              )}>
                <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" role={currentUser.role} className={cn('ring-2', dark ? 'ring-green-800' : 'ring-violet-200')} />
                <div>
                  <p className={cn('text-sm font-semibold', dark ? 'text-green-400 font-mono' : 'text-slate-900')}>{currentUser.name}</p>
                  <p className={cn('text-xs', dark ? 'text-green-700 font-mono' : 'text-violet-600')}>
                    {currentUser.role === 'client' ? 'Клиент' : currentUser.role === 'freelancer' ? 'Фрилансер' : '★ Администратор'}
                  </p>
                </div>
              </div>
              {getNavLinks()}
              {currentUser.role !== 'administrator' && (
                <NavLink to="/profile" icon={<User size={16} />}>Мой профиль</NavLink>
              )}
              {showThemeToggle && <ThemeToggleButton mobile />}
              <button
                onClick={handleLogout}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  dark
                    ? 'text-red-500 hover:bg-red-900/20 font-mono'
                    : 'text-red-600 hover:bg-red-50'
                )}
              >
                <LogOut size={16} />
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Вход
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
