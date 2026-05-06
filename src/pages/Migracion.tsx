import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle, XCircle, AlertTriangle, Database, Users, Ticket,
  Package, FileText, Building2, RefreshCw, Download, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Semaforo = 'ok' | 'warn' | 'critical';

interface ModuloOdoo {
  nombre: string;
  icono: any;
  registrosTotal: number;
  registrosLimpios: number;
  zombies: number;
  camposVacios: number;
  duplicados: number;
  estado: Semaforo;
  ultimaRevision: string;
}

interface CheckItem {
  id: string;
  fase: 'pre' | 'post';
  area: string;
  descripcion: string;
  responsable: string;
  completado: boolean;
  critico: boolean;
}

const modulos: ModuloOdoo[] = [
  {
    nombre: 'Empleados (hr.employee)',
    icono: Users,
    registrosTotal: 248,
    registrosLimpios: 231,
    zombies: 9,
    camposVacios: 14,
    duplicados: 3,
    estado: 'warn',
    ultimaRevision: '2026-05-05',
  },
  {
    nombre: 'Tickets (helpdesk.ticket)',
    icono: Ticket,
    registrosTotal: 4_821,
    registrosLimpios: 4_690,
    zombies: 87,
    camposVacios: 52,
    duplicados: 0,
    estado: 'warn',
    ultimaRevision: '2026-05-05',
  },
  {
    nombre: 'Contactos (res.partner)',
    icono: Building2,
    registrosTotal: 1_203,
    registrosLimpios: 1_098,
    zombies: 67,
    camposVacios: 143,
    duplicados: 28,
    estado: 'critical',
    ultimaRevision: '2026-05-05',
  },
  {
    nombre: 'Inventario (stock.picking)',
    icono: Package,
    registrosTotal: 892,
    registrosLimpios: 876,
    zombies: 4,
    camposVacios: 9,
    duplicados: 1,
    estado: 'ok',
    ultimaRevision: '2026-05-05',
  },
  {
    nombre: 'Habilidades (hr.employee.skill)',
    icono: FileText,
    registrosTotal: 540,
    registrosLimpios: 498,
    zombies: 22,
    camposVacios: 34,
    duplicados: 0,
    estado: 'warn',
    ultimaRevision: '2026-05-05',
  },
  {
    nombre: 'Base de datos (res.company)',
    icono: Database,
    registrosTotal: 5,
    registrosLimpios: 5,
    zombies: 0,
    camposVacios: 0,
    duplicados: 0,
    estado: 'ok',
    ultimaRevision: '2026-05-05',
  },
];

