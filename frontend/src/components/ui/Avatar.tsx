// Компонент аватара пользователя
// Для всех кроме администратора — первая буква имени на цветном фоне
// Для администратора — специальный зелёный иконочный аватар

import { cn } from '../../utils/cn';

// Аватар администратора остаётся прежним
const ADMIN_AVATAR = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=administrator&backgroundColor=000000&primaryColor=00ff00';

// Палитра цветов фона для букв — приятные пастельные и насыщенные оттенки
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-green-600',
  'bg-red-500',
  'bg-sky-500',
  'bg-fuchsia-500',
];

// Генерация стабильного цвета из строки (имени пользователя)
// Один и тот же человек всегда получает один цвет
function getColorFromName(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Получаем первую букву имени (заглавную)
function getInitial(name: string): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

interface AvatarProps {
  src?: string;          // Не используется, оставлен для обратной совместимости
  alt?: string;          // Имя пользователя (используется для буквы и цвета)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'administrator' | 'client' | 'freelancer';
  className?: string;
}

export function Avatar({ alt = '', size = 'md', role, className }: AvatarProps) {
  // Размеры контейнера и текста
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  // Администратор получает отдельный иконочный аватар
  if (role === 'administrator') {
    return (
      <div className={cn(
        'relative rounded-full overflow-hidden bg-black ring-2 ring-green-800 shadow-sm',
        sizeClasses[size],
        className
      )}>
        <img
          src={ADMIN_AVATAR}
          alt="Администратор"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Зелёная точка статуса администратора */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"
          title="Администратор"
        />
      </div>
    );
  }

  // Для всех остальных — первая буква имени на цветном фоне
  const initial = getInitial(alt);
  const bgColor = getColorFromName(alt);

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center',
      bgColor,
      sizeClasses[size],
      className
    )}>
      <span className="font-semibold text-white leading-none select-none">
        {initial}
      </span>
    </div>
  );
}

// Экспорт для обратной совместимости
export const UNIVERSAL_USER_AVATAR = '';
export { ADMIN_AVATAR };
