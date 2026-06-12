import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../config";

// ─── Design tokens (Apple + UniFi/Ubiquiti) ───────────────────────────────
const T = {
  bg:      "#0a0a0f",
  surface: "rgba(255,255,255,0.035)",
  surfaceHover: "rgba(255,255,255,0.06)",
  border:  "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  blue:    "#006FFF",
  blueGlow:"rgba(0,111,255,0.18)",
  green:   "#1FA649",
  greenGlow:"rgba(31,166,73,0.2)",
  amber:   "#F5A623",
  amberGlow:"rgba(245,166,35,0.2)",
  red:     "#E8413E",
  redGlow: "rgba(232,65,62,0.2)",
  purple:  "#7C3AED",
  text:    "#F5F5F7",
  dim:     "#86868B",
  dimmer:  "#4a4a4f",
  font:    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  mono:    "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
  r:       { sm: 10, md: 16, lg: 20, xl: 24 },
};

const EMPRESA_COLORS: Record<string, string> = {
  xcien: "#1FA649", luminet: "#006FFF", huus: "#7C3AED",
  manufactura: "#F5A623", otro: "#86868B",
};

function fmtMXN(v: number | null | undefined, compact = false) {
  if (v == null) return "—";
  if (compact) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v.toLocaleString("es-MX")}`;
  }
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
}

function UptimeDial({ pct }: { pct: number }) {
  const r = 30, cx = 36, cy = 36, stroke = 5;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const color = pct >= 90 ? T.green : pct >= 75 ? T.amber : T.red;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={13} fontWeight={800} fontFamily={T.mono}>
        {pct}%
      </text>
    </svg>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 4, background: T.border, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99,
        boxShadow: `0 0 6px ${color}80`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function MonthBars({ data }: { data: any[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map((d, i) => {
        const h = Math.max((d.total / max) * 72, 4);
        const isLatest = i === data.length - 1;
        return (
          <div key={d.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: "100%", height: h, background: isLatest ? T.blue : T.border,
              borderRadius: "4px 4px 0 0",
              boxShadow: isLatest ? `0 0 10px ${T.blueGlow}` : undefined,
              transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
            <span style={{ fontSize: 9, color: T.dimmer, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {d.mes.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Dot({ color, size = 8, glow }: { color: string; size?: number; glow?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 8px ${glow}` : undefined,
    }} />
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", display: "inline-flex", width: "100%", height: "100%",
        borderRadius: "50%", background: color, opacity: 0.4,
        animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%",
        width: 10, height: 10, background: color }} />
    </span>
  );
}

function Divider() {
  return <div style={{ width: "100%", height: 1, background: T.border, margin: "4px 0" }} />;
}

interface EmpresaRow { id: string; name: string; color: string; mrr: number; ordenes: number; }
interface MesRow { mes: string; total: number; xcien?: number; luminet?: number; huus?: number; manufactura?: number; otro?: number; }
interface DashData {
  mrr: number; arr: number; vtc: number; total_ordenes: number;
  por_empresa: EmpresaRow[];
  mrr_por_mes: MesRow[];
  top_vendedores: { nombre: string; ordenes: number; mrr: number }[];
  noc: { total: number; online: number; uptime: number } | null;
  wfm: { total: number; abiertos: number; cerrados: number; alta: number; media: number; baja: number } | null;
}

