import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Building2, Lock, Mail, Phone, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleShell } from "@/config/roleShells";
import type { BackendUserRole } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const registerRoles: BackendUserRole[] = ["carrier", "shipper"];

export default function AuthPage() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const { login, register } = useAuth();
  const [location, setLocation] = useLocation();
  const isDark = theme === "dark";
  const initialTab = (location === "/register" || location.includes("tab=register"))
    ? "register"
    : "login";
  const [authTab, setAuthTab] = useState<"login" | "register">(initialTab);

  useEffect(() => {
    setAuthTab(location === "/register" || location.includes("tab=register") ? "register" : "login");
  }, [location]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regUserType, setRegUserType] = useState<BackendUserRole>("carrier");
  const [regLoading, setRegLoading] = useState(false);

  const notify = (message: string, ok = true) => {
    toast[ok ? "success" : "error"](message, {
      style: {
        background: isDark ? "#111A2E" : "#fff",
        border: "1px solid rgba(200,169,106,0.3)",
        color: isDark ? "#E6E1D6" : "#1E2A3A",
      },
    });
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      notify(lang === "ru" ? "Заполните все поля" : lang === "kz" ? "Барлық өрістерді толтырыңыз" : "Fill all fields", false);
      return;
    }

    setLoginLoading(true);
    try {
      const auth = await login({ login: loginEmail, password: loginPassword });
      setLocation(getRoleShell(auth.user.role).homePath);
      notify(lang === "ru" ? "Вход выполнен" : lang === "kz" ? "Кіру орындалды" : "Logged in");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Login failed", false);
    } finally {
      setLoginLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFirstName || !regLastName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      notify(lang === "ru" ? "Заполните все поля" : lang === "kz" ? "Барлық өрістерді толтырыңыз" : "Fill all fields", false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      notify(lang === "ru" ? "Пароли не совпадают" : lang === "kz" ? "Құпия сөздер сәйкес емес" : "Passwords do not match", false);
      return;
    }

    if (regPassword.length < 6) {
      notify(lang === "ru" ? "Пароль должен быть минимум 6 символов" : lang === "kz" ? "Құпия сөз кемінде 6 таңба болуы керек" : "Password must be at least 6 characters", false);
      return;
    }

    setRegLoading(true);
    try {
      const username = `${regFirstName}.${regLastName}`
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase() || regEmail.split("@")[0];

      const auth = await register({
        email: regEmail,
        username,
        password: regPassword,
        name: `${regFirstName} ${regLastName}`.trim(),
        role: regUserType,
        company: regPhone,
      });
      setLocation(getRoleShell(auth.user.role).homePath);
      notify(lang === "ru" ? "Аккаунт создан" : lang === "kz" ? "Аккаунт құрылды" : "Account created");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Registration failed", false);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: isDark ? "#0A0A0F" : "#F0E9DD" }}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl grid lg:grid-cols-[1.1fr_0.9fr]"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(17,26,46,0.96) 0%, rgba(20,12,32,0.96) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(240,233,221,0.94) 100%)",
          borderColor: isDark ? "rgba(200,169,106,0.22)" : "rgba(47,74,109,0.15)",
        }}
      >
        <div className="p-8 lg:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r" style={{ borderColor: isDark ? "rgba(34,49,79,0.65)" : "rgba(47,74,109,0.12)" }}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(200,169,106,0.12)" }}>
                <Truck size={20} style={{ color: "#C8A96A" }} />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-widest">WEST</div>
                <div className="text-xs uppercase tracking-[0.3em]" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                  Logistics Access
                </div>
              </div>
            </div>

            <h1 className="text-3xl lg:text-5xl font-semibold leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {lang === "ru"
                ? "Вход в изолированную панель по роли"
                : lang === "kz"
                  ? "Рөлге байланысты оқшауланған панель"
                  : "Role-isolated access panel"}
            </h1>
            <p className="mt-4 max-w-xl text-sm lg:text-base" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A", lineHeight: 1.7 }}>
              {lang === "ru"
                ? "Сначала пользователь входит или регистрируется. Потом система открывает только тот интерфейс, который соответствует его роли: перевозчик, отправитель или акимат."
                : lang === "kz"
                  ? "Әуелі пайдаланушы кіреді немесе тіркеледі. Содан кейін жүйе тек рөліне сай интерфейсті ашады: тасымалдаушы, жіберуші немесе әкімдік."
                  : "First the user signs in or registers. Then the system opens only the interface that matches the account role: carrier, shipper, or akimat."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["carrier", "Freight Tinder", "map + load search"],
              ["shipper", "Create Order", "orders + tracking"],
              ["admin", "Akimat", "dashboard only"],
            ].map(([key, title, desc]) => (
              <div key={key} className="rounded-2xl p-4 border" style={{ background: isDark ? "rgba(34,49,79,0.28)" : "rgba(92,107,122,0.06)", borderColor: isDark ? "rgba(34,49,79,0.8)" : "rgba(47,74,109,0.12)" }}>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs mt-1" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "login" | "register")} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6" style={{ background: isDark ? "rgba(34,49,79,0.45)" : "rgba(92,107,122,0.08)" }}>
              <TabsTrigger value="login">{lang === "ru" ? "Вход" : lang === "kz" ? "Кіру" : "Login"}</TabsTrigger>
              <TabsTrigger value="register">{lang === "ru" ? "Регистрация" : lang === "kz" ? "Тіркеу" : "Register"}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input className="pl-9" type="email" placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{lang === "ru" ? "Пароль" : lang === "kz" ? "Құпия сөз" : "Password"}</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input className="pl-9" type="password" placeholder="••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "..." : (lang === "ru" ? "Войти" : lang === "kz" ? "Кіру" : "Sign In")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={onRegister} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{lang === "ru" ? "Имя" : lang === "kz" ? "Аты" : "First Name"}</Label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input className="pl-9" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ru" ? "Фамилия" : lang === "kz" ? "Тегі" : "Last Name"}</Label>
                    <Input value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input className="pl-9" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{lang === "ru" ? "Телефон / компания" : lang === "kz" ? "Телефон / компания" : "Phone / company"}</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input className="pl-9" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{lang === "ru" ? "Роль" : lang === "kz" ? "Рөл" : "Role"}</Label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                    <select
                      className="w-full h-10 rounded-md border bg-background pl-9 pr-3 text-sm"
                      value={regUserType}
                      onChange={(e) => setRegUserType(e.target.value as BackendUserRole)}
                    >
                      {registerRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{lang === "ru" ? "Пароль" : lang === "kz" ? "Құпия сөз" : "Password"}</Label>
                    <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ru" ? "Повтор пароля" : lang === "kz" ? "Қайталау" : "Confirm"}</Label>
                    <Input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={regLoading}>
                  {regLoading ? "..." : (lang === "ru" ? "Создать аккаунт" : lang === "kz" ? "Аккаунт құру" : "Create account")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
