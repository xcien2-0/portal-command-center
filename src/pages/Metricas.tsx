import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, Target, CheckCircle, AlertTriangle, XCircle,
  Plus, Download, BarChart3, Clock, Users, Shield, Phone, Send,
} from 'lucide-react';

type EstadoKPI = 'verde' | 'amarillo' | 'rojo';

interface KPI {
  id: string;
  nombre: string;
  area: string;
  formula: string;
  valor: number;
  objetivo: number;
  unidad: string;
  frecuencia: string;
  responsable: string;
  estado: EstadoKPI;
  tendencia: 'sube' | 'baja' | 'estable';
}

interface SLA {
  id: string;
  area: string;
  servicio: string;
  tiempo: string;
  cumplimiento: number;
  objetivo: number;
}

const kpisIniciales: KPI[] = [
  // Operaciones / Campo
  { id: 'k1', nombre: 'Servicios completados por día', area: 'Operaciones', formula: 'Tickets cerrados / Días hábiles', valor: 4.2, objetivo: 3, unidad: 'tickets/día', frecuencia: 'Diario', responsable: 'Líder de Operaciones', estado: 'verde', tendencia: 'sube' },
  { id: 'k2', nombre: 'Re-trabajos', area: 'Operaciones', formula: 'Tickets de corrección / Total tickets', valor: 1.8, objetivo: 2, unidad: '%', frecuencia: 'Semanal', responsable: 'Líder de Operaciones', estado: 'verde', tendencia: 'baja' },
  { id: 'k3', nombre: 'Instalaciones con RF óptimo', area: 'Operaciones', formula: 'Instalaciones -35 a -45 dBi / Total', valor: 87, objetivo: 100, unidad: '%', frecuencia: 'Diario', responsable: 'Técnico Líder', estado: 'amarillo', tendencia: 'sube' },
  { id: 'k4', nombre: 'Cero Basura verificado', area: 'Operaciones', formula: 'Tickets con foto cierre limpio / Total', valor: 100, objetivo: 100, unidad: '%', frecuencia: 'Diario', responsable: 'Técnico Líder', estado: 'verde', tendencia: 'estable' },
  // NOC
  { id: 'k5', nombre: 'Disponibilidad de red', area: 'NOC', formula: '(Uptime / Total tiempo) × 100', valor: 99.2, objetivo: 99.5, unidad: '%', frecuencia: 'Tiempo real', responsable: 'NOC', estado: 'amarillo', tendencia: 'estable' },
  { id: 'k6', nombre: 'MTTR (tiempo de resolución)', area: 'NOC', formula: 'Suma tiempo resolución / Incidentes', valor: 42, objetivo: 60, unidad: 'min', frecuencia: 'Semanal', responsable: 'NOC', estado: 'verde', tendencia: 'baja' },
  { id: 'k7', nombre: 'Incidentes críticos abiertos', area: 'NOC', formula: 'Tickets críticos sin cierre', valor: 2, objetivo: 0, unidad: 'tickets', frecuencia: 'Tiempo real', responsable: 'NOC', estado: 'rojo', tendencia: 'estable' },
  // Dispatch
  { id: 'k8', nombre: 'Tiempo de asignación', area: 'Dispatch', formula: 'Tiempo ticket creado → bidrilla asignada', valor: 8, objetivo: 15, unidad: 'min', frecuencia: 'Diario', responsable: 'Dispatch', estado: 'verde', tendencia: 'baja' },
  { id: 'k9', nombre: 'Bidrillas activas vs disponibles', area: 'Dispatch', formula: 'Bidrillas en campo / Total bidrillas', valor: 75, objetivo: 80, unidad: '%', frecuencia: 'Tiempo real', responsable: 'Dispatch', estado: 'amarillo', tendencia: 'sube' },
  // RRHH
  { id: 'k10', nombre: 'Técnicos certificados', area: 'RRHH', formula: 'Técnicos con examen ≥90% / Total', valor: 68, objetivo: 100, unidad: '%', frecuencia: 'Mensual', responsable: 'RRHH', estado: 'amarillo', tendencia: 'sube' },
  { id: 'k11', nombre: 'Rotación de personal', area: 'RRHH', formula: 'Bajas voluntarias / Headcount promedio', valor: 3.2, objetivo: 5, unidad: '%', frecuencia: 'Mensual', responsable: 'RRHH', estado: 'verde', tendencia: 'baja' },
  // Comercial
  { id: 'k12', nombre: 'Satisfacción cliente (NPS)', area: 'Comercial', formula: 'Promedio encuestas post-servicio', valor: 4.3, objetivo: 4.5, unidad: '/5', frecuencia: 'Mensual', responsable: 'Comercial', estado: 'amarillo', tendencia: 'sube' },
];

