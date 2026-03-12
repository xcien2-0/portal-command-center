import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_NODES, TECHNICIANS, AlertSeverity, Incident } from '@/data/mockNetworkData';

interface IncidentPanelProps {
  open: boolean;
  onClose: () => void;
  preselectedNodeId?: string;
  incidents: Incident[];
  onCreateIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'status'>) => void;
  onExportCSV: () => void;
}

export function IncidentPanel({ open, onClose, preselectedNodeId, incidents, onCreateIncident, onExportCSV }: IncidentPanelProps) {
  const [nodeId, setNodeId] = useState(preselectedNodeId || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<AlertSeverity>('alto');
  const [assignedTech, setAssignedTech] = useState(TECHNICIANS[0]);
  const [estimatedResolution, setEstimatedResolution] = useState('1h');
  const [internalNotes, setInternalNotes] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    // TODO: connect to Supabase incidents table
    onCreateIncident({ nodeId, description, priority, assignedTech, estimatedResolution, internalNotes });
    setDescription('');
    setInternalNotes('');
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border z-50 animate-slide-in-right flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Panel de Incidentes</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={onExportCSV}>
            <Download className="h-3 w-3" /> CSV
          </Button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <h4 className="text-xs font-semibold mb-2">Crear Incidente</h4>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-muted-foreground">Nodo afectado</label>
              <select value={nodeId} onChange={e => setNodeId(e.target.value)} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5">
                <option value="">Seleccionar...</option>
                {MOCK_NODES.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Prioridad</label>
                <select value={priority} onChange={e => setPriority(e.target.value as AlertSeverity)} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5">
                  <option value="critico">Crítico</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Medio</option>
                  <option value="bajo">Bajo</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Técnico</label>
                <select value={assignedTech} onChange={e => setAssignedTech(e.target.value)} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5">
                  {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Resolución estimada</label>
              <select value={estimatedResolution} onChange={e => setEstimatedResolution(e.target.value)} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5">
                <option value="30m">30 minutos</option>
                <option value="1h">1 hora</option>
                <option value="2h">2 horas</option>
                <option value="4h">4 horas</option>
                <option value="8h">8 horas</option>
                <option value="24h">24 horas</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Notas internas (no visible para el cliente)</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={2} className="w-full text-xs bg-accent border border-border rounded px-2 py-1.5 mt-0.5 resize-none" placeholder="Solo visible para el equipo técnico..." />
            </div>
            <Button size="sm" className="w-full text-xs" onClick={handleSubmit} disabled={!nodeId || !description}>
              Crear Incidente
            </Button>
          </div>
        </div>

        {incidents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2">Incidentes Recientes</h4>
            <div className="space-y-1.5">
              {incidents.map(inc => {
                const node = MOCK_NODES.find(n => n.id === inc.nodeId);
                return (
                  <div key={inc.id} className="bg-accent rounded p-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-mono font-medium">{node?.name || inc.nodeId}</span>
                      <span className="text-muted-foreground">{inc.createdAt}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{inc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
