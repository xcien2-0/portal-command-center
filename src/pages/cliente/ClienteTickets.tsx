import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

const ORANGE = '#FB923C';
const CARD_BG = '#0f1f38';
const BORDER = 'rgba(251,146,60,0.18)';

type TicketStatus = 'Abierto' | 'En proceso' | 'Resuelto';
type TicketPriority = 'Alta' | 'Media' | 'Baja';

interface Ticket {
  id: string;
  asunto: string;
  prioridad: TicketPriority;
  estatus: TicketStatus;
  fecha: string;
}

const INITIAL_TICKETS: Ticket[] = [
  { id: 'TK-0021', asunto: 'Latencia elevada en enlace principal', prioridad: 'Alta', estatus: 'En proceso', fecha: '15 May 2026' },
  { id: 'TK-0020', asunto: 'Solicitud de reporte mensual de uso', prioridad: 'Baja', estatus: 'Abierto', fecha: '12 May 2026' },
  { id: 'TK-0019', asunto: 'Falla intermitente en servicio de voz', prioridad: 'Media', estatus: 'Resuelto', fecha: '02 May 2026' },
  { id: 'TK-0018', asunto: 'Configuración de VPN adicional', prioridad: 'Media', estatus: 'Resuelto', fecha: '18 Abr 2026' },
  { id: 'TK-0017', asunto: 'Interrupción de servicio — 15 min', prioridad: 'Alta', estatus: 'Resuelto', fecha: '08 Abr 2026' },
];

const statusStyles: Record<TicketStatus, { bg: string; color: string }> = {
  Abierto: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  'En proceso': { bg: 'rgba(234,179,8,0.12)', color: '#facc15' },
  Resuelto: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
};

const priorityStyles: Record<TicketPriority, { color: string }> = {
  Alta: { color: '#f87171' },
  Media: { color: '#facc15' },
  Baja: { color: '#94a3b8' },
};

export default function ClienteTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [open, setOpen] = useState(false);

  // Form state
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<TicketPriority>('Media');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setAsunto('');
    setDescripcion('');
    setPrioridad('Media');
    setFormError('');
  };

  const handleCreateTicket = () => {
    if (!asunto.trim()) {
      setFormError('El asunto es requerido.');
      return;
    }
    const nextId = `TK-${String(Number(tickets[0]?.id.replace('TK-', '') ?? 21) + 1).padStart(4, '0')}`;
    const today = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    setTickets([
      { id: nextId, asunto: asunto.trim(), prioridad, estatus: 'Abierto', fecha: today },
      ...tickets,
    ]);
    setOpen(false);
    resetForm();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
          Mis Tickets de Soporte
        </h1>
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 font-semibold text-sm"
          style={{ backgroundColor: ORANGE, color: '#1a0a00' }}
        >
          <Plus size={15} />
          Nuevo Ticket
        </Button>
      </div>

      {/* Tickets table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['ID', 'Asunto', 'Prioridad', 'Estatus', 'Fecha'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs uppercase tracking-wider"
                    style={{ color: '#475569' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: i < tickets.length - 1 ? `1px solid rgba(251,146,60,0.08)` : 'none',
                  }}
                >
                  <td className="px-5 py-3 font-mono text-xs font-medium" style={{ color: ORANGE }}>
                    {t.id}
                  </td>
                  <td className="px-5 py-3 max-w-xs" style={{ color: '#cbd5e1' }}>
                    {t.asunto}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium"
                      style={{ color: priorityStyles[t.prioridad].color }}
                    >
                      {t.prioridad}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: statusStyles[t.estatus].bg,
                        color: statusStyles[t.estatus].color,
                      }}
                    >
                      {t.estatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {t.fecha}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent
          style={{ backgroundColor: '#0f1f38', border: `1px solid ${BORDER}`, color: '#e2e8f0' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: ORANGE }}>Nuevo Ticket de Soporte</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label style={{ color: '#94a3b8' }}>Asunto *</Label>
              <Input
                placeholder="Describe brevemente el problema"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                style={{ backgroundColor: '#0a1628', borderColor: `${ORANGE}40`, color: '#e2e8f0' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#94a3b8' }}>Descripción</Label>
              <textarea
                placeholder="Proporciona más detalles sobre el problema..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1"
                style={{
                  backgroundColor: '#0a1628',
                  border: `1px solid ${ORANGE}40`,
                  color: '#e2e8f0',
                  focusRingColor: ORANGE,
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#94a3b8' }}>Prioridad</Label>
              <Select value={prioridad} onValueChange={(v) => setPrioridad(v as TicketPriority)}>
                <SelectTrigger
                  style={{ backgroundColor: '#0a1628', borderColor: `${ORANGE}40`, color: '#e2e8f0' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#0f1f38', borderColor: BORDER }}>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm" style={{ color: '#f87171' }}>
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setOpen(false); resetForm(); }}
              style={{ color: '#64748b' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTicket}
              style={{ backgroundColor: ORANGE, color: '#1a0a00' }}
              className="font-semibold"
            >
              Crear Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