const checklistInicial: CheckItem[] = [
  // PRE-MIGRACIÓN
  { id: 'p1', fase: 'pre', area: 'TI', descripcion: 'Backup completo de wispi17 verificado y restaurable', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'p2', fase: 'pre', area: 'TI', descripcion: 'Ambiente de staging con nueva versión Odoo levantado', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'p3', fase: 'pre', area: 'Datos', descripcion: 'Contactos zombies identificados y archivados (≥67)', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'p4', fase: 'pre', area: 'Datos', descripcion: 'Empleados inactivos +180 días marcados como archivados', responsable: 'RRHH', completado: false, critico: true },
  { id: 'p5', fase: 'pre', area: 'Datos', descripcion: 'Duplicados en res.partner resueltos (28 detectados)', responsable: 'Operaciones', completado: false, critico: true },
  { id: 'p6', fase: 'pre', area: 'Procesos', descripcion: 'Mapa de módulos personalizados documentado', responsable: 'Gerente TI', completado: false, critico: false },
  { id: 'p7', fase: 'pre', area: 'Procesos', descripcion: 'SLAs y KPIs actuales exportados como baseline', responsable: 'Planeación', completado: false, critico: false },
  { id: 'p8', fase: 'pre', area: 'TI', descripcion: 'Scripts de validación post-migración listos', responsable: 'Gerente TI', completado: false, critico: false },
  { id: 'p9', fase: 'pre', area: 'Usuarios', descripcion: 'Usuarios y permisos documentados por área', responsable: 'Gerente TI', completado: false, critico: false },
  { id: 'p10', fase: 'pre', area: 'Comunicación', descripcion: 'Ventana de mantenimiento comunicada a todas las áreas', responsable: 'Dirección', completado: false, critico: false },
  // POST-MIGRACIÓN
  { id: 'q1', fase: 'post', area: 'TI', descripcion: 'Integridad referencial verificada en todos los modelos', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'q2', fase: 'post', area: 'Datos', descripcion: 'Conteo de registros pre vs post coincide (±0.5%)', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'q3', fase: 'post', area: 'Operaciones', descripcion: 'Flujo de ticket helpdesk probado end-to-end', responsable: 'NOC', completado: false, critico: true },
  { id: 'q4', fase: 'post', area: 'RRHH', descripcion: 'Nómina y habilidades de empleados verificadas', responsable: 'RRHH', completado: false, critico: true },
  { id: 'q5', fase: 'post', area: 'Integraciones', descripcion: 'API XML-RPC responde desde portal y agentes IA', responsable: 'Gerente TI', completado: false, critico: true },
  { id: 'q6', fase: 'post', area: 'Usuarios', descripcion: 'Login y permisos validados por área', responsable: 'Gerente TI', completado: false, critico: false },
  { id: 'q7', fase: 'post', area: 'Reportes', descripcion: 'Reportes de KPIs generan datos correctos', responsable: 'Planeación', completado: false, critico: false },
  { id: 'q8', fase: 'post', area: 'Comunicación', descripcion: 'Go-live confirmado y comunicado a todas las áreas', responsable: 'Dirección', completado: false, critico: false },
];

const colorSemaforo: Record<Semaforo, string> = {
  ok: 'text-green-500',
  warn: 'text-amber-500',
  critical: 'text-red-500',
};

const bgSemaforo: Record<Semaforo, string> = {
  ok: 'border-green-500/30 bg-green-500/5',
  warn: 'border-amber-500/30 bg-amber-500/5',
  critical: 'border-red-500/30 bg-red-500/5',
};

const labelSemaforo: Record<Semaforo, string> = {
  ok: 'Limpio',
  warn: 'Atención',
  critical: 'Crítico',
};

const badgeSemaforo: Record<Semaforo, 'default' | 'secondary' | 'destructive'> = {
  ok: 'default',
  warn: 'secondary',
  critical: 'destructive',
};

