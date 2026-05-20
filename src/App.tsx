import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import InvitePage from "./pages/InvitePage.tsx";
import { useViewMode } from "./contexts/ViewModeContext.tsx";
import { ViewModeProvider } from "./contexts/ViewModeContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import Login from "./pages/Login.tsx";
import AccesoDenegado from "./pages/AccesoDenegado.tsx";
import ClienteLayout from "./pages/cliente/ClienteLayout.tsx";
import ClienteHome from "./pages/cliente/ClienteHome.tsx";
import ClienteTickets from "./pages/cliente/ClienteTickets.tsx";
import ClienteSLA from "./pages/cliente/ClienteSLA.tsx";
import FloatingChat from "./pages/xcien2/sections/FloatingChat.tsx";
import { DEFAULT_THEME } from "./pages/xcien2/types.ts";
import { useAuth } from "./contexts/AuthContext.tsx";

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
    const saved = localStorage.getItem('xcien2_theme');
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
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/acceso-denegado" element={<AccesoDenegado />} />

              {/* Cliente portal — protected */}
              <Route element={<ProtectedRoute requiredPortal="cliente" />}>
                <Route path="/cliente" element={<ClienteLayout />}>
                  <Route index element={<ClienteHome />} />
                  <Route path="tickets" element={<ClienteTickets />} />
                  <Route path="sla" element={<ClienteSLA />} />
                  {/* Placeholder routes for nav items */}
                  <Route path="servicio" element={<ClienteHome />} />
                  <Route path="soporte" element={<ClienteTickets />} />
                </Route>
              </Route>

              {/* Empleado portal — all existing routes wrapped */}
              <Route element={<ProtectedRoute requiredPortal="empleado" />}>
                <Route path="/" element={<Index />} />
                <Route path="/xcien2" element={<Xcien2Page />} />
                <Route path="/invite" element={<InvitePage />} />
                <Route path="/gerencia" element={<Gerencia />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/noc" element={<NOC />} />
                <Route path="/dispatch" element={<Dispatch />} />
                <Route path="/academia" element={<AcademiaLayout />}>
                  <Route index element={<AcademiaDashboard />} />
                  <Route path="modulos" element={<AcademiaModulos />} />
                  <Route path="examenes" element={<AcademiaExamenes />} />
                  <Route path="perfil" element={<AcademiaPerfil />} />
                  <Route path="leaderboard" element={<AcademiaLeaderboard />} />
                  <Route path="admin" element={<AcademiaAdmin />} />
                </Route>

                {/* Fallback for classic shell modules */}
                <Route path="*" element={
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col min-w-0">
                        <header className="h-10 flex items-center border-b border-border bg-background px-2">
                          <SidebarTrigger />
                          <HeaderActions />
                        </header>
                        <main className="flex-1">
                          <Routes>
                            <Route path="/call-center" element={<CallCenter />} />
                            <Route path="/reportes-gobierno" element={<ReportesGobierno />} />
                            <Route path="/reporte-impacto" element={<ReporteImpacto />} />
                            <Route path="/docs" element={<Docs />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                } />
              </Route>
            </Routes>
            <FloatingChatConditional />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ViewModeProvider>
);

// Only show FloatingChat for empleados
function FloatingChatConditional() {
  const theme = getGlobalTheme();
  const { portalType } = useAuth();
  if (portalType === 'cliente') return null;
  return <FloatingChat theme={theme} />;
}

export default App;
