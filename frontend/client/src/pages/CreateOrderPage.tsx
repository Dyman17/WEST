// WEST — Neon Transit: Create Order Page (Shipper)
// Design: Cyberpunk Terminal — Multi-step order creation form
// Features: Route, cargo details, requirements, submit with AI suggestions

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { backend, type BackendAiOrderSuggestionResponse } from '@/lib/backend';
import {
  MapPin, Package, DollarSign, Calendar, Truck, Ship, Train,
  ChevronRight, ChevronLeft, CheckCircle, Zap, Weight, Clock,
  FileText, AlertTriangle
} from 'lucide-react';

const STEPS = [
  { id: 1, key: 'route', icon: MapPin },
  { id: 2, key: 'cargo', icon: Package },
  { id: 3, key: 'requirements', icon: FileText },
  { id: 4, key: 'review', icon: CheckCircle },
];

const CARGO_TYPES_OPTIONS = {
  ru: ['Нефтепродукты', 'Контейнеры', 'Зерно', 'Металл', 'Химикаты', 'Оборудование', 'Автомобили', 'Стройматериалы', 'Другое'],
  kz: ['Мұнай өнімдері', 'Контейнерлер', 'Астық', 'Металл', 'Химикаттар', 'Жабдықтар', 'Автомобильдер', 'Құрылыс материалдары', 'Басқа'],
  en: ['Petroleum', 'Containers', 'Grain', 'Metal', 'Chemicals', 'Equipment', 'Vehicles', 'Construction Materials', 'Other'],
};

const CITIES = {
  ru: ['Актау', 'Курык', 'Атырау', 'Алматы', 'Астана', 'Шымкент', 'Баку', 'Туркменбаши', 'Ташкент'],
  kz: ['Ақтау', 'Құрық', 'Атырау', 'Алматы', 'Астана', 'Шымкент', 'Баку', 'Түркіменбашы', 'Ташкент'],
  en: ['Aktau', 'Kuryk', 'Atyrau', 'Almaty', 'Astana', 'Shymkent', 'Baku', 'Turkmenbashi', 'Tashkent'],
};

interface FormData {
  from: string; to: string; date: string; time: string;
  cargoType: string; weight: string; volume: string; price: string;
  transport: string; dangerous: boolean; temperature: boolean; notes: string;
}

