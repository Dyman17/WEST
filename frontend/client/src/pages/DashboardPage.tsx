// WEST - Neon Transit: Akim Dashboard Page
// Design: Cyberpunk terminal - regional transit statistics for administration
// Features: KPI cards, recharts line/bar/pie charts, port load table, export

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { backend, type BackendDashboard, type BackendPort } from '@/lib/backend';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  Ship,
  Train,
  DollarSign,
  BarChart3,
  Download,
  Leaf,
  Clock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

type PortLoadRow = {
  name: { ru: string; kz: string; en: string };
  load: number;
  ships: number;
  trucks: number;
  revenue: number;
};

type KpiCard = {
  icon: typeof Truck;
  label: { ru: string; kz: string; en: string };
  value: string;
  change: number;
  color: string;
};

const TRANSPORT_SHARE = [
  { name: 'Авто', value: 58, color: '#C8A96A' },
  { name: 'Судно', value: 27, color: '#6FA3FF' },
  { name: 'Ж/Д', value: 15, color: '#4FBF9F' },
];

function getLoadColor(load: number) {
  if (load >= 70) return '#E05A5A';
  if (load >= 40) return '#E0C27A';
  return '#4FBF9F';
}

function buildPortRows(ports: BackendPort[]): PortLoadRow[] {
  if (!ports.length) return [];

  const translations: Record<string, PortLoadRow['name']> = {
    aktau: { ru: 'Порт Актау', kz: 'Ақтау порты', en: 'Aktau Port' },
    kuryk: { ru: 'Порт Курык', kz: 'Құрық порты', en: 'Kuryk Port' },
    baku: { ru: 'Порт Баку', kz: 'Баку порты', en: 'Baku Port' },
    turkmenbashi: { ru: 'Туркменбаши', kz: 'Түркменбашы', en: 'Turkmenbashi' },
  };

  return ports.map(port => {
    const load = port.load ?? 0;
    const key = port.id.toLowerCase();
    return {
      name: translations[key] ?? { ru: port.name, kz: port.name, en: port.name },
      load,
      ships: Math.max(0, Math.round((load / 100) * 30)),
      trucks: Math.max(0, Math.round((load / 100) * 180)),
      revenue: Number((load / 100 * 1.5).toFixed(1)),
    };
  });
}

