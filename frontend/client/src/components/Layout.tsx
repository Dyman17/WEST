// WEST — Neon Transit Layout
// Design: Cyberpunk Terminal
// Vertical left-rail sidebar (240px) + fixed header + main content
// Sidebar collapses to 64px on mobile

import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Map, Layers, BarChart3, Plus, Users, Star,
  Anchor, ArrowLeftRight, GraduationCap, Navigation,
  Sun, Moon, Menu, X, ChevronRight, Globe, LogIn, LogOut,
  Zap
} from 'lucide-react';
import AuthModal from './AuthModal';

const navItems = [
  { path: '/map', icon: Map, key: 'nav.map', group: 'carrier' },
  { path: '/tinder', icon: Layers, key: 'nav.tinder', group: 'carrier' },
  { path: '/backhaul', icon: ArrowLeftRight, key: 'nav.backhaul', group: 'carrier' },
  { path: '/booking', icon: Anchor, key: 'nav.booking', group: 'carrier' },
  { path: '/rating', icon: Star, key: 'nav.rating', group: 'carrier' },
  { path: '/onboarding', icon: GraduationCap, key: 'nav.onboarding', group: 'carrier' },
  { path: '/create-order', icon: Plus, key: 'nav.create_order', group: 'sender' },
  { path: '/carriers', icon: Users, key: 'nav.carriers', group: 'sender' },
  { path: '/tracking', icon: Navigation, key: 'nav.tracking', group: 'sender' },
  { path: '/dashboard', icon: BarChart3, key: 'nav.dashboard', group: 'admin' },
];

