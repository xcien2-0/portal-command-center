import { useState } from 'react';
import { X, Download } from 'lucide-react';
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
    onCreateIncident({ nodeId, description, priority, assignedTech, estimatedResolution, internalNotes });
    setDescription('');
    setInternalNotes('');
  };

  const inputCls = "w-full text-[12px] bg-[#0f1923] border border-[#2a3f50] text-[#F5F5F7] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[#34C759]/50";

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#1a2733] border-l border-[#2a3f50] z-50 animate-slide-in-right flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-[#2a3f50]">
        <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Panel de Incidentes</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 text-[11px] text-[#8ba3b8] hover:text-[#F5F5F7] transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={onClose} className="text-[#5a7080] hover:text-[#F5F5F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <h4 className="text-[12px] font-medium text-[#5a7080] uppercase tracking-wider mb-3">Crear Incidente</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#8ba3b8]">Nodo afectado</label>
              <select value={nodeId} onChange={e => setNodeId(e.target.value)} className={inputCls}>
                <option value="">Seleccionar...</option>
                {MOCK_NODES.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#8ba3b8]">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#8ba3b8]">Prioridad</label>
                <select value={priority} onChange={e => setPriority(e.target.value as AlertSeverity)} className={inputCls}>
                  <option value="critico">Crítico</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Medio</option>
                  <option value="bajo">Bajo</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#8ba3b8]">Técnico</label>
                <select value={assignedTech} onChange={e => setAssignedTech(e.target.value)} className={inputCls}>
                  {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#8ba3b8]">Resolución estimada</label>
              <select value={estimatedResolution} onChange={e => setEstimatedResolution(e.target.value)} className={inputCls}>
                <option value="30m">30 minutos</option>
                <option value="1h">1 hora</option>
                <option value="2h">2 horas</option>
                <option value="4h">4 horas</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#8ba3b8]">Notas internas</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Solo visible para el equipo técnico..." />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!nodeId || !description}
              className="w-full h-10 bg-[#34C759] hover:bg-[#2db84e] disabled:opacity-30 text-[#0f1923] font-semibold text-[13px] rounded-lg transition-colors"
            >
              Crear Incidente
            </button>
          </div>
        </div>

        {incidents.length > 0 && (
          <div>
            <h4 className="text-[12px] font-medium text-[#5a7080] uppercase tracking-wider mb-2">Recientes</h4>
            <div className="space-y-2">
              {incidents.map(inc => {
                const node = MOCK_NODES.find(n => n.id === inc.nodeId);
                return (
                  <div key={inc.id} className="bg-[#0f1923] rounded-lg p-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono font-semibold text-[#F5F5F7]">{node?.name || inc.nodeId}</span>
                      <span className="text-[#5a7080]">{inc.createdAt}</span>
                    </div>
                    <p className="text-[12px] text-[#8ba3b8] mt-1">{inc.description}</p>
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
