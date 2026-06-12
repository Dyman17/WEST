// WEST ? Neon Transit: Carrier Rating Page
// Design: Cyberpunk Terminal ? Logistics Reputation Score (LRS)
// Features: Rating cards, criteria breakdown, review system, leave review modal

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { backend, type BackendRatingItem } from '@/lib/backend';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Star,
  Clock,
  Leaf,
  TrendingUp,
  TrendingDown,
  Award,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
  Truck,
  Ship,
  Train,
} from 'lucide-react';

type CarrierReview = {
  author: string;
  text: { ru: string; kz: string; en: string };
  rating: number;
  date: string;
};

type CarrierCard = {
  id: number;
  name: string;
  transport: 'truck' | 'ship' | 'train';
  score: number;
  trips: number;
  onTime: number;
  eco: number;
  quality: number;
  cancels: number;
  badge: 'gold' | 'silver' | 'bronze' | null;
  reviews: CarrierReview[];
};

const TRANSPORT_ICONS = { truck: Truck, ship: Ship, train: Train };
const BADGE_COLORS = { gold: '#E0C27A', silver: '#B8B0A2', bronze: '#C8A96A' };

function mapBackendRating(item: BackendRatingItem): CarrierCard {
  const transport =
    item.transportType === 'ship'
      ? 'ship'
      : item.transportType === 'rail'
        ? 'train'
        : 'truck';

  return {
    id: Number(item.id.replace(/\D/g, '')) || item.score,
    name: item.name,
    transport,
    score: item.score,
    trips: item.trips,
    onTime: Math.max(0, Math.min(100, 100 - item.penalties.delays * 5)),
    eco: item.eco,
    quality: Math.max(1, Math.min(5, item.quality)),
    cancels: item.penalties.cancellations * 2,
    badge: item.score >= 90 ? 'gold' : item.score >= 80 ? 'silver' : item.score >= 70 ? 'bronze' : null,
    reviews: [],
  };
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? '#4FBF9F' : score >= 70 ? '#E0C27A' : '#E05A5A';

  return (
    <div className="relative" style={{ width: 88, height: 88 }}>
      <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: 'none', transition: 'stroke-dashoffset 1s cubic-bezier(0.23,1,0.32,1)' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <span style={{ fontSize: '20px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '9px', color: 'rgba(184,176,162,0.7)', marginTop: '1px' }}>LRS</span>
      </div>
    </div>
  );
}

export default function RatingPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [carriers, setCarriers] = useState<CarrierCard[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [sortBy, setSortBy] = useState<'score' | 'trips' | 'onTime'>('score');

  useEffect(() => {
    let cancelled = false;

    const loadRatings = async () => {
      try {
        const response = await backend.ratings();
        if (!cancelled) setCarriers(response.items.map(mapBackendRating));
      } catch {
        if (!cancelled) setCarriers([]);
      }
    };

    void loadRatings();

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...carriers].sort((a, b) => b[sortBy] - a[sortBy]);

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    toast.success(t('rating.leave_review'), {
      style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' },
    });
    setShowReviewModal(null);
    setReviewText('');
    setReviewRating(5);
  };

  return (
    <div className="min-h-[calc(100vh-56px)]">
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.12)',
          background: isDark ? 'rgba(11,18,32,0.8)' : 'rgba(245,240,230,0.8)',
        }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Manrope', sans-serif", color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
            {t('rating.title')}
          </h1>
          <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
            {lang === 'ru'
              ? 'Logistics Reputation Score (LRS) — автоматический рейтинг'
              : lang === 'kz'
                ? 'Logistics Reputation Score (LRS) — автоматты рейтинг'
                : 'Logistics Reputation Score (LRS) — automated rating'}
          </p>
        </div>

        <div className="flex gap-2">
          {[
            { key: 'score' as const, label: 'LRS' },
            { key: 'trips' as const, label: lang === 'ru' ? 'Рейсы' : lang === 'kz' ? 'Рейстер' : 'Trips' },
            { key: 'onTime' as const, label: lang === 'ru' ? 'Пунктуальность' : lang === 'kz' ? 'Уақыттылық' : 'On Time' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: sortBy === s.key ? 'rgba(200,169,106,0.2)' : isDark ? 'rgba(17,26,46,0.6)' : 'rgba(255,255,255,0.6)',
                border: sortBy === s.key ? '1px solid rgba(200,169,106,0.4)' : isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.12)',
                color: sortBy === s.key ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-4xl">
          {[
            { icon: Clock, label: { ru: 'Опоздания', kz: 'Кешігулер', en: 'Late Arrivals' }, effect: '-20%', color: '#E05A5A' },
            { icon: X, label: { ru: 'Отмены', kz: 'Бас тартулар', en: 'Cancellations' }, effect: '-30%', color: '#E05A5A' },
            { icon: Leaf, label: { ru: 'Экологичность', kz: 'Экологиялылық', en: 'Eco Score' }, effect: '+10%', color: '#4FBF9F' },
            { icon: Star, label: { ru: 'Отзывы', kz: 'Пікірлер', en: 'Reviews' }, effect: '1–5 ★', color: '#C8A96A' },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="p-3 rounded-lg flex items-center gap-2"
                style={{
                  background: isDark ? '#111A2E' : '#fff',
                  border: `1px solid ${c.color}20`,
                }}
              >
                <div className="p-1.5 rounded-md" style={{ background: `${c.color}15`, color: c.color }}>
                  <Icon size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{c.label[lang]}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: c.color, fontFamily: "'JetBrains Mono', monospace" }}>{c.effect}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 max-w-4xl">
          {sorted.map((carrier, i) => {
            const TransportIcon = TRANSPORT_ICONS[carrier.transport];
            const isExpanded = expanded === carrier.id;

            return (
              <div
                key={carrier.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background: isDark ? '#111A2E' : '#fff',
                  border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                  boxShadow: i === 0 ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : carrier.id)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: i === 0 ? 'rgba(224,194,122,0.15)' : i === 1 ? 'rgba(192,192,192,0.15)' : i === 2 ? 'rgba(205,127,50,0.15)' : isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.1)',
                      color: i < 3 ? BADGE_COLORS[(['gold', 'silver', 'bronze'] as const)[i]] : isDark ? '#B8B0A2' : '#5C6B7A',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {i + 1}
                  </div>

                  <ScoreRing score={carrier.score} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                        {carrier.name}
                      </span>
                      {carrier.badge && <Award size={14} style={{ color: BADGE_COLORS[carrier.badge] }} />}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <TransportIcon size={12} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }} />
                        <span style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                          {carrier.trips} {t('carriers.trips')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} style={{ color: '#4FBF9F' }} />
                        <span style={{ fontSize: '12px', color: '#4FBF9F', fontFamily: "'JetBrains Mono', monospace" }}>
                          {carrier.onTime}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Leaf size={12} style={{ color: '#4FBF9F' }} />
                        <span style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'JetBrains Mono', monospace" }}>
                          {carrier.eco}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 justify-end mb-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={12}
                            fill={si < Math.floor(carrier.quality) ? '#C8A96A' : 'none'}
                            style={{ color: si < Math.floor(carrier.quality) ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.3)' }}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'JetBrains Mono', monospace" }}>
                        {carrier.quality.toFixed(1)} / 5.0
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} style={{ color: '#C8A96A' }} /> : <ChevronDown size={16} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    style={{ borderTop: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)' }}
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: t('rating.on_time'), value: carrier.onTime, color: '#4FBF9F', icon: Clock },
                          { label: t('rating.eco'), value: carrier.eco, color: '#4FBF9F', icon: Leaf },
                          { label: t('rating.quality'), value: carrier.quality * 20, color: '#C8A96A', icon: Star },
                          { label: t('rating.cancellations'), value: Math.max(0, 100 - carrier.cancels * 5), color: carrier.cancels > 8 ? '#E05A5A' : '#E0C27A', icon: carrier.cancels > 8 ? TrendingDown : TrendingUp },
                        ].map(bar => {
                          const Icon = bar.icon;
                          return (
                            <div key={bar.label}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <Icon size={11} style={{ color: bar.color }} />
                                  <span style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{bar.label}</span>
                                </div>
                                <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: bar.color }}>{bar.value}%</span>
                              </div>
                              <div className="congestion-bar">
                                <div className="congestion-fill" style={{ width: `${bar.value}%`, background: bar.color, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {carrier.reviews.length > 0 && (
                        <div className="mb-3">
                          <div
                            className="text-xs font-semibold mb-2"
                            style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          >
                            {lang === 'ru' ? 'Отзывы' : lang === 'kz' ? 'Пікірлер' : 'Reviews'}
                          </div>
                          {carrier.reviews.map((rev, ri) => (
                            <div
                              key={ri}
                              className="p-3 rounded-lg mb-2"
                              style={{
                                background: isDark ? 'rgba(17,26,46,0.6)' : 'rgba(240,233,221,0.6)',
                                border: isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(47,74,109,0.08)',
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}>
                                  {rev.author}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: rev.rating }).map((_, si) => (
                                    <Star key={si} size={10} fill="#C8A96A" style={{ color: '#C8A96A' }} />
                                  ))}
                                </div>
                              </div>
                              <p style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                                {rev.text[lang]}
                              </p>
                              <div style={{ fontSize: '10px', color: isDark ? 'rgba(184,176,162,0.4)' : 'rgba(92,107,122,0.4)', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                                {rev.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setShowReviewModal(carrier.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: 'rgba(200,169,106,0.1)',
                          border: '1px solid rgba(200,169,106,0.3)',
                          color: '#C8A96A',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        <MessageSquare size={13} />
                        {t('rating.leave_review')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowReviewModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md p-6 rounded-2xl"
            style={{
              background: isDark ? '#111A2E' : '#fff',
              border: '1px solid rgba(200,169,106,0.3)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '18px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {t('rating.leave_review')}
              </h3>
              <button onClick={() => setShowReviewModal(null)} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)}>
                  <Star
                    size={28}
                    fill={i < reviewRating ? '#C8A96A' : 'none'}
                    style={{
                      color: i < reviewRating ? '#C8A96A' : isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.3)',
                      filter: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder={lang === 'ru' ? 'Напишите ваш отзыв...' : lang === 'kz' ? 'Пікіріңізді жазыңыз...' : 'Write your review...'}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-4"
              style={{
                background: isDark ? '#1C2B4A' : '#F0E9DD',
                border: '1px solid rgba(34,49,79,0.6)',
                color: isDark ? '#E6E1D6' : '#1E2A3A',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            />

            <button
              onClick={handleSubmitReview}
              className="w-full py-2.5 rounded-lg font-semibold btn-neon text-sm"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {lang === 'ru' ? 'Отправить отзыв' : lang === 'kz' ? 'Пікір жіберу' : 'Submit Review'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

