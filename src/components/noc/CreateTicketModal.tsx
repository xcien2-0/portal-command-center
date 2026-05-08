import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { NOCAlert } from '@/types/noc';
import { TicketPayload, TenantType } from '@/types/tenant';
import { toast } from 'sonner';
import { API_BASE } from '@/config';

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  alert: NOCAlert | null;
  tenantId: string;
  tenantType: TenantType;
}

export function CreateTicketModal({ open, onClose, alert, tenantId, tenantType }: CreateTicketModalProps) {
  const [description, setDescription] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('alta');
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/api/wfm/tecnicos`)
        .then(res => res.json())
        .then((data: any[]) => setTechnicians(data.map(t => ({ id: t.id, name: t.nombre }))))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (alert) {
      setDescription(`[${alert.severity.toUpperCase()}] ${alert.type} detectado en ${alert.cityName} — ${alert.siteName}, IP: ${alert.hostIp}. Requiere atención inmediata.`);
      setPriority(alert.severity === 'critical' ? 'alta' : 'media');
    }
  }, [alert]);

  if (!open || !alert) return null;

  const handleSubmit = async () => {
    setSending(true);
    const payload: TicketPayload = {
      tenantId,
      tenantType,
      city: alert.cityName,
      site: alert.siteName,
      hostIp: alert.hostIp,
      description,
      technicianId: technicianId || undefined,
      priority,
      source: 'noc_alert',
    };

    try {
      // Save to local backend
      await fetch(`${API_BASE}/api/wfm/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: alert.siteName,
          location: alert.cityName,
          priority,
          zona: alert.cityName,
          tipo: 'noc_alert',
          notas: description,
          tecnico_asignado: technicians.find(t => t.id === technicianId)?.name || '',
        }),
      });

      // Best-effort n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_DISPATCH_WEBHOOK;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
      toast.success('Ticket enviado a Dispatch ✓');
      onClose();
    } catch {
      toast.error('Error al enviar ticket');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-[#161B27] border border-[#1E3A4A] rounded-lg w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#1E3A4A]">
          <h3 className="text-[14px] font-semibold text-[#e2e8f0]">Crear Ticket — Dispatch</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#1E3A4A] rounded transition-colors">
            <X className="h-4 w-4 text-[#64748b]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1 block">Ciudad</label>
              <input value={alert.cityName} readOnly className="w-full bg-[#0D1B2A] border border-[#1E3A4A] rounded px-3 py-2 text-[12px] text-[#e2e8f0] font-mono" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1 block">Host / IP</label>
              <input value={alert.hostIp} readOnly className="w-full bg-[#0D1B2A] border border-[#1E3A4A] rounded px-3 py-2 text-[12px] text-[#e2e8f0] font-mono" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1 block">Descripción</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#0D1B2A] border border-[#1E3A4A] rounded px-3 py-2 text-[12px] text-[#e2e8f0] resize-none focus:border-[#00B4D8]/50 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1 block">Técnico</label>
              <select
                value={technicianId} onChange={e => setTechnicianId(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-[#1E3A4A] rounded px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[#00B4D8]/50"
              >
                <option value="">Sin asignar</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1 block">Prioridad</label>
              <select
                value={priority} onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-[#0D1B2A] border border-[#1E3A4A] rounded px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[#00B4D8]/50"
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-[#1E3A4A]">
          <button onClick={onClose} className="px-4 py-2 rounded text-[12px] text-[#64748b] hover:text-[#e2e8f0] transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit} disabled={sending}
            className="px-4 py-2 rounded bg-[#00C896] text-[#0D1B2A] text-[12px] font-semibold hover:bg-[#00C896]/90 transition-colors disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar a Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}
