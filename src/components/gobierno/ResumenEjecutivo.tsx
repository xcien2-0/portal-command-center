import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { MONTHS_ES } from '@/data/mockGobiernoData';

interface ResumenEjecutivoProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  disponibilidad: number;
  slaCumplido: boolean;
  incidentesRegistrados: number;
  tiempoPromedioResolucion: string;
  onGeneratePDF: () => void;
  pdfGenerating: boolean;
}

export function ResumenEjecutivo({
  month, year, onMonthChange, onYearChange,
  disponibilidad, slaCumplido, incidentesRegistrados,
  tiempoPromedioResolucion, onGeneratePDF, pdfGenerating,
}: ResumenEjecutivoProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gob-navy">Resumen Ejecutivo</h2>
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={v => onMonthChange(Number(v))}>
              <SelectTrigger className="w-[140px] h-8 text-sm border-gob-navy/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS_ES.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => onYearChange(Number(v))}>
              <SelectTrigger className="w-[100px] h-8 text-sm border-gob-navy/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={onGeneratePDF}
          disabled={pdfGenerating}
          className="bg-gob-navy hover:bg-gob-navy/90 text-white"
        >
          {pdfGenerating ? (
            <><Clock className="h-4 w-4 animate-spin" /> Generando...</>
          ) : (
            <><FileText className="h-4 w-4" /> Generar Reporte PDF</>
          )}
        </Button>
      </div>

      {pdfGenerating && (
        <div className="mb-4 px-4 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" /> Generando reporte...
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Disponibilidad del servicio"
          value={`${disponibilidad}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          color={disponibilidad >= 99.5 ? 'text-status-ok' : disponibilidad >= 98 ? 'text-status-warning' : 'text-status-critical'}
        />
        <KPICard
          label="SLA cumplido"
          value={slaCumplido ? 'Sí' : 'No'}
          icon={slaCumplido ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          color={slaCumplido ? 'text-status-ok' : 'text-status-critical'}
          chip={slaCumplido}
        />
        <KPICard
          label="Incidentes registrados"
          value={String(incidentesRegistrados)}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="text-gob-navy"
        />
        <KPICard
          label="Tiempo prom. de resolución"
          value={tiempoPromedioResolucion}
          icon={<Clock className="h-5 w-5" />}
          color="text-gob-navy"
        />
      </div>
    </section>
  );
}

function KPICard({ label, value, icon, color, chip }: {
  label: string; value: string; icon: React.ReactNode; color: string; chip?: boolean;
}) {
  return (
    <Card className="border-gob-navy/10 shadow-sm bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gob-navy/60 uppercase tracking-wide">{label}</span>
          <span className={color}>{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          {chip !== undefined && (
            <Badge className={chip ? 'bg-status-ok text-white' : 'bg-status-critical text-white'}>
              {chip ? 'Cumplido' : 'Incumplido'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