const slasIniciales: SLA[] = [
  { id: 's1', area: 'NOC', servicio: 'Respuesta a incidente crítico', tiempo: '15 min', cumplimiento: 94, objetivo: 98 },
  { id: 's2', area: 'NOC', servicio: 'Resolución de incidente mayor', tiempo: '4 hrs', cumplimiento: 88, objetivo: 95 },
  { id: 's3', area: 'Dispatch', servicio: 'Asignación de bidrilla', tiempo: '15 min', cumplimiento: 97, objetivo: 95 },
  { id: 's4', area: 'Operaciones', servicio: 'Instalación estándar', tiempo: '4 hrs', cumplimiento: 91, objetivo: 95 },
  { id: 's5', area: 'Operaciones', servicio: 'Cierre de ticket en Odoo', tiempo: 'Mismo día', cumplimiento: 99, objetivo: 100 },
  { id: 's6', area: 'Call Center', servicio: 'Tiempo de espera en llamada', tiempo: '3 min', cumplimiento: 82, objetivo: 90 },
  { id: 's7', area: 'Comercial', servicio: 'Cotización a cliente externo', tiempo: '24 hrs', cumplimiento: 95, objetivo: 95 },
];

const areas = ['Todas', 'Operaciones', 'NOC', 'Dispatch', 'RRHH', 'Comercial'];
const areaIconos: Record<string, any> = {
  Operaciones: Users, NOC: Shield, Dispatch: Send, RRHH: Users, Comercial: BarChart3, 'Call Center': Phone,
};

const colorEstado: Record<EstadoKPI, string> = {
  verde: 'text-green-500', amarillo: 'text-amber-500', rojo: 'text-red-500',
};

