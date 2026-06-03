import { useState, useCallback } from 'react';
import {
  FileText, Download, Plus, Trash2, ChevronDown, ChevronUp,
  Radio, AlertCircle, BarChart2, MapPin, Loader2
} from 'lucide-react';
import { API_BASE } from '../../../config';
import { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

// ── Tipos de reporte ──────────────────────────────────────────────────────────
const TIPOS = [
  {
    id: 'barrido',
    label: 'Barrido de Frecuencias',
    icon: Radio,
    color: '#2e7d32',
    desc: 'Mediciones de RF en sitio: frecuencias, niveles y canales.',
  },
  {
    id: 'incidente',
    label: 'Reporte de Incidente',
    icon: AlertCircle,
    color: '#c62828',
    desc: 'Documentación de fallas: causa raíz, acciones y timeline.',
  },
  {
    id: 'noc_caidas',
    label: 'NOC — Caídas Semanales',
    icon: BarChart2,
    color: '#e65100',
    desc: 'Registro semanal de caídas de dispositivos monitoreados.',
  },
  {
    id: 'operativo',
    label: 'Reporte Operativo',
    icon: MapPin,
    color: '#1565c0',
    desc: 'Resumen operativo de plaza: tickets, instalaciones y KPIs.',
  },
];

// ── Formularios por tipo ──────────────────────────────────────────────────────
function FormBarrido({ datos, onChange }: { datos: any; onChange: (d: any) => void }) {
  const [mediciones, setMediciones] = useState<any[]>(datos.mediciones || []);
  const upd = (k: string, v: any) => onChange({ ...datos, [k]: v });

  const addRow = () => {
    const newRows = [...mediciones, { frecuencia: '', nivel_dbm: '', canal: '', estado: 'OK' }];
    setMediciones(newRows);
    onChange({ ...datos, mediciones: newRows });
  };
  const removeRow = (i: number) => {
    const newRows = mediciones.filter((_, idx) => idx !== i);
    setMediciones(newRows);
    onChange({ ...datos, mediciones: newRows });
  };
  const editRow = (i: number, k: string, v: string) => {
    const newRows = mediciones.map((r, idx) => idx === i ? { ...r, [k]: v } : r);
    setMediciones(newRows);
    onChange({ ...datos, mediciones: newRows });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row2>
        <Field label="Sitio" value={datos.sitio || ''} onChange={v => upd('sitio', v)} placeholder="Ej. Torre Norte MTY" />
        <Field label="Técnico" value={datos.tecnico || ''} onChange={v => upd('tecnico', v)} placeholder="Nombre del técnico" />
      </Row2>
      <Row2>
        <Field label="Fecha" type="date" value={datos.fecha || today()} onChange={v => upd('fecha', v)} />
        <div />
      </Row2>
      <Field label="Notas de campo" value={datos.notas || ''} onChange={v => upd('notas', v)} multiline placeholder="Condiciones del sitio, observaciones..." />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Mediciones
          </label>
          <button onClick={addRow} style={btnSmall('#2e7d32')}>
            <Plus size={12} /> Agregar fila
          </button>
        </div>
        {mediciones.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#2e7d32' }}>
                {['Frecuencia (MHz)', 'Nivel (dBm)', 'Canal', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '5px 8px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mediciones.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#1a2234' : '#141921' }}>
                  {['frecuencia', 'nivel_dbm', 'canal', 'estado'].map(k => (
                    <td key={k} style={{ padding: '3px 4px' }}>
                      <input
                        value={r[k] || ''}
                        onChange={e => editRow(i, k, e.target.value)}
                        style={inlineInput}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '3px 4px' }}>
                    <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormIncidente({ datos, onChange }: { datos: any; onChange: (d: any) => void }) {
  const [timeline, setTimeline] = useState<any[]>(datos.timeline || []);
  const upd = (k: string, v: any) => onChange({ ...datos, [k]: v });

  const addTL = () => {
    const rows = [...timeline, { hora: '', evento: '' }];
    setTimeline(rows);
    onChange({ ...datos, timeline: rows });
  };
  const removeTL = (i: number) => {
    const rows = timeline.filter((_, idx) => idx !== i);
    setTimeline(rows);
    onChange({ ...datos, timeline: rows });
  };
  const editTL = (i: number, k: string, v: string) => {
    const rows = timeline.map((r, idx) => idx === i ? { ...r, [k]: v } : r);
    setTimeline(rows);
    onChange({ ...datos, timeline: rows });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row2>
        <Field label="Empresa / Cliente" value={datos.empresa || ''} onChange={v => upd('empresa', v)} placeholder="Ej. PANASONIC" />
        <Field label="Ticket / Folio" value={datos.ticket || ''} onChange={v => upd('ticket', v)} placeholder="Ej. SO57716" />
      </Row2>
      <Row2>
        <Field label="Servicio" value={datos.servicio || ''} onChange={v => upd('servicio', v)} placeholder="Ej. Internet Dedicado 500 Mbps" />
        <Field label="Responsable" value={datos.responsable || ''} onChange={v => upd('responsable', v)} placeholder="Nombre del encargado" />
      </Row2>
      <Row2>
        <Field label="Fecha Inicio" type="date" value={datos.fecha_inicio || today()} onChange={v => upd('fecha_inicio', v)} />
        <Field label="Fecha Cierre" type="date" value={datos.fecha_cierre || today()} onChange={v => upd('fecha_cierre', v)} />
      </Row2>
      <Row2>
        <Field label="Impacto" value={datos.impacto || ''} onChange={v => upd('impacto', v)} placeholder="Ej. Pérdida de conectividad total" />
        <div>
          <label style={labelStyle}>Estatus</label>
          <select value={datos.estatus || 'Cerrado'} onChange={e => upd('estatus', e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            {['Cerrado', 'En análisis', 'Pendiente cliente', 'Escalado'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Row2>
      <Field label="Descripción del incidente" value={datos.descripcion || ''} onChange={v => upd('descripcion', v)} multiline placeholder="¿Qué ocurrió? ¿Cómo se detectó?" />
      <Field label="Causa Raíz" value={datos.causa_raiz || ''} onChange={v => upd('causa_raiz', v)} multiline placeholder="Causa técnica identificada..." />
      <Field label="Acciones Tomadas" value={datos.acciones || ''} onChange={v => upd('acciones', v)} multiline placeholder="Pasos ejecutados para resolver..." />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Timeline</label>
          <button onClick={addTL} style={btnSmall('#c62828')}>
            <Plus size={12} /> Agregar evento
          </button>
        </div>
        {timeline.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <input placeholder="Hora / Fecha" value={r.hora} onChange={e => editTL(i, 'hora', e.target.value)}
              style={{ ...inputStyle, width: 130, flexShrink: 0 }} />
            <input placeholder="Evento" value={r.evento} onChange={e => editTL(i, 'evento', e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => removeTL(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormNocCaidas({ datos, onChange }: { datos: any; onChange: (d: any) => void }) {
  const [caidas, setCaidas] = useState<any[]>(datos.caidas || []);
  const upd = (k: string, v: any) => onChange({ ...datos, [k]: v });

  const addRow = () => {
    const rows = [...caidas, { dispositivo: '', ip: '', inicio: '', duracion_min: '', causa: '', plaza: '' }];
    setCaidas(rows);
    onChange({ ...datos, caidas: rows });
  };
  const removeRow = (i: number) => {
    const rows = caidas.filter((_, idx) => idx !== i);
    setCaidas(rows);
    onChange({ ...datos, caidas: rows });
  };
  const editRow = (i: number, k: string, v: string) => {
    const rows = caidas.map((r, idx) => idx === i ? { ...r, [k]: v } : r);
    setCaidas(rows);
    onChange({ ...datos, caidas: rows });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row2>
        <Field label="Semana" value={datos.semana || ''} onChange={v => upd('semana', v)} placeholder="Ej. 26 May – 1 Jun 2026" />
        <Field label="Analista NOC" value={datos.analista || 'NOC XCIEN'} onChange={v => upd('analista', v)} />
      </Row2>
      <Field label="Total dispositivos monitoreados" type="number" value={String(datos.total_dispositivos || '')} onChange={v => upd('total_dispositivos', Number(v))} />
      <Field label="Hallazgo Principal" value={datos.hallazgo_principal || ''} onChange={v => upd('hallazgo_principal', v)} multiline placeholder="Observación más importante de la semana..." />
      <Field label="Acciones Preventivas" value={datos.acciones_preventivas || ''} onChange={v => upd('acciones_preventivas', v)} multiline placeholder="Acciones para evitar recurrencia..." />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Caídas</label>
          <button onClick={addRow} style={btnSmall('#e65100')}>
            <Plus size={12} /> Agregar caída
          </button>
        </div>
        {caidas.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#e65100' }}>
                {['Dispositivo', 'IP', 'Inicio', 'Min', 'Causa', 'Plaza', ''].map(h => (
                  <th key={h} style={{ padding: '5px 6px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caidas.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#1a2234' : '#141921' }}>
                  {['dispositivo', 'ip', 'inicio', 'duracion_min', 'causa', 'plaza'].map(k => (
                    <td key={k} style={{ padding: '3px 4px' }}>
                      <input value={r[k] || ''} onChange={e => editRow(i, k, e.target.value)} style={inlineInput} />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormOperativo({ datos, onChange }: { datos: any; onChange: (d: any) => void }) {
  const [tickets, setTickets] = useState<any[]>(datos.tickets || []);
  const upd = (k: string, v: any) => onChange({ ...datos, [k]: v });

  const addTicket = () => {
    const rows = [...tickets, { folio: '', cliente: '', descripcion: '', etapa: '', tecnico: '' }];
    setTickets(rows);
    onChange({ ...datos, tickets: rows });
  };
  const removeTicket = (i: number) => {
    const rows = tickets.filter((_, idx) => idx !== i);
    setTickets(rows);
    onChange({ ...datos, tickets: rows });
  };
  const editTicket = (i: number, k: string, v: string) => {
    const rows = tickets.map((r, idx) => idx === i ? { ...r, [k]: v } : r);
    setTickets(rows);
    onChange({ ...datos, tickets: rows });
  };

  const m = datos.metricas || {};
  const updMetrica = (k: string, v: string) => onChange({ ...datos, metricas: { ...m, [k]: v } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row2>
        <Field label="Plaza" value={datos.plaza || ''} onChange={v => upd('plaza', v)} placeholder="Ej. Monterrey" />
        <Field label="Gerente de Plaza" value={datos.gerente || ''} onChange={v => upd('gerente', v)} />
      </Row2>
      <Field label="Fecha" type="date" value={datos.fecha || today()} onChange={v => upd('fecha', v)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          ['tickets_abiertos', 'Tickets Abiertos'],
          ['tickets_cerrados', 'Tickets Cerrados'],
          ['nps', 'NPS'],
          ['uptime', 'Uptime'],
        ].map(([k, label]) => (
          <div key={k}>
            <label style={labelStyle}>{label}</label>
            <input
              value={m[k] || ''}
              onChange={e => updMetrica(k, e.target.value)}
              placeholder="—"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        ))}
      </div>

      <Field label="Notas del Gerente" value={datos.notas || ''} onChange={v => upd('notas', v)} multiline />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Tickets</label>
          <button onClick={addTicket} style={btnSmall('#1565c0')}>
            <Plus size={12} /> Agregar ticket
          </button>
        </div>
        {tickets.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#1565c0' }}>
                {['Folio', 'Cliente', 'Descripción', 'Etapa', 'Técnico', ''].map(h => (
                  <th key={h} style={{ padding: '5px 6px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#1a2234' : '#141921' }}>
                  {['folio', 'cliente', 'descripcion', 'etapa', 'tecnico'].map(k => (
                    <td key={k} style={{ padding: '3px 4px' }}>
                      <input value={r[k] || ''} onChange={e => editTicket(i, k, e.target.value)} style={inlineInput} />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => removeTicket(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Helpers de estilo ─────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

const inputStyle: React.CSSProperties = {
  background: '#1a2234',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '7px 10px',
  outline: 'none',
};

const inlineInput: React.CSSProperties = {
  ...inputStyle,
  width: '100%',
  padding: '4px 6px',
  borderRadius: 4,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#94a3b8',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 4,
};

const btnSmall = (color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 4,
  background: `${color}18`, border: `1px solid ${color}40`,
  borderRadius: 4, color, fontSize: 11, fontWeight: 600,
  padding: '4px 8px', cursor: 'pointer',
});

function Field({
  label, value, onChange, placeholder = '', type = 'text', multiline = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.5 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputStyle, width: '100%' }}
        />
      )}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ReportLabSection({ theme }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [datos, setDatos] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const tipo = TIPOS.find(t => t.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    setDatos({});
    setError(null);
    setSuccess(false);
    setExpanded(true);
  };

  const handleGenerar = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/reportlab/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: selected, datos }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Error generando PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : `xcien_${selected}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selected, datos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(46,125,50,0.12)', border: '1px solid rgba(46,125,50,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={18} color="#2e7d32" />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Generador de Reportes PDF</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Reportes corporativos XCIEN — formato blanco y verde</p>
        </div>
      </div>

      {/* Selector de tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {TIPOS.map(t => {
          const Icon = t.icon;
          const isActive = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '16px 10px',
                background: isActive ? `${t.color}14` : '#141921',
                border: `1.5px solid ${isActive ? t.color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `${t.color}18`, border: `1px solid ${t.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={t.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : '#94a3b8', lineHeight: 1.3 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Formulario */}
      {selected && tipo && (
        <div style={{
          background: '#141921',
          border: `1px solid rgba(255,255,255,0.07)`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Form header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: `${tipo.color}10`,
              borderBottom: `1px solid ${tipo.color}25`,
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(p => !p)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <tipo.icon size={15} color={tipo.color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{tipo.label}</span>
            </div>
            {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
          </div>

          {expanded && (
            <div style={{ padding: 20 }}>
              {selected === 'barrido'    && <FormBarrido    datos={datos} onChange={setDatos} />}
              {selected === 'incidente'  && <FormIncidente  datos={datos} onChange={setDatos} />}
              {selected === 'noc_caidas' && <FormNocCaidas  datos={datos} onChange={setDatos} />}
              {selected === 'operativo'  && <FormOperativo  datos={datos} onChange={setDatos} />}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#0f1520',
          }}>
            <button
              onClick={handleGenerar}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px',
                background: loading ? 'rgba(46,125,50,0.3)' : '#2e7d32',
                border: 'none', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
                color: '#fff', fontSize: 13, fontWeight: 700,
                transition: 'background 0.15s',
              }}
            >
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generando…</>
                : <><Download size={14} /> Generar PDF</>
              }
            </button>

            {error && (
              <span style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertCircle size={13} /> {error}
              </span>
            )}
            {success && (
              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                PDF descargado correctamente
              </span>
            )}
          </div>
        </div>
      )}

      {!selected && (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          background: '#141921', borderRadius: 12,
          border: '1px dashed rgba(255,255,255,0.08)',
        }}>
          <FileText size={32} color="#334155" style={{ marginBottom: 10 }} />
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            Selecciona un tipo de reporte para comenzar
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}
