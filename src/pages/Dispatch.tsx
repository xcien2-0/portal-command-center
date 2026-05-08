import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../config';
import {
  Send, Clock, CheckCircle2, XCircle, AlertTriangle, Filter, RefreshCw, Plus,
  User, MapPin, Calendar, List, Columns3, ChevronRight, Phone, FileText,
  Truck, MapPinned, Timer, ArrowUpDown, Search, X, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

/* ───── Types ───── */
type JobStatus = 'pending_dispatch' | 'scheduled' | 'in_route' | 'on_site' | 'completed' | 'blocked';
type CustomerStatus = 'pending' | 'confirmed' | 'unavailable' | 'access_denied' | 'reschedule';
type ServiceType = 'instalacion_residencial' | 'instalacion_empresarial' | 'mantenimiento' | 'reparacion' | 'retiro' | 'migracion' | 'otro';
type VisitType = 'primera_visita' | 'seguimiento' | 'revisita' | 'emergencia';
type ViewMode = 'queue' | 'calendar' | 'board';

interface DispatchJob {
  id: string;
  job_number: string;
  project_id: string | null;
  customer_name: string;
  site_address: string;
  service_type: ServiceType;
  visit_type: VisitType;
  priority: string;
  status: JobStatus;
  customer_status: CustomerStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_duration_minutes: number | null;
  contact_person: string | null;
  contact_phone: string | null;
  zone: string | null;
  territory: string | null;
  crew_id: string | null;
  work_order_id: string | null;
  odoo_order_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: JobStatus | null;
  new_status: JobStatus;
  changed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

interface DispatchNote {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Technician {
  id: string;
  name: string;
  plaza: string | null;
  phone: string | null;
  is_active: boolean;
}

/* ───── Config ───── */
const STATUS_CONFIG: Record<JobStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending_dispatch: { label: 'Pendiente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  scheduled: { label: 'Programado', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  in_route: { label: 'En Ruta', icon: Truck, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  on_site: { label: 'En Sitio', icon: MapPinned, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30' },
  completed: { label: 'Completado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  blocked: { label: 'Bloqueado', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  alta: { label: 'Alta', dot: 'bg-red-400' },
  media: { label: 'Media', dot: 'bg-amber-400' },
  baja: { label: 'Baja', dot: 'bg-emerald-400' },
};

const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  unavailable: 'No disponible',
  access_denied: 'Acceso denegado',
  reschedule: 'Reprogramar',
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  instalacion_residencial: 'Instalación Residencial',
  instalacion_empresarial: 'Instalación Empresarial',
  mantenimiento: 'Mantenimiento',
  reparacion: 'Reparación',
  retiro: 'Retiro',
  migracion: 'Migración',
  otro: 'Otro',
};

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  primera_visita: 'Primera Visita',
  seguimiento: 'Seguimiento',
  revisita: 'Revisita',
  emergencia: 'Emergencia',
};

const STATUS_FLOW: Record<JobStatus, JobStatus[]> = {
  pending_dispatch: ['scheduled', 'blocked'],
  scheduled: ['in_route', 'blocked', 'pending_dispatch'],
  in_route: ['on_site', 'blocked'],
  on_site: ['completed', 'blocked'],
  completed: [],
  blocked: ['pending_dispatch', 'scheduled'],
};

/* ───── Helpers ───── */
const fmtDate = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (t: string | null) => t ? t.slice(0, 5) : '—';
const fmtDateTime = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeSince = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

/* ═══════════════════════════════════════════════════════════ */
/* ═══  MAIN COMPONENT  ════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

import { useViewMode } from "../contexts/ViewModeContext.tsx";
import WFMSection from "./xcien2/sections/WFMSection.tsx";
import { DEFAULT_THEME } from "./xcien2/types.ts";

export default function Dispatch() {
  const { mode } = useViewMode();
  const theme = DEFAULT_THEME;

  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/tickets`);
      if (res.ok) {
        const data = await res.json();
        // Map backend tickets to DispatchJob structure
        const mappedJobs = data.map((t: any) => ({
          id: t.id,
          job_number: t.id,
          customer_name: t.client,
          site_address: t.location,
          service_type: 'mantenimiento', // Default or derived
          visit_type: 'seguimiento',    // Default or derived
          priority: t.priority,
          status: t.status === 'Abierto' ? 'pending_dispatch' : 
                  t.status === 'Agendado' ? 'scheduled' :
                  t.status === 'En Sitio' ? 'on_site' :
                  t.status === 'Completado' ? 'completed' : 'blocked',
          customer_status: 'confirmed',
          scheduled_date: t.created_at,
          zone: t.zona,
          created_at: new Date().toISOString(), // Mocking timestamp if missing
        }));
        setJobs(mappedJobs);
      }
    } catch (e) {
      console.error("Error fetching jobs from backend:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
    fetch(`${API_BASE}/api/wfm/tecnicos`)
      .then(res => res.json())
      .then(data => {
        setTechnicians(data.map((tec: any) => ({
          id: tec.id,
          name: tec.nombre,
          plaza: tec.zona,
          is_active: true
        })));
      });
    
    const interval = setInterval(fetchJobs, 10000); // Polling instead of WebSocket for stability
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const zones = useMemo(() => [...new Set(jobs.map(j => j.zone).filter(Boolean))], [jobs]);

  const filtered = useMemo(() => jobs.filter(j => {
    if (filterStatus !== 'all' && j.status !== filterStatus) return false;
    if (filterPriority !== 'all' && j.priority !== filterPriority) return false;
    if (filterZone !== 'all' && j.zone !== filterZone) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return j.customer_name.toLowerCase().includes(q) ||
        j.job_number.toLowerCase().includes(q) ||
        j.site_address.toLowerCase().includes(q) ||
        (j.project_id || '').toLowerCase().includes(q);
    }
    return true;
  }), [jobs, filterStatus, filterPriority, filterZone, searchQuery]);

  const counts = useMemo(() => ({
    total: jobs.length,
    pending_dispatch: jobs.filter(j => j.status === 'pending_dispatch').length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    in_route: jobs.filter(j => j.status === 'in_route').length,
    on_site: jobs.filter(j => j.status === 'on_site').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    blocked: jobs.filter(j => j.status === 'blocked').length,
  }), [jobs]);

  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    const backendStatusMap: Record<JobStatus, string> = {
      pending_dispatch: 'Abierto',
      scheduled: 'Agendado',
      in_route: 'Agendado', // Map to Agendado for now
      on_site: 'En Sitio',
      completed: 'Completado',
      blocked: 'Bloqueado'
    };

    try {
      const res = await fetch(`${API_BASE}/api/wfm/tickets/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatusMap[newStatus] })
      });

      if (res.ok) {
        toast.success(`Estado actualizado a "${STATUS_CONFIG[newStatus].label}"`);
        fetchJobs();
      } else {
        toast.error('Error al actualizar en el servidor');
      }
    } catch (e) {
      toast.error('Error de conexión con el backend');
    }
  };

  if (mode === 'holo') return (
    <div className="flex-1 h-[calc(100vh-2.5rem)] bg-[#0a0a0a] overflow-y-auto relative p-6">
      <WFMSection theme={theme} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Send className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Dispatch Center</h1>
            <p className="text-[10px] text-slate-500">Centro de operaciones de campo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nuevo Job
          </button>
          <button onClick={fetchJobs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs hover:border-slate-600 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2 px-4 md:px-6 py-3 border-b border-slate-800">
        {([
          { key: 'total', label: 'Total', color: 'text-slate-200' },
          { key: 'pending_dispatch', label: 'Pendientes', color: 'text-amber-400' },
          { key: 'scheduled', label: 'Programados', color: 'text-blue-400' },
          { key: 'in_route', label: 'En Ruta', color: 'text-purple-400' },
          { key: 'on_site', label: 'En Sitio', color: 'text-cyan-400' },
          { key: 'completed', label: 'Completados', color: 'text-emerald-400' },
          { key: 'blocked', label: 'Bloqueados', color: 'text-red-400' },
        ] as const).map(m => (
          <button
            key={m.key}
            onClick={() => setFilterStatus(m.key === 'total' ? 'all' : m.key)}
            className={`rounded-lg border p-2 text-center transition-colors ${filterStatus === m.key || (m.key === 'total' && filterStatus === 'all') ? 'border-slate-600 bg-slate-800/50' : 'border-slate-800 hover:border-slate-700'}`}
          >
            <p className={`text-lg md:text-xl font-bold font-mono ${m.color}`}>{counts[m.key]}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</p>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-2.5 border-b border-slate-800">
        {/* View toggles */}
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {([
            { mode: 'queue' as ViewMode, icon: List, label: 'Cola' },
            { mode: 'calendar' as ViewMode, icon: Calendar, label: 'Calendario' },
            { mode: 'board' as ViewMode, icon: Columns3, label: 'Board' },
          ]).map(v => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === v.mode ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <v.icon className="h-3.5 w-3.5" /> <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente, job, dirección..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-600 placeholder:text-slate-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* Filters */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none">
          <option value="all">Prioridad</option>
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Media</option>
          <option value="baja">🟢 Baja</option>
        </select>
        {zones.length > 0 && (
          <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none">
            <option value="all">Zona</option>
            {zones.map(z => <option key={z} value={z!}>{z}</option>)}
          </select>
        )}
        <span className="ml-auto text-[10px] text-slate-500">{filtered.length} jobs</span>
      </div>

      {/* ── Main content ── */}
      <div className="flex h-[calc(100vh-235px)]">
        {viewMode === 'queue' && <QueueView jobs={filtered} selectedJob={selectedJob} onSelect={setSelectedJob} loading={loading} />}
        {viewMode === 'calendar' && <CalendarView jobs={filtered} onSelect={setSelectedJob} />}
        {viewMode === 'board' && <BoardView jobs={filtered} onSelect={setSelectedJob} onStatusChange={updateJobStatus} />}

        {/* Detail panel — always visible on desktop */}
        <div className="hidden lg:flex flex-1 flex-col border-l border-slate-800 min-w-0">
          {selectedJob ? (
            <JobDetailPanel
              job={selectedJob}
              technicians={technicians}
              onStatusChange={updateJobStatus}
              onClose={() => setSelectedJob(null)}
              onRefresh={fetchJobs}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <Send className="h-10 w-10 opacity-20" />
              <p className="text-xs">Selecciona un job para ver detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail sheet */}
      {selectedJob && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSelectedJob(null)}>
          <div className="absolute inset-x-0 bottom-0 top-16 bg-[#0B1120] rounded-t-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <JobDetailPanel
              job={selectedJob}
              technicians={technicians}
              onStatusChange={updateJobStatus}
              onClose={() => setSelectedJob(null)}
              onRefresh={fetchJobs}
            />
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateJobModal
          technicians={technicians}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchJobs(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ═══  QUEUE VIEW  ════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

function QueueView({ jobs, selectedJob, onSelect, loading }: {
  jobs: DispatchJob[]; selectedJob: DispatchJob | null; onSelect: (j: DispatchJob) => void; loading: boolean;
}) {
  if (loading && jobs.length === 0) {
    return <div className="w-full lg:w-[45%] flex items-center justify-center text-slate-500 text-sm">Cargando...</div>;
  }
  if (jobs.length === 0) {
    return (
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center text-slate-600 gap-2">
        <Send className="h-8 w-8 opacity-20" />
        <p className="text-xs">Sin jobs encontrados</p>
      </div>
    );
  }
  return (
    <div className="w-full lg:w-[45%] overflow-y-auto">
      {jobs.map(job => {
        const sc = STATUS_CONFIG[job.status];
        const pc = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.media;
        const SI = sc.icon;
        const isSelected = selectedJob?.id === job.id;
        return (
          <button
            key={job.id}
            onClick={() => onSelect(job)}
            className={`w-full text-left px-4 py-3 border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-slate-800/60 border-l-2 border-l-emerald-400' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                  <span className="text-[10px] font-mono text-slate-500">{job.job_number}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color}`}>
                    <SI className="h-3 w-3" />{sc.label}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {SERVICE_TYPE_LABELS[job.service_type].split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium truncate">{job.customer_name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{job.site_address}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                  {job.scheduled_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(job.scheduled_date)}</span>
                  )}
                  {job.scheduled_time && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(job.scheduled_time)}</span>
                  )}
                  {job.zone && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.zone}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">{timeSince(job.created_at)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ═══  CALENDAR VIEW  ════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

function CalendarView({ jobs, onSelect }: { jobs: DispatchJob[]; onSelect: (j: DispatchJob) => void }) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0); return d;
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00–18:00

  const getJobsForDay = (day: Date) => {
    const ds = day.toISOString().split('T')[0];
    return jobs.filter(j => j.scheduled_date === ds);
  };

  const prevWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  const nextWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  const today = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); d.setHours(0,0,0,0); setWeekStart(d); };

  return (
    <div className="flex-1 overflow-auto">
      {/* Week nav */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 sticky top-0 bg-[#0B1120] z-10">
        <button onClick={prevWeek} className="text-xs text-slate-400 hover:text-white">← Ant</button>
        <button onClick={today} className="text-xs text-emerald-400 hover:text-emerald-300">Hoy</button>
        <button onClick={nextWeek} className="text-xs text-slate-400 hover:text-white">Sig →</button>
        <span className="text-xs text-slate-400 ml-2">
          {weekStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-b border-slate-800">
        {days.map(d => {
          const isToday = d.toDateString() === new Date().toDateString();
          const dayJobs = getJobsForDay(d);
          return (
            <div key={d.toISOString()} className="border-r border-slate-800 last:border-r-0 min-h-[400px]">
              <div className={`px-2 py-2 text-center border-b border-slate-800 sticky top-10 bg-[#0B1120] z-[5] ${isToday ? 'bg-emerald-500/5' : ''}`}>
                <p className="text-[9px] text-slate-500 uppercase">{d.toLocaleDateString('es-MX', { weekday: 'short' })}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>{d.getDate()}</p>
                {dayJobs.length > 0 && <span className="text-[9px] text-slate-500">{dayJobs.length} jobs</span>}
              </div>
              <div className="p-1 space-y-1">
                {dayJobs.map(job => {
                  const sc = STATUS_CONFIG[job.status];
                  return (
                    <button
                      key={job.id}
                      onClick={() => onSelect(job)}
                      className={`w-full text-left p-1.5 rounded border ${sc.bg} hover:opacity-80 transition-opacity`}
                    >
                      <p className={`text-[10px] font-medium ${sc.color}`}>{fmtTime(job.scheduled_time)}</p>
                      <p className="text-[10px] text-slate-300 truncate">{job.customer_name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{SERVICE_TYPE_LABELS[job.service_type].split(' ')[0]}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled */}
      {jobs.filter(j => !j.scheduled_date).length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Sin programar ({jobs.filter(j => !j.scheduled_date).length})</p>
          <div className="flex flex-wrap gap-2">
            {jobs.filter(j => !j.scheduled_date).slice(0, 20).map(job => (
              <button key={job.id} onClick={() => onSelect(job)} className="text-left px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <p className="text-[10px] text-slate-300 font-medium">{job.customer_name}</p>
                <p className="text-[9px] text-slate-500">{job.job_number}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ═══  BOARD VIEW (Kanban)  ══════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

function BoardView({ jobs, onSelect, onStatusChange }: {
  jobs: DispatchJob[]; onSelect: (j: DispatchJob) => void; onStatusChange: (id: string, s: JobStatus) => void;
}) {
  const columns: JobStatus[] = ['pending_dispatch', 'scheduled', 'in_route', 'on_site', 'completed', 'blocked'];

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-3 p-4 min-w-max h-full">
        {columns.map(status => {
          const sc = STATUS_CONFIG[status];
          const SI = sc.icon;
          const colJobs = jobs.filter(j => j.status === status);
          return (
            <div key={status} className="w-64 flex flex-col rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800">
                <SI className={`h-3.5 w-3.5 ${sc.color}`} />
                <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                <span className="ml-auto text-[10px] font-mono text-slate-500">{colJobs.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colJobs.map(job => {
                  const pc = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.media;
                  return (
                    <button
                      key={job.id}
                      onClick={() => onSelect(job)}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                        <span className="text-[9px] font-mono text-slate-500">{job.job_number}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 font-medium truncate">{job.customer_name}</p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">{job.site_address}</p>
                      {job.scheduled_date && (
                        <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{fmtDate(job.scheduled_date)} {fmtTime(job.scheduled_time)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ═══  JOB DETAIL PANEL  ════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

function JobDetailPanel({ job, technicians, onStatusChange, onClose, onRefresh }: {
  job: DispatchJob;
  technicians: Technician[];
  onStatusChange: (id: string, s: JobStatus) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<'info' | 'timeline' | 'notes' | 'crew'>('info');
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [notes, setNotes] = useState<DispatchNote[]>([]);
  const [assignedTechs, setAssignedTechs] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>(job.customer_status);
  const [editSchedule, setEditSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState(job.scheduled_date || '');
  const [schedTime, setSchedTime] = useState(job.scheduled_time || '');
  const [duration, setDuration] = useState(String(job.estimated_duration_minutes || 60));

  const sc = STATUS_CONFIG[job.status];
  const SI = sc.icon;
  const pc = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.media;

  useEffect(() => {
    // Reset local state when job changes — history/notes/crew live in local state only
    setHistory([]);
    setNotes([]);
    setAssignedTechs([]);
    setCustomerStatus(job.customer_status);
    setSchedDate(job.scheduled_date || '');
    setSchedTime(job.scheduled_time || '');
    setDuration(String(job.estimated_duration_minutes || 60));
  }, [job.id]);

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: DispatchNote = {
      id: crypto.randomUUID(),
      author_name: 'Dispatcher',
      content: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setNewNote('');
    toast.success('Nota agregada');
  };

  const updateCustomerStatus = (cs: CustomerStatus) => {
    setCustomerStatus(cs);
    toast.success('Estado del cliente actualizado');
  };

  const saveSchedule = () => {
    setEditSchedule(false);
    toast.success('Horario actualizado (local)');
    onRefresh();
  };

  const toggleTechnician = (techId: string) => {
    setAssignedTechs(prev =>
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
    toast.success('Asignación actualizada');
  };

  const nextStatuses = STATUS_FLOW[job.status];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-500">{job.job_number}</span>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${sc.bg} ${sc.color} font-medium`}>
              <SI className="h-3 w-3" />{sc.label}
            </span>
            <button onClick={onClose} className="lg:hidden text-slate-400"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <h2 className="text-sm font-semibold text-slate-100">{job.customer_name}</h2>
        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{job.site_address}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {(['info', 'timeline', 'notes', 'crew'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors ${tab === t ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'info' && 'Detalle'}
            {t === 'timeline' && 'Timeline'}
            {t === 'notes' && `Notas (${notes.length})`}
            {t === 'crew' && `Crew (${assignedTechs.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'info' && (
          <div className="p-4 space-y-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Servicio', value: SERVICE_TYPE_LABELS[job.service_type] },
                { label: 'Visita', value: VISIT_TYPE_LABELS[job.visit_type] },
                { label: 'Prioridad', value: pc.label, dotColor: pc.dot },
                { label: 'Zona', value: job.zone || '—' },
                { label: 'Territorio', value: job.territory || '—' },
                { label: 'Proyecto', value: job.project_id || '—' },
                { label: 'Work Order', value: job.work_order_id || '—' },
                { label: 'Odoo ID', value: job.odoo_order_id || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">{f.label}</p>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    {'dotColor' in f && f.dotColor && <span className={`w-1.5 h-1.5 rounded-full ${f.dotColor}`} />}
                    {f.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Customer contact */}
            <div className="rounded-lg border border-slate-800 p-3">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Contacto del cliente</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-slate-200">{job.contact_person || '—'}</p>
                  {job.contact_phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{job.contact_phone}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(Object.entries(CUSTOMER_STATUS_LABELS) as [CustomerStatus, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateCustomerStatus(key)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${customerStatus === key ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Programación</p>
                <button onClick={() => setEditSchedule(!editSchedule)} className="text-[10px] text-emerald-400 hover:text-emerald-300">
                  {editSchedule ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              {editSchedule ? (
                <div className="space-y-2">
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
                  <div className="flex items-center gap-2">
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-20 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
                    <span className="text-[10px] text-slate-500">min</span>
                  </div>
                  <button onClick={saveSchedule} className="w-full py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-slate-500">Fecha</p>
                    <p className="text-xs text-slate-300">{fmtDate(job.scheduled_date)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Hora</p>
                    <p className="text-xs text-slate-300">{fmtTime(job.scheduled_time)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Duración</p>
                    <p className="text-xs text-slate-300">{job.estimated_duration_minutes || 60} min</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {job.notes && (
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Notas generales</p>
                <p className="text-[11px] text-slate-300">{job.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[9px] text-slate-500">Creado</p>
                <p className="text-[10px] text-slate-400 font-mono">{fmtDateTime(job.created_at)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Actualizado</p>
                <p className="text-[10px] text-slate-400 font-mono">{fmtDateTime(job.updated_at)}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div className="p-4">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Sin historial de cambios</p>
            ) : (
              <div className="space-y-3">
                {history.map(h => {
                  const nsc = STATUS_CONFIG[h.new_status];
                  const NSI = nsc.icon;
                  return (
                    <div key={h.id} className="flex gap-3 items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${nsc.bg} border`}>
                        <NSI className={`h-3 w-3 ${nsc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-300">
                          {h.old_status ? `${STATUS_CONFIG[h.old_status]?.label || h.old_status} → ` : ''}{nsc.label}
                        </p>
                        {h.notes && <p className="text-[10px] text-slate-500 mt-0.5">{h.notes}</p>}
                        <p className="text-[9px] text-slate-600 mt-0.5">{h.changed_by_name || 'Sistema'} · {fmtDateTime(h.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Agregar nota..."
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-600 placeholder:text-slate-600"
              />
              <button onClick={addNote} className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </div>
            {notes.map(n => (
              <div key={n.id} className="rounded-lg border border-slate-800 p-3">
                <p className="text-[11px] text-slate-300">{n.content}</p>
                <p className="text-[9px] text-slate-600 mt-1.5">{n.author_name} · {fmtDateTime(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'crew' && (
          <div className="p-4 space-y-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Técnicos disponibles — clic para asignar/desasignar</p>
            {technicians.map(tech => {
              const isAssigned = assignedTechs.includes(tech.id);
              return (
                <button
                  key={tech.id}
                  onClick={() => toggleTechnician(tech.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isAssigned ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isAssigned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-xs font-medium ${isAssigned ? 'text-emerald-300' : 'text-slate-300'}`}>{tech.name}</p>
                    <p className="text-[9px] text-slate-500">{tech.plaza || '—'}{tech.phone ? ` · ${tech.phone}` : ''}</p>
                  </div>
                  {isAssigned && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div className="p-3 border-t border-slate-800">
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map(ns => {
              const nsc = STATUS_CONFIG[ns];
              const NI = nsc.icon;
              return (
                <button
                  key={ns}
                  onClick={() => onStatusChange(job.id, ns)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${nsc.bg} ${nsc.color} hover:opacity-80`}
                >
                  <NI className="h-3.5 w-3.5" />{nsc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ═══  CREATE JOB MODAL  ════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

function CreateJobModal({ technicians, onClose, onCreated }: {
  technicians: Technician[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    customer_name: '',
    site_address: '',
    service_type: 'instalacion_residencial' as ServiceType,
    visit_type: 'primera_visita' as VisitType,
    priority: 'media',
    contact_person: '',
    contact_phone: '',
    zone: '',
    territory: '',
    project_id: '',
    work_order_id: '',
    scheduled_date: '',
    scheduled_time: '',
    estimated_duration_minutes: '60',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async () => {
    if (!form.customer_name || !form.site_address) { toast.error('Cliente y dirección son requeridos'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: form.customer_name,
          location: form.site_address,
          priority: form.priority,
          zona: form.zone || '',
          tipo: form.service_type,
          notas: form.notes || '',
        }),
      });
      if (!res.ok) throw new Error('Backend error');
      toast.success('Job de dispatch creado');
      onCreated();
    } catch {
      toast.error('Error al crear job en el servidor');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-600 placeholder:text-slate-600"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0F1724] border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100">Nuevo Job de Dispatch</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><InputField label="Cliente *" field="customer_name" placeholder="Nombre del cliente" /></div>
            <div className="col-span-2"><InputField label="Dirección del sitio *" field="site_address" placeholder="Dirección completa" /></div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Tipo de servicio</label>
              <select value={form.service_type} onChange={e => update('service_type', e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none">
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Tipo de visita</label>
              <select value={form.visit_type} onChange={e => update('visit_type', e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none">
                {Object.entries(VISIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Prioridad</label>
              <select value={form.priority} onChange={e => update('priority', e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none">
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
            <InputField label="Zona" field="zone" placeholder="Norte, Sur..." />
            <InputField label="Contacto" field="contact_person" placeholder="Nombre" />
            <InputField label="Teléfono" field="contact_phone" type="tel" placeholder="+52..." />
            <InputField label="Fecha" field="scheduled_date" type="date" />
            <InputField label="Hora" field="scheduled_time" type="time" />
            <InputField label="Duración (min)" field="estimated_duration_minutes" type="number" />
            <InputField label="Territorio" field="territory" placeholder="Territorio" />
            <InputField label="Proyecto ID" field="project_id" placeholder="PRJ-001" />
            <InputField label="Work Order" field="work_order_id" placeholder="WO-001" />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={2}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-600 placeholder:text-slate-600 resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Technician selection */}
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Asignar técnicos</label>
            <div className="flex flex-wrap gap-1.5">
              {technicians.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTechs(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${selectedTechs.includes(t.id) ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
