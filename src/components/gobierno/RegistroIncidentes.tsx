import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { GobIncident } from '@/data/mockGobiernoData';

interface RegistroIncidentesProps {
  incidents: GobIncident[];
}

export function RegistroIncidentes({ incidents }: RegistroIncidentesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleExportCSV = () => {
    const header = 'Folio,Fecha Inicio,Fecha Resolución,Duración,Tipo,Causa Raíz,Impacto,Resolución\n';
    const rows = incidents.map(i =>
      `${i.folio},"${i.fechaInicio}","${i.fechaResolucion}",${i.duracion},${i.tipo},"${i.causaRaiz}","${i.impacto}","${i.resolucion}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidentes_gobierno_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gob-navy">Registro de Incidentes</h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-gob-navy/20 text-gob-navy hover:bg-gob-navy/5">
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>
      <div className="border border-gob-navy/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gob-navy">
            <TableRow className="border-none hover:bg-gob-navy">
              <TableHead className="text-white text-xs w-8"></TableHead>
              <TableHead className="text-white text-xs">Folio</TableHead>
              <TableHead className="text-white text-xs">Fecha inicio</TableHead>
              <TableHead className="text-white text-xs">Fecha resolución</TableHead>
              <TableHead className="text-white text-xs">Duración</TableHead>
              <TableHead className="text-white text-xs">Tipo</TableHead>
              <TableHead className="text-white text-xs">Causa raíz</TableHead>
              <TableHead className="text-white text-xs">Impacto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map(inc => (
              <Collapsible key={inc.folio} open={expanded === inc.folio} onOpenChange={open => setExpanded(open ? inc.folio : null)} asChild>
                <>
                  <CollapsibleTrigger asChild>
                    <TableRow className="cursor-pointer text-gob-navy border-gob-navy/10 hover:bg-gob-navy/5">
                      <TableCell className="py-2">
                        {expanded === inc.folio ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </TableCell>
                      <TableCell className="text-xs font-mono-data py-2 font-semibold">{inc.folio}</TableCell>
                      <TableCell className="text-xs font-mono-data py-2">{inc.fechaInicio}</TableCell>
                      <TableCell className="text-xs font-mono-data py-2">{inc.fechaResolucion}</TableCell>
                      <TableCell className="text-xs py-2">{inc.duracion}</TableCell>
                      <TableCell className="text-xs py-2">{inc.tipo}</TableCell>
                      <TableCell className="text-xs py-2">{inc.causaRaiz}</TableCell>
                      <TableCell className="text-xs py-2">{inc.impacto}</TableCell>
                    </TableRow>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-gob-navy/5 border-gob-navy/10">
                      <TableCell colSpan={8} className="py-3 px-6">
                        <div className="text-xs text-gob-navy space-y-1">
                          <p><strong>Resolución aplicada:</strong> {inc.resolucion}</p>
                          {inc.detalles && <p><strong>Detalle técnico:</strong> {inc.detalles}</p>}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