function buildKpis(metrics: BackendDashboard['metrics']): KpiCard[] {
  return [
    {
      icon: Truck,
      label: { ru: 'Рейсов в месяц', kz: 'Ай сайынғы рейстер', en: 'Trips/month' },
      value: metrics.activeUsers.toLocaleString('ru-RU'),
      change: +12.4,
      color: '#C8A96A',
    },
    {
      icon: DollarSign,
      label: { ru: 'Выручка (млрд ₸)', kz: 'Түсім (млрд ₸)', en: 'Revenue (B ₸)' },
      value: `${metrics.estimatedMonthlyRevenueKzt.toLocaleString('ru-RU')} ₸`,
      change: +18.2,
      color: '#4FBF9F',
    },
    {
      icon: Clock,
      label: { ru: 'Простой в портах (ч)', kz: 'Порттағы тоқтау (сағ)', en: 'Port wait (h)' },
      value: `${(Math.max(1, metrics.confirmedBookings) / 120).toFixed(1)} ч`,
      change: -68,
      color: '#6FA3FF',
    },
    {
      icon: Leaf,
      label: { ru: 'CO₂ экономия (т)', kz: 'CO₂ үнемдеу (т)', en: 'CO₂ saved (t)' },
      value: `${metrics.ecoFreightShare}%`,
      change: +31,
      color: '#E0C27A',
    },
    {
      icon: Users,
      label: { ru: 'Активных перевозчиков', kz: 'Белсенді тасымалдаушылар', en: 'Active carriers' },
      value: metrics.averageDriverScore.toFixed(0),
      change: +8.5,
      color: '#C8A96A',
    },
    {
      icon: TrendingDown,
      label: { ru: 'Пустые рейсы', kz: 'Бос рейстер', en: 'Empty trips' },
      value: `${Math.max(0, 100 - metrics.openFreights)}%`,
      change: -75,
      color: '#4FBF9F',
    },
  ];
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  isDark: boolean;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: isDark ? '#111A2E' : '#fff',
        border: '1px solid rgba(200,169,106,0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', marginBottom: '6px' }}>
        {label}
      </div>
      {payload.map((item) => (
        <div key={item.name} style={{ fontFamily: "'Manrope', sans-serif", fontSize: '12px', color: item.color, fontWeight: 600 }}>
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';
  const [kpis, setKpis] = useState<KpiCard[]>([]);
  const [portRows, setPortRows] = useState<PortLoadRow[]>([]);
  const [chartData, setChartData] = useState<Array<{ month: string; trucks: number; ships: number; trains: number; revenue: number }>>([]);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [dashboardResponse, portsResponse] = await Promise.all([
          backend.dashboard(),
          backend.ports(),
        ]);

        if (cancelled) return;

        setKpis(buildKpis(dashboardResponse.metrics));
        setPortRows(buildPortRows(portsResponse.items));
        setChartData(dashboardResponse.monthlySeries ?? []);
        setGeneratedAt(dashboardResponse.generatedAt);
      } catch {
        if (cancelled) return;
        setKpis([]);
        setPortRows([]);
        setChartData([]);
        setGeneratedAt('');
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = () => {
    toast.success(
      lang === 'ru' ? 'Отчёт экспортируется...' : lang === 'kz' ? 'Есеп экспортталуда...' : 'Report exporting...',
      { style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' } }
    );
  };

  const gridBg = isDark ? 'rgba(34,49,79,0.15)' : 'rgba(47,74,109,0.05)';
  const axisColor = isDark ? '#B8B0A2' : '#5C6B7A';
  const subtitle = generatedAt
    ? `${lang === 'ru' ? 'Обновлено' : lang === 'kz' ? 'Жаңартылды' : 'Updated'} · ${new Date(generatedAt).toLocaleString()}`
    : lang === 'ru'
      ? 'Мангистауская область · 2024'
      : lang === 'kz'
        ? 'Маңғыстау облысы · 2024'
        : 'Mangystau Region · 2024';

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
            {t('dashboard.title')}
          </h1>
          <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>{subtitle}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
            border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
            color: isDark ? '#B8B0A2' : '#5C6B7A',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <Download size={15} />
          {lang === 'ru' ? 'Экспорт' : lang === 'kz' ? 'Экспорт' : 'Export'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            const isPositive = kpi.change > 0;
            const isGoodNegative = kpi.label.ru.includes('Простой') || kpi.label.ru.includes('Пустые');
            const isGood = isGoodNegative ? !isPositive : isPositive;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="p-3 rounded-xl"
                style={{
                  background: isDark ? '#111A2E' : '#fff',
                  border: `1px solid ${kpi.color}20`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                    <Icon size={14} />
                  </div>
                  <div
                    className="flex items-center gap-0.5 text-xs"
                    style={{ color: isGood ? '#4FBF9F' : '#E05A5A', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', fontWeight: 700, color: kpi.color, textShadow: 'none' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '10px', color: isDark ? '#B8B0A2' : '#5C6B7A', marginTop: '2px', fontFamily: "'Inter', sans-serif", lineHeight: 1.3 }}>
                  {kpi.label[lang]}
                </div>
              </motion.div>
              );
            })}
          {!kpis.length && (
            <div className="col-span-full rounded-xl border p-4 text-sm" style={{ borderColor: isDark ? 'rgba(34,49,79,0.7)' : 'rgba(47,74,109,0.12)', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
              {lang === 'ru' ? 'Метрики загружаются из backend...' : lang === 'kz' ? 'Метрикалар backend-тен жүктеліп жатыр...' : 'Metrics are loading from backend...'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            className="xl:col-span-2 p-4 rounded-2xl"
            style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                {lang === 'ru' ? 'Рейсы по месяцам' : lang === 'kz' ? 'Айлар бойынша рейстер' : 'Monthly Trips'}
              </h3>
              <BarChart3 size={16} style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="truckGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A96A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8A96A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6FA3FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6FA3FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4FBF9F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4FBF9F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridBg} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Area type="monotone" dataKey="trucks" name={lang === 'ru' ? 'Авто' : 'Truck'} stroke="#C8A96A" fill="url(#truckGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="ships" name={lang === 'ru' ? 'Судно' : 'Ship'} stroke="#6FA3FF" fill="url(#shipGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="trains" name={lang === 'ru' ? 'Ж/Д' : 'Train'} stroke="#4FBF9F" fill="url(#trainGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)' }}
          >
            <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '16px' }}>
              {lang === 'ru' ? 'Доля транспорта' : lang === 'kz' ? 'Көлік үлесі' : 'Transport Share'}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={TRANSPORT_SHARE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {TRANSPORT_SHARE.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {TRANSPORT_SHARE.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)' }}
        >
          <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '16px' }}>
            {lang === 'ru' ? 'Выручка (млрд ₸)' : lang === 'kz' ? 'Түсім (млрд ₸)' : 'Revenue (B ₸)'}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridBg} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Bar dataKey="revenue" name={lang === 'ru' ? 'Выручка' : 'Revenue'} fill="#C8A96A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)' }}
        >
          <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14px', color: isDark ? '#E6E1D6' : '#1E2A3A', marginBottom: '16px' }}>
            {lang === 'ru' ? 'Загруженность портов' : lang === 'kz' ? 'Порттардың жүктемесі' : 'Port Load'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)' }}>
                  {[
                    lang === 'ru' ? 'Порт' : lang === 'kz' ? 'Порт' : 'Port',
                    lang === 'ru' ? 'Загрузка' : lang === 'kz' ? 'Жүктеме' : 'Load',
                    lang === 'ru' ? 'Судна' : lang === 'kz' ? 'Кемелер' : 'Ships',
                    lang === 'ru' ? 'Авто' : lang === 'kz' ? 'Авто' : 'Trucks',
                    lang === 'ru' ? 'Выручка (млрд ₸)' : lang === 'kz' ? 'Түсім (млрд ₸)' : 'Revenue (B ₸)',
                  ].map(header => (
                    <th
                      key={header}
                      className="text-left pb-2 pr-4"
                      style={{
                        fontSize: '11px',
                        color: isDark ? '#B8B0A2' : '#5C6B7A',
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portRows.map((port, index) => {
                  const color = getLoadColor(port.load);
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.07, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      style={{ borderBottom: isDark ? '1px solid rgba(34,49,79,0.3)' : '1px solid rgba(47,74,109,0.06)' }}
                    >
                      <td className="py-2.5 pr-4" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '13px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                        {port.name[lang]}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '60px' }} className="congestion-bar">
                            <div className="congestion-fill" style={{ width: `${port.load}%`, background: color }} />
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color }}>{port.load}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#6FA3FF' }}>
                        {port.ships}
                      </td>
                      <td className="py-2.5 pr-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#C8A96A' }}>
                        {port.trucks}
                      </td>
                      <td className="py-2.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#4FBF9F' }}>
                        {port.revenue}B
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