function IconoEstado({ e }: { e: EstadoKPI }) {
  if (e === 'verde') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (e === 'amarillo') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export default function Metricas() {
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [buscar, setBuscar] = useState('');

  const kpisFiltrados = kpisIniciales.filter(k =>
    (areaFiltro === 'Todas' || k.area === areaFiltro) &&
    k.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  const verdes = kpisIniciales.filter(k => k.estado === 'verde').length;
  const amarillos = kpisIniciales.filter(k => k.estado === 'amarillo').length;
  const rojos = kpisIniciales.filter(k => k.estado === 'rojo').length;

  const slasCumplidos = slasIniciales.filter(s => s.cumplimiento >= s.objetivo).length;

  const exportar = () => {
    const lineas = [
      '# Dashboard Métricas & KPIs — Next Ventures',
      `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      '', '## KPIs por área',
      ...kpisIniciales.map(k =>
        `### ${k.nombre} (${k.area})\n- Valor: ${k.valor} ${k.unidad}\n- Objetivo: ${k.objetivo} ${k.unidad}\n- Estado: ${k.estado}\n- Responsable: ${k.responsable}`
      ),
      '', '## SLAs',
      ...slasIniciales.map(s =>
        `### ${s.servicio} (${s.area})\n- Tiempo: ${s.tiempo}\n- Cumplimiento: ${s.cumplimiento}%\n- Objetivo: ${s.objetivo}%`
      ),
    ];
    const blob = new Blob([lineas.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `metricas_kpis_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas & KPIs</h1>
          <p className="text-sm text-muted-foreground mt-1">Framework centralizado · SLAs · Metodología de medición</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Nueva métrica</Button>
          <Button size="sm" onClick={exportar}><Download className="h-4 w-4 mr-1" />Exportar</Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">KPIs en verde</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-500">{verdes}</div><p className="text-xs text-muted-foreground mt-1">de {kpisIniciales.length} métricas activas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Requieren atención</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-500">{amarillos}</div><p className="text-xs text-muted-foreground mt-1">En rango de alerta</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Fuera de objetivo</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-500">{rojos}</div><p className="text-xs text-muted-foreground mt-1">Acción inmediata</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">SLAs cumplidos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{slasCumplidos}/{slasIniciales.length}</div>
            <Progress value={(slasCumplidos / slasIniciales.length) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kpis">
        <TabsList>
          <TabsTrigger value="kpis"><Target className="h-4 w-4 mr-1" />KPIs por área</TabsTrigger>
          <TabsTrigger value="slas"><Clock className="h-4 w-4 mr-1" />SLAs</TabsTrigger>
          <TabsTrigger value="metodologia"><TrendingUp className="h-4 w-4 mr-1" />Metodología</TabsTrigger>
        </TabsList>

        {/* KPIs */}
        <TabsContent value="kpis" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Buscar métrica..." value={buscar} onChange={e => setBuscar(e.target.value)} className="w-48" />
            {areas.map(a => (
              <Button key={a} variant={areaFiltro === a ? 'default' : 'outline'} size="sm" onClick={() => setAreaFiltro(a)}>{a}</Button>
            ))}
          </div>
          <div className="space-y-2">
            {kpisFiltrados.map(k => {
              const pct = Math.min(100, Math.round((k.valor / k.objetivo) * 100));
              const Icon = areaIconos[k.area] || BarChart3;
              return (
                <Card key={k.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{k.nombre}</p>
                          <p className="text-xs text-muted-foreground">Fórmula: {k.formula}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{k.area}</Badge>
                            <span className="text-[10px] text-muted-foreground">{k.frecuencia} · {k.responsable}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className={`text-lg font-bold font-mono ${colorEstado[k.estado]}`}>{k.valor} <span className="text-xs font-normal text-muted-foreground">{k.unidad}</span></p>
                          <p className="text-xs text-muted-foreground">Obj: {k.objetivo} {k.unidad}</p>
                        </div>
                        <IconoEstado e={k.estado} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={pct > 100 ? 100 : pct} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* SLAs */}
        <TabsContent value="slas" className="mt-4">
          <div className="space-y-3">
            {slasIniciales.map(s => {
              const ok = s.cumplimiento >= s.objetivo;
              return (
                <Card key={s.id} className={`border ${ok ? 'border-green-500/20' : 'border-red-500/20'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{s.servicio}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1">{s.area}</Badge>
                          <span className="text-[10px] text-muted-foreground">Tiempo comprometido: {s.tiempo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className={`text-xl font-bold font-mono ${ok ? 'text-green-500' : 'text-red-500'}`}>{s.cumplimiento}%</p>
                          <p className="text-xs text-muted-foreground">Obj: {s.objetivo}%</p>
                        </div>
                        {ok ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    </div>
                    <Progress value={s.cumplimiento} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Metodología */}
        <TabsContent value="metodologia" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Cómo crear una métrica nueva</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ['1. Definir el nombre', 'Claro, específico y orientado a resultado. Evitar métricas de actividad.'],
                  ['2. Definir la fórmula', 'Numerador / Denominador × 100 (si es %). Debe ser reproducible.'],
                  ['3. Asignar área y responsable', 'Un solo responsable por KPI. El área valida mensualmente.'],
                  ['4. Establecer objetivo y SLA', 'Objetivo = qué queremos lograr. SLA = compromiso mínimo.'],
                  ['5. Definir frecuencia', 'Tiempo real / Diario / Semanal / Mensual. Depende del impacto.'],
                  ['6. Conectar a Odoo', 'Identificar el modelo y campo en ERP que alimenta la métrica.'],
                ].map(([titulo, desc]) => (
                  <div key={titulo} className="border-l-2 border-primary pl-3">
                    <p className="font-medium text-xs">{titulo}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Criterios de semáforo</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Verde — En objetivo</p>
                    <p className="text-xs text-muted-foreground">Valor ≥ 95% del objetivo definido. No requiere acción.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Amarillo — Atención</p>
                    <p className="text-xs text-muted-foreground">Valor entre 80% y 94% del objetivo. Revisar en próxima reunión de área.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Rojo — Fuera de objetivo</p>
                    <p className="text-xs text-muted-foreground">Valor {'<'} 80% del objetivo. Acción correctiva inmediata y escalación.</p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="font-medium text-xs mb-1">Revisión periódica obligatoria</p>
                  <p className="text-xs text-muted-foreground">
                    Métricas diarias: revisión en standup de 15 min.<br />
                    Métricas semanales: revisión en junta de área.<br />
                    Métricas mensuales: reporte a Dirección General.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
