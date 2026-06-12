// WEST - Neon Transit: Carriers Page (Shipper view)
// Design: Cyberpunk terminal - carrier list with search, filters, ratings
// Features: Search, transport filter, LRS score, invite to order

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Truck, Ship, Train, Star, Award, Clock, Leaf, Send, Filter } from 'lucide-react';
import { backend, type BackendDriver } from '@/lib/backend';

const TRANSPORT_ICONS = { truck: Truck, ship: Ship, train: Train };
const BADGE_COLORS = { gold: '#E0C27A', silver: '#B8B0A2', bronze: '#C8A96A' };

function mapBackendDriver(driver: BackendDriver) {
  const badge = driver.score >= 90 ? 'gold' : driver.score >= 80 ? 'silver' : driver.score >= 70 ? 'bronze' : null;
  return {
    id: Number(driver.id.replace(/\D/g, '')) || Math.abs(driver.score),
    name: driver.name,
    transport: driver.transportType === 'rail' ? 'train' : driver.transportType,
    score: driver.score,
    trips: driver.trips,
    onTime: Math.max(50, 100 - driver.delays * 2),
    eco: driver.eco,
    quality: driver.rating,
    badge,
    routes: driver.routes,
    available: driver.available,
  };
}

export default function CarriersPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [transportFilter, setTransportFilter] = useState<string[]>(['truck', 'ship', 'train']);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [invited, setInvited] = useState<number[]>([]);
  const [carriers, setCarriers] = useState<ReturnType<typeof mapBackendDriver>[]>([]);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const { items } = await backend.drivers();
        setCarriers(items.map(mapBackendDriver));
      } catch {
        setCarriers([]);
      }
    };
    void loadDrivers();
  }, []);

  const filtered = carriers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.routes.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const matchTransport = transportFilter.includes(c.transport);
    const matchAvail = !availableOnly || c.available;
    return matchSearch && matchTransport && matchAvail;
  });

  const toggleTransport = (t: string) => {
    setTransportFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleInvite = (id: number, name: string) => {
    setInvited(prev => [...prev, id]);
    toast.success(
      lang === 'ru' ? `Приглашение отправлено ${name}` :
      lang === 'kz' ? `${name} шақыру жіберілді` :
      `Invitation sent to ${name}`,
      { style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' } }
    );
  };

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
          {t('carriers.title')}
        </h1>
        <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
          {lang === 'ru' ? 'Найдите надёжного перевозчика с высоким LRS' : lang === 'kz' ? 'Жоғары LRS-пен сенімді тасымалдаушы табыңыз' : 'Find a reliable carrier with high LRS'}
        </p>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
            style={{
              background: isDark ? '#111A2E' : '#fff',
              border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
            }}
          >
            <Search size={15} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск по имени или маршруту...' : lang === 'kz' ? 'Аты немесе маршрут бойынша іздеу...' : 'Search by name or route...'}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}
            />
          </div>

          {/* Transport filters */}
          <div className="flex gap-2">
            {[
              { key: 'truck', icon: Truck, label: { ru: 'Авто', kz: 'Авто', en: 'Truck' } },
              { key: 'ship', icon: Ship, label: { ru: 'Судно', kz: 'Кеме', en: 'Ship' } },
              { key: 'train', icon: Train, label: { ru: 'Ж/Д', kz: 'Теміржол', en: 'Train' } },
            ].map(tr => {
              const Icon = tr.icon;
              const active = transportFilter.includes(tr.key);
              return (
                <button
                  key={tr.key}
                  onClick={() => toggleTransport(tr.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? 'rgba(200,169,106,0.15)' : isDark ? '#111A2E' : '#fff',
                    border: active ? '1px solid rgba(200,169,106,0.4)' : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                    color: active ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tr.label[lang]}</span>
                </button>
              );
            })}
          </div>

          {/* Available only */}
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: availableOnly ? 'rgba(79,191,159,0.12)' : isDark ? '#111A2E' : '#fff',
              border: availableOnly ? '1px solid rgba(79,191,159,0.35)' : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
              color: availableOnly ? '#4FBF9F' : isDark ? '#B8B0A2' : '#5C6B7A',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            <Filter size={14} />
            {lang === 'ru' ? 'Свободны' : lang === 'kz' ? 'Бос' : 'Available'}
          </button>
        </div>

        {/* Results count */}
        <div className="mb-3 text-xs" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'JetBrains Mono', monospace" }}>
          {lang === 'ru' ? `${filtered.length} перевозчиков` : lang === 'kz' ? `${filtered.length} тасымалдаушы` : `${filtered.length} carriers`}
        </div>

        {/* Carrier grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
          {!filtered.length && (
            <div
              className="rounded-2xl border p-5 text-sm"
              style={{
                borderColor: isDark ? 'rgba(34,49,79,0.7)' : 'rgba(47,74,109,0.12)',
                color: isDark ? '#B8B0A2' : '#5C6B7A',
              }}
            >
              {lang === 'ru'
                ? 'Перевозчики загружаются из backend...'
                : lang === 'kz'
                  ? 'Тасымалдаушылар backend-тен жүктеліп жатыр...'
                  : 'Carriers are loading from backend...'}
            </div>
          )}
          {filtered.map((carrier, i) => {
            const TransportIcon = TRANSPORT_ICONS[carrier.transport as keyof typeof TRANSPORT_ICONS];
            const isInvited = invited.includes(carrier.id);
            const scoreColor = carrier.score >= 85 ? '#4FBF9F' : carrier.score >= 70 ? '#E0C27A' : '#E05A5A';

            return (
              <motion.div
                key={carrier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="p-4 rounded-2xl transition-all"
                style={{
                  background: isDark ? '#111A2E' : '#fff',
                  border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                  opacity: carrier.available ? 1 : 0.65,
                }}
                onMouseEnter={e => {
                  if (carrier.available) {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(200,169,106,0.3)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(200,169,106,0.1)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                    style={{
                      background: `linear-gradient(135deg, rgba(200,169,106,0.2), rgba(111,163,255,0.2))`,
                      border: '1px solid rgba(200,169,106,0.25)',
                      color: '#C8A96A',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {carrier.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                        {carrier.name}
                      </span>
                      {carrier.badge && (
                        <Award size={13} style={{ color: BADGE_COLORS[carrier.badge as keyof typeof BADGE_COLORS] }} />
                      )}
                      <div
                        className="ml-auto px-2 py-0.5 rounded text-xs"
                        style={{
                          background: carrier.available ? 'rgba(79,191,159,0.12)' : isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
                          color: carrier.available ? '#4FBF9F' : isDark ? '#B8B0A2' : '#5C6B7A',
                          fontFamily: "'JetBrains Mono', monospace",
                          border: carrier.available ? '1px solid rgba(79,191,159,0.3)' : isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(92,107,122,0.15)',
                        }}
                      >
                        {carrier.available
                          ? (lang === 'ru' ? 'Свободен' : lang === 'kz' ? 'Бос' : 'Available')
                          : (lang === 'ru' ? 'Занят' : lang === 'kz' ? 'Бос емес' : 'Busy')}
                      </div>
                    </div>

                    {/* Transport + routes */}
                    <div className="flex items-center gap-2 mb-2">
                      <TransportIcon size={12} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }} />
                      <span style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                        {carrier.routes.join(' · ')}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: `${scoreColor}12`, border: `1px solid ${scoreColor}25` }}
                      >
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: scoreColor }}>
                          {carrier.score}
                        </span>
                        <span style={{ fontSize: '9px', color: scoreColor }}>LRS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={11} style={{ color: '#4FBF9F' }} />
                        <span style={{ fontSize: '11px', color: '#4FBF9F', fontFamily: "'JetBrains Mono', monospace" }}>{carrier.onTime}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Leaf size={11} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }} />
                        <span style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'JetBrains Mono', monospace" }}>{carrier.eco}%</span>
                      </div>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} size={10} fill={si < Math.floor(carrier.quality) ? '#C8A96A' : 'none'}
                            style={{ color: si < Math.floor(carrier.quality) ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.3)' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invite button */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => !isInvited && carrier.available && handleInvite(carrier.id, carrier.name)}
                    disabled={isInvited || !carrier.available}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: isInvited ? 'rgba(79,191,159,0.12)' : carrier.available ? 'rgba(200,169,106,0.15)' : isDark ? 'rgba(34,49,79,0.3)' : 'rgba(92,107,122,0.06)',
                      border: isInvited ? '1px solid rgba(79,191,159,0.3)' : carrier.available ? '1px solid rgba(200,169,106,0.35)' : isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(92,107,122,0.12)',
                      color: isInvited ? '#4FBF9F' : carrier.available ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.4)' : 'rgba(92,107,122,0.4)',
                      cursor: isInvited || !carrier.available ? 'default' : 'pointer',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <Send size={12} />
                    {isInvited
                      ? (lang === 'ru' ? 'Приглашён' : lang === 'kz' ? 'Шақырылды' : 'Invited')
                      : (lang === 'ru' ? 'Пригласить' : lang === 'kz' ? 'Шақыру' : 'Invite')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

