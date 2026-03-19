import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Download, Users, Wifi, Clock, MapPin, Globe, TrendingUp,
  Landmark, Scale, UserCheck, Radio,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  MOCK_IMPACT_MONTHS,
  generateImpactNarrative,
  IMPACT_AUDIENCES,
  type ImpactMonth,
} from '@/data/mockImpactData';
import { generateImpactPDF } from '@/utils/generateImpactPDF';

const AUDIENCE_ICONS: Record<string, React.ReactNode> = {
  fondos: <TrendingUp className="h-4 w-4" />,
  ift: <Scale className="h-4 w-4" />,
  gobierno: <Landmark className="h-4 w-4" />,
  internacional: <Globe className="h-4 w-4" />,
};

export default function ReporteImpacto() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [generating, setGenerating] = useState(false);

  const data = MOCK_IMPACT_MONTHS[selectedIdx];
  const narrative = useMemo(() => generateImpactNarrative(data), [data]);

  const handlePDF = () => {
    setGenerating(true);
    setTimeout(() => {
      generateImpactPDF(data);
      setGenerating(false);
    }, 1200);
  };

  const trendData = [...MOCK_IMPACT_MONTHS].reverse().map(m => ({
    name: `${m.mes.slice(0, 3)} ${m.year}`,
    usuarios: m.usuariosUnicos,
    comunidades: m.comunidadesConectadas,
    primeraVez: m.primeraVezInternet,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2">IMPACTO</Badge>
            <h1 className="text-xl font-bold text-foreground">Reporte Mensual de Impacto</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            Coco WiFi Comunitario — Internet para comunidades rurales
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Period selector + PDF */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Periodo</h2>
            <Select value={String(selectedIdx)} onValueChange={v => setSelectedIdx(Number(v))}>
              <SelectTrigger className="w-[200px] h-8 text-sm border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_IMPACT_MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m.mes} {m.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handlePDF} disabled={generating} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {generating ? (
              <><Clock className="h-4 w-4 animate-spin" /> Generando...</>
            ) : (
              <><Download className="h-4 w-4" /> Descargar PDF de Impacto</>
            )}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI icon={<MapPin className="h-5 w-5" />} label="Comunidades" value={String(data.comunidadesConectadas)} />
          <KPI icon={<Users className="h-5 w-5" />} label="Usuarios únicos" value={data.usuariosUnicos.toLocaleString('es-MX')} />
          <KPI icon={<Wifi className="h-5 w-5" />} label="1ª vez internet" value={data.primeraVezInternet.toLocaleString('es-MX')} highlight />
          <KPI icon={<Clock className="h-5 w-5" />} label="Horas conexión" value={data.horasTotalesConexion.toLocaleString('es-MX')} />
          <KPI icon={<Radio className="h-5 w-5" />} label="Coco Boxes" value={String(data.cocoBoxesActivas)} />
          <KPI icon={<UserCheck className="h-5 w-5" />} label="Afiliados activos" value={String(data.afiliadosActivos)} />
          <KPI icon={<Globe className="h-5 w-5" />} label="Estados" value={String(data.estados.length)} />
          <KPI icon={<TrendingUp className="h-5 w-5" />} label="Ingreso bruto" value={`$${(data.ingresoBruto / 1000).toFixed(0)}K`} />
        </div>

        <Separator className="bg-border" />

        {/* Narrative */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Narrativa de Impacto — Generada por Claude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 rounded-lg p-5 border border-primary/10">
              {narrative.split('\n\n').map((p, i) => (
                <p key={i} className="text-foreground/90 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              * Esta narrativa será generada automáticamente por Claude con datos reales del NOC, Odoo y las Coco Boxes.
            </p>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* Trend Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Tendencia de Crecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="usuarios" name="Usuarios únicos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="primeraVez" name="1ª vez internet" fill="hsl(var(--status-warning))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comunidades" name="Comunidades" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-border" />

        {/* States + Audiences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Estados con presencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.estados.map(e => (
                  <Badge key={e} variant="secondary" className="text-sm px-3 py-1">{e}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                +{data.municipiosNuevos} municipios nuevos este mes
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Audiencias del reporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {IMPACT_AUDIENCES.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded bg-accent/30 border border-border">
                    <span className="text-primary">{AUDIENCE_ICONS[a.id]}</span>
                    <span className="text-sm text-foreground">{a.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className={highlight ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
        </div>
        <span className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
      </CardContent>
    </Card>
  );
}
