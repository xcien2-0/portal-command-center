import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import type { DailyAvailability } from '@/data/mockGobiernoData';

interface TablaDisponibilidadProps {
  data: DailyAvailability[];
}

function getRowColor(d: number): string {
  if (d >= 99.5) return '';
  if (d >= 98) return 'bg-amber-50';
  return 'bg-red-50';
}

export function TablaDisponibilidad({ data }: TablaDisponibilidadProps) {
  const avgDisp = data.reduce((s, d) => s + d.disponibilidad, 0) / data.length;
  const totalIncidentes = data.reduce((s, d) => s + d.incidentes, 0);
  // parse "X min" -> number
  const totalDowntimeMin = data.reduce((s, d) => {
    const m = d.tiempoInactivo.match(/(\d+)/);
    return s + (m ? parseInt(m[1]) : 0);
  }, 0);
  const totalDowntimeHrs = (totalDowntimeMin / 60).toFixed(1);

  return (
    <section>
      <h2 className="text-lg font-semibold text-gob-navy mb-3">Tabla de Disponibilidad</h2>
      <div className="border border-gob-navy/10 rounded-lg overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gob-navy">
              <TableRow className="border-none hover:bg-gob-navy">
                <TableHead className="text-white text-xs">Fecha</TableHead>
                <TableHead className="text-white text-xs">Disponibilidad %</TableHead>
                <TableHead className="text-white text-xs">Incidentes</TableHead>
                <TableHead className="text-white text-xs">Tiempo inactivo</TableHead>
                <TableHead className="text-white text-xs">Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.fecha} className={`${getRowColor(row.disponibilidad)} text-gob-navy border-gob-navy/10`}>
                  <TableCell className="text-xs font-mono-data py-2">{row.fecha}</TableCell>
                  <TableCell className="text-xs font-mono-data py-2 font-semibold">{row.disponibilidad}%</TableCell>
                  <TableCell className="text-xs py-2">{row.incidentes}</TableCell>
                  <TableCell className="text-xs py-2">{row.tiempoInactivo}</TableCell>
                  <TableCell className="text-xs py-2">{row.observaciones}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-gob-navy/5 border-t-2 border-gob-navy/20">
              <TableRow className="hover:bg-gob-navy/10">
                <TableCell className="text-xs font-semibold text-gob-navy py-2">TOTALES</TableCell>
                <TableCell className="text-xs font-semibold text-gob-navy py-2 font-mono-data">{avgDisp.toFixed(2)}%</TableCell>
                <TableCell className="text-xs font-semibold text-gob-navy py-2">{totalIncidentes}</TableCell>
                <TableCell className="text-xs font-semibold text-gob-navy py-2">{totalDowntimeHrs} hrs</TableCell>
                <TableCell className="text-xs text-gob-navy py-2">Promedio mensual</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </section>
  );
}
