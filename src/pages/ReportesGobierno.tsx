import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ResumenEjecutivo } from '@/components/gobierno/ResumenEjecutivo';
import { TablaDisponibilidad } from '@/components/gobierno/TablaDisponibilidad';
import { ObservacionesEjecutivas } from '@/components/gobierno/ObservacionesEjecutivas';
import { RegistroIncidentes } from '@/components/gobierno/RegistroIncidentes';
import { CumplimientoSLA } from '@/components/gobierno/CumplimientoSLA';
import { HistorialReportes } from '@/components/gobierno/HistorialReportes';
import {
  generateDailyAvailability,
  MOCK_GOB_INCIDENTS,
  MOCK_SLA_TERMS,
  MOCK_REPORT_HISTORY,
  MONTHS_ES,
  type GeneratedReport,
} from '@/data/mockGobiernoData';
import { generateGobPDF } from '@/utils/generateGobPDF';

export default function ReportesGobierno() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [reports, setReports] = useState(MOCK_REPORT_HISTORY);

  // TODO: connect to Supabase or API for real availability data
  const dailyData = useMemo(() => generateDailyAvailability(year, month), [year, month]);

  const disponibilidad = useMemo(() => {
    const avg = dailyData.reduce((s, d) => s + d.disponibilidad, 0) / dailyData.length;
    return parseFloat(avg.toFixed(1));
  }, [dailyData]);

  const slaCumplido = disponibilidad >= 99.5;
  const incidentesRegistrados = MOCK_GOB_INCIDENTS.length;
  const tiempoPromedioResolucion = '47 min';

  const handleGeneratePDF = useCallback(() => {
    setPdfGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      generateGobPDF(
        month, year, disponibilidad, slaCumplido,
        incidentesRegistrados, tiempoPromedioResolucion,
        dailyData, MOCK_GOB_INCIDENTS, MOCK_SLA_TERMS,
      );
      // Add to history
      const newReport: GeneratedReport = {
        id: `r-${Date.now()}`,
        periodo: `${MONTHS_ES[month]} ${year}`,
        folio: `RPT-GOB-${year}-${String(month + 1).padStart(2, '0')}`,
        generadoPor: 'Sistema automático',
        fecha: new Date().toLocaleString('es-MX'),
        disponibilidad,
        estado: 'completado',
      };
      setReports(prev => [newReport, ...prev]);
      setPdfGenerating(false);
    }, 1500);
  }, [month, year, disponibilidad, slaCumplido, dailyData]);

  const handleDownloadReport = useCallback((report: GeneratedReport) => {
    // TODO: connect to Supabase storage to download stored PDFs
    alert(`Descargando reporte: ${report.folio}`);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* GOB Header */}
      <div className="border-b border-gob-navy/10 bg-gradient-to-r from-gob-navy/5 to-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-gob-navy text-white font-bold text-xs px-2">GOB</Badge>
            <h1 className="text-xl font-bold text-gob-navy">Reportes de Gobierno</h1>
          </div>
          <div className="text-xs text-gob-navy/50">
            Portal Gubernamental — Gobierno del Estado de Nuevo León
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <ResumenEjecutivo
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
          disponibilidad={disponibilidad}
          slaCumplido={slaCumplido}
          incidentesRegistrados={incidentesRegistrados}
          tiempoPromedioResolucion={tiempoPromedioResolucion}
          onGeneratePDF={handleGeneratePDF}
          pdfGenerating={pdfGenerating}
        />

        <Separator className="bg-gob-navy/10" />

        <TablaDisponibilidad data={dailyData} />

        <Separator className="bg-gob-navy/10" />

        <RegistroIncidentes incidents={MOCK_GOB_INCIDENTS} />

        <Separator className="bg-gob-navy/10" />

        <CumplimientoSLA terms={MOCK_SLA_TERMS} />

        <Separator className="bg-gob-navy/10" />

        <HistorialReportes reports={reports} onDownload={handleDownloadReport} />
      </div>
    </div>
  );
}
