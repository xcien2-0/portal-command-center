import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NetworkNode } from '@/data/mockNetworkData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Technician {
  id: string;
  name: string;
  phone: string | null;
  speciality: string | null;
}

interface DispatchModalProps {
  open: boolean;
  onClose: () => void;
  node: NetworkNode | null;
}

function generateDescription(node: NetworkNode): string {
  const issues: string[] = [];
  if (node.status === 'critical') issues.push('Nodo en estado CRÍTICO');
  else if (node.status === 'warning') issues.push('Nodo con advertencias');
  if (node.latency > 150) issues.push(`Alta latencia (${node.latency}ms)`);
  if (node.packetLoss > 1) issues.push(`Packet loss elevado (${node.packetLoss}%)`);
  if (node.signal < -50) issues.push(`Señal débil (${node.signal} dBm)`);
  if (node.uptime < 99) issues.push(`Uptime degradado (${node.uptime}%)`);
  if (issues.length === 0) issues.push('Revisión preventiva del nodo');
  return `${issues.join('. ')}. Nodo: ${node.name}, IP: ${node.ip}, Zona: ${node.zone}.`;
}

export function DispatchModal({ open, onClose, node }: DispatchModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('alta');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fetch technicians from Supabase
  useEffect(() => {
    supabase
      .from('technicians')
      .select('id, name, phone, speciality')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setTechnicians(data);
          if (data.length > 0 && !selectedTechId) setSelectedTechId(data[0].id);
        }
      });
  }, []);

  // Pre-fill when node changes
  useEffect(() => {
    if (node) {
      setDescription(generateDescription(node));
      setPriority(node.status === 'critical' ? 'alta' : node.status === 'warning' ? 'media' : 'baja');
      setSent(false);
    }
  }, [node]);

  const handleDispatch = async () => {
    if (!node || !selectedTechId) return;
    setSending(true);

    const tech = technicians.find(t => t.id === selectedTechId);
    const payload = {
      plaza: node.location,
      zona: node.zone,
      host: node.name,
      ip: node.ip,
      isp: node.isp,
      descripcion: description,
      prioridad: priority,
      tecnico: tech?.name || '',
      tecnico_telefono: tech?.phone || '',
      tecnico_especialidad: tech?.speciality || '',
      timestamp: new Date().toISOString(),
    };

    try {
      // POST to n8n webhook — replace URL with your actual webhook
      const webhookUrl = 'https://n8n.ispilot.mx/webhook/dispatch-incidente';
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSent(true);
    } catch (err) {
      console.error('Error dispatching:', err);
    } finally {
      setSending(false);
    }
  };

  if (!node) return null;

  const selectedTech = technicians.find(t => t.id === selectedTechId);
  const inputCls = "w-full text-[13px] bg-[#0f1923] border border-[#2a3f50] text-[#F5F5F7] rounded-lg px-3 py-2.5 mt-1.5 outline-none focus:border-[#34C759]/60 transition-colors";

  const priorityOptions = [
    { value: 'alta', label: 'Alta', color: 'bg-[#FF3B30]/20 text-[#FF6961] border-[#FF3B30]/30' },
    { value: 'media', label: 'Media', color: 'bg-[#FF9F0A]/20 text-[#FFB340] border-[#FF9F0A]/30' },
    { value: 'baja', label: 'Baja', color: 'bg-[#34C759]/20 text-[#34C759] border-[#34C759]/30' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#1a2733] border-[#2a3f50] text-[#F5F5F7] max-w-md p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-[#2a3f50]">
          <DialogTitle className="text-[16px] font-semibold text-[#F5F5F7] flex items-center gap-2">
            <Send className="h-4 w-4 text-[#34C759]" />
            Enviar a Dispatch
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#34C759]/20 flex items-center justify-center mx-auto">
              <Send className="h-5 w-5 text-[#34C759]" />
            </div>
            <p className="text-[15px] font-semibold text-[#F5F5F7]">Incidente enviado</p>
            <p className="text-[13px] text-[#8ba3b8]">
              Asignado a <span className="text-[#F5F5F7] font-medium">{selectedTech?.name}</span>
            </p>
            <button onClick={onClose} className="mt-4 px-6 py-2 text-[13px] text-[#8ba3b8] hover:text-[#F5F5F7] transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Pre-filled read-only fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#5a7080] uppercase tracking-wider">Plaza / Ciudad</label>
                <div className="mt-1.5 px-3 py-2.5 bg-[#0f1923]/60 border border-[#2a3f50]/50 rounded-lg text-[13px] text-[#8ba3b8]">
                  {node.location}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#5a7080] uppercase tracking-wider">Host / IP</label>
                <div className="mt-1.5 px-3 py-2.5 bg-[#0f1923]/60 border border-[#2a3f50]/50 rounded-lg text-[13px] text-[#8ba3b8] font-mono">
                  {node.ip}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium text-[#5a7080] uppercase tracking-wider">Descripción del incidente</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Technician dropdown */}
            <div>
              <label className="text-[11px] font-medium text-[#5a7080] uppercase tracking-wider">Técnico asignado</label>
              <select value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)} className={inputCls}>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.speciality ? ` — ${t.speciality}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-medium text-[#5a7080] uppercase tracking-wider mb-2 block">Prioridad</label>
              <div className="flex gap-2">
                {priorityOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 py-2 text-[12px] font-semibold rounded-lg border transition-all ${
                      priority === opt.value
                        ? opt.color
                        : 'bg-[#0f1923] border-[#2a3f50] text-[#5a7080] hover:text-[#8ba3b8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleDispatch}
              disabled={!selectedTechId || !description || sending}
              className="w-full h-11 bg-[#34C759] hover:bg-[#2db84e] disabled:opacity-30 text-[#0f1923] font-semibold text-[13px] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4" /> Enviar a Dispatch</>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
