import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Shield, MessageCircle, Star, ArrowRight,
  Zap, Users, TrendingUp, Code2
} from 'lucide-react';
import StarRating from '../components/ui/StarRating';

const LandingPage: React.FC = () => {

  const features = [
    {
      icon: <Zap className="text-amber-500" size={28} />,
      title: 'Быстрый поиск',
      desc: 'Найдите подходящего специалиста за считанные минуты с помощью умных фильтров',
      bg: 'bg-amber-50',
    },
    {
      icon: <Shield className="text-emerald-500" size={28} />,
      title: 'Безопасные платежи',
      desc: 'Средства хранятся в эскроу и выплачиваются только после принятия работы',
      bg: 'bg-emerald-50',
    },
    {
      icon: <Star className="text-violet-500" size={28} />,
      title: 'Рейтинг исполнителей',
      desc: 'Объективные отзывы и рейтинги помогут выбрать проверенного профессионала',
      bg: 'bg-violet-50',
    },
    {
      icon: <MessageCircle className="text-sky-500" size={28} />,
      title: 'Встроенный чат',
      desc: 'Общайтесь напрямую, обменивайтесь файлами и согласовывайте детали',
      bg: 'bg-sky-50',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Зарегистрируйтесь',
      desc: 'Создайте аккаунт клиента или фрилансера за 1 минуту',
      icon: <Users size={24} />,
    },
    {
      num: '02',
      title: 'Создайте заказ',
      desc: 'Опишите задачу, установите бюджет и сроки, выберите навыки',
      icon: <Search size={24} />,
    },
    {
      num: '03',
      title: 'Получите результат',
      desc: 'Работайте с лучшим специалистом и оплачивайте после приёмки',
      icon: <TrendingUp size={24} />,
    },
  ];

  const stats = [
    { value: '12 000+', label: 'Фрилансеров' },
    { value: '8 500+', label: 'Выполненных заказов' },
    { value: '4.9', label: 'Средняя оценка' },
    { value: '98%', label: 'Довольных клиентов' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium mb-8 border border-white/20">
            {/*<Zap size={14} className="text-amber-400" />*/}
            Новая эра IT-фриланса в России
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Найди IT-специалиста
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              или заказ за минуты
            </span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            MaxDev объединяет лучших разработчиков, дизайнеров и DevOps-инженеров с заказчиками со всей России
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-2xl shadow-violet-900/50 text-lg"
            >
              Начать бесплатно
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/freelancers"
              className="flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg"
            >
              Смотреть исполнителей
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-white/60 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Почему выбирают MaxDev?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Мы создали платформу, которая делает работу комфортной как для заказчиков, так и для исполнителей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-violet-200 transition-all duration-200">
                {/*}
                <div className={`w-14 h-14 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* How it works */}
      <section className="py-24 bg-gradient-to-br from-violet-950 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">Как это работает?</h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Три простых шага до результата
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-white/20 -translate-x-8 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <span className="text-white">{step.icon}</span>
                  </div>
                  <div className="text-5xl font-extrabold text-white/10 mb-2">{step.num}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/60">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-2xl text-lg"
            >
              Начать прямо сейчас
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Отзывы клиентов</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Алексей П.', role: 'CEO стартапа', text: 'Нашёл разработчика за 2 часа. Результат превзошёл все ожидания!', rating: 5 },
              { name: 'Марина К.', role: 'Маркетолог', text: 'Отличная платформа! Очень удобный чат и прозрачная система оплаты.', rating: 5 },
              { name: 'Сергей В.', role: 'Product Manager', text: 'Использую MaxDev уже полгода. Это лучший способ найти IT-специалистов.', rating: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <StarRating rating={t.rating} className="mb-4" />
                <p className="text-slate-600 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-12 shadow-2xl shadow-violet-200">
            {/*
            <Code2 className="mx-auto mb-6 text-white/80" size={48} />
            */}
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Присоединяйтесь к тысячам довольных клиентов и фрилансеров на платформе MaxDev
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register?role=client"
                className="flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-lg text-lg w-full sm:w-auto justify-center"
              >
                {/*<Search size={20} />*/}
                Я заказчик
              </Link>
              <Link
                to="/register?role=freelancer"
                className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg w-full sm:w-auto justify-center"
              >
                {/*<Code2 size={20} />*/}
                Я фрилансер
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/*
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Code2 size={16} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">MaxDev</span>
            </div>
            */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">О платформе</a>
              <a href="#" className="hover:text-white transition-colors">Условия использования</a>
              <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-white transition-colors">Контакты</a>
            </div>

            <div className="flex items-center gap-3">
              {['T', 'VK', 'TG'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold">
                  {s}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-600">
            © 2025 MaxDev. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
