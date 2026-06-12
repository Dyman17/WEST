// WEST - Neon Transit: Freight Tinder Page
// Design: Cyberpunk Terminal - swipeable cargo cards with Framer Motion
// Features: Card swipe (like/dislike), list view toggle, AI match badge, animated transitions

import { useCallback, useEffect, useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { backend, type BackendAiMatchResponse, type BackendFreight } from '@/lib/backend';
import {
  Heart, X, List, LayoutGrid, Zap, MapPin, Weight,
  Package, DollarSign, Clock, Star, RefreshCw, ChevronRight,
  Truck, Ship, Train
} from 'lucide-react';

const TINDER_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663750962403/RpHCNcbWw9cJjb9eFmm4hJ/west-freight-tinder-R5d3qegUfTrAUYpF7UQsyF.webp';

const CARGO_TYPES = {
  ru: ['Нефтепродукты', 'Контейнеры', 'Зерно', 'Металл', 'Химикаты', 'Оборудование', 'Автомобили', 'Стройматериалы'],
  kz: ['Мұнай өнімдері', 'Контейнерлер', 'Астық', 'Металл', 'Химикаттар', 'Жабдықтар', 'Автомобильдер', 'Құрылыс материалдары'],
  en: ['Petroleum', 'Containers', 'Grain', 'Metal', 'Chemicals', 'Equipment', 'Vehicles', 'Construction Materials'],
};
const ROUTES = [
  { from: { ru: 'Ақтау', kz: 'Ақтау', en: 'Aktau' }, to: { ru: 'Баку', kz: 'Баку', en: 'Baku' } },
  { from: { ru: 'Құрық', kz: 'Құрық', en: 'Kuryk' }, to: { ru: 'Түркменбашы', kz: 'Түркменбашы', en: 'Turkmenbashi' } },
  { from: { ru: 'Ақтау', kz: 'Ақтау', en: 'Aktau' }, to: { ru: 'Алматы', kz: 'Алматы', en: 'Almaty' } },
  { from: { ru: 'Атырау', kz: 'Атырау', en: 'Atyrau' }, to: { ru: 'Ақтау', kz: 'Ақтау', en: 'Aktau' } },
  { from: { ru: 'Ақтау', kz: 'Ақтау', en: 'Aktau' }, to: { ru: 'Астана', kz: 'Астана', en: 'Astana' } },
  { from: { ru: 'Құрық', kz: 'Құрық', en: 'Kuryk' }, to: { ru: 'Баку', kz: 'Баку', en: 'Baku' } },
];

const TRANSPORT_ICONS = { truck: Truck, ship: Ship, train: Train };

function freightToCard(freight: BackendFreight, index: number, lang: 'ru' | 'kz' | 'en') {
  const route = {
    from: { ru: freight.from, kz: freight.from, en: freight.from },
    to: { ru: freight.to, kz: freight.to, en: freight.to },
  };

  return {
    id: freight.id,
    displayId: index + 1,
    route,
    cargoType: freight.type,
    weight: freight.weight * 1000,
    price: freight.price,
    distance: freight.distance,
    rating: freight.rating,
    transport: (freight.transportType === 'ship' ? 'ship' : freight.transportType === 'rail' ? 'train' : 'truck') as 'truck' | 'ship' | 'train',
    isAiMatch: Boolean(freight.match && freight.match.score >= 80),
    departure: freight.deadline.slice(11, 16) || '10:00',
  };
}

function SwipeCard({
  card,
  isTop,
  onSwipe,
  isDark,
  lang,
  t,
}: {
  card: ReturnType<typeof freightToCard>;
  isTop: boolean;
  onSwipe: (dir: 'left' | 'right') => void;
  isDark: boolean;
  lang: 'ru' | 'kz' | 'en';
  t: (k: string) => string;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0]);

  const TransportIcon = TRANSPORT_ICONS[card.transport];

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, position: 'absolute', width: '100%', maxWidth: '380px' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
      className="freight-card"
    >
      {/* Like / Nope overlays */}
      <motion.div
        style={{ opacity: likeOpacity, borderColor: '#4FBF9F', background: 'rgba(79,191,159,0.15)' }}
        className="absolute top-6 left-6 z-10 px-3 py-1 rounded-lg border-2 rotate-[-12deg]"
      >
        <span style={{ color: '#4FBF9F', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: '18px', letterSpacing: '2px' }}>TAKE</span>
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity, borderColor: '#E05A5A', background: 'rgba(224,90,90,0.15)' }}
        className="absolute top-6 right-6 z-10 px-3 py-1 rounded-lg border-2 rotate-[12deg]"
      >
        <span style={{ color: '#E05A5A', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: '18px', letterSpacing: '2px' }}>NOPE</span>
      </motion.div>

      {/* Card header */}
      <div
        className="relative h-40 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(200,169,106,0.15), rgba(111,163,255,0.15))`,
          borderBottom: isDark ? '1px solid rgba(200,169,106,0.2)' : '1px solid rgba(47,74,109,0.15)',
        }}
      >
        {/* Transport icon large */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0.12 }}
        >
          <TransportIcon size={120} style={{ color: '#C8A96A' }} />
        </div>

        {/* AI badge */}
        {card.isAiMatch && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{
              background: 'rgba(111,163,255,0.2)',
              border: '1px solid rgba(111,163,255,0.4)',
              color: '#6FA3FF',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Zap size={11} />
            {t('tinder.ai_match')}
          </div>
        )}

        {/* Transport type */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
          style={{
            background: isDark ? 'rgba(17,26,46,0.8)' : 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(200,169,106,0.25)',
            color: '#C8A96A',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <TransportIcon size={11} />
          <span className="capitalize">{card.transport}</span>
        </div>

        {/* Route display */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '20px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {card.route.from[lang]}
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{t('tinder.route')}</div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #C8A96A, #6FA3FF)' }} />
              <ChevronRight size={16} style={{ color: '#C8A96A', flexShrink: 0 }} />
            </div>
            <div className="text-right">
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '20px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {card.route.to[lang]}
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{card.distance} {t('common.km')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.floor(card.rating) ? '#C8A96A' : 'none'}
                style={{
                  color: i < Math.floor(card.rating) ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.3)',
                  filter: 'none',
                }}
              />
            ))}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#C8A96A', marginLeft: '4px' }}>
              {card.rating}
            </span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
            #{String(card.displayId).padStart(4, '0')}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { icon: Package, label: t('tinder.type'), value: card.cargoType },
            { icon: Weight, label: t('tinder.weight'), value: `${(card.weight / 1000).toFixed(1)} ?` },
            { icon: DollarSign, label: t('tinder.price'), value: `${(card.price / 1000).toFixed(0)}K ?` },
            { icon: Clock, label: t('tinder.departure'), value: card.departure },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: isDark ? 'rgba(17,26,46,0.6)' : 'rgba(240,233,221,0.6)',
                  border: isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(47,74,109,0.08)',
                }}
              >
                <Icon size={13} style={{ color: '#C8A96A', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '10px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{item.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ListCard({
  card,
  onAccept,
  isDark,
  lang,
  t,
}: {
  card: ReturnType<typeof freightToCard>;
  onAccept: () => void;
  isDark: boolean;
  lang: 'ru' | 'kz' | 'en';
  t: (k: string) => string;
}) {
  const TransportIcon = TRANSPORT_ICONS[card.transport];
  return (
    <div
      className="p-3 rounded-xl transition-all"
      style={{
        background: isDark ? '#111A2E' : '#fff',
        border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(200,169,106,0.3)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(200,169,106,0.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border = isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(200,169,106,0.1)', color: '#C8A96A' }}
        >
          <TransportIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '13px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
              {card.route.from[lang]} → {card.route.to[lang]}
            </span>
            {card.isAiMatch && (
              <span style={{ color: '#6FA3FF', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
                AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
            <span>{card.cargoType}</span>
            <span>·</span>
            <span>{(card.weight / 1000).toFixed(1)} т</span>
            <span>·</span>
            <span>{card.distance} {t('common.km')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '14px', color: '#C8A96A' }}>
              {(card.price / 1000).toFixed(0)}K ₸
            </div>
            <div className="flex items-center gap-0.5 justify-end">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} fill={i < Math.floor(card.rating) ? '#C8A96A' : 'none'} style={{ color: i < Math.floor(card.rating) ? '#C8A96A' : 'rgba(184,176,162,0.3)' }} />
              ))}
            </div>
          </div>
          <button
            onClick={onAccept}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-neon"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {t('tinder.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TinderPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [cards, setCards] = useState<ReturnType<typeof freightToCard>[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [aiMatch, setAiMatch] = useState<BackendAiMatchResponse | null>(null);

  const topCard = cards[cards.length - 1];

  const loadCards = useCallback(async () => {
    try {
      const { items } = await backend.freightFeed({ limit: 8 });
      const mapped = items.map((freight, index) => freightToCard(freight, index, lang));
      setCards([...mapped].reverse());
    } catch {
      setCards([]);
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    const syncCards = async () => {
      if (cancelled) return;
      await loadCards();
    };

    void syncCards();
    const timer = window.setInterval(() => {
      void syncCards();
    }, 2000);

    const handleFocus = () => {
      void syncCards();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        void syncCards();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadCards]);

  useEffect(() => {
    let cancelled = false;

    if (!topCard) {
      setAiMatch(null);
      return undefined;
    }

    const fetchMatch = async () => {
      try {
        const response = await backend.aiMatchExplanation({
          from: topCard.route.from[lang],
          to: topCard.route.to[lang],
          cargoType: topCard.cargoType,
          weight: topCard.weight,
          price: topCard.price,
          transport: topCard.transport,
          rating: topCard.rating,
          matchScore: topCard.isAiMatch ? 94 : 78,
          language: lang,
        });

        if (!cancelled) {
          setAiMatch(response);
        }
      } catch {
        if (!cancelled) {
          setAiMatch(null);
        }
      }
    };

    void fetchMatch();

    return () => {
      cancelled = true;
    };
  }, [topCard, lang]);

  const handleSwipe = async (dir: 'left' | 'right') => {
    const currentCard = topCard;
    if (!currentCard) return;

    try {
      await backend.freightDecision(currentCard.id, dir === 'right' ? 'take' : 'skip');

      if (dir === 'right') {
        setAccepted(a => a + 1);
        toast.success(t('tinder.accepted'), {
          duration: 1800,
          style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' },
        });
      } else {
        setRejected(r => r + 1);
      }

      setCards(prev => prev.filter(card => card.id !== currentCard.id));
      await loadCards();
    } catch {
      toast.error('Failed to send the decision to the server');
    }
  };

  const handleReset = () => {
    void loadCards();
    setAccepted(0);
    setRejected(0);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.12)',
          background: isDark ? 'rgba(11,18,32,0.8)' : 'rgba(245,240,230,0.8)',
        }}
      >
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}
          >
            {t('tinder.title')}
          </h1>
          <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
            {t('tinder.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="text-center">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 600, color: '#4FBF9F' }}>{accepted}</div>
              <div style={{ fontSize: '10px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>{t('tinder.accepted').replace('!', '')}</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.15)' }} />
            <div className="text-center">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 600, color: '#E05A5A' }}>{rejected}</div>
              <div style={{ fontSize: '10px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>{t('tinder.rejected')}</div>
            </div>
          </div>

          {/* View toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(47,74,109,0.2)' }}
          >
            {[
              { mode: 'cards' as const, icon: LayoutGrid, label: t('tinder.view_cards') },
              { mode: 'list' as const, icon: List, label: t('tinder.view_list') },
            ].map(v => {
              const Icon = v.icon;
              return (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: viewMode === v.mode
                      ? 'rgba(200,169,106,0.2)'
                      : isDark ? 'rgba(17,26,46,0.5)' : 'rgba(255,255,255,0.5)',
                    color: viewMode === v.mode ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {viewMode === 'cards' ? (
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Card stack */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
              <AnimatePresence>
                {cards.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(200,169,106,0.1)', border: '2px solid rgba(200,169,106,0.3)' }}
                    >
                      <Package size={36} style={{ color: '#C8A96A' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '18px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                        {t('tinder.no_more')}
                      </p>
                      <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A', marginTop: '4px' }}>
                        {accepted} {t('tinder.accepted').replace('!', '')} ? {rejected} {t('tinder.rejected')}
                      </p>
                    </div>
                    <button onClick={handleReset} className="btn-neon px-5 py-2 rounded-lg text-sm flex items-center gap-2">
                      <RefreshCw size={15} />
                      {t('tinder.refresh')}
                    </button>
                  </motion.div>
                ) : (
                  <div className="relative" style={{ width: '100%', maxWidth: '380px', height: '480px' }}>
                    {/* Stack of cards (show up to 3) */}
                    {cards.slice(-3).map((card, i, arr) => {
                      const isTop = i === arr.length - 1;
                      const offset = (arr.length - 1 - i) * 8;
                      return (
                        <motion.div
                          key={card.id}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            top: offset,
                            scale: 1 - (arr.length - 1 - i) * 0.03,
                            zIndex: i,
                          }}
                        >
                          {isTop ? (
                            <SwipeCard
                              card={card}
                              isTop={true}
                              onSwipe={handleSwipe}
                              isDark={isDark}
                              lang={lang}
                              t={t}
                            />
                          ) : (
                            <div
                              className="freight-card"
                              style={{ height: '480px', pointerEvents: 'none' }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {cards.length > 0 && (
                <div className="flex items-center gap-6 mt-6">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isDark ? 'rgba(224,90,90,0.1)' : 'rgba(224,90,90,0.08)',
                      border: '2px solid rgba(224,90,90,0.4)',
                      color: '#E05A5A',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(224,90,90,0.2)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(224,90,90,0.1)' : 'rgba(224,90,90,0.08)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <X size={24} />
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all btn-neon"
                    style={{ borderRadius: '9999px' }}
                  >
                    <Heart size={26} />
                  </button>
                </div>
              )}
            </div>

            {/* Right info panel */}
            <div
              className="w-72 flex-shrink-0 p-4 hidden lg:block"
              style={{
                borderLeft: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.12)',
                background: isDark ? 'rgba(11,18,32,0.5)' : 'rgba(245,240,230,0.5)',
              }}
            >

              <div className="mb-4">
                <h3 style={{ fontFamily: '\'Manrope\', sans-serif', fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Как пользоваться' : lang === 'kz' ? 'Қалай пайдалану керек' : 'How to use'}
                </h3>
                {[
                  { icon: '←', text: { ru: 'Свайп влево — пропустить', kz: 'Солға свайп — өткізіп жіберу', en: 'Swipe left — skip' } },
                  { icon: '→', text: { ru: 'Свайп вправо — взять груз', kz: 'Оңға свайп — жүктi алу', en: 'Swipe right — take cargo' } },
                  { icon: '⚡', text: { ru: 'AI подбирает лучшие варианты', kz: 'AI үздік нұсқаларды іріктейді', en: 'AI selects the best matches' } },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                      {item.text[lang]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current card info */}
              {topCard && (
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(111,163,255,0.08)',
                    border: '1px solid rgba(111,163,255,0.2)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={13} style={{ color: '#6FA3FF' }} />
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '12px', color: '#6FA3FF' }}>
                      {t('tinder.ai_match')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                    {aiMatch?.analysis.summary ?? (lang === 'ru'
                      ? `Маршрут ${topCard.route.from.ru}→${topCard.route.to.ru} соответствует вашему профилю на 94%`
                      : lang === 'kz'
                        ? `${topCard.route.from.kz}→${topCard.route.to.kz} маршруты сіздің профиліңізге 94% сәйкес келеді`
                        : `Route ${topCard.route.from.en}→${topCard.route.to.en} matches your profile 94%`) }
                  </p>
                  <p style={{ marginTop: '8px', fontSize: '11px', color: '#6FA3FF', fontFamily: "'JetBrains Mono', monospace" }}>
                    {aiMatch ? `${aiMatch.match.confidence}% · ${aiMatch.match.routeMatch}` : ''}
                  </p>
                </div>
              )}

              {/* Remaining */}
              <div className="mt-4 text-center">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '24px', fontWeight: 600, color: '#C8A96A' }}>
                  {cards.length}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
                  {lang === 'ru' ? 'Грузов доступно' : lang === 'kz' ? 'Жүк қолжетімді' : 'cargo available'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <div className="max-w-3xl flex flex-col gap-2">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  <ListCard
                    card={card}
                    onAccept={() => {
                      toast.success(t('tinder.accepted'), {
                        duration: 1500,
                        style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' },
                      });
                    }}
                    isDark={isDark}
                    lang={lang}
                    t={t}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


