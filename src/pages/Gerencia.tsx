import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  ISP_FILTERS, ISP_COLORS, REVENUE_METRICS, ISP_UPTIMES, SUPPORT_PRIORITIES,
  INVENTORY_ITEMS, MRR_EVOLUTION, ISP_PERFORMANCE, AGENTS, ALERTS, ACTIVITY_FEED,
  type IspId,
} from "@/data/mockGerenciaData";

// ── Helpers ──────────────────────────────────────────────
const fmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function uptimeColor(v: number) {
  if (v >= 99) return "hsl(160 70% 37%)";
  if (v >= 97) return "hsl(37 78% 55%)";
  return "hsl(0 72% 59%)";
}

// ── Page ─────────────────────────────────────────────────
export default function Gerencia() {
  const [activeIsp, setActiveIsp] = useState<IspId>("todos");
  const [now, setNow] = useState(new Date());
  const [fadeKey, setFadeKey] = useState(0);

  // Auto-refresh timestamp every 60s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleFilter = useCallback((id: IspId) => {
    setActiveIsp(id);
    setFadeKey(k => k + 1);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F7" }}>
      {/* ── Sticky Top Bar ─────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(245,245,247,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "#E5E5E7",
        }}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3">
          <span className="text-[20px] font-semibold tracking-tight" style={{ color: "#1D1D1F" }}>
            ISPilot
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {ISP_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => handleFilter(f.id)}
                className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-150"
                style={
                  activeIsp === f.id
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

      <div key={fadeKey} className="mx-auto max-w-[1280px] px-8 pb-20 animate-count-up">
        {/* ── SECTION 1 — REVENUE ───────────────────────── */}
        <section style={{ marginTop: 40 }}>
          <SectionLabel>INGRESOS</SectionLabel>
          <div className="grid grid-cols-5 gap-4">
            {REVENUE_METRICS.map(m => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        </section>

        {/* ── SECTION 2 — OPERATIONS ────────────────────── */}
        <section style={{ marginTop: 48 }}>
          <SectionLabel>OPERACIONES</SectionLabel>
          <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr" }}>
            {/* Network Health */}
            <GCard title="Salud de red">
              <p className="text-[48px] font-semibold leading-none" style={{ color: "hsl(160 70% 37%)" }}>98.7%</p>
              <p className="mt-1 text-[13px]" style={{ color: "#6E6E73" }}>Uptime promedio</p>
              <div className="mt-5 space-y-3">
                {ISP_UPTIMES.map(isp => (
                  <div key={isp.name} className="flex items-center gap-3">
                    <span className="w-16 text-[13px] font-medium" style={{ color: "#1D1D1F" }}>{isp.name}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#E5E5E7" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${isp.uptime}%`, background: uptimeColor(isp.uptime) }}
                      />
                    </div>
                    <span className="w-12 text-right text-[13px] font-mono tabular-nums" style={{ color: "#1D1D1F" }}>
                      {isp.uptime}%
                    </span>
                  </div>
                ))}
              </div>
            </GCard>

            {/* Support */}
            <GCard title="Soporte">
              <p className="text-[48px] font-semibold leading-none" style={{ color: "#1D1D1F" }}>47</p>
              <p className="mt-1 text-[13px]" style={{ color: "#6E6E73" }}>tickets abiertos</p>
              <div className="mt-5 space-y-2.5">
                {SUPPORT_PRIORITIES.map(p => (
                  <div key={p.label} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 text-[13px]" style={{ color: "#1D1D1F" }}>{p.label}</span>
                    <span className="text-[13px] font-mono font-medium" style={{ color: "#1D1D1F" }}>{p.count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] italic" style={{ color: "#6E6E73" }}>
                Nico resolvió 312 sin humanos
              </p>
            </GCard>

            {/* Inventory */}
            <GCard title="Inventario">
              <p className="text-[48px] font-semibold leading-none" style={{ color: "hsl(37 78% 55%)" }}>3</p>
              <p className="mt-1 text-[13px]" style={{ color: "#6E6E73" }}>productos bajo mínimo</p>
              <div className="mt-5 space-y-3">
                {INVENTORY_ITEMS.map(item => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: "#1D1D1F" }}>{item.name}</span>
                      <span className="font-mono" style={{ color: "#6E6E73" }}>{item.current}/{item.max} uds</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#E5E5E7" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.current / item.max) * 100}%`,
                          background: "hsl(0 72% 59%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px]" style={{ color: "#6E6E73" }}>
                2 POs pendientes de aprobación
              </p>
            </GCard>
          </div>
        </section>

        {/* ── SECTION 3 — CHART + TABLE ─────────────────── */}
        <section style={{ marginTop: 48 }}>
          <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
            <GCard title="Evolución MRR" subtitle="Últimos 6 meses">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MRR_EVOLUTION} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6E6E73" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#6E6E73" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #E5E5E7",
                        borderRadius: 12,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                        fontSize: 13,
                      }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    {(["xcien", "luminet", "wispi", "huus", "sandur"] as const).map(k => (
                      <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={k.charAt(0).toUpperCase() + k.slice(1)}
                        stroke={ISP_COLORS[k]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GCard>

            <GCard title="Rendimiento por ISP">
              <div className="overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ color: "#6E6E73" }}>
                      <th className="pb-3 text-left font-medium">ISP</th>
                      <th className="pb-3 text-right font-medium">MRR</th>
                      <th className="pb-3 text-right font-medium">Clientes</th>
                      <th className="pb-3 text-right font-medium">Uptime</th>
                      <th className="pb-3 text-right font-medium">Churn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ISP_PERFORMANCE.map(r => (
                      <tr key={r.isp} className="border-t" style={{ borderColor: "#F0F0F2" }}>
                        <td className="py-2.5 font-medium" style={{ color: "#1D1D1F" }}>{r.isp}</td>
                        <td className="py-2.5 text-right font-mono" style={{ color: "#1D1D1F" }}>{r.mrr}</td>
                        <td className="py-2.5 text-right font-mono" style={{ color: "#1D1D1F" }}>{r.clientes}</td>
                        <td className="py-2.5 text-right font-mono" style={{ color: r.uptime >= 99 ? "hsl(160 70% 37%)" : r.uptime >= 97 ? "hsl(37 78% 55%)" : "hsl(0 72% 59%)" }}>
                          {r.uptime}%
                        </td>
                        <td className="py-2.5 text-right font-mono" style={{ color: r.churn <= 1.5 ? "hsl(160 70% 37%)" : "hsl(0 72% 59%)" }}>
                          {r.churn}%
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-semibold" style={{ borderColor: "#E5E5E7", color: "#1D1D1F" }}>
                      <td className="py-2.5">TOTAL</td>
                      <td className="py-2.5 text-right font-mono">$102,500</td>
                      <td className="py-2.5 text-right font-mono">405</td>
                      <td className="py-2.5 text-right font-mono">98.7%</td>
                      <td className="py-2.5 text-right font-mono">1.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GCard>
          </div>
        </section>

        {/* ── SECTION 4 — AGENTS ────────────────────────── */}
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

        {/* ── SECTION 5 — ALERTS ────────────────────────── */}
        <section style={{ marginTop: 48 }}>
          <SectionLabel>REQUIERE ATENCIÓN</SectionLabel>
          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Alerts */}
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
                    <div
                      className="w-[3px] shrink-0 rounded-full"
                      style={{ background: a.severity === "red" ? "hsl(0 72% 59%)" : "hsl(37 78% 55%)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate" style={{ color: "#1D1D1F" }}>{a.title}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#6E6E73" }}>{a.description}</p>
                      <Link to={a.action} className="text-[12px] font-medium mt-1 inline-block" style={{ color: "hsl(172 60% 45%)" }}>
                        {a.actionLabel}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </GCard>

            {/* Activity Feed */}
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
                        <span
                          className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: `${item.agentColor}22`, color: item.agentColor }}
                        >
                          {item.agent}
                        </span>
                      </div>
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: "#1D1D1F" }}>{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="text-[12px] font-medium mt-3" style={{ color: "hsl(172 60% 45%)" }}>
                Ver todo →
              </button>
            </GCard>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Shared Components ────────────────────────────────────

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

function MetricCard({
  label, value, sub, trend, trendGood,
}: {
  label: string; value: string; sub: string; trend: string; trendDir: string; trendGood: boolean;
}) {
  return (
    <GCard>
      <p className="text-[12px] font-medium" style={{ color: "#6E6E73" }}>{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight animate-count-up" style={{ color: "#1D1D1F" }}>
        {value}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "#6E6E73" }}>{sub}</p>
      <p
        className="mt-2 text-[12px] font-medium"
        style={{ color: trendGood ? "hsl(160 70% 37%)" : "hsl(0 72% 59%)" }}
      >
        {trend}
      </p>
    </GCard>
  );
}
