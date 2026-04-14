import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index.tsx";
import RedEnVivo from "./pages/RedEnVivo.tsx";
import ReportesGobierno from "./pages/ReportesGobierno.tsx";
import CocoBoxMonitor from "./pages/CocoBoxMonitor.tsx";
import CocoOnboarding from "./pages/CocoOnboarding.tsx";
import CallCenter from "./pages/CallCenter.tsx";
import NocVip from "./pages/NocVip.tsx";
import ReporteImpacto from "./pages/ReporteImpacto.tsx";
import IBlackPortal from "./pages/IBlackPortal.tsx";
import PitchDeck from "./pages/PitchDeck.tsx";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Full-screen route (no sidebar) */}
          <Route path="/pitch" element={<PitchDeck />} />
          <Route path="/gerencia" element={<Gerencia />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/noc" element={<NOC />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/iblack/*" element={<IBlackPortal />} />
          <Route path="/academia" element={<AcademiaLayout />}>
            <Route index element={<AcademiaDashboard />} />
            <Route path="modulos" element={<AcademiaModulos />} />
            <Route path="examenes" element={<AcademiaExamenes />} />
            <Route path="perfil" element={<AcademiaPerfil />} />
            <Route path="leaderboard" element={<AcademiaLeaderboard />} />
            <Route path="admin" element={<AcademiaAdmin />} />
          </Route>
          {/* Main app with sidebar */}
          <Route path="*" element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <header className="h-10 flex items-center border-b border-border bg-background px-2">
                    <SidebarTrigger />
                  </header>
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/red-en-vivo" element={<RedEnVivo />} />
                      <Route path="/coco-monitor" element={<CocoBoxMonitor />} />
                      <Route path="/coco-onboarding" element={<CocoOnboarding />} />
                      <Route path="/call-center" element={<CallCenter />} />
                      <Route path="/noc-vip" element={<NocVip />} />
                      <Route path="/reportes-gobierno" element={<ReportesGobierno />} />
                      <Route path="/reporte-impacto" element={<ReporteImpacto />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