const languages = [
  { code: 'ru' as const, label: 'RU', full: 'Русский' },
  { code: 'kz' as const, label: 'KZ', full: 'Қазақша' },
  { code: 'en' as const, label: 'EN', full: 'English' },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme, visualMode, toggleVisualMode } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isDark = theme === 'dark';

  const handleLangChange = (code: typeof lang) => {
    setLang(code);
    setShowLangMenu(false);
    toast.success(t('common.language_changed'), {
      duration: 2000,
      style: {
        background: isDark ? '#111A2E' : '#fff',
        border: '1px solid rgba(200,169,106,0.3)',
        color: isDark ? '#E6E1D6' : '#1E2A3A',
      }
    });
  };

  const carrierItems = navItems.filter(i => i.group === 'carrier');
  const senderItems = navItems.filter(i => i.group === 'sender');
  const adminItems = navItems.filter(i => i.group === 'admin');

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? '' : 'light'}`}
      style={{ background: isDark ? '#0B1220' : '#F0E9DD' }}>

      {/* ── HEADER ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{
          background: isDark
            ? 'rgba(11,18,32,0.92)'
            : 'rgba(240,233,221,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: isDark
            ? '1px solid rgba(200,169,106,0.15)'
            : '1px solid rgba(47,74,109,0.15)',
        }}
      >
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex items-center gap-1.5">
              <Zap size={18} style={{ color: '#C8A96A', filter: 'drop-shadow(0 0 8px rgba(200,169,106,0.5))' }} />
              <span className="logo-text text-xl tracking-widest">WEST</span>
            </div>
          </Link>
          <span
            className="hidden sm:block text-xs font-mono px-2 py-0.5 rounded"
            style={{
              color: isDark ? '#B8B0A2' : '#5C6B7A',
              background: isDark ? 'rgba(34,49,79,0.6)' : 'rgba(92,107,122,0.1)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            NEON TRANSIT
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all"
              style={{
                color: isDark ? '#B8B0A2' : '#5C6B7A',
                background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
                border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Globe size={13} />
              <span>{lang.toUpperCase()}</span>
            </button>
            {showLangMenu && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50 min-w-[120px]"
                style={{
                  background: isDark ? '#111A2E' : '#fff',
                  border: isDark ? '1px solid rgba(200,169,106,0.25)' : '1px solid rgba(47,74,109,0.2)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleLangChange(l.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
                    style={{
                      color: lang === l.code ? '#C8A96A' : (isDark ? '#B8B0A2' : '#5C6B7A'),
                      background: lang === l.code
                        ? 'rgba(200,169,106,0.1)'
                        : 'transparent',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <span className="font-mono text-xs w-6">{l.label}</span>
                    <span>{l.full}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md transition-all"
            title={isDark ? t('header.theme_light') : t('header.theme_dark')}
            style={{
              color: isDark ? '#B8B0A2' : '#5C6B7A',
              background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
              border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={toggleVisualMode}
            className="p-2 rounded-md transition-all"
            title={visualMode === 'cyber' ? (lang === 'ru' ? 'Выключить кибер-режим' : lang === 'kz' ? 'Кибер режимін өшіру' : 'Disable cyber mode') : (lang === 'ru' ? 'Включить кибер-режим' : lang === 'kz' ? 'Кибер режимі' : 'Cyber mode')}
            style={{
              color: visualMode === 'cyber' ? '#FF3B3B' : (isDark ? '#B8B0A2' : '#5C6B7A'),
              background: visualMode === 'cyber' ? 'rgba(213,0,109,0.12)' : (isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)'),
              border: visualMode === 'cyber' ? '1px solid rgba(213,0,109,0.35)' : (isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)'),
              boxShadow: visualMode === 'cyber' ? '0 0 16px rgba(213,0,109,0.25)' : undefined,
            }}
          >
            <Zap size={16} />
          </button>

          {user ? (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all"
              style={{
                fontFamily: "'Manrope', sans-serif",
                color: isDark ? '#E6E1D6' : '#1E2A3A',
                background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(92,107,122,0.08)',
                border: isDark ? '1px solid rgba(34,49,79,0.8)' : '1px solid rgba(92,107,122,0.2)',
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: isDark ? 'rgba(200,169,106,0.14)' : 'rgba(47,74,109,0.1)',
                  color: isDark ? '#C8A96A' : '#2F4A6D',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {(user.name || user.username || user.email || 'W')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="max-w-[160px] truncate">{user.name}</span>
              <button
                onClick={logout}
                className="ml-1 inline-flex items-center justify-center rounded-md p-1 transition-colors"
                style={{ color: isDark ? '#B8B0A2' : '#5C6B7A' }}
                title={lang === 'ru' ? 'Выйти' : lang === 'kz' ? 'Шығу' : 'Logout'}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all btn-neon"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <LogIn size={14} />
              <span>{t('header.login')}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── BODY: sidebar + content ── */}
      <div className="flex flex-1 pt-14">

        {/* ── SIDEBAR ── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed left-0 top-14 bottom-0 z-40 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-200
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{
              width: '240px',
              background: isDark ? '#0B1220' : '#F5F0E6',
              borderRight: isDark
                ? '1px solid rgba(34,49,79,0.8)'
                : '1px solid rgba(47,74,109,0.12)',
            }}
          >
            <div className="flex flex-col flex-1 p-3 gap-1">

              {/* Carrier section */}
              <div className="mb-1">
                <div
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{
                    color: isDark ? 'rgba(184,176,162,0.5)' : 'rgba(92,107,122,0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                  }}
                >
                  {t('role.carrier')}
                </div>
                {carrierItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span className="nav-label">{t(item.key)}</span>
                      {isActive && (
                        <ChevronRight size={14} className="ml-auto" style={{ color: '#C8A96A' }} />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.1)', margin: '4px 8px' }} />

              {/* Sender section */}
              <div className="mb-1">
                <div
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{
                    color: isDark ? 'rgba(184,176,162,0.5)' : 'rgba(92,107,122,0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                  }}
                >
                  {t('role.sender')}
                </div>
                {senderItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span className="nav-label">{t(item.key)}</span>
                      {isActive && (
                        <ChevronRight size={14} className="ml-auto" style={{ color: '#C8A96A' }} />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.1)', margin: '4px 8px' }} />

              {/* Admin section */}
              <div>
                <div
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{
                    color: isDark ? 'rgba(184,176,162,0.5)' : 'rgba(92,107,122,0.5)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                  }}
                >
                  Акимат
                </div>
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span className="nav-label">{t(item.key)}</span>
                      {isActive && (
                        <ChevronRight size={14} className="ml-auto" style={{ color: '#C8A96A' }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sidebar footer */}
            <div
              className="p-3 border-t"
              style={{ borderColor: isDark ? 'rgba(34,49,79,0.8)' : 'rgba(47,74,109,0.12)' }}
            >
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                style={{
                  background: isDark ? 'rgba(79,191,159,0.06)' : 'rgba(0,139,116,0.06)',
                  border: isDark ? '1px solid rgba(79,191,159,0.15)' : '1px solid rgba(0,139,116,0.15)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#4FBF9F', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: isDark ? '#4FBF9F' : '#2E8B7D',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {t('common.online')} · MVP v1.0
                </span>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 min-h-0 overflow-auto"
          style={{ marginLeft: '240px' }}
        >
          <style>{`
            @media (max-width: 1023px) {
              main { margin-left: 0 !important; }
            }
          `}</style>
          {children}
        </main>
      </div>

      {/* Click outside to close lang menu */}
      {showLangMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLangMenu(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(email) => {
          toast.success(`${lang === 'ru' ? 'Вы вошли как' : lang === 'kz' ? 'Сіз кірдіңіз' : 'Logged in as'} ${email}`, {
            style: {
              background: isDark ? '#111A2E' : '#fff',
              border: '1px solid rgba(79,191,159,0.3)',
              color: isDark ? '#E6E1D6' : '#1E2A3A',
            }
          });
        }}
        onRegisterSuccess={(email, userType) => {
          toast.success(`${lang === 'ru' ? 'Аккаунт создан' : lang === 'kz' ? 'Аккаунт құрылды' : 'Account created'}`, {
            style: {
              background: isDark ? '#111A2E' : '#fff',
              border: '1px solid rgba(79,191,159,0.3)',
              color: isDark ? '#E6E1D6' : '#1E2A3A',
            }
          });
        }}
      />
    </div>
  );
}
