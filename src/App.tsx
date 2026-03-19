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
import PitchDeck from "./pages/PitchDeck.tsx";
import Gerencia from "./pages/Gerencia.tsx";
import NotFound from "./pages/NotFound.tsx";

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