function IconoSemaforo({ estado }: { estado: Semaforo }) {
  if (estado === 'ok') return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (estado === 'warn') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

export default function Migracion() {
  const [checklist, setChecklist] = useState<CheckItem[]>(checklistInicial);
  const [tab, setTab] = useState('modulos');

  const totalZombies = modulos.reduce((s, m) => s + m.zombies, 0);
  const totalDuplicados = modulos.reduce((s, m) => s + m.duplicados, 0);
  const totalRegistros = modulos.reduce((s, m) => s + m.registrosTotal, 0);
  const totalLimpios = modulos.reduce((s, m) => s + m.registrosLimpios, 0);
  const pctCalidad = Math.round((totalLimpios / totalRegistros) * 100);

  const criticos = modulos.filter(m => m.estado === 'critical').length;
  const advertencias = modulos.filter(m => m.estado === 'warn').length;

  const preItems = checklist.filter(c => c.fase === 'pre');
  const postItems = checklist.filter(c => c.fase === 'post');
  const preCompletados = preItems.filter(c => c.completado).length;
  const postCompletados = postItems.filter(c => c.completado).length;

  const toggle = (id: string) =>
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completado: !c.completado } : c));

  const exportar = () => {
    const lineas = [
      '# Reporte Calidad de Datos — Migración Odoo',
      `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      '',
      '## Resumen',
      `- Calidad global: ${pctCalidad}%`,
      `- Registros zombies: ${totalZombies}`,
      `- Duplicados: ${totalDuplicados}`,
      `- Módulos críticos: ${criticos}`,
      '',
      '## Detalle por módulo',
      ...modulos.map(m =>
        `### ${m.nombre}\n- Total: ${m.registrosTotal.toLocaleString()}\n- Zombies: ${m.zombies}\n- Duplicados: ${m.duplicados}\n- Estado: ${labelSemaforo[m.estado]}`
      ),
      '',
      '## Checklist Pre-migración',
      ...preItems.map(c => `- [${c.completado ? 'x' : ' '}] ${c.descripcion} (${c.responsable})`),
      '',
      '## Checklist Post-migración',
      ...postItems.map(c => `- [${c.completado ? 'x' : ' '}] ${c.descripcion} (${c.responsable})`),
    ];
    const blob = new Blob([lineas.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migracion_odoo_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Migración Odoo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calidad de datos · Registros zombie · Checklist pre/post migración
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button size="sm" onClick={exportar}>
            <Download className="h-4 w-4 mr-1" /> Exportar reporte
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Calidad global</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pctCalidad >= 95 ? 'text-green-500' : pctCalidad >= 85 ? 'text-amber-500' : 'text-red-500'}`}>
              {pctCalidad}%
            </div>
            <Progress value={pctCalidad} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{totalLimpios.toLocaleString()} / {totalRegistros.toLocaleString()} registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Zombies detectados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{totalZombies}</div>
            <p className="text-xs text-muted-foreground mt-2">Registros sin relaciones activas en +180 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Duplicados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{totalDuplicados}</div>
            <p className="text-xs text-muted-foreground mt-2">Principalmente en contactos (res.partner)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Estado módulos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-green-500 font-bold text-xl">{modulos.filter(m => m.estado === 'ok').length}</span>
              <span className="text-xs text-muted-foreground">OK</span>
              <span className="text-amber-500 font-bold text-xl">{advertencias}</span>
              <span className="text-xs text-muted-foreground">Alerta</span>
              <span className="text-red-500 font-bold text-xl">{criticos}</span>
              <span className="text-xs text-muted-foreground">Crítico</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="modulos"><Database className="h-4 w-4 mr-1" />Módulos Odoo</TabsTrigger>
          <TabsTrigger value="checklist"><ClipboardList className="h-4 w-4 mr-1" />Checklist migración</TabsTrigger>
          <TabsTrigger value="zombies"><AlertTriangle className="h-4 w-4 mr-1" />Zombies & Duplicados</TabsTrigger>
        </TabsList>

        {/* TAB: Módulos */}
        <TabsContent value="modulos" className="space-y-3 mt-4">
          {modulos.map(m => {
            const pct = Math.round((m.registrosLimpios / m.registrosTotal) * 100);
            return (
              <Card key={m.nombre} className={`border ${bgSemaforo[m.estado]}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <m.icono className={`h-5 w-5 shrink-0 ${colorSemaforo[m.estado]}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">Última revisión: {m.ultimaRevision}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={badgeSemaforo[m.estado]}>{labelSemaforo[m.estado]}</Badge>
                      <IconoSemaforo estado={m.estado} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold">{m.registrosTotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-500">{m.zombies}</p>
                      <p className="text-xs text-muted-foreground">Zombies</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-500">{m.duplicados}</p>
                      <p className="text-xs text-muted-foreground">Duplicados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-400">{m.camposVacios}</p>
                      <p className="text-xs text-muted-foreground">Campos vacíos</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Calidad</span><span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* TAB: Checklist */}
        <TabsContent value="checklist" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pre */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Pre-migración</h3>
                <span className="text-xs text-muted-foreground">{preCompletados}/{preItems.length} completados</span>
              </div>
              <Progress value={(preCompletados / preItems.length) * 100} className="h-1.5 mb-4" />
              <div className="space-y-2">
                {preItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${item.completado ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border hover:bg-accent/30'}`}
                  >
                    {item.completado
                      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      : <div className={`h-4 w-4 rounded-full border-2 shrink-0 mt-0.5 ${item.critico ? 'border-red-500' : 'border-muted-foreground'}`} />
                    }
                    <div className="min-w-0">
                      <p className={`text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                        {item.descripcion}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{item.area}</Badge>
                        <span className="text-[10px] text-muted-foreground">{item.responsable}</span>
                        {item.critico && !item.completado && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1">crítico</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Post */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Post-migración</h3>
                <span className="text-xs text-muted-foreground">{postCompletados}/{postItems.length} completados</span>
              </div>
              <Progress value={(postCompletados / postItems.length) * 100} className="h-1.5 mb-4" />
              <div className="space-y-2">
                {postItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${item.completado ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border hover:bg-accent/30'}`}
                  >
                    {item.completado
                      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      : <div className={`h-4 w-4 rounded-full border-2 shrink-0 mt-0.5 ${item.critico ? 'border-red-500' : 'border-muted-foreground'}`} />
                    }
                    <div className="min-w-0">
                      <p className={`text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                        {item.descripcion}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{item.area}</Badge>
                        <span className="text-[10px] text-muted-foreground">{item.responsable}</span>
                        {item.critico && !item.completado && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1">crítico</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Zombies */}
        <TabsContent value="zombies" className="mt-4 space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> ¿Qué es un registro zombie?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Un registro zombie es un dato que existe en la base de datos pero ya no tiene utilidad operativa:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Empleados sin actividad en Odoo por más de 180 días y sin fecha de baja registrada</li>
                <li>Tickets cerrados hace más de 1 año sin ninguna referencia activa</li>
                <li>Contactos sin transacciones, cotizaciones ni comunicaciones en los últimos 12 meses</li>
                <li>Habilidades asignadas a empleados que ya no existen en el catálogo actual</li>
                <li>Registros de inventario con cantidad 0 y sin movimientos en +6 meses</li>
              </ul>
              <p className="text-amber-600 font-medium">
                Migrar zombies a la nueva versión contamina la base de datos nueva y aumenta el tiempo de migración.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Zombies por módulo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {modulos.filter(m => m.zombies > 0).sort((a, b) => b.zombies - a.zombies).map(m => (
                  <div key={m.nombre} className="flex items-center gap-3">
                    <m.icono className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{m.nombre.split('(')[0].trim()}</span>
                        <span className="font-mono text-amber-500 shrink-0">{m.zombies}</span>
                      </div>
                      <Progress value={(m.zombies / m.registrosTotal) * 100} className="h-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Duplicados por módulo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {modulos.filter(m => m.duplicados > 0).sort((a, b) => b.duplicados - a.duplicados).map(m => (
                  <div key={m.nombre} className="flex items-center gap-3">
                    <m.icono className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{m.nombre.split('(')[0].trim()}</span>
                        <span className="font-mono text-red-500 shrink-0">{m.duplicados}</span>
                      </div>
                      <Progress value={(m.duplicados / m.registrosTotal) * 100} className="h-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-sm text-red-600">Acción requerida antes de migrar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">1. Archivar zombies</p>
                  <p className="text-xs text-muted-foreground">No eliminar — archivar en Odoo para mantener historial. Total: <span className="text-amber-500 font-mono">{totalZombies}</span></p>
                </div>
                <div>
                  <p className="font-medium mb-1">2. Resolver duplicados</p>
                  <p className="text-xs text-muted-foreground">Usar la función "Deduplicar" de Odoo en res.partner. Total: <span className="text-red-500 font-mono">{totalDuplicados}</span></p>
                </div>
                <div>
                  <p className="font-medium mb-1">3. Completar campos críticos</p>
                  <p className="text-xs text-muted-foreground">Campos vacíos en registros activos deben llenarse antes de migrar. Total: <span className="text-amber-400 font-mono">{modulos.reduce((s, m) => s + m.camposVacios, 0)}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
