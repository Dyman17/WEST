// WEST ? Neon Transit: Backhaul Page
// Design: Cyberpunk Terminal ? Eliminate empty return trips
// Features: Route input, backhaul matches, savings calculator, accept flow

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { backend, type BackendAiBackhaulItem } from '@/lib/backend';
import {
  ArrowLeftRight, MapPin, Package, DollarSign, Truck, Zap,
  TrendingDown, CheckCircle, ChevronRight, Fuel, Clock
} from 'lucide-react';

export default function BackhaulPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [myRoute, setMyRoute] = useState({ from: '', to: '' });
  const [searched, setSearched] = useState(false);
  const [accepted, setAccepted] = useState<number | null>(null);
  const [matches, setMatches] = useState<BackendAiBackhaulItem[]>([]);

  useEffect(() => {
    setMatches([]);
  }, [lang]);

  const handleSearch = () => {
    setSearched(true);
    void backend.aiBackhaul({
      from: myRoute.from,
      to: myRoute.to,
      capacityKg: 18000,
      language: lang,
    })
      .then((response) => {
        setMatches(response.items);
      })
      .catch(() => {
        setMatches([]);
      });
  };

  const handleAccept = (id: number) => {
    setAccepted(id);
    const match = matches.find((m) => m.id === id);
    toast.success(
      lang === 'ru' ? `Обратный груз принят! +${((match?.price || 0) / 1000).toFixed(0)}K ₸` :
      lang === 'kz' ? `Кері жүк қабылданды! +${((match?.price || 0) / 1000).toFixed(0)}K ₸` :
      `Backhaul accepted! +${((match?.price || 0) / 1000).toFixed(0)}K ₸`,
      { style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' } }
    );
  };

  const totalSavings = matches.reduce((sum, m) => sum + m.price, 0);

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{
          borderBottom: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.12)',
          background: isDark ? 'rgba(11,18,32,0.8)' : 'rgba(245,240,230,0.8)',
        }}
      >
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
          {t('backhaul.title')}
        </h1>
        <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
          {lang === 'ru' ? 'Никогда не возвращайся пустым — найди обратный груз' : lang === 'kz' ? 'Ешқашан бос оралма — кері жүк тап' : 'Never return empty — find a backhaul cargo'}
        </p>
      </div>

      <div className="p-6 max-w-5xl">
        {/* Stats banner */}
        <div
          className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-2xl"
          style={{
            background: isDark ? 'rgba(200,169,106,0.06)' : 'rgba(47,74,109,0.04)',
            border: '1px solid rgba(200,169,106,0.2)',
          }}
        >
          {[
            { icon: TrendingDown, value: '40%→10%', label: { ru: 'Пустые рейсы', kz: 'Бос рейстер', en: 'Empty trips' }, color: '#4FBF9F' },
            { icon: DollarSign, value: `${(totalSavings / 1000000).toFixed(1)}M в‚ё`, label: { ru: 'Доп. доход/мес', kz: 'Қосымша табыс/ай', en: 'Extra income/mo' }, color: '#C8A96A' },
            { icon: Fuel, value: '30%', label: { ru: 'Экономия топлива', kz: 'Отын үнемдеу', en: 'Fuel savings' }, color: '#6FA3FF' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: `${s.color}15`, color: s.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 600, color: s.color, textShadow: 'none' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                    {s.label[lang]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Route input */}
        <div
          className="p-4 rounded-2xl mb-6"
          style={{
            background: isDark ? '#111A2E' : '#fff',
            border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
            {lang === 'ru' ? 'Мой маршрут (откуда еду)' : lang === 'kz' ? 'Менің маршрутым (қайдан барамын)' : 'My Route (where I\'m going)'}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", display: 'block', marginBottom: '4px' }}>
                {lang === 'ru' ? 'Откуда' : lang === 'kz' ? 'Қайдан' : 'From'}
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: isDark ? '#1C2B4A' : '#F0E9DD', border: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)' }}>
                <MapPin size={14} style={{ color: '#C8A96A', flexShrink: 0 }} />
                <input
                  type="text"
                  value={myRoute.from}
                  onChange={e => setMyRoute(r => ({ ...r, from: e.target.value }))}
                  placeholder={lang === 'ru' ? 'Актау' : lang === 'kz' ? 'Ақтау' : 'Aktau'}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}
                />
              </div>
            </div>
            <ArrowLeftRight size={20} style={{ color: '#C8A96A', flexShrink: 0, marginBottom: '8px' }} />
            <div className="flex-1">
              <label style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", display: 'block', marginBottom: '4px' }}>
                {lang === 'ru' ? 'Куда' : lang === 'kz' ? 'Қайда' : 'To'}
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: isDark ? '#1C2B4A' : '#F0E9DD', border: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)' }}>
                <MapPin size={14} style={{ color: '#4FBF9F', flexShrink: 0 }} />
                <input
                  type="text"
                  value={myRoute.to}
                  onChange={e => setMyRoute(r => ({ ...r, to: e.target.value }))}
                  placeholder={lang === 'ru' ? 'Баку' : lang === 'kz' ? 'Баку' : 'Baku'}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="btn-neon px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ fontFamily: "'Manrope', sans-serif", flexShrink: 0 }}
            >
              <Zap size={15} />
              {lang === 'ru' ? 'Найти' : lang === 'kz' ? 'Іздеу' : 'Find'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === 'ru' ? 'Подходящие обратные грузы' : lang === 'kz' ? 'Сәйкес кері жүктер' : 'Matching Backhaul Cargo'}
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={12} style={{ color: '#6FA3FF' }} />
              <span style={{ fontSize: '12px', color: '#6FA3FF', fontFamily: "'JetBrains Mono', monospace" }}>
                {lang === 'ru' ? 'AI-подбор' : lang === 'kz' ? 'AI іріктеу' : 'AI-matched'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {matches.map((match, i) => {
              const isAccepted = accepted === match.id;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="p-4 rounded-2xl transition-all"
                  style={{
                    background: isAccepted
                      ? isDark ? 'rgba(79,191,159,0.08)' : 'rgba(79,191,159,0.05)'
                      : isDark ? '#111A2E' : '#fff',
                    border: isAccepted
                      ? '1px solid rgba(79,191,159,0.35)'
                      : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                    boxShadow: isAccepted ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} style={{ color: '#C8A96A' }} />
                          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                            {match.from[lang]}
                          </span>
                        </div>
                        <ChevronRight size={14} style={{ color: '#C8A96A' }} />
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} style={{ color: '#4FBF9F' }} />
                          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                            {match.to[lang]}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-3">
                        {[
                          { icon: Package, value: match.cargo[lang], color: isDark ? '#B8B0A2' : '#5C6B7A' },
                          { icon: Truck, value: `${(match.weight / 1000).toFixed(0)}т`, color: isDark ? '#B8B0A2' : '#5C6B7A' },
                          { icon: ArrowLeftRight, value: `${match.distance} ${t('common.km')}`, color: isDark ? '#B8B0A2' : '#5C6B7A' },
                          { icon: Clock, value: match.departure, color: isDark ? '#B8B0A2' : '#5C6B7A' },
                        ].map((d, di) => {
                          const Icon = d.icon;
                          return (
                            <div key={di} className="flex items-center gap-1">
                              <Icon size={12} style={{ color: d.color }} />
                              <span style={{ fontSize: '12px', color: d.color, fontFamily: "'Inter', sans-serif" }}>{d.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Match score */}
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{
                          background: match.matchScore >= 90 ? 'rgba(79,191,159,0.12)' : 'rgba(200,169,106,0.1)',
                          border: `1px solid ${match.matchScore >= 90 ? 'rgba(79,191,159,0.3)' : 'rgba(200,169,106,0.25)'}`,
                        }}
                      >
                        <Zap size={11} style={{ color: match.matchScore >= 90 ? '#4FBF9F' : '#C8A96A' }} />
                        <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: match.matchScore >= 90 ? '#4FBF9F' : '#C8A96A', fontWeight: 600 }}>
                          {match.matchScore}%
                        </span>
                      </div>

                      {/* Price */}
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 700, color: '#C8A96A', textShadow: 'none' }}>
                        {(match.price / 1000).toFixed(0)}K в‚ё
                      </div>

                      {/* Accept button */}
                      {isAccepted ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(79,191,159,0.12)', border: '1px solid rgba(79,191,159,0.3)' }}>
                          <CheckCircle size={14} style={{ color: '#4FBF9F' }} />
                          <span style={{ fontSize: '12px', color: '#4FBF9F', fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
                            {lang === 'ru' ? 'Принято' : lang === 'kz' ? 'Қабылданды' : 'Accepted'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAccept(match.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold btn-neon"
                          style={{ fontFamily: "'Manrope', sans-serif" }}
                        >
                          {t('backhaul.accept')}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

