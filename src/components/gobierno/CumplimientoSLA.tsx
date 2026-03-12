import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SLATerm } from '@/data/mockGobiernoData';
import { GOB_CLIENT } from '@/data/mockGobiernoData';

interface CumplimientoSLAProps {
  terms: SLATerm[];
}

export function CumplimientoSLA({ terms }: CumplimientoSLAProps) {
  const allCompliant = terms.every(t => t.cumplido);
  const breached = terms.filter(t => !t.cumplido);

  return (
    <section>
      <h2 className="text-lg font-semibold text-gob-navy mb-3">Cumplimiento de SLA</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-gob-navy/10 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gob-navy">Términos del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {terms.map(term => (
              <div key={term.nombre} className="flex items-center justify-between py-2 border-b border-gob-navy/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gob-navy">{term.nombre}</p>
                  <p className="text-xs text-gob-navy/50">Garantizado: {term.garantizado}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-data text-gob-navy">{term.actual}</span>
                  {term.cumplido ? (
                    <CheckCircle className="h-5 w-5 text-status-ok" />
                  ) : (
                    <XCircle className="h-5 w-5 text-status-critical" />
                  )}
                </div>
              </div>
            ))}
            <Button variant="link" className="text-gob-navy p-0 h-auto text-xs">
              <ExternalLink className="h-3 w-3 mr-1" /> Ver contrato completo
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-2 ${allCompliant ? 'border-status-ok/30 bg-green-50' : 'border-status-critical/30 bg-red-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gob-navy">Estado General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              {allCompliant ? (
                <CheckCircle className="h-10 w-10 text-status-ok" />
              ) : (
                <XCircle className="h-10 w-10 text-status-critical" />
              )}
              <div>
                <p className="text-xl font-bold text-gob-navy">
                  {allCompliant ? 'SLA Cumplido' : 'SLA Incumplido'}
                </p>
                <p className="text-xs text-gob-navy/60">
                  Contrato: {GOB_CLIENT.contrato}
                </p>
              </div>
            </div>

            {!allCompliant && (
              <div className="bg-red-100 border border-red-200 rounded p-3">
                <p className="text-sm font-semibold text-red-800 mb-2">Cálculo de penalización:</p>
                {breached.map(t => (
                  <div key={t.nombre} className="text-xs text-red-700">
                    <p>• {t.nombre}: garantizado {t.garantizado}, actual {t.actual}</p>
                  </div>
                ))}
                <p className="text-sm font-bold text-red-800 mt-2">
                  Penalización aplicable: 5% de factura mensual
                </p>
              </div>
            )}

            {allCompliant && (
              <Badge className="bg-status-ok text-white">
                Todos los términos cumplidos
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
