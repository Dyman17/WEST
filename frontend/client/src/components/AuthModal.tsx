// WEST — Neon Transit: Auth Modal
// Design: Cyberpunk Terminal — Glassmorphism login/register modal
// Features: Email/password login, full registration form with role selection

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { backend, setAuthToken } from '@/lib/backend';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (email: string) => void;
  onRegisterSuccess?: (email: string, userType: 'carrier' | 'shipper') => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
}: AuthModalProps) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const isDark = theme === 'dark';

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regUserType, setRegUserType] = useState<'carrier' | 'shipper'>('carrier');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error(lang === 'ru' ? 'Заполните все поля' : lang === 'kz' ? 'Барлық өрістерді толтырыңыз' : 'Fill all fields', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      return;
    }

    setLoginLoading(true);
    try {
      const auth = await backend.login(loginEmail, loginPassword);
      setAuthToken(auth.token);
      toast.success('Logged in successfully', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(79,191,159,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      onLoginSuccess?.(auth.user.email);
      onClose();
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!regFirstName || !regLastName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      toast.error(lang === 'ru' ? 'Заполните все поля' : lang === 'kz' ? 'Барлық өрістерді толтырыңыз' : 'Fill all fields', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error(lang === 'ru' ? 'Пароли не совпадают' : lang === 'kz' ? 'Құпия сөздер сәйкес емес' : 'Passwords do not match', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      return;
    }

    if (regPassword.length < 6) {
      toast.error(lang === 'ru' ? 'Пароль должен быть минимум 6 символов' : lang === 'kz' ? 'Құпия сөз кемінде 6 таңба болуы керек' : 'Password must be at least 6 characters', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      return;
    }

    setRegLoading(true);
    const username = `${regFirstName}.${regLastName}`
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase() || regEmail.split("@")[0];

    try {
      const auth = await backend.register({
        email: regEmail,
        username,
        password: regPassword,
        name: `${regFirstName} ${regLastName}`.trim(),
        role: regUserType,
        company: regPhone,
      });
      setAuthToken(auth.token);
      toast.success('Account created successfully', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(79,191,159,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
      onRegisterSuccess?.(auth.user.email, regUserType);
      onClose();
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegUserType('carrier');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed', {
        style: {
          background: isDark ? '#111A2E' : '#fff',
          border: '1px solid rgba(224,90,90,0.3)',
          color: isDark ? '#E6E1D6' : '#1E2A3A',
        }
      });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(17,26,46,0.95) 0%, rgba(30,20,50,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,233,221,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: isDark
                  ? '1px solid rgba(200,169,106,0.3)'
                  : '1px solid rgba(47,74,109,0.2)',
                boxShadow: isDark
                  ? '0 20px 60px rgba(200,169,106,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 20px 60px rgba(47,74,109,0.15)',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg transition-colors z-10"
                style={{
                  background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.08)',
                  color: isDark ? '#B8B0A2' : '#5C6B7A',
                }}
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.1)' }}>
                <h2
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: isDark ? '#E6E1D6' : '#1E2A3A',
                  }}
                >
                  WEST
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: isDark ? '#B8B0A2' : '#5C6B7A',
                    fontFamily: "'Inter', sans-serif",
                    marginTop: '4px',
                  }}
                >
                  {lang === 'ru' ? 'Логистическая платформа' : lang === 'kz' ? 'Логистикалық платформа' : 'Logistics Platform'}
                </p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="w-full rounded-none border-b" style={{ background: 'transparent', borderColor: isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.1)' }}>
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-b-2"
                    style={{
                      borderColor: 'transparent',
                      color: isDark ? '#B8B0A2' : '#5C6B7A',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {lang === 'ru' ? 'Вход' : lang === 'kz' ? 'Кіру' : 'Login'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-b-2"
                    style={{
                      borderColor: 'transparent',
                      color: isDark ? '#B8B0A2' : '#5C6B7A',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {lang === 'ru' ? 'Регистрация' : lang === 'kz' ? 'Тіркеу' : 'Register'}
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="p-6 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: '#C8A96A' }}
                        />
                        <Input
                          type="email"
                          placeholder={lang === 'ru' ? 'your@email.com' : lang === 'kz' ? 'your@email.com' : 'your@email.com'}
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          className="pl-9 border-0 h-10"
                          style={{
                            background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                            color: isDark ? '#E6E1D6' : '#1E2A3A',
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Пароль' : lang === 'kz' ? 'Құпия сөз' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: '#6FA3FF' }}
                        />
                        <Input
                          type="password"
                          placeholder="••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="pl-9 border-0 h-10"
                          style={{
                            background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                            color: isDark ? '#E6E1D6' : '#1E2A3A',
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full h-10 font-semibold mt-6"
                      style={{
                        background: loginLoading
                          ? 'rgba(200,169,106,0.5)'
                          : 'linear-gradient(135deg, #C8A96A 0%, #6FA3FF 100%)',
                        color: '#fff',
                        border: 'none',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {loginLoading ? '...' : (lang === 'ru' ? 'Войти' : lang === 'kz' ? 'Кіру' : 'Sign In')}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <form onSubmit={handleRegister} className="space-y-3">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Имя' : lang === 'kz' ? 'Аты' : 'First Name'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={lang === 'ru' ? 'Иван' : lang === 'kz' ? 'Иван' : 'John'}
                        value={regFirstName}
                        onChange={e => setRegFirstName(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Фамилия' : lang === 'kz' ? 'Тегі' : 'Last Name'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={lang === 'ru' ? 'Иванов' : lang === 'kz' ? 'Иванов' : 'Doe'}
                        value={regLastName}
                        onChange={e => setRegLastName(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Телефон' : lang === 'kz' ? 'Телефон' : 'Phone'}
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+7 (700) 123-45-67"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Пароль' : lang === 'kz' ? 'Құпия сөз' : 'Password'}
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••••"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Подтверждение пароля' : lang === 'kz' ? 'Құпия сөзді растау' : 'Confirm Password'}
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••••"
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        className="border-0 h-9"
                        style={{
                          background: isDark ? 'rgba(34,49,79,0.5)' : 'rgba(47,74,109,0.06)',
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      />
                    </div>

                    {/* User Type Selection */}
                    <div className="space-y-2 pt-2">
                      <Label
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isDark ? '#E6E1D6' : '#1E2A3A',
                        }}
                      >
                        {lang === 'ru' ? 'Тип пользователя' : lang === 'kz' ? 'Пайдаланушы түрі' : 'User Type'}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegUserType('carrier')}
                          className="p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                          style={{
                            borderColor: regUserType === 'carrier' ? '#C8A96A' : isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.15)',
                            background: regUserType === 'carrier'
                              ? isDark ? 'rgba(200,169,106,0.15)' : 'rgba(200,169,106,0.1)'
                              : isDark ? 'rgba(34,49,79,0.3)' : 'rgba(47,74,109,0.05)',
                            color: regUserType === 'carrier' ? '#C8A96A' : isDark ? '#B8B0A2' : '#5C6B7A',
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <Truck size={14} />
                          {lang === 'ru' ? 'Перевозчик' : lang === 'kz' ? 'Тасымалдаушы' : 'Carrier'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegUserType('shipper')}
                          className="p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2"
                          style={{
                            borderColor: regUserType === 'shipper' ? '#4FBF9F' : isDark ? 'rgba(34,49,79,0.6)' : 'rgba(47,74,109,0.15)',
                            background: regUserType === 'shipper'
                              ? isDark ? 'rgba(79,191,159,0.15)' : 'rgba(79,191,159,0.1)'
                              : isDark ? 'rgba(34,49,79,0.3)' : 'rgba(47,74,109,0.05)',
                            color: regUserType === 'shipper' ? '#4FBF9F' : isDark ? '#B8B0A2' : '#5C6B7A',
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <Package size={14} />
                          {lang === 'ru' ? 'Грузоотправитель' : lang === 'kz' ? 'Жүк жіберуші' : 'Shipper'}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={regLoading}
                      className="w-full h-10 font-semibold mt-4"
                      style={{
                        background: regLoading
                          ? 'rgba(79,191,159,0.5)'
                          : 'linear-gradient(135deg, #4FBF9F 0%, #4FBF9F 100%)',
                        color: '#0B1220',
                        border: 'none',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {regLoading ? '...' : (lang === 'ru' ? 'Создать аккаунт' : lang === 'kz' ? 'Аккаунт құру' : 'Create Account')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
