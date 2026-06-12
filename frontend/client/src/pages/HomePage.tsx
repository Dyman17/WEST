// WEST — Neon Transit: Home Page
// Design: Cyberpunk Terminal — Hero section with neon map background
// Full-width hero, quick access cards, economic impact stats

import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion } from 'framer-motion';
import {
  Map, Layers, BarChart3, Plus, Anchor, ArrowLeftRight,
  GraduationCap, TrendingUp, Clock, Fuel, Star, ChevronRight, Zap
} from 'lucide-react';

const HERO_BG = '/manus-storage/west-hero-map_496ecb3e.png';

const quickLinks = [
  {
    path: '/auth?tab=login',
    icon: Map,
    titleKey: 'nav.map',
    desc: { ru: 'Карта загруженности портов и КПП в реальном времени', kz: 'Порттар мен КБП жүктемесінің нақты уақыт картасы', en: 'Real-time port and checkpoint congestion map' },
    color: '#C8A96A',
  },
  {
    path: '/auth?tab=login',
    icon: Layers,
    titleKey: 'nav.tinder',
    desc: { ru: 'Найди груз за 5 секунд — свайп как в Tinder', kz: '5 секундта жүк тап — Tinder сияқты свайп', en: 'Find cargo in 5 seconds — swipe like Tinder' },
    color: '#6FA3FF',
  },
  {
    path: '/auth?tab=login',
    icon: Anchor,
    titleKey: 'nav.booking',
    desc: { ru: 'Забронируй слот в порту как столик в ресторане', kz: 'Порт слотын мейрамхана столы сияқты брондаңыз', en: 'Book a port slot like a restaurant reservation' },
    color: '#4FBF9F',
  },
  {
    path: '/auth?tab=login',
    icon: Plus,
    titleKey: 'nav.create_order',
    desc: { ru: 'Создай заявку и выбери перевозчика с рейтингом', kz: 'Өтінім жасаңыз және рейтингі бар тасымалдаушы таңдаңыз', en: 'Create an order and choose a rated carrier' },
    color: '#E05A5A',
  },
  {
    path: '/auth?tab=login',
    icon: BarChart3,
    titleKey: 'nav.dashboard',
    desc: { ru: 'Статистика транзита для акимата области', kz: 'Облыс әкімдігі үшін транзит статистикасы', en: 'Transit statistics for regional administration' },
    color: '#E0C27A',
  },
  {
    path: '/auth?tab=login',
    icon: GraduationCap,
    titleKey: 'nav.onboarding',
    desc: { ru: 'Видеоуроки для начинающих перевозчиков', kz: 'Жаңадан бастаған тасымалдаушыларға бейне сабақтар', en: 'Video tutorials for new carriers' },
    color: '#C8A96A',
  },
];

const stats = [
  { icon: Clock, value: '5 мин', label: { ru: 'Поиск груза', kz: 'Жүк іздеу', en: 'Cargo search' }, was: { ru: '2–3 часа', kz: '2–3 сағат', en: '2–3 hours' }, color: '#C8A96A' },
  { icon: Anchor, value: '1 ч', label: { ru: 'Простой в порту', kz: 'Порттағы тоқтау', en: 'Port wait time' }, was: { ru: '4 часа', kz: '4 сағат', en: '4 hours' }, color: '#4FBF9F' },
  { icon: Fuel, value: '10%', label: { ru: 'Пустые рейсы', kz: 'Бос рейстер', en: 'Empty trips' }, was: { ru: '40%', kz: '40%', en: '40%' }, color: '#6FA3FF' },
  { icon: TrendingUp, value: '500K ₸', label: { ru: 'Доход в месяц', kz: 'Ай сайынғы табыс', en: 'Monthly income' }, was: { ru: '300K ₸', kz: '300K ₸', en: '300K ₸' }, color: '#E0C27A' },
];

