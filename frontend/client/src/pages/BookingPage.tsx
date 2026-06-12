// WEST — Neon Transit: Port Booking Page
// Design: Cyberpunk Terminal — Book port slots like a restaurant reservation
// Features: Port selector, date/time picker, slot availability grid, booking confirmation

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Anchor, Clock, CheckCircle, X, AlertTriangle, ChevronRight, Truck, Ship, Calendar } from 'lucide-react';
import { backend, type BackendPort } from '@/lib/backend';

type PortOption = {
  id: string;
  name: { ru: string; kz: string; en: string };
  load: number;
  slots: number;
  total: number;
};

type PortSlot = {
  time: string;
  status: 'free' | 'busy' | 'mine';
  booking: null | { id: string; portId: string; userId: string; date: string; slot: string; purpose: string; status: string };
};

function mapBackendPort(port: BackendPort): PortOption {
  return {
    id: port.id,
    name: { ru: port.name, kz: port.name, en: port.name },
    load: port.load,
    slots: port.availableSlots ?? 0,
    total: port.capacityPerDay ?? 40,
  };
}

function getLoadColor(load: number) {
  if (load >= 70) return '#E05A5A';
  if (load >= 40) return '#E0C27A';
  return '#4FBF9F';
}

export default function BookingPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === 'dark';

  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [transportType, setTransportType] = useState<'truck' | 'ship'>('truck');
  const [cargoWeight, setCargoWeight] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [portSlots, setPortSlots] = useState<PortSlot[]>([]);
  const [portsData, setPortsData] = useState<PortOption[]>([]);

  const port = portsData.find(p => p.id === selectedPort);
  const selectedPortSlots = portSlots;

  const loadPorts = async () => {
    try {
      const { items } = await backend.ports(selectedDate || undefined);
      setPortsData(items.map(mapBackendPort));
    } catch {
      setPortsData([]);
    }
  };

  const loadSlots = async (portId: string, date: string) => {
    try {
      const { slots } = await backend.portSlots(portId, date);
      setPortSlots(slots.map((slot) => ({
        time: slot.time,
        status: slot.booking ? 'mine' : slot.status === 'busy' ? 'busy' : 'free',
        booking: slot.booking ? {
          id: slot.booking.id,
          portId: slot.booking.portId,
          userId: slot.booking.userId,
          date: slot.booking.date,
          slot: slot.booking.slot,
          purpose: slot.booking.purpose,
          status: slot.booking.status,
        } : null,
      })));
    } catch {
      setPortSlots([]);
    }
  };

  useEffect(() => {
    void loadPorts();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedPort || !selectedDate) return;
    void loadSlots(selectedPort, selectedDate);
  }, [selectedPort, selectedDate]);

  const handleBook = async () => {
    if (!selectedPort || !selectedDate || !selectedTime) return;

    try {
      await backend.createBooking({
        portId: selectedPort,
        date: selectedDate,
        slot: selectedTime,
        purpose: transportType,
      });
      setShowConfirm(false);
      toast.success(
        lang === 'ru' ? `Slot ${selectedTime} booked at ${port?.name.ru}!` :
        lang === 'kz' ? `${port?.name.kz} portында ${selectedTime} slot booked!` :
        `Slot ${selectedTime} booked at ${port?.name.en}!`,
        { style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(79,191,159,0.4)', color: '#4FBF9F' } }
      );
      setSelectedTime(null);
      await loadSlots(selectedPort, selectedDate);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Booking failed', {
        style: { background: isDark ? '#111A2E' : '#fff', border: '1px solid rgba(224,90,90,0.3)', color: isDark ? '#E6E1D6' : '#1E2A3A' }
      });
    }
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
          {t('booking.title')}
        </h1>
        <p style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A' }}>
          {lang === 'ru' ? 'Забронируй слот в порту как столик в ресторане' : lang === 'kz' ? 'Портта слотты мейрамхана столы сияқты брондаңыз' : 'Book a port slot like a restaurant reservation'}
        </p>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-6xl">
        {/* Left: Port + date/transport selection */}
        <div className="flex flex-col gap-4 lg:w-72 flex-shrink-0">
          {/* Port selector */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === 'ru' ? '1. Выберите порт' : lang === 'kz' ? '1. Портты таңдаңыз' : '1. Select Port'}
            </div>
            <div className="flex flex-col gap-2">
              {portsData.map(p => {
                const color = getLoadColor(p.load);
                const isSelected = selectedPort === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPort(p.id); setSelectedTime(null); }}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected
                        ? isDark ? 'rgba(200,169,106,0.12)' : 'rgba(47,74,109,0.08)'
                        : isDark ? '#111A2E' : '#fff',
                      border: isSelected ? '1px solid rgba(200,169,106,0.4)' : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                      boxShadow: isSelected ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Anchor size={14} style={{ color: isSelected ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A' }} />
                        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '13px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                          {p.name[lang]}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color }}>
                        {p.load}%
                      </span>
                    </div>
                    <div className="congestion-bar">
                      <div className="congestion-fill" style={{ width: `${p.load}%`, background: color, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span style={{ fontSize: '11px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                        {p.slots} {lang === 'ru' ? 'слотов' : lang === 'kz' ? 'слот' : 'slots'} {lang === 'ru' ? 'свободно' : lang === 'kz' ? 'бос' : 'free'}
                      </span>
                      {p.load >= 70 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={10} style={{ color: '#E05A5A' }} />
                          <span style={{ fontSize: '10px', color: '#E05A5A', fontFamily: "'JetBrains Mono', monospace" }}>
                            {lang === 'ru' ? 'Загружен' : lang === 'kz' ? 'Жүктелген' : 'Busy'}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === 'ru' ? '2. Дата' : lang === 'kz' ? '2. Күн' : '2. Date'}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)' }}>
              <Calendar size={16} style={{ color: '#C8A96A', flexShrink: 0 }} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'JetBrains Mono', monospace" }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Transport type */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === 'ru' ? '3. Транспорт' : lang === 'kz' ? '3. Көлік' : '3. Transport'}
            </div>
            <div className="flex gap-2">
              {[
                { key: 'truck' as const, icon: Truck, label: { ru: 'Авто', kz: 'Авто', en: 'Truck' } },
                { key: 'ship' as const, icon: Ship, label: { ru: 'Судно', kz: 'Кеме', en: 'Ship' } },
              ].map(tr => {
                const Icon = tr.icon;
                return (
                  <button
                    key={tr.key}
                    onClick={() => setTransportType(tr.key)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: transportType === tr.key ? 'rgba(200,169,106,0.15)' : isDark ? '#111A2E' : '#fff',
                      border: transportType === tr.key ? '1px solid rgba(200,169,106,0.4)' : isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                      color: transportType === tr.key ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
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

          {/* Cargo weight */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === 'ru' ? '4. Вес груза (тонн)' : lang === 'kz' ? '4. Жүк салмағы (тонна)' : '4. Cargo Weight (tons)'}
            </div>
            <input
              type="number"
              value={cargoWeight}
              onChange={e => setCargoWeight(e.target.value)}
              placeholder={lang === 'ru' ? 'Например: 25' : lang === 'kz' ? 'Мысалы: 25' : 'e.g. 25'}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: isDark ? '#111A2E' : '#fff',
                border: isDark ? '1px solid rgba(34,49,79,0.7)' : '1px solid rgba(47,74,109,0.12)',
                color: isDark ? '#E6E1D6' : '#1E2A3A',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>

        {/* Right: Time slot grid */}
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: isDark ? 'rgba(184,176,162,0.6)' : 'rgba(92,107,122,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
            {lang === 'ru' ? '5. Выберите время' : lang === 'kz' ? '5. Уақытты таңдаңыз' : '5. Select Time Slot'}
          </div>

          {!selectedPort ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: isDark ? '#111A2E' : '#fff', border: isDark ? '1px solid rgba(34,49,79,0.5)' : '1px solid rgba(47,74,109,0.1)' }}
            >
              <Anchor size={40} style={{ color: isDark ? 'rgba(184,176,162,0.3)' : 'rgba(92,107,122,0.3)', marginBottom: '12px' }} />
              <p style={{ color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                {lang === 'ru' ? 'Выберите порт слева' : lang === 'kz' ? 'Сол жақтан портты таңдаңыз' : 'Select a port on the left'}
              </p>
            </div>
          ) : (
            <div>
              {/* Slot grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-6">
                {selectedPortSlots.map(slot => {
                  const time = slot.time;
                  const status = slot.status;
                  const isSelected = selectedTime === time;

                  let bg = isDark ? '#111A2E' : '#fff';
                  let border = isDark ? '1px solid rgba(34,49,79,0.6)' : '1px solid rgba(47,74,109,0.1)';
                  let color = isDark ? '#E6E1D6' : '#1E2A3A';
                  let cursor = 'pointer';
                  let shadow = 'none';

                  if (status === 'busy') {
                    bg = isDark ? 'rgba(224,90,90,0.08)' : 'rgba(224,90,90,0.05)';
                    border = '1px solid rgba(224,90,90,0.2)';
                    color = isDark ? 'rgba(184,176,162,0.4)' : 'rgba(92,107,122,0.4)';
                    cursor = 'not-allowed';
                  } else if (status === 'mine') {
                    bg = 'rgba(79,191,159,0.12)';
                    border = '1px solid rgba(79,191,159,0.4)';
                    color = '#4FBF9F';
                  } else if (isSelected) {
                    bg = 'rgba(200,169,106,0.15)';
                    border = '1px solid rgba(200,169,106,0.5)';
                    color = '#C8A96A';
                    shadow = '0 0 12px rgba(200,169,106,0.25)';
                  }

                  return (
                    <button
                      key={time}
                      disabled={status === 'busy'}
                      onClick={() => status !== 'busy' && status !== 'mine' && setSelectedTime(isSelected ? null : time)}
                      className="py-2.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: bg, border, color, cursor, boxShadow: shadow,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {status === 'mine' ? '✓' : time}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { color: isDark ? '#E6E1D6' : '#1E2A3A', bg: isDark ? '#111A2E' : '#fff', border: isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.1)', label: { ru: 'Свободно', kz: 'Бос', en: 'Free' } },
                  { color: isDark ? 'rgba(184,176,162,0.4)' : 'rgba(92,107,122,0.4)', bg: 'rgba(224,90,90,0.08)', border: 'rgba(224,90,90,0.2)', label: { ru: 'Занято', kz: 'Бос емес', en: 'Busy' } },
                  { color: '#C8A96A', bg: 'rgba(200,169,106,0.15)', border: 'rgba(200,169,106,0.5)', label: { ru: 'Выбрано', kz: 'Таңдалған', en: 'Selected' } },
                  { color: '#4FBF9F', bg: 'rgba(79,191,159,0.12)', border: 'rgba(79,191,159,0.4)', label: { ru: 'Мои', kz: 'Менің', en: 'Mine' } },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded text-xs flex items-center justify-center" style={{ background: l.bg, border: `1px solid ${l.border}`, color: l.color, fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}>
                      {i === 2 ? '10:00' : i === 3 ? '✓' : i === 1 ? '09:00' : '07:00'}
                    </div>
                    <span style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{l.label[lang]}</span>
                  </div>
                ))}
              </div>

              {/* Book button */}
              <AnimatePresence>
                {selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                      background: isDark ? 'rgba(200,169,106,0.08)' : 'rgba(47,74,109,0.05)',
                      border: '1px solid rgba(200,169,106,0.3)',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                        {port?.name[lang]} · {selectedTime}
                      </div>
                      <div style={{ fontSize: '12px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>
                        {selectedDate || (lang === 'ru' ? 'Дата не выбрана' : lang === 'kz' ? 'Күн таңдалмаған' : 'No date selected')} · {transportType === 'truck' ? '🚛' : '🚢'} {cargoWeight ? `${cargoWeight}т` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold btn-neon text-sm"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {t('booking.book_slot')}
                      <ChevronRight size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-sm p-6 rounded-2xl"
              style={{
                background: isDark ? '#111A2E' : '#fff',
                border: '1px solid rgba(79,191,159,0.3)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full" style={{ background: 'rgba(79,191,159,0.15)' }}>
                  <CheckCircle size={24} style={{ color: '#4FBF9F' }} />
                </div>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '18px', color: isDark ? '#E6E1D6' : '#1E2A3A' }}>
                  {t('booking.confirm')}
                </h3>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  { label: lang === 'ru' ? 'Порт' : lang === 'kz' ? 'Порт' : 'Port', value: port?.name[lang] },
                  { label: lang === 'ru' ? 'Дата' : lang === 'kz' ? 'Күн' : 'Date', value: selectedDate || '—' },
                  { label: lang === 'ru' ? 'Время' : lang === 'kz' ? 'Уақыт' : 'Time', value: selectedTime },
                  { label: lang === 'ru' ? 'Транспорт' : lang === 'kz' ? 'Көлік' : 'Transport', value: transportType === 'truck' ? '🚛 Авто' : '🚢 Судно' },
                  ...(cargoWeight ? [{ label: lang === 'ru' ? 'Вес' : lang === 'kz' ? 'Салмақ' : 'Weight', value: `${cargoWeight}т` }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ fontSize: '13px', color: isDark ? '#B8B0A2' : '#5C6B7A', fontFamily: "'Inter', sans-serif" }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#E6E1D6' : '#1E2A3A', fontFamily: "'Manrope', sans-serif" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
                    border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
                    color: isDark ? '#B8B0A2' : '#5C6B7A',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {lang === 'ru' ? 'Отмена' : lang === 'kz' ? 'Бас тарту' : 'Cancel'}
                </button>
                <button
                  onClick={handleBook}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold btn-neon"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {lang === 'ru' ? 'Подтвердить' : lang === 'kz' ? 'Растау' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