export default function CreateOrderPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [createdFreightId, setCreatedFreightId] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<BackendAiOrderSuggestionResponse | null>(null);
  const [form, setForm] = useState<FormData>({
    from: '', to: '', date: '', time: '',
    cargoType: '', weight: '', volume: '', price: '',
    transport: 'truck', dangerous: false, temperature: false, notes: '',
  });

  const update = (k: keyof FormData, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    let cancelled = false;

    if (step < 2 || !form.from || !form.to || !form.cargoType || !form.weight || !form.price) {
      setAiSuggestion(null);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void backend.aiOrderSuggestion({
        from: form.from,
        to: form.to,
        cargoType: form.cargoType,
        weight: Number(form.weight),
        price: Number(form.price),
        transport: form.transport,
        language: lang,
      })
        .then((response) => {
          if (!cancelled) {
            setAiSuggestion(response);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAiSuggestion(null);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [step, form.from, form.to, form.cargoType, form.weight, form.price, form.transport, lang]);

  const canNext = () => {
    if (step === 1) return form.from && form.to && form.date;
    if (step === 2) return form.cargoType && form.weight && form.price;
    return true;
  };
  const handleSubmit = async () => {
    try {
      const response = await backend.createFreight({
        from: form.from,
        to: form.to,
        weight: Number(form.weight),
        type: form.cargoType,
        price: Number(form.price),
        transportType: form.transport,
        eco: form.temperature || !form.dangerous,
        deadline: form.date,
        distance: Number(form.volume) || undefined,
        priority: form.dangerous ? 92 : 75,
      });

      setCreatedFreightId(response.freight.id);
      setSubmitted(true);
      toast.success(
        lang === 'ru' ? `?????? ${response.freight.id} ???????! ??????????? ??? ????? ??.` :
        lang === 'kz' ? `?????? ${response.freight.id} ???????! ??????????????? ??? ????? ?????.` :
        `Order ${response.freight.id} created! Carriers can see it now.`,
        { style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' } }
      );
    } catch {
      toast.error(lang === 'ru' ? '?? ??????? ??????? ??????' : lang === 'kz' ? '???????? ????? ?????? ???????' : 'Failed to create order');
    }
  };
  };

  const inputStyle = {
    background: isDark ? '#1C2B4A' : '#F0E9DD',
    border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.15)',
    color: isDark ? '#E6E1D6' : '#1E2A3A',
    fontFamily: "'Manrope', sans-serif",
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '12px',
    color: isDark ? '#B8B0A2' : '#5C6B7A',
    fontFamily: "'Inter', sans-serif",
    display: 'block',
    marginBottom: '6px',
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="text-center max-w-md"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(79,191,159,0.12)', border: '2px solid rgba(79,191,159,0.4)' }}
          >
            <CheckCircle size={48} style={{ color: '#4FBF9F', filter: 'none' }} />
          </div>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '24px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '8px' }}>
            {lang === 'ru' ? 'Заявка создана!' : lang === 'kz' ? 'Өтінім жасалды!' : 'Order Created!'}
          </h2>
          <p style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
            {lang === 'ru'
              ? `${form.from} → ${form.to} · ${form.weight}т · ${form.price} ₸`
              : lang === 'kz'
                ? `${form.from} → ${form.to} · ${form.weight}т · ${form.price} ₸`
                : `${form.from} → ${form.to} · ${form.weight}t · ${form.price} ₸`}
          </p>
          <p style={{ color: '#4FBF9F', fontFamily: "'JetBrains Mono', monospace", marginBottom: '24px' }}>
            {createdFreightId ? `ID: ${createdFreightId}` : ''}
          </p>
          <div
            className="p-3 rounded-xl mb-5 flex items-center gap-2"
            style={{ background: 'rgba(111,163,255,0.08)', border: '1px solid rgba(111,163,255,0.2)' }}
          >
            <Zap size={16} style={{ color: '#6FA3FF', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#6FA3FF', fontFamily: "'Inter', sans-serif" }}>
              {aiSuggestion?.analysis.summary ?? (lang === 'ru'
                ? 'AI уже подбирает подходящих перевозчиков...'
                : lang === 'kz'
                  ? 'AI қазір өзіңізге сәйкес тасымалдаушыларды іздеуде...'
                  : 'AI is already finding matching carriers...')}
            </p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setForm({ from: '', to: '', date: '', time: '', cargoType: '', weight: '', volume: '', price: '', transport: 'truck', dangerous: false, temperature: false, notes: '' }); }}
            className="btn-neon px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {lang === 'ru' ? 'Создать ещё заявку' : lang === 'kz' ? 'Тағы өтінім жасау' : 'Create Another Order'}
          </button>
        </motion.div>
      </div>
    );
  }

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
          {t('create_order.title')}
        </h1>
        <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
          {lang === 'ru'
            ? 'Создайте заявку и получите предложения от перевозчиков'
            : lang === 'kz'
              ? 'Өтінім жасаңыз және тасымалдаушылардан ұсыныстар алыңыз'
              : 'Create an order and receive offers from carriers'}
        </p>
      </div>

      <div className="p-6 max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(200,169,106,0.15)' : isDone ? 'rgba(79,191,159,0.1)' : isDark ? 'rgba(34,49,79,0.3)' : 'rgba(92,107,122,0.08)',
                    border: isActive ? '1px solid rgba(200,169,106,0.4)' : isDone ? '1px solid rgba(79,191,159,0.3)' : isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(92,107,122,0.15)',
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? '#C8A96A' : isDone ? '#4FBF9F' : isDark ? '#B8B0A2' : '#5C6B7A' }} />
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{
                      color: isActive ? '#C8A96A' : isDone ? '#4FBF9F' : isDark ? '#B8B0A2' : '#5C6B7A',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {t(`create_order.step_${s.key}`)}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '1px', background: isDone ? 'rgba(79,191,159,0.4)' : isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.1)', margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="p-5 rounded-2xl mb-5"
            style={{
              background: isDark ? '#111A2E' : '#fff',
              border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
            }}
          >
            {/* Step 1: Route */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                  {lang === 'ru' ? 'Маршрут' : lang === 'kz' ? 'Маршрут' : 'Route'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Откуда' : lang === 'kz' ? 'Қайдан' : 'From'}</label>
                    <select value={form.from} onChange={e => update('from', e.target.value)} style={inputStyle}>
                      <option value="">{lang === 'ru' ? 'Выберите город' : lang === 'kz' ? 'Қала таңдаңыз' : 'Select city'}</option>
                      {CITIES[lang].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Куда' : lang === 'kz' ? 'Қайда' : 'To'}</label>
                    <select value={form.to} onChange={e => update('to', e.target.value)} style={inputStyle}>
                      <option value="">{lang === 'ru' ? 'Выберите город' : lang === 'kz' ? 'Қала таңдаңыз' : 'Select city'}</option>
                      {CITIES[lang].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Дата отправки' : lang === 'kz' ? 'Жөнелту күні' : 'Departure Date'}</label>
                    <input type="date" value={form.date} onChange={e => update('date', e.target.value)} style={inputStyle} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Время (опц.)' : lang === 'kz' ? 'Уақыт (міндетті емес)' : 'Time (optional)'}</label>
                    <input type="time" value={form.time} onChange={e => update('time', e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cargo */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                  {lang === 'ru' ? 'Груз' : lang === 'kz' ? 'Жүк' : 'Cargo'}
                </h3>
                <div>
                  <label style={labelStyle}>{lang === 'ru' ? 'Тип груза' : lang === 'kz' ? 'Жүк түрі' : 'Cargo Type'}</label>
                  <select value={form.cargoType} onChange={e => update('cargoType', e.target.value)} style={inputStyle}>
                    <option value="">{lang === 'ru' ? 'Выберите тип' : lang === 'kz' ? 'Түрді таңдаңыз' : 'Select type'}</option>
                    {CARGO_TYPES_OPTIONS[lang].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Вес (тонн)' : lang === 'kz' ? 'Салмақ (тонна)' : 'Weight (tons)'}</label>
                    <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{lang === 'ru' ? 'Объём (м³)' : lang === 'kz' ? 'Көлем (м³)' : 'Volume (m³)'}</label>
                    <input type="number" value={form.volume} onChange={e => update('volume', e.target.value)} placeholder="0" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{lang === 'ru' ? 'Ставка (₸)' : lang === 'kz' ? 'Мөлшерлеме (₸)' : 'Rate (₸)'}</label>
                  <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                {/* AI price suggestion */}
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(111,163,255,0.08)', border: '1px solid rgba(111,163,255,0.2)' }}
                >
                  <Zap size={14} style={{ color: '#6FA3FF', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#6FA3FF', fontFamily: "'Inter', sans-serif" }}>
                    {aiSuggestion?.analysis.summary ?? (lang === 'ru'
                      ? 'AI-рекомендация: рыночная ставка 320–450K ₸'
                      : lang === 'kz'
                        ? 'AI ұсынысы: нарықтық мөлшерлеме 320–450K ₸'
                        : 'AI suggestion: market rate 320–450K ₸')}
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                  {lang === 'ru' ? 'Требования' : lang === 'kz' ? 'Талаптар' : 'Requirements'}
                </h3>
                {/* Transport type */}
                <div>
                  <label style={labelStyle}>{lang === 'ru' ? 'Тип транспорта' : lang === 'kz' ? 'Көлік түрі' : 'Transport Type'}</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'truck', icon: Truck, label: { ru: 'Авто', kz: 'Авто', en: 'Truck' } },
                      { key: 'ship', icon: Ship, label: { ru: 'Судно', kz: 'Кеме', en: 'Ship' } },
                      { key: 'train', icon: Train, label: { ru: 'Ж/Д', kz: 'Теміржол', en: 'Train' } },
                    ].map(tr => {
                      const Icon = tr.icon;
                      return (
                        <button
                          key={tr.key}
                          onClick={() => update('transport', tr.key)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: form.transport === tr.key ? 'rgba(200,169,106,0.15)' : isDark ? '#1C2B4A' : '#F0E9DD',
                            border: form.transport === tr.key ? '1px solid rgba(200,169,106,0.4)' : isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)',
                            color: form.transport === tr.key ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
                            fontFamily: "'Manrope', sans-serif",
                          }}
                        >
                          <Icon size={15} />
                          {tr.label[lang]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Special requirements */}
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'dangerous' as const, icon: AlertTriangle, label: { ru: 'Опасный груз', kz: 'Қауіпті жүк', en: 'Dangerous cargo' }, color: '#E05A5A' },
                    { key: 'temperature' as const, icon: Package, label: { ru: 'Температурный режим', kz: 'Температуралық режим', en: 'Temperature control' }, color: '#4FBF9F' },
                  ].map(req => {
                    const Icon = req.icon;
                    return (
                      <button
                        key={req.key}
                        onClick={() => update(req.key, !form[req.key])}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: form[req.key] ? `${req.color}10` : isDark ? '#1C2B4A' : '#F0E9DD',
                          border: form[req.key] ? `1px solid ${req.color}40` : isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)',
                        }}
                      >
                        <Icon size={16} style={{ color: form[req.key] ? req.color : isDark ? '#B8B0A2' : '#5C6B7A' }} />
                        <span style={{ fontSize: '13px', fontFamily: "'Manrope', sans-serif", color: form[req.key] ? req.color : isDark ? '#E6E1D6' : '#1E2A3A', fontWeight: form[req.key] ? 600 : 400 }}>
                          {req.label[lang]}
                        </span>
                        <div className="ml-auto w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: form[req.key] ? req.color : isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.2)', background: form[req.key] ? req.color : 'transparent' }}>
                          {form[req.key] && <CheckCircle size={12} style={{ color: '#fff' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label style={labelStyle}>{lang === 'ru' ? 'Примечания' : lang === 'kz' ? 'Ескертпелер' : 'Notes'}</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    rows={3}
                    placeholder={lang === 'ru' ? 'Дополнительные требования...' : lang === 'kz' ? 'Қосымша талаптар...' : 'Additional requirements...'}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                  {lang === 'ru' ? 'Проверка заявки' : lang === 'kz' ? 'Өтінімді тексеру' : 'Review Order'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: MapPin, label: lang === 'ru' ? 'Маршрут' : lang === 'kz' ? 'Маршрут' : 'Route', value: `${form.from} → ${form.to}` },
                    { icon: Calendar, label: lang === 'ru' ? 'Дата' : lang === 'kz' ? 'Күн' : 'Date', value: form.date + (form.time ? ` ${form.time}` : '') },
                    { icon: Package, label: lang === 'ru' ? 'Груз' : lang === 'kz' ? 'Жүк' : 'Cargo', value: form.cargoType },
                    { icon: Weight, label: lang === 'ru' ? 'Вес' : lang === 'kz' ? 'Салмақ' : 'Weight', value: `${form.weight}т` },
                    { icon: DollarSign, label: lang === 'ru' ? 'Ставка' : lang === 'kz' ? 'Мөлшерлеме' : 'Rate', value: `${Number(form.price).toLocaleString()} ₸` },
                    { icon: Truck, label: lang === 'ru' ? 'Транспорт' : lang === 'kz' ? 'Көлік' : 'Transport', value: form.transport },
                  ].map(row => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-start gap-2 p-3 rounded-xl"
                        style={{ background: isDark ? '#1C2B4A' : '#F0E9DD', border: isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(47,74,109,0.08)' }}
                      >
                        <Icon size={14} style={{ color: '#C8A96A', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{row.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}>{row.value || '—'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: step === 1 ? 'transparent' : isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
              border: step === 1 ? '1px solid transparent' : isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
              color: step === 1 ? 'transparent' : isDark ? '#B8B0A2' : '#5C6B7A',
              fontFamily: "'Manrope', sans-serif",
              cursor: step === 1 ? 'default' : 'pointer',
            }}
          >
            <ChevronLeft size={16} />
            {lang === 'ru' ? 'Назад' : lang === 'kz' ? 'Артқа' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => canNext() && setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-neon transition-all"
              style={{
                fontFamily: "'Manrope', sans-serif",
                opacity: canNext() ? 1 : 0.5,
                cursor: canNext() ? 'pointer' : 'not-allowed',
              }}
            >
              {lang === 'ru' ? 'Далее' : lang === 'kz' ? 'Келесі' : 'Next'}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-neon"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <CheckCircle size={16} />
              {lang === 'ru' ? 'Создать заявку' : lang === 'kz' ? 'Өтінім жасау' : 'Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
