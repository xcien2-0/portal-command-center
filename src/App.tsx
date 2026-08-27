import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index.tsx";
import ReportesGobierno from "./pages/ReportesGobierno.tsx";
import CallCenter from "./pages/CallCenter.tsx";
import ReporteImpacto from "./pages/ReporteImpacto.tsx";
import Gerencia from "./pages/Gerencia.tsx";
import Scan from "./pages/Scan.tsx";
import NOC from "./pages/NOC.tsx";
import Dispatch from "./pages/Dispatch.tsx";
import NotFound from "./pages/NotFound.tsx";
import AcademiaLayout from "./pages/academia/AcademiaLayout.tsx";
import AcademiaDashboard from "./pages/academia/AcademiaDashboard.tsx";
import AcademiaModulos from "./pages/academia/AcademiaModulos.tsx";
import AcademiaExamenes from "./pages/academia/AcademiaExamenes.tsx";
import AcademiaPerfil from "./pages/academia/AcademiaPerfil.tsx";
import AcademiaLeaderboard from "./pages/academia/AcademiaLeaderboard.tsx";
import AcademiaAdmin from "./pages/academia/AcademiaAdmin.tsx";
import Docs from "./pages/Docs.tsx";
import Xcien2Page from "./pages/xcien2/index.tsx";
import Plan2026Page from "./pages/Plan2026Page.tsx";
import InvitePage from "./pages/InvitePage.tsx";
import Migracion from "./pages/Migracion.tsx";
import Metricas from "./pages/Metricas.tsx";
import Bitacora from "./pages/Bitacora.tsx";
import CiudadOSPage from "./pages/CiudadOSPage.tsx";
import { useViewMode } from "./contexts/ViewModeContext.tsx";
import { ViewModeProvider } from "./contexts/ViewModeContext.tsx";
import { AuthProvider, RequireAuth, useAuth } from "./contexts/AuthContext.tsx";
import { AnalyticsProvider } from "./contexts/AnalyticsContext.tsx";
import Login from "./pages/Login.tsx";
import { DEFAULT_THEME } from "./pages/xcien2/types.ts";

function UserBadge() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 ml-2">
      <span className="text-[11px]" style={{ color: '#5a6a7a' }}>
        {user.nombre.split(' ')[0]} · <span style={{ color: '#00C896' }}>{user.rol}</span>
      </span>
      <button
        onClick={logout}
        className="text-[11px] px-2 py-0.5 rounded"
        style={{ color: '#5a6a7a', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
      >
        Salir
      </button>
    </div>
  );
}

function HeaderActions() {
  const { mode, toggleMode } = useViewMode();
  return (
    <button
      onClick={toggleMode}
      className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border transition-colors"
      style={{
        backgroundColor: mode === 'holo' ? 'rgba(0,180,216,0.1)' : 'transparent',
        borderColor: mode === 'holo' ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.1)',
        color: mode === 'holo' ? '#00B4D8' : '#94a3b8'
      }}
    >
      {mode === 'holo' ? '✨ Vista Holo Activa' : 'Vista Clásica'}
    </button>
  );
}

const queryClient = new QueryClient();

const getGlobalTheme = () => {
  try {
    const saved = localStorage.getItem('app_theme');
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
};

const App = () => (
  <ViewModeProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <AnalyticsProvider>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Main Hub — / redirige al portal */}
          <Route path="/" element={<Navigate to="/portal" replace />} />
          <Route path="/hub" element={<Index />} />
          <Route path="/portal" element={<RequireAuth><Xcien2Page /></RequireAuth>} />
          <Route path="/invite" element={<InvitePage />} />

          {/* City OS — standalone público, sin auth */}
          <Route path="/pdn" element={<CiudadOSPage />} />

          {/* Full-screen routes (no sidebar) — protegidas */}
          <Route path="/plan2026" element={<RequireAuth><Plan2026Page /></RequireAuth>} />
          <Route path="/gerencia" element={<RequireAuth><Gerencia /></RequireAuth>} />
          <Route path="/scan" element={<RequireAuth><Scan /></RequireAuth>} />
          <Route path="/noc" element={<RequireAuth><NOC /></RequireAuth>} />
          <Route path="/dispatch" element={<RequireAuth><Dispatch /></RequireAuth>} />
          <Route path="/academia" element={<AcademiaLayout />}>
            <Route index element={<AcademiaDashboard />} />
            <Route path="modulos" element={<AcademiaModulos />} />
            <Route path="examenes" element={<AcademiaExamenes />} />
            <Route path="perfil" element={<AcademiaPerfil />} />
            <Route path="leaderboard" element={<AcademiaLeaderboard />} />
            <Route path="admin" element={<AcademiaAdmin />} />
          </Route>

          {/* Classic shell with sidebar — protegido */}
          <Route path="*" element={
            <RequireAuth><SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="h-10 flex items-center border-b border-border bg-background px-2">
                    <SidebarTrigger />
                    <HeaderActions />
                    <UserBadge />
                  </header>
                  <main className="flex-1">
                    <Routes>
                      <Route path="/call-center" element={<CallCenter />} />
                      <Route path="/reportes-gobierno" element={<ReportesGobierno />} />
                      <Route path="/reporte-impacto" element={<ReporteImpacto />} />
                      <Route path="/docs" element={<Docs />} />
                      <Route path="/migracion" element={<Migracion />} />
                      <Route path="/metricas" element={<Metricas />} />
                      <Route path="/bitacora" element={<Bitacora />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider></RequireAuth>
          } />
        </Routes>
        </AnalyticsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ViewModeProvider>
);

export default App;
