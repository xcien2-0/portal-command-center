import { useEffect, useRef } from 'react';
import type { Notificacion, NotiTipo } from '../../../hooks/useNotificaciones';
import type { SectionId } from '../types';

interface Props {
  open: boolean;
  notificaciones: Notificacion[];
  noLeidas: number;
  onClose: () => void;
  onMarcarLeida: (id: string) => void;
  onMarcarTodasLeidas: () => void;
  onLimpiar: () => void;
  onNavigate: (id: SectionId) => void;
}

const TIPO_META: Record<NotiTipo, { icon: string; color: string; label: string }> = {
  noc_critica:  { icon: '🔴', color: '#FF4757', label: 'NOC Crítico' },
  wfm_urgente:  { icon: '🟡', color: '#FFB703', label: 'WFM Urgente' },
  kpi_alerta:   { icon: '📊', color: '#7c3aed', label: 'KPI Alerta'  },
  academia:     { icon: '🎓', color: '#00C896', label: 'Academia'    },
  sistema:      { icon: '⚙️', color: '#4FC3F7', label: 'Sistema'     },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)  return 'Hace un momento';
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export default function NotificacionesPanel({
  open, notificaciones, noLeidas,
  onClose, onMarcarLeida, onMarcarTodasLeidas, onLimpiar, onNavigate,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Solicitar permiso de notificaciones desktop al abrir por primera vez con no-leídas
  useEffect(() => {
    if (open && noLeidas > 0 && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [open, noLeidas]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const grupos: Partial<Record<NotiTipo, Notificacion[]>> = {};
  for (const n of notificaciones) {
    if (!grupos[n.tipo]) grupos[n.tipo] = [];
    grupos[n.tipo]!.push(n);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1000,
          width: 380,
          background: '#0f1623',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🔔</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>Notificaciones</p>
              {noLeidas > 0 && (
                <p style={{ margin: 0, fontSize: 11, color: '#FFB703', fontWeight: 600 }}>
                  {noLeidas} sin leer
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {noLeidas > 0 && (
              <button
                onClick={onMarcarTodasLeidas}
                style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Leer todas
              </button>
            )}
            {notificaciones.length > 0 && (
              <button
                onClick={onLimpiar}
                style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', fontSize: 11, cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: '5px 9px', borderRadius: 6, background: 'transparent', border: 'none', color: '#6b7280', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {notificaciones.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#374151' }}>
              <span style={{ fontSize: 40 }}>🔔</span>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
                Sin notificaciones.<br/>Todo está en orden.
              </p>
            </div>
          ) : (
            Object.entries(grupos).map(([tipo, items]) => {
              const meta = TIPO_META[tipo as NotiTipo];
              return (
                <div key={tipo} style={{ marginBottom: 20 }}>
                  {/* Grupo header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>{meta.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {meta.label}
                    </span>
                    <div style={{ flex: 1, height: 1, background: `${meta.color}20` }} />
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{items!.length}</span>
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items!.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onMarcarLeida(n.id);
                          if (n.link) onNavigate(n.link as SectionId);
                        }}
                        style={{
                          padding: '11px 14px',
                          borderRadius: 10,
                          background: n.leida ? 'rgba(255,255,255,0.02)' : `${meta.color}08`,
                          border: `1px solid ${n.leida ? 'rgba(255,255,255,0.04)' : `${meta.color}20`}`,
                          cursor: n.link ? 'pointer' : 'default',
                          transition: 'all 0.15s',
                          position: 'relative',
                        }}
                      >
                        {/* Unread dot */}
                        {!n.leida && (
                          <div style={{
                            position: 'absolute', top: 11, right: 12,
                            width: 7, height: 7, borderRadius: '50%',
                            background: meta.color,
                            boxShadow: `0 0 6px ${meta.color}`,
                          }} />
                        )}
                        <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: n.leida ? 600 : 800, color: n.leida ? '#9ca3af' : '#f3f4f6', paddingRight: 16 }}>
                          {n.titulo}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                          {n.cuerpo}
                        </p>
                        <p style={{ margin: '5px 0 0', fontSize: 10, color: '#4b5563' }}>
                          {timeAgo(n.ts)}
                          {n.link && <span style={{ marginLeft: 6, color: meta.color }}>Ir →</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#374151', textAlign: 'center' }}>
            Actualización en tiempo real vía SSE · XCIEN Centro de Mando
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0 }
          to   { transform: translateX(0);    opacity: 1 }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
      `}</style>
    </>
  );
}
