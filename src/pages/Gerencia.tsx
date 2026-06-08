import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { AGENTS, ALERTS, ACTIVITY_FEED } from "@/data/mockGerenciaData";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

type EmpresaId = "todos" | "xcien" | "luminet" | "huus" | "manufactura" | "otro";

const EMPRESA_COLORS: Record<string, string> = {
  xcien:       "#1B7F4A",
  luminet:     "#0E6B3A",
  huus:        "#7C3AED",
  manufactura: "#EA580C",
  otro:        "#6E6E73",
};

const fmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function uptimeColor(v: number) {
  if (v >= 99) return "hsl(160 70% 37%)";
  if (v >= 90) return "hsl(37 78% 55%)";
  return "hsl(0 72% 59%)";
}

function fmtMXN(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString("es-MX")}`;
}

interface EmpresaRow {
  id: string; name: string; color: string; mrr: number; ordenes: number;
}
interface MesRow {
  mes: string; total: number;
  xcien?: number; luminet?: number; huus?: number; manufactura?: number; otro?: number;
}
interface DashData {
  mrr: number; arr: number; vtc: number; total_ordenes: number;
  por_empresa: EmpresaRow[];
  mrr_por_mes: MesRow[];
  top_vendedores: { nombre: string; ordenes: number; mrr: number }[];
  noc: { total: number; online: number; uptime: number } | null;
  wfm: { total: number; abiertos: number; cerrados: number; alta: number; media: number; baja: number } | null;
  total_servicios: number | null;
}

export default function Gerencia() {
  const [activeEmp, setActiveEmp] = useState<EmpresaId>("todos");
  const [now, setNow]             = useState(new Date());
  const [fadeKey, setFadeKey]     = useState(0);
  const [dash, setDash]           = useState<DashData | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchDash = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/gerencia/dashboard`)
      .then(r => r.json())
      .then(d => { setDash(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDash();
    const id = setInterval(fetchDash, 120_000);
    return () => clearInterval(id);
  }, [fetchDash]);

  const handleFilter = useCallback((id: EmpresaId) => {
    setActiveEmp(id);
    setFadeKey(k => k + 1);
  }, []);

  // Filtered empresa rows
  const empresas: EmpresaRow[] = dash?.por_empresa ?? [];
  const filteredEmpresas = activeEmp === "todos"
    ? empresas
    : empresas.filter(e => e.id === activeEmp);

  // MRR filtered
  const filteredMRR = activeEmp === "todos"
    ? dash?.mrr_por_mes ?? []
    : (dash?.mrr_por_mes ?? []).map(m => ({
        ...m,
        total: (m as Record<string, number>)[activeEmp] ?? 0,
      }));

  // KPIs filtered
  const mrr = activeEmp === "todos"
    ? dash?.mrr
    : filteredEmpresas.reduce((s, e) => s + e.mrr, 0);

  const ISP_FILTERS = [
    { id: "todos" as EmpresaId, label: "Todos" },
    ...empresas.map(e => ({ id: e.id as EmpresaId, label: e.name })),
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      {/* ── Sticky Top Bar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(245,245,247,0.72)", backdropFilter: "blur(20px)", borderColor: "#E5E5E7" }}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[20px] font-semibold tracking-tight" style={{ color: "#1D1D1F" }}>
              ISPilot
            </span>
            {loading && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F0F0F2", color: "#6E6E73" }}>
                actualizando…
              </span>
            )}
            {!loading && dash && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "hsl(160 70% 93%)", color: "hsl(160 70% 30%)" }}>
                datos reales
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ISP_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => handleFilter(f.id)}
                className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-150"
                style={
                  activeEmp === f.id
                    ? { background: "#1D1D1F", color: "#fff" }
                    : { background: "transparent", border: "1px solid #E5E5E7", color: "#6E6E73" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[13px] tabular-nums" style={{ color: "#6E6E73" }}>
            {fmt.format(now)}
          </span>
        </div>
      </header>

      <div key={fadeKey} className="mx-auto max-w-[1280px] px-8 pb-20">
        {/* ── SECTION 1 — INGRESOS */}
        <section style={{ marginTop: 40 }}>
          <SectionLabel>INGRESOS</SectionLabel>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              label="MRR total"
              value={fmtMXN(mrr)}
              sub="MXN / mes"
              trend={`${filteredEmpresas.reduce((s,e)=>s+e.ordenes,0) || dash?.total_ordenes || 0} órdenes`}
              trendGood={true}
            />
            <MetricCard
              label="ARR proyectado"
              value={fmtMXN(dash?.arr)}
              sub="MXN anual"
              trend={`${empresas.length} empresas activas`}
              trendGood={true}
            />
            <MetricCard
              label="VTC (Valor Total Contratos)"
              value={fmtMXN(dash?.vtc)}
              sub="MXN acumulado"
              trend="Archivo Maestro 2026"
              trendGood={true}
            />
            <MetricCard
              label="Servicios activos"
              value={dash?.total_servicios != null ? String(dash.total_servicios) : String(dash?.total_ordenes ?? "—")}
              sub={dash?.total_servicios != null ? "clientes en Odoo" : "órdenes en EAC"}
              trend="Fuente: Odoo ERP"
              trendGood={true}
            />
          </div>
        </section>

        {/* ── SECTION 2 — OPERACIONES */}
        <section style={{ marginTop: 48 }}>
          <SectionLabel>OPERACIONES</SectionLabel>
          <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr" }}>
            {/* Network Health */}
            <GCard title="Salud de red">
              {dash?.noc ? (
                <>
                  <p
                    className="text-[48px] font-semibold leading-none"
                    style={{ color: uptimeColor(dash.noc.uptime) }}
                  >
                    {dash.noc.uptime}%
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "#6E6E73" }}>
                    Uptime NOCBoard — {dash.noc.online}/{dash.noc.total} hosts online
                  </p>
                  <div className="mt-5">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-[13px] font-medium" style={{ color: "#1D1D1F" }}>NOCBoard</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#E5E5E7" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${dash.noc.uptime}%`, background: uptimeColor(dash.noc.uptime) }}
                        />
                      </div>
                      <span className="w-12 text-right text-[13px] font-mono tabular-nums" style={{ color: "#1D1D1F" }}>
                        {dash.noc.uptime}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] italic" style={{ color: "#6E6E73" }}>
                    {dash.noc.total - dash.noc.online} hosts con alertas
                  </p>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: "#6E6E73" }}>NOCBoard no disponible</p>
              )}
            </GCard>

            {/* Support WFM */}
            <GCard title="Soporte / WFM">
              {dash?.wfm ? (
                <>
                  <p className="text-[48px] font-semibold leading-none" style={{ color: "#1D1D1F" }}>
                    {dash.wfm.abiertos}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "#6E6E73" }}>tickets abiertos</p>
                  <div className="mt-5 space-y-2.5">
                    {[
                      { label: "Alta prioridad", color: "hsl(0 72% 59%)",  count: dash.wfm.alta },
                      { label: "Media prioridad", color: "hsl(37 78% 55%)", count: dash.wfm.media },
                      { label: "Normal",          color: "hsl(0 0% 65%)",   count: dash.wfm.baja },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        <span className="flex-1 text-[13px]" style={{ color: "#1D1D1F" }}>{p.label}</span>
                        <span className="text-[13px] font-mono font-medium" style={{ color: "#1D1D1F" }}>{p.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] italic" style={{ color: "#6E6E73" }}>
                    {dash.wfm.cerrados} cerrados · {dash.wfm.total} totales
                  </p>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: "#6E6E73" }}>WFM no disponible</p>
              )}
            </GCard>

            {/* Top Vendedores */}
            <GCard title="Top vendedores">
              <div className="space-y-3 mt-1">
                {(dash?.top_vendedores ?? []).map((v, i) => (
                  <div key={v.nombre} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono w-4" style={{ color: "#6E6E73" }}>{i+1}</span>
                    <span className="flex-1 text-[13px] truncate" style={{ color: "#1D1D1F" }}>
                      {v.nombre.split(' ')[0]} {v.nombre.split(' ')[1] ?? ''}
                    </span>
                    <span className="text-[12px] font-mono" style={{ color: "hsl(160 70% 37%)" }}>
                      {fmtMXN(v.mrr)}
                    </span>
                  </div>
                ))}
              </div>
            </GCard>
          </div>
        </section>

        {/* ── SECTION 3 — CHART + TABLE */}
        <section style={{ marginTop: 48 }}>
          <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
            <GCard title="Evolución MRR" subtitle="Por mes · 2026">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredMRR} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6E6E73" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6E6E73" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1_000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #E5E5E7", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toLocaleString("es-MX")}`, undefined]}
                    />
                    {activeEmp === "todos" ? (
                      empresas.map(e => (
                        <Line key={e.id} type="monotone" dataKey={e.id} name={e.name}
                          stroke={e.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))
                    ) : (
                      <Line type="monotone" dataKey="total" name={empresas.find(e=>e.id===activeEmp)?.name ?? activeEmp}
                        stroke={EMPRESA_COLORS[activeEmp] ?? "#1B7F4A"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    )}
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GCard>

            <GCard title="Rendimiento por empresa">
              <div className="overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ color: "#6E6E73" }}>
                      <th className="pb-3 text-left font-medium">Empresa</th>
                      <th className="pb-3 text-right font-medium">MRR</th>
                      <th className="pb-3 text-right font-medium">Órdenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmpresas.map(r => (
                      <tr key={r.id} className="border-t" style={{ borderColor: "#F0F0F2" }}>
                        <td className="py-2.5 font-medium flex items-center gap-1.5" style={{ color: "#1D1D1F" }}>
                          <span className="h-2 w-2 rounded-full inline-block" style={{ background: r.color }} />
                          {r.name}
                        </td>
                        <td className="py-2.5 text-right font-mono" style={{ color: "hsl(160 70% 37%)" }}>
                          {fmtMXN(r.mrr)}
                        </td>
                        <td className="py-2.5 text-right font-mono" style={{ color: "#1D1D1F" }}>
                          {r.ordenes}
                        </td>
                      </tr>
                    ))}
                    {filteredEmpresas.length > 1 && (
                      <tr className="border-t font-semibold" style={{ borderColor: "#E5E5E7", color: "#1D1D1F" }}>
                        <td className="py-2.5">TOTAL</td>
                        <td className="py-2.5 text-right font-mono" style={{ color: "hsl(160 70% 37%)" }}>
                          {fmtMXN(filteredEmpresas.reduce((s,e)=>s+e.mrr,0))}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {filteredEmpresas.reduce((s,e)=>s+e.ordenes,0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GCard>
          </div>
        </section>

        {/* ── SECTION 4 — AGENTS */}
        <section style={{ marginTop: 48 }}>
          <SectionLabel>AGENTES IA</SectionLabel>
          <div className="grid grid-cols-5 gap-4">
            {AGENTS.map(agent => (
              <GCard key={agent.name} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[17px] font-semibold" style={{ color: "#1D1D1F" }}>{agent.name}</span>
                  <Badge className="border-0 text-[11px] px-2 py-0.5" style={{ background: "hsl(160 70% 37%)", color: "#fff" }}>
                    Activo
                  </Badge>
                </div>
                <div className="my-3 h-px" style={{ background: "#E5E5E7" }} />
                <div className="flex-1 space-y-3">
                  {agent.metrics.map(m => (
                    <div key={m.label}>
                      <p className="text-[12px]" style={{ color: "#6E6E73" }}>{m.label}</p>
                      <p className="text-[20px] font-semibold" style={{ color: "#1D1D1F" }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] italic" style={{ color: "#6E6E73" }}>{agent.insight}</p>
              </GCard>
            ))}
          </div>
        </section>

        {/* ── SECTION 5 — ALERTS + FEED */}
        <section style={{ marginTop: 48 }}>
          <SectionLabel>REQUIERE ATENCIÓN</SectionLabel>
          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <GCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[15px] font-semibold" style={{ color: "#1D1D1F" }}>Alertas activas</span>
                <Badge className="border-0 text-[11px] px-2 py-0.5" style={{ background: "hsl(0 72% 59%)", color: "#fff" }}>
                  {ALERTS.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {ALERTS.map((a, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-3" style={{ background: "#F5F5F7" }}>
                    <div className="w-[3px] shrink-0 rounded-full"
                      style={{ background: a.severity === "red" ? "hsl(0 72% 59%)" : "hsl(37 78% 55%)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate" style={{ color: "#1D1D1F" }}>{a.title}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#6E6E73" }}>{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GCard>

            <GCard>
              <span className="text-[15px] font-semibold block mb-4" style={{ color: "#1D1D1F" }}>Actividad reciente</span>
              <div className="space-y-0 max-h-[340px] overflow-y-auto pr-1">
                {ACTIVITY_FEED.map((item, i) => (
                  <div key={i} className="flex gap-3 py-2.5">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full mt-1.5" style={{ background: item.agentColor }} />
                      {i < ACTIVITY_FEED.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: "#E5E5E7" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono tabular-nums" style={{ color: "#6E6E73" }}>{item.time}</span>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: `${item.agentColor}22`, color: item.agentColor }}>
                          {item.agent}
                        </span>
                      </div>
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: "#1D1D1F" }}>{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GCard>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6E6E73" }}>
      {children}
    </p>
  );
}

function GCard({
  title, subtitle, children, className = "",
}: {
  title?: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)" }}
    >
      {title && (
        <div className="mb-3">
          <p className="text-[15px] font-semibold" style={{ color: "#1D1D1F" }}>{title}</p>
          {subtitle && <p className="text-[12px] mt-0.5" style={{ color: "#6E6E73" }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, trend, trendGood }: {
  label: string; value: string; sub: string; trend: string; trendGood: boolean;
}) {
  return (
    <GCard>
      <p className="text-[12px] font-medium" style={{ color: "#6E6E73" }}>{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight" style={{ color: "#1D1D1F" }}>
        {value}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "#6E6E73" }}>{sub}</p>
      <p className="mt-2 text-[12px] font-medium"
        style={{ color: trendGood ? "hsl(160 70% 37%)" : "hsl(0 72% 59%)" }}>
        {trend}
      </p>
    </GCard>
  );
}