export default function HomePage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(11,18,32,0.88) 0%, rgba(11,18,32,0.6) 50%, rgba(11,18,32,0.85) 100%)'
              : 'linear-gradient(135deg, rgba(240,233,221,0.88) 0%, rgba(240,233,221,0.6) 50%, rgba(240,233,221,0.85) 100%)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-center px-8 py-16" style={{ minHeight: '420px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="badge-neon badge-pink text-xs"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                MVP v1.0
              </span>
              <span
                className="badge-neon badge-teal text-xs"
              >
                Мангистауская область
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold mb-3"
              style={{
                fontFamily: "'Manrope', sans-serif",
                color: isDark ? '#E6E1D6' : '#1E2A3A',
                lineHeight: 1.15,
              }}
            >
              {lang === 'ru' && <>Цифровой двойник<br /><span style={{ color: '#C8A96A', textShadow: 'none' }}>логистики Мангистау</span></>}
              {lang === 'kz' && <>Маңғыстау<br /><span style={{ color: '#C8A96A', textShadow: 'none' }}>логистикасының цифрлық егізі</span></>}
              {lang === 'en' && <>Mangystau Logistics<br /><span style={{ color: '#C8A96A', textShadow: 'none' }}>Digital Twin</span></>}
            </h1>

            <p
              className="text-base max-w-xl mb-6"
              style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}
            >
              {lang === 'ru' && 'Перевозчик видит пробки заранее, находит груз за 5 секунд, бронирует порт как столик в ресторане и никогда не возвращается пустым.'}
              {lang === 'kz' && 'Тасымалдаушы кептелісті алдын ала көреді, 5 секундта жүк табады, портты мейрамхана столы сияқты брондайды және ешқашан бос оралмайды.'}
              {lang === 'en' && 'Carriers see congestion ahead, find cargo in 5 seconds, book port slots like restaurant reservations, and never return empty.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/auth?tab=login">
                <button className="btn-neon px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                  <Map size={16} />
                  {lang === 'ru' ? 'Войти' : lang === 'kz' ? 'Кіру' : 'Login'}
                </button>
              </Link>
              <Link href="/auth?tab=register">
                <button
                  className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-medium transition-all"
                  style={{
                    background: isDark ? 'rgba(34,49,79,0.6)' : 'rgba(255,255,255,0.8)',
                    border: isDark ? '1px solid rgba(200,169,106,0.3)' : '1px solid rgba(47,74,109,0.3)',
                    color: isDark ? '#E6E1D6' : '#1E2A3A',
                    fontFamily: "'Manrope', sans-serif",
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Layers size={16} />
                  {lang === 'ru' ? 'Регистрация' : lang === 'kz' ? 'Тіркелу' : 'Register'}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── ECONOMIC STATS ── */}
      <div
        className="px-6 py-6"
        style={{
          background: isDark ? 'rgba(17,26,46,0.8)' : 'rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)',
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: isDark ? 'rgba(11,18,32,0.6)' : 'rgba(240,233,221,0.8)',
                  border: `1px solid ${stat.color}22`,
                }}
              >
                <div
                  className="p-2 rounded-md flex-shrink-0"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div
                    className="text-xl font-bold"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: stat.color,
                      textShadow: 'none',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                    {stat.label[lang]}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(184,176,162,0.5)' : 'rgba(92,107,122,0.5)' }}>
                    {lang === 'ru' ? 'Было: ' : lang === 'kz' ? 'Бұрын: ' : 'Was: '}{stat.was[lang]}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── QUICK LINKS GRID ── */}
      <div className="p-6">
        <div className="mb-5">
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}
          >
            {lang === 'ru' ? 'Все модули платформы' : lang === 'kz' ? 'Платформаның барлық модульдері' : 'All Platform Modules'}
          </h2>
          <p className="text-sm" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
            {lang === 'ru' ? 'Выберите раздел для работы' : lang === 'kz' ? 'Жұмыс бөлімін таңдаңыз' : 'Select a section to work with'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
          {quickLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <Link href={link.path}>
                  <div
                    className="group p-4 rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: isDark ? '#111A2E' : '#fff',
                      border: `1px solid ${isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.12)'}`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.border = `1px solid ${link.color}40`;
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.border = `1px solid ${isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.12)'}`;
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ background: `${link.color}15`, color: link.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ color: isDark ? 'rgba(184,176,162,0.4)' : 'rgba(92,107,122,0.4)', marginTop: '4px' }}
                      />
                    </div>
                    <h3
                      className="font-semibold text-sm mb-1"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: isDark ? '#E6E1D6' : '#1E2A3A',
                      }}
                    >
                      {t(link.titleKey)}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }}
                    >
                      {link.desc[lang]}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-xl max-w-5xl"
          style={{
            background: isDark ? 'rgba(200,169,106,0.06)' : 'rgba(47,74,109,0.04)',
            border: '1px solid rgba(200,169,106,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <Zap size={18} style={{ color: '#C8A96A', flexShrink: 0, marginTop: '2px' }} />
            <p
              className="text-sm italic"
              style={{
                color: isDark ? '#B8B0A2' : '#5C6B7A',
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {lang === 'ru' && '«WEST — это не просто карта и заявки. Это экосистема, где перевозчик видит пробки заранее, находит груз за 5 секунд в Tinder, бронирует порт как столик в ресторане и никогда не возвращается пустым.»'}
              {lang === 'kz' && '«WEST — бұл жай ғана карта мен өтінімдер емес. Бұл тасымалдаушы кептелісті алдын ала көретін, Tinder-де 5 секундта жүк табатын, портты мейрамхана столы сияқты брондайтын және ешқашан бос оралмайтын экожүйе.»'}
              {lang === 'en' && '"WEST is not just a map and orders. It\'s an ecosystem where carriers see congestion ahead, find cargo in 5 seconds on Tinder, book port slots like restaurant tables, and never return empty."'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
