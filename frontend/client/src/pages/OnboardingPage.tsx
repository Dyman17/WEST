// WEST — Neon Transit: Onboarding / Tutorial Page
// Design: Cyberpunk Terminal — Interactive step-by-step tutorial
// Features: Role selection, feature tour, animated steps, completion

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Truck, Ship, BarChart3, Map, Layers, Star, Anchor, ArrowLeftRight,
  ChevronRight, ChevronLeft, CheckCircle, Zap, Play, X
} from 'lucide-react';

const ROLES = [
  {
    key: 'carrier',
    icon: Truck,
    label: { ru: 'Перевозчик', kz: 'Тасымалдаушы', en: 'Carrier' },
    desc: { ru: 'Ищу грузы, управляю рейсами', kz: 'Жүк іздеймін, рейстерді басқарамын', en: 'Find cargo, manage trips' },
    color: '#C8A96A',
  },
  {
    key: 'shipper',
    icon: Ship,
    label: { ru: 'Грузоотправитель', kz: 'Жүк жіберуші', en: 'Shipper' },
    desc: { ru: 'Отправляю грузы, ищу перевозчиков', kz: 'Жүк жіберемін, тасымалдаушы іздеймін', en: 'Send cargo, find carriers' },
    color: '#6FA3FF',
  },
  {
    key: 'akim',
    icon: BarChart3,
    label: { ru: 'Аким / Регулятор', kz: 'Әкім / Реттеуші', en: 'Akim / Regulator' },
    desc: { ru: 'Мониторинг транзита региона', kz: 'Аймақтың транзитін бақылау', en: 'Monitor regional transit' },
    color: '#4FBF9F',
  },
];

const FEATURES = [
  {
    icon: Map,
    title: { ru: 'Цифровой двойник', kz: 'Цифрлық егіз', en: 'Digital Twin' },
    desc: { ru: 'Интерактивная карта с загруженностью портов и пограничных переходов в реальном времени', kz: 'Порттар мен шекара бекеттерінің жүктемесі бар интерактивті карта', en: 'Interactive map with real-time port and checkpoint congestion' },
    color: '#C8A96A',
    route: '/map',
  },
  {
    icon: Layers,
    title: { ru: 'Freight Tinder', kz: 'Freight Tinder', en: 'Freight Tinder' },
    desc: { ru: 'Свайпай карточки грузов — принимай или отклоняй рейсы одним движением', kz: 'Жүк карточкаларын сырғытыңыз — рейстерді бір қозғалыспен қабылдаңыз немесе бас тартыңыз', en: 'Swipe cargo cards — accept or reject trips with one gesture' },
    color: '#6FA3FF',
    route: '/tinder',
  },
  {
    icon: Star,
    title: { ru: 'Рейтинг LRS', kz: 'LRS рейтингі', en: 'LRS Rating' },
    desc: { ru: 'Логистический рейтинг доверия — прозрачная оценка каждого перевозчика', kz: 'Логистикалық сенім рейтингі — әр тасымалдаушының мөлдір бағасы', en: 'Logistics Reliability Score — transparent rating for every carrier' },
    color: '#E0C27A',
    route: '/rating',
  },
  {
    icon: Anchor,
    title: { ru: 'Бронирование порта', kz: 'Порт брондау', en: 'Port Booking' },
    desc: { ru: 'Бронируй слоты в портах как столик в ресторане — без очередей', kz: 'Порттарда слоттарды мейрамхана столы сияқты брондаңыз — кезексіз', en: 'Book port slots like a restaurant reservation — no queues' },
    color: '#4FBF9F',
    route: '/booking',
  },
  {
    icon: ArrowLeftRight,
    title: { ru: 'Обратная загрузка', kz: 'Кері жүктеу', en: 'Backhaul' },
    desc: { ru: 'Никогда не возвращайся пустым — AI подбирает обратный груз автоматически', kz: 'Ешқашан бос оралма — AI кері жүкті автоматты түрде іріктейді', en: 'Never return empty — AI automatically finds backhaul cargo' },
    color: '#C8A96A',
    route: '/backhaul',
  },
  {
    icon: BarChart3,
    title: { ru: 'Дашборд акима', kz: 'Әкім дашборды', en: 'Akim Dashboard' },
    desc: { ru: 'Статистика транзита региона, загруженность портов, CO₂ экономия', kz: 'Аймақтың транзит статистикасы, порттардың жүктемесі, CO₂ үнемдеу', en: 'Regional transit stats, port load, CO₂ savings' },
    color: '#6FA3FF',
    route: '/dashboard',
  },
];

