// WEST — Neon Transit
// Design: Cyberpunk Terminal — Asymmetric split-screen, neon magenta on deep black
// Layout: Vertical left-rail sidebar + main content area

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ShellLayout from "./components/ShellLayout";
import { getRoleShell } from "./config/roleShells";
import { useEffect } from "react";
import { useLocation } from "wouter";

function RoleRouter() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const shell = getRoleShell(user?.role ?? "shipper");
  const allowedPaths = new Set(shell.routes.map((route) => route.path));

  useEffect(() => {
    if (!user) return;
    const current = location.replace(/\/+$/, "") || "/";
    if (!allowedPaths.has(current)) {
      setLocation(shell.homePath);
    }
  }, [allowedPaths, location, setLocation, shell.homePath, user]);

  if (!user) return null;

  return (
    <ShellLayout
      user={user}
      homePath={shell.homePath}
      sections={shell.sections}
      showSidebar={shell.showSidebar}
      onLogout={logout}
    >
      <Switch>
        {shell.routes.map((route) => (
          <Route key={route.path} path={route.path} component={route.component} />
        ))}
        <Route path="/404" component={NotFound} />
        <Route component={() => null} />
      </Switch>
    </ShellLayout>
  );
}

function PublicRouter() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const normalized = location.replace(/\/+$/, "") || "/";
    if (normalized !== "/" && !normalized.startsWith("/auth") && !normalized.startsWith("/login") && !normalized.startsWith("/register")) {
      setLocation("/");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/" component={HomePage} />
      <Route component={HomePage} />
    </Switch>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-70">Loading WEST...</div>
      </div>
    );
  }

  if (!user) {
    return <PublicRouter />;
  }

  return <RoleRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AppRouter />
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
