// Executive dashboard mock data for ISPilot /gerencia route

export type IspId = "todos" | "xcien" | "wispi" | "luminet" | "huus" | "sandur";

export const ISP_FILTERS: { id: IspId; label: string }[] = [
  { id: "todos",  label: "Todos" },
  { id: "xcien",  label: "XCIEN" },
  { id: "wispi",  label: "Wispi" },
  { id: "luminet",label: "Luminet WAN" },
  { id: "huus",   label: "Huus" },
  { id: "sandur", label: "Sandur" },
];

export const ISP_COLORS: Record<string, string> = {
  xcien:   "#1B7F4A",
  luminet: "#0E6B3A",
  wispi:   "#0EA5E9",
  huus:    "#7C3AED",
  sandur:  "#EA580C",
};

export interface RevenueMetric {
  label: string;
  value: string;
  sub: string;
  trend: string;
  trendDir: "up" | "down" | "neutral";
  trendGood: boolean;
}

export const REVENUE_METRICS: RevenueMetric[] = [
  { label: "MRR total", value: "$102,500", sub: "MXN / mes", trend: "↑ 8.3% vs mes anterior", trendDir: "up", trendGood: true },
  { label: "ARR proyectado", value: "$1.23M", sub: "MXN anual", trend: "5 ISPs activos", trendDir: "neutral", trendGood: true },
  { label: "Cuentas por cobrar", value: "$47,200", sub: "MXN vencido", trend: "↑ 12 facturas", trendDir: "up", trendGood: false },
  { label: "Tasa de cobranza", value: "94.2%", sub: "Cobra: 847 acciones", trend: "↑ 2.1% vs mes ant.", trendDir: "up", trendGood: true },
  { label: "Churn rate", value: "1.8%", sub: "3 clientes riesgo", trend: "↓ 0.3% vs mes ant.", trendDir: "down", trendGood: true },
];

export interface IspUptime { name: string; uptime: number; }
export const ISP_UPTIMES: IspUptime[] = [
  { name: "Xcien",       uptime: 99.2 },
  { name: "Luminet WAN", uptime: 99.8 },
  { name: "Wispi",       uptime: 97.1 },
  { name: "Huus",        uptime: 99.1 },
  { name: "Sandur",      uptime: 95.3 },
];

export interface SupportPriority { label: string; color: string; count: number; }
export const SUPPORT_PRIORITIES: SupportPriority[] = [
  { label: "P1 Crítico", color: "hsl(0 72% 59%)", count: 2 },
  { label: "P2 Alto", color: "hsl(37 78% 55%)", count: 8 },
  { label: "P3 Medio", color: "hsl(0 0% 65%)", count: 37 },
];

export interface InventoryItem { name: string; current: number; max: number; }
export const INVENTORY_ITEMS: InventoryItem[] = [
  { name: "ONT fibra", current: 8, max: 30 },
  { name: "UPS", current: 4, max: 10 },
  { name: "Cable cat6", current: 12, max: 20 },
];

export interface MrrDataPoint { month: string; xcien: number; luminet: number; huus: number; wispi: number; sandur: number; }
export const MRR_EVOLUTION: MrrDataPoint[] = [
  { month: "Oct", xcien: 28000, luminet: 22000, huus: 15000, wispi: 12000, sandur: 8000 },
  { month: "Nov", xcien: 29500, luminet: 23000, huus: 15800, wispi: 12500, sandur: 9200 },
  { month: "Dic", xcien: 30200, luminet: 23500, huus: 16200, wispi: 13000, sandur: 10500 },
  { month: "Ene", xcien: 31000, luminet: 24200, huus: 17000, wispi: 13800, sandur: 11000 },
  { month: "Feb", xcien: 32500, luminet: 25000, huus: 17500, wispi: 14200, sandur: 11800 },
  { month: "Mar", xcien: 34000, luminet: 26000, huus: 18000, wispi: 14500, sandur: 12500 },
];

