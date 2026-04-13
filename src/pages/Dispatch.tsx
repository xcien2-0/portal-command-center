import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send, Clock, CheckCircle2, XCircle, AlertTriangle, Filter, RefreshCw, Plus, ChevronDown, User, MapPin, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface DispatchTicket {
  id: string;
  ticket_number: string;
  city: string;
  site: string | null;
  host_ip: string | null;
  host_name: string | null;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cancelado';
  source: string;
  technician_id: string | null;
  technician_name: string | null;
  tenant_id: string | null;
  isp: string | null;
  zone: string | null;
  notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  abierto: { label: 'Abierto', icon: AlertTriangle, color: 'text-[#FFB703]', bg: 'bg-[#FFB703]/15 border-[#FFB703]/30' },
  en_progreso: { label: 'En Progreso', icon: Clock, color: 'text-[#00B4D8]', bg: 'bg-[#00B4D8]/15 border-[#00B4D8]/30' },
  resuelto: { label: 'Resuelto', icon: CheckCircle2, color: 'text-[#00C896]', bg: 'bg-[#00C896]/15 border-[#00C896]/30' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-[#64748b]', bg: 'bg-[#64748b]/15 border-[#64748b]/30' },
};

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', dot: 'bg-[#FF4D6D]' },
  media: { label: 'Media', dot: 'bg-[#FFB703]' },
  baja: { label: 'Baja', dot: 'bg-[#00C896]' },
};

export default function Dispatch() {
  const [tickets, setTickets] = useState<DispatchTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<DispatchTicket | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dispatch_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTickets(data as unknown as DispatchTicket[]);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    supabase.from('technicians').select('id, name').eq('is_active', true).then(({ data }) => {
      if (data) setTechnicians(data);
    });

    // Realtime subscription
    const channel = supabase
      .channel('dispatch_tickets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const updates = newStatus === 'resuelto'
      ? { status: newStatus, resolved_at: new Date().toISOString() }
      : { status: newStatus };
    
    const { error } = await supabase.from('dispatch_tickets').update(updates).eq('id', ticketId);
    if (error) {
      toast.error('Error al actualizar ticket');
    } else {
      toast.success(`Ticket actualizado a "${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}"`);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as DispatchTicket['status'], ...(newStatus === 'resuelto' ? { resolved_at: new Date().toISOString() } : {}) } : null);
      }
    }
    setUpdatingStatus(false);
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const counts = {
    abierto: tickets.filter(t => t.status === 'abierto').length,
    en_progreso: tickets.filter(t => t.status === 'en_progreso').length,
    resuelto: tickets.filter(t => t.status === 'resuelto').length,
    total: tickets.length,
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const timeSince = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E3A4A]">
        <div className="flex items-center gap-3">
          <Send className="h-5 w-5 text-[#00C896]" />
          <h1 className="text-[16px] font-bold tracking-wide">Dispatch Center</h1>
        </div>
        <button onClick={fetchTickets} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E3A4A] hover:border-[#00B4D8]/40 transition-colors text-[12px]">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-[#1E3A4A]">
        {[
          { label: 'Total', value: counts.total, color: 'text-[#e2e8f0]' },
          { label: 'Abiertos', value: counts.abierto, color: 'text-[#FFB703]' },
          { label: 'En Progreso', value: counts.en_progreso, color: 'text-[#00B4D8]' },
          { label: 'Resueltos', value: counts.resuelto, color: 'text-[#00C896]' },
        ].map(s => (
          <div key={s.label} className="bg-[#161B27] border border-[#1E3A4A] rounded-lg p-3 text-center">
            <p className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1E3A4A]">
        <Filter className="h-3.5 w-3.5 text-[#64748b]" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#161B27] border border-[#1E3A4A] rounded px-3 py-1.5 text-[12px] text-[#e2e8f0] outline-none">
          <option value="all">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En Progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-[#161B27] border border-[#1E3A4A] rounded px-3 py-1.5 text-[12px] text-[#e2e8f0] outline-none">
          <option value="all">Toda prioridad</option>
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Media</option>
          <option value="baja">🟢 Baja</option>
        </select>
        <span className="ml-auto text-[11px] text-[#64748b]">{filtered.length} tickets</span>
      </div>

      {/* Main layout */}
      <div className="flex h-[calc(100vh-220px)]">
        {/* Ticket list */}
        <div className="w-full lg:w-[45%] border-r border-[#1E3A4A] overflow-y-auto">
          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#64748b] text-[13px]">Cargando tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#64748b] gap-2">
              <Send className="h-8 w-8 opacity-30" />
              <p className="text-[13px]">Sin tickets {filterStatus !== 'all' ? `con estado "${filterStatus}"` : ''}</p>
            </div>
          ) : (
            filtered.map(ticket => {
              const sc = STATUS_CONFIG[ticket.status];
              const pc = PRIORITY_CONFIG[ticket.priority];
              const StatusIcon = sc.icon;
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1E3A4A] hover:bg-[#1A2B3C] transition-colors ${isSelected ? 'bg-[#1A2B3C] border-l-2 border-l-[#00B4D8]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                        <span className="text-[11px] font-mono text-[#64748b]">{ticket.ticket_number}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#e2e8f0] truncate">{ticket.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#64748b]">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ticket.city}</span>
                        {ticket.host_ip && <span className="flex items-center gap-1 font-mono"><Wifi className="h-3 w-3" />{ticket.host_ip}</span>}
                        {ticket.technician_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.technician_name}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#64748b] font-mono whitespace-nowrap">{timeSince(ticket.created_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden lg:flex flex-1 flex-col">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              technicians={technicians}
              onStatusChange={updateTicketStatus}
              updatingStatus={updatingStatus}
              formatTime={formatTime}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#64748b] gap-2">
              <Send className="h-10 w-10 opacity-20" />
              <p className="text-[13px]">Selecciona un ticket para ver detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, technicians, onStatusChange, updatingStatus, formatTime }: {
  ticket: DispatchTicket;
  technicians: Array<{ id: string; name: string }>;
  onStatusChange: (id: string, status: string) => void;
  updatingStatus: boolean;
  formatTime: (iso: string) => string;
}) {
  const sc = STATUS_CONFIG[ticket.status];
  const pc = PRIORITY_CONFIG[ticket.priority];
  const StatusIcon = sc.icon;

  const nextStatuses = {
    abierto: ['en_progreso', 'cancelado'],
    en_progreso: ['resuelto', 'abierto'],
    resuelto: ['abierto'],
    cancelado: ['abierto'],
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-[#1E3A4A]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-mono text-[#64748b]">{ticket.ticket_number}</span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border ${sc.bg} ${sc.color} font-medium`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {sc.label}
          </span>
        </div>
        <p className="text-[14px] text-[#e2e8f0] leading-relaxed">{ticket.description}</p>
      </div>

      {/* Info grid */}
      <div className="p-5 border-b border-[#1E3A4A] grid grid-cols-2 gap-4">
        {[
          { label: 'Ciudad', value: ticket.city, icon: MapPin },
          { label: 'Host / IP', value: ticket.host_ip || '—', icon: Wifi },
          { label: 'Sitio', value: ticket.site || '—' },
          { label: 'ISP', value: ticket.isp || '—' },
          { label: 'Técnico', value: ticket.technician_name || 'Sin asignar', icon: User },
          { label: 'Zona', value: ticket.zone || '—' },
          { label: 'Prioridad', value: pc.label, dot: pc.dot },
          { label: 'Fuente', value: ticket.source },
          { label: 'Creado', value: formatTime(ticket.created_at) },
          { label: 'Actualizado', value: formatTime(ticket.updated_at) },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">{f.label}</p>
            <p className="text-[12px] text-[#e2e8f0] flex items-center gap-1.5">
              {'dot' in f && f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
              {'icon' in f && f.icon && <f.icon className="h-3 w-3 text-[#64748b]" />}
              <span className="font-mono">{f.value}</span>
            </p>
          </div>
        ))}
        {ticket.resolved_at && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">Resuelto</p>
            <p className="text-[12px] text-[#00C896] font-mono">{formatTime(ticket.resolved_at)}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {ticket.notes && (
        <div className="p-5 border-b border-[#1E3A4A]">
          <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-2">Notas</p>
          <p className="text-[12px] text-[#e2e8f0] bg-[#0D1B2A] rounded-lg p-3 border border-[#1E3A4A]">{ticket.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="p-5 mt-auto">
        <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-3">Cambiar estado</p>
        <div className="flex gap-2 flex-wrap">
          {nextStatuses[ticket.status].map(ns => {
            const nsc = STATUS_CONFIG[ns as keyof typeof STATUS_CONFIG];
            const NIcon = nsc.icon;
            return (
              <button
                key={ns}
                onClick={() => onStatusChange(ticket.id, ns)}
                disabled={updatingStatus}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all disabled:opacity-50 ${nsc.bg} ${nsc.color} hover:opacity-80`}
              >
                <NIcon className="h-3.5 w-3.5" />
                {nsc.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
