import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import type { GeneratedReport } from '@/data/mockGobiernoData';

interface HistorialReportesProps {
  reports: GeneratedReport[];
  onDownload: (report: GeneratedReport) => void;
}

export function HistorialReportes({ reports, onDownload }: HistorialReportesProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gob-navy mb-3">Historial de Reportes</h2>
      <div className="border border-gob-navy/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gob-navy">
            <TableRow className="border-none hover:bg-gob-navy">
              <TableHead className="text-white text-xs">Periodo</TableHead>
              <TableHead className="text-white text-xs">Folio</TableHead>
              <TableHead className="text-white text-xs">Generado por</TableHead>
              <TableHead className="text-white text-xs">Fecha</TableHead>
              <TableHead className="text-white text-xs">Disponibilidad</TableHead>
              <TableHead className="text-white text-xs">Estado</TableHead>
              <TableHead className="text-white text-xs w-20">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.id} className="text-gob-navy border-gob-navy/10 hover:bg-gob-navy/5">
                <TableCell className="text-xs py-2 font-medium">{r.periodo}</TableCell>
                <TableCell className="text-xs font-mono-data py-2">{r.folio}</TableCell>
                <TableCell className="text-xs py-2">{r.generadoPor}</TableCell>
                <TableCell className="text-xs font-mono-data py-2">{r.fecha}</TableCell>
                <TableCell className="text-xs font-mono-data py-2">{r.disponibilidad}%</TableCell>
                <TableCell className="py-2">
                  <Badge className={r.estado === 'completado' ? 'bg-status-ok text-white' : 'bg-status-warning text-white'}>
                    {r.estado === 'completado' ? 'Completado' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <Button variant="ghost" size="sm" onClick={() => onDownload(r)} className="h-7 px-2 text-gob-navy hover:bg-gob-navy/10">
                    <Download className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