export default function OnboardingPage() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const isDark = theme === 'dark';
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0); // 0: welcome, 1: role, 2: features, 3: done
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [featureIdx, setFeatureIdx] = useState(0);

  const handleDone = () => {
    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: isDark ? '#0B1220' : '#F5F0E6' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(200,169,106,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,106,0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(47,74,109,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(47,74,109,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(200,169,106,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(111,163,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="text-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(200,169,106,0.12)', border: '1px solid rgba(200,169,106,0.3)' }}
              >
                <Zap size={14} style={{ color: '#C8A96A' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#C8A96A' }}>
                  {lang === 'ru' ? 'Добро пожаловать' : lang === 'kz' ? 'Қош келдіңіз' : 'Welcome'}
                </span>
              </div>

              <h1
                className="text-5xl font-black mb-3"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  background: 'linear-gradient(135deg, #C8A96A, #6FA3FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                WEST
              </h1>
              <div
                className="text-xl font-semibold mb-4"
                style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}
              >
                {lang === 'ru' ? 'Цифровой транзит Мангистау' : lang === 'kz' ? 'Маңғыстаудың цифрлық транзиті' : 'Mangystau Digital Transit'}
              </div>
              <p
                className="text-base mb-8 max-w-md mx-auto"
                style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}
              >
                {lang === 'ru'
                  ? 'Платформа для перевозчиков, грузоотправителей и акиматов. Цифровой двойник портов, AI-подбор грузов и прозрачный рейтинг.'
                  : lang === 'kz'
                  ? 'Тасымалдаушылар, жүк жіберушілер және акиматтар үшін платформа. Порттардың цифрлық егізі, AI жүк іріктеу және мөлдір рейтинг.'
                  : 'Platform for carriers, shippers, and akimats. Digital twin of ports, AI cargo matching, and transparent ratings.'}
              </p>

              <button
                onClick={() => setStep(1)}
                className="btn-neon inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <Play size={18} />
                {lang === 'ru' ? 'Начать' : lang === 'kz' ? 'Бастау' : 'Get Started'}
              </button>
            </motion.div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {lang === 'ru' ? 'Кто вы?' : lang === 'kz' ? 'Сіз кімсіз?' : 'Who are you?'}
              </h2>
              <p className="text-center mb-6" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                {lang === 'ru' ? 'Выберите роль для персонализированного опыта' : lang === 'kz' ? 'Жекелендірілген тәжірибе үшін рөл таңдаңыз' : 'Select your role for a personalized experience'}
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {ROLES.map((role, i) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.key;
                  return (
                    <motion.button
                      key={role.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      onClick={() => setSelectedRole(role.key)}
                      className="p-4 rounded-2xl text-left transition-all flex items-center gap-4"
                      style={{
                        background: isSelected ? `${role.color}12` : isDark ? '#111A2E' : '#fff',
                        border: isSelected ? `1px solid ${role.color}40` : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                        boxShadow: isSelected ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${role.color}15`, border: `1px solid ${role.color}30` }}
                      >
                        <Icon size={22} style={{ color: role.color }} />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                          {role.label[lang]}
                        </div>
                        <div style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                          {role.desc[lang]}
                        </div>
                      </div>
                      {isSelected && <CheckCircle size={20} style={{ color: role.color, flexShrink: 0 }} />}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Manrope', sans-serif" }}
                >
                  <ChevronLeft size={16} />
                  {lang === 'ru' ? 'Назад' : lang === 'kz' ? 'Артқа' : 'Back'}
                </button>
                <button
                  onClick={() => selectedRole && setStep(2)}
                  className="btn-neon flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ fontFamily: "'Manrope', sans-serif", opacity: selectedRole ? 1 : 0.5, cursor: selectedRole ? 'pointer' : 'not-allowed' }}
                >
                  {lang === 'ru' ? 'Далее' : lang === 'kz' ? 'Келесі' : 'Next'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Feature tour */}
          {step === 2 && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {lang === 'ru' ? 'Возможности WEST' : lang === 'kz' ? 'WEST мүмкіндіктері' : 'WEST Features'}
              </h2>
              <p className="text-center mb-6" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                {featureIdx + 1} / {FEATURES.length}
              </p>

              {/* Feature card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={featureIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="p-6 rounded-2xl mb-4"
                  style={{
                    background: isDark ? '#111A2E' : '#fff',
                    border: `1px solid ${FEATURES[featureIdx].color}30`,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${FEATURES[featureIdx].color}15`, border: `1px solid ${FEATURES[featureIdx].color}30` }}
                  >
                    {(() => { const Icon = FEATURES[featureIdx].icon; return <Icon size={28} style={{ color: FEATURES[featureIdx].color }} />; })()}
                  </div>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '20px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '8px' }}>
                    {FEATURES[featureIdx].title[lang]}
                  </h3>
                  <p style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                    {FEATURES[featureIdx].desc[lang]}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mb-5">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeatureIdx(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === featureIdx ? '20px' : '6px',
                      height: '6px',
                      background: i === featureIdx ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.2)',
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => featureIdx > 0 ? setFeatureIdx(f => f - 1) : setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Manrope', sans-serif" }}
                >
                  <ChevronLeft size={16} />
                  {lang === 'ru' ? 'Назад' : lang === 'kz' ? 'Артқа' : 'Back'}
                </button>
                {featureIdx < FEATURES.length - 1 ? (
                  <button
                    onClick={() => setFeatureIdx(f => f + 1)}
                    className="btn-neon flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {lang === 'ru' ? 'Далее' : lang === 'kz' ? 'Келесі' : 'Next'}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(3)}
                    className="btn-neon flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    <CheckCircle size={16} />
                    {lang === 'ru' ? 'Готово' : lang === 'kz' ? 'Дайын' : 'Done'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="text-center"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(79,191,159,0.12)', border: '2px solid rgba(79,191,159,0.4)' }}
              >
                <CheckCircle size={48} style={{ color: '#4FBF9F', filter: 'none' }} />
              </div>
              <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {lang === 'ru' ? 'Всё готово!' : lang === 'kz' ? 'Бәрі дайын!' : 'All Set!'}
              </h2>
              <p className="mb-8 max-w-sm mx-auto" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                {lang === 'ru'
                  ? 'Добро пожаловать в WEST. Начните с карты или Freight Tinder.'
                  : lang === 'kz'
                  ? 'WEST-ке қош келдіңіз. Картадан немесе Freight Tinder-ден бастаңыз.'
                  : 'Welcome to WEST. Start with the map or Freight Tinder.'}
              </p>
              <button
                onClick={handleDone}
                className="btn-neon inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <Zap size={18} />
                {lang === 'ru' ? 'Войти в платформу' : lang === 'kz' ? 'Платформаға кіру' : 'Enter Platform'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        {step < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={handleDone}
              style={{ fontSize: '12px', color: isDark ? 'rgba(184,176,162,0.5)' : 'rgba(92,107,122,0.5)', fontFamily: "'Inter', sans-serif" }}
            >
              {lang === 'ru' ? 'Пропустить' : lang === 'kz' ? 'Өткізіп жіберу' : 'Skip'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