export default function Gerencia() {
  const [dash, setDash]       = useState<DashData | null>(null);
  const [noc, setNoc]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [tick, setTick]       = useState(0);
  const prevMrr               = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, nocRes] = await Promise.all([
        fetch(`${API_BASE}/api/gerencia/dashboard`),
        fetch(`${API_BASE}/api/noc/dashboard-stats`),
      ]);
      if (dashRes.ok) { const d = await dashRes.json(); setDash(d); prevMrr.current = d.mrr; }
      if (nocRes.ok)  { const d = await nocRes.json(); setNoc(d); }
      setLastRefresh(new Date());
    } catch { /* silencio */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 90_000); return () => clearInterval(id); }, [fetchAll]);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const uptimePct = dash?.noc?.uptime ?? noc?.uptime_pct ?? 0;
  const nocTotal  = dash?.noc?.total  ?? noc?.total  ?? 0;
  const nocOnline = dash?.noc?.online ?? noc?.up     ?? 0;
  const maxEmpMrr = Math.max(...(dash?.por_empresa ?? []).map(e => e.mrr), 1);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
      color: T.dim, fontFamily: T.font, fontSize: 13, letterSpacing: 1 }}>
      <Dot color={T.blue} size={6} /> &nbsp; CARGANDO DATOS GERENCIALES...
    </div>
  );

  return (
    <div style={{ background: T.bg, fontFamily: T.font, color: T.text, padding: "32px 32px 60px", minHeight: "100vh" }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .g-card { transition: border-color 0.2s; }
        .g-card:hover { border-color: rgba(255,255,255,0.15) !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <PulseDot color={T.green} />
            <span style={{ fontSize: 11, color: T.dim, letterSpacing: 2, textTransform: "uppercase" }}>
              Live · {dateStr}
            </span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: -1.5, lineHeight: 1.05,
            background: "linear-gradient(135deg, #F5F5F7 0%, #86868B 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dashboard Gerencial
          </h1>
          <p style={{ fontSize: 14, color: T.dim, marginTop: 6, marginBottom: 0 }}>
            XCIEN / Luminet WAN / Huus · Consorcio XCIEN
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: T.mono, letterSpacing: -1,
            color: T.text, lineHeight: 1 }}>{timeStr}</div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>
            Última actualización: {lastRefresh.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            <button onClick={fetchAll} style={{ marginLeft: 10, padding: "2px 10px", borderRadius: 99,
              background: T.surface, border: `1px solid ${T.border}`, color: T.blue, fontSize: 11,
              cursor: "pointer", fontFamily: T.font }}>↺ Refrescar</button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "MRR Total", value: fmtMXN(dash?.mrr, true), sub: "Ingresos recurrentes mensuales",
            color: T.green, glow: T.greenGlow, icon: "◈" },
          { label: "ARR", value: fmtMXN(dash?.arr, true), sub: "Anualizado",
            color: T.blue, glow: T.blueGlow, icon: "◉" },
          { label: "VTC Total", value: fmtMXN(dash?.vtc, true), sub: "Valor total del contrato",
            color: T.purple, glow: "rgba(124,58,237,0.2)", icon: "◇" },
          { label: "Órdenes", value: dash?.total_ordenes?.toLocaleString() ?? "—", sub: "Contratos activos",
            color: T.amber, glow: T.amberGlow, icon: "◎" },
          { label: "Tickets WFM", value: dash?.wfm ? `${dash.wfm.abiertos} / ${dash.wfm.total}` : "—",
            sub: dash?.wfm ? `${dash.wfm.alta} alta prioridad` : "Cargando...",
            color: dash?.wfm && dash.wfm.alta > 0 ? T.amber : T.dim, glow: T.amberGlow, icon: "◑" },
        ].map((k, i) => (
          <div key={i} className="g-card" style={{
            padding: "20px 20px 18px", borderRadius: T.r.lg,
            background: T.surface, border: `1px solid ${T.border}`,
            display: "flex", flexDirection: "column", gap: 8,
            animation: `fadeSlide 0.4s ease ${i * 0.07}s both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.dim, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
                {k.label}
              </span>
              <span style={{ fontSize: 18, color: k.color, opacity: 0.6 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1,
              color: k.color, textShadow: `0 0 20px ${k.glow}`, fontFamily: T.mono }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: T.dimmer }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main 3-col grid ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Col 1: MRR por empresa */}
        <div className="g-card" style={{ borderRadius: T.r.xl, background: T.surface,
          border: `1px solid ${T.border}`, padding: "24px 24px 20px",
          animation: "fadeSlide 0.4s ease 0.3s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: 0.3, color: T.text }}>
              MRR por Empresa
            </h3>
            <span style={{ fontSize: 11, color: T.blue, fontFamily: T.mono, fontWeight: 600 }}>
              {fmtMXN(dash?.mrr, true)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(dash?.por_empresa ?? []).filter(e => e.mrr > 0).sort((a, b) => b.mrr - a.mrr).map(emp => (
              <div key={emp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot color={EMPRESA_COLORS[emp.id] ?? T.dim} size={7} glow={EMPRESA_COLORS[emp.id]} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</span>
                    <span style={{ fontSize: 11, color: T.dimmer }}>{emp.ordenes} órd.</span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: T.mono, fontWeight: 600,
                    color: EMPRESA_COLORS[emp.id] ?? T.text }}>
                    {fmtMXN(emp.mrr, true)}
                  </span>
                </div>
                <MiniBar value={emp.mrr} max={maxEmpMrr} color={EMPRESA_COLORS[emp.id] ?? T.dim} />
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Red NOC */}
        <div className="g-card" style={{ borderRadius: T.r.xl, background: T.surface,
          border: `1px solid ${T.border}`, padding: "24px 24px 20px",
          animation: "fadeSlide 0.4s ease 0.4s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>Estado de Red</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UptimeDial pct={Math.round(uptimePct)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Nodos", value: nocTotal, color: T.dim },
              { label: "Online", value: nocOnline, color: T.green },
              { label: "Offline", value: nocTotal - nocOnline, color: T.red },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: "10px 12px", borderRadius: T.r.md,
                background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: T.mono, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T.dimmer, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Divider />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {(noc?.regiones ?? []).slice(0, 6).map((r: any) => (
              <div key={r.nombre}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot color={r.fail_pct > 30 ? T.red : r.fail_pct > 15 ? T.amber : T.green}
                      size={6} glow={r.fail_pct > 30 ? T.redGlow : T.greenGlow} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{r.nombre}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.dim }}>
                    {r.up}/{r.total}
                  </span>
                </div>
                <MiniBar value={r.up} max={r.total}
                  color={r.fail_pct > 30 ? T.red : r.fail_pct > 15 ? T.amber : T.green} />
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Top vendedores */}
        <div className="g-card" style={{ borderRadius: T.r.xl, background: T.surface,
          border: `1px solid ${T.border}`, padding: "24px 24px 20px",
          animation: "fadeSlide 0.4s ease 0.5s both" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
            Top Vendedores
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(dash?.top_vendedores ?? []).map((v, i) => (
              <div key={v.nombre}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? T.blueGlow : T.surface,
                    border: `1px solid ${i === 0 ? T.blue : T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, fontFamily: T.mono, color: i === 0 ? T.blue : T.dim }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.nombre.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div style={{ fontSize: 10, color: T.dimmer }}>{v.ordenes} órdenes</div>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: T.mono, fontWeight: 700,
                    color: i === 0 ? T.blue : T.text }}>
                    {fmtMXN(v.mrr, true)}
                  </div>
                </div>
                {i < (dash?.top_vendedores ?? []).length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: MRR Mensual + Alertas ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16 }}>

        {/* MRR por mes */}
        <div className="g-card" style={{ borderRadius: T.r.xl, background: T.surface,
          border: `1px solid ${T.border}`, padding: "24px 24px 20px",
          animation: "fadeSlide 0.4s ease 0.6s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>MRR Mensual</h3>
            <span style={{ fontSize: 11, color: T.dim }}>2026</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <MonthBars data={dash?.mrr_por_mes ?? []} />
            {/* Breakdown stacked por empresa */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {(dash?.mrr_por_mes ?? []).map(m => {
                const empresasEnMes = Object.entries(m).filter(([k]) =>
                  k !== "mes" && k !== "total" && (m as any)[k] > 0
                ) as [string, number][];
                return (
                  <div key={m.mes} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 50, fontSize: 10, color: T.dimmer, textTransform: "uppercase",
                      letterSpacing: 0.5, flexShrink: 0 }}>{m.mes.slice(0, 3)}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: "hidden",
                      display: "flex", background: T.border }}>
                      {empresasEnMes.map(([empId, val]) => {
                        const pct = m.total > 0 ? (val / m.total) * 100 : 0;
                        return (
                          <div key={empId} style={{ width: `${pct}%`, height: "100%",
                            background: EMPRESA_COLORS[empId] ?? T.dim }} />
                        );
                      })}
                    </div>
                    <span style={{ width: 60, fontSize: 11, fontFamily: T.mono, textAlign: "right",
                      color: T.text }}>{fmtMXN(m.total, true)}</span>
                  </div>
                );
              })}
            </div>
            {/* Leyenda */}
            <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
              {Object.entries(EMPRESA_COLORS).map(([id, color]) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Dot color={color} size={6} />
                  <span style={{ fontSize: 10, color: T.dim, textTransform: "capitalize" }}>
                    {id === "luminet" ? "Luminet WAN" : id.charAt(0).toUpperCase() + id.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de salud del sistema */}
        <div className="g-card" style={{ borderRadius: T.r.xl, background: T.surface,
          border: `1px solid ${T.border}`, padding: "24px 24px 20px",
          animation: "fadeSlide 0.4s ease 0.7s both" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
            Salud del Sistema
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "NOCBoard", sub: `${nocOnline}/${nocTotal} nodos`, ok: nocOnline > 0 },
              { label: "Odoo ERP", sub: "wispi17 · XML-RPC", ok: (dash?.total_ordenes ?? 0) > 0 },
              { label: "UISP / Ubiquiti", sub: "xcien.uisp.com", ok: true },
              { label: "API Backend", sub: "FastAPI · Puerto 8002", ok: !!dash },
              { label: "WFM Field Service", sub: dash?.wfm ? `${dash.wfm.total} tickets` : "Conectando...",
                ok: !!dash?.wfm },
            ].map((s, i, arr) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.r.sm,
                      background: s.ok ? T.greenGlow : T.redGlow,
                      border: `1px solid ${s.ok ? T.green + "40" : T.red + "40"}`,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14 }}>{s.ok ? "●" : "○"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: T.dimmer }}>{s.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                    fontWeight: 600, color: s.ok ? T.green : T.red }}>
                    {s.ok ? <PulseDot color={T.green} /> : <Dot color={T.red} />}
                    <span style={{ marginLeft: 4 }}>{s.ok ? "OK" : "ERROR"}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
          {/* Footer timestamp */}
          <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: T.r.md,
            background: "rgba(0,111,255,0.06)", border: `1px solid ${T.blue}25`,
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.blue, fontFamily: T.mono }}>
              AUTO-REFRESH · 90s
            </span>
            <span style={{ fontSize: 10, color: T.dimmer, fontFamily: T.mono }}>
              {timeStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