export interface IspPerformance { isp: string; mrr: string; clientes: number; uptime: number; churn: number; }
export const ISP_PERFORMANCE: IspPerformance[] = [
  { isp: "Xcien",       mrr: "$34,000", clientes: 142, uptime: 99.2, churn: 1.2 },
  { isp: "Luminet WAN", mrr: "$26,000", clientes: 98,  uptime: 99.8, churn: 0.8 },
  { isp: "Wispi",       mrr: "$14,500", clientes: 53,  uptime: 97.1, churn: 2.8 },
  { isp: "Huus",        mrr: "$18,000", clientes: 67,  uptime: 99.1, churn: 1.5 },
  { isp: "Sandur",      mrr: "$12,500", clientes: 45,  uptime: 95.3, churn: 3.1 },
];

export interface AgentData {
  name: string;
  metrics: { label: string; value: string }[];
  insight: string;
}
export const AGENTS: AgentData[] = [
  { name: "Atlas NOC", metrics: [{ label: "Incidentes", value: "47" }, { label: "Respuesta", value: "1.8 min" }, { label: "P1 auto", value: "89%" }], insight: "Sin escalaciones humanas esta semana" },
  { name: "Nico Soporte", metrics: [{ label: "Chats", value: "312" }, { label: "Resueltos IA", value: "78%" }, { label: "CSAT", value: "4.6★" }], insight: "Tiempo promedio resolución: 4.2 min" },
  { name: "Cobra Cobranza", metrics: [{ label: "Procesadas", value: "89" }, { label: "Recuperación", value: "73%" }, { label: "Auto", value: "$34.2k" }], insight: "8 escalaciones a humano este mes" },
  { name: "Onboarding", metrics: [{ label: "Nuevos", value: "23" }, { label: "Tiempo", value: "1.8 días" }, { label: "Sin humanos", value: "91%" }], insight: "Próxima activación: mañana 9am" },
  { name: "Ventas", metrics: [{ label: "Leads", value: "31" }, { label: "Demos", value: "12" }, { label: "Pipeline", value: "$145k" }], insight: "2 demos agendadas esta semana" },
];

export interface AlertItem {
  severity: "red" | "amber";
  title: string;
  description: string;
  action: string;
  actionLabel: string;
}
export const ALERTS: AlertItem[] = [
  { severity: "red", title: "COAH-SALTILLO-CORE", description: "P1 sin resolver — 45 minutos", action: "/red-en-vivo", actionLabel: "Ver en NOC →" },
  { severity: "amber", title: "Manufactura del Norte S.A.", description: "Churn score: 78/100", action: "#", actionLabel: "Ver cliente →" },
  { severity: "amber", title: "Stock ONT fibra — 3 días", description: "PO pendiente de aprobación", action: "#", actionLabel: "Aprobar →" },
];

export interface ActivityItem {
  time: string;
  agent: string;
  agentColor: string;
  action: string;
}
export const ACTIVITY_FEED: ActivityItem[] = [
  { time: "14:32", agent: "Atlas", agentColor: "hsl(172 60% 45%)", action: "Ticket NOC-0847 creado" },
  { time: "14:28", agent: "Cobra", agentColor: "hsl(28 85% 55%)", action: "Recordatorio enviado — Grupo Ind." },
  { time: "13:15", agent: "Nico", agentColor: "hsl(270 50% 55%)", action: "Ticket #4521 resuelto en 3 min" },
  { time: "12:00", agent: "Bodega IA", agentColor: "hsl(5 70% 60%)", action: "Stock mínimo — ONT fibra" },
  { time: "11:45", agent: "Atlas", agentColor: "hsl(172 60% 45%)", action: "Failover activado — Wispi nodo 3" },
  { time: "11:20", agent: "Ventas", agentColor: "hsl(220 55% 35%)", action: "Demo agendada — TelCom MX" },
  { time: "10:55", agent: "Nico", agentColor: "hsl(270 50% 55%)", action: "Ticket #4520 resuelto en 2 min" },
  { time: "10:30", agent: "Cobra", agentColor: "hsl(28 85% 55%)", action: "Pago confirmado — $12,400 MXN" },
  { time: "09:15", agent: "Onboarding", agentColor: "hsl(162 68% 37%)", action: "ISP Wispi — activación completada" },
  { time: "08:42", agent: "Atlas", agentColor: "hsl(172 60% 45%)", action: "Mantenimiento programado — Luminet" },
];
