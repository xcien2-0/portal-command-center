import { useState, useEffect } from 'react';
import { ThemeConfig, WFMOrder, WFMOrderState } from '../types';

import { API_BASE } from '../../../config';
const G = '#00ff88';

// ── Matrix Background ─────────────────────────────────────────────────────────
function MatrixBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)',
        fontFamily: 'monospace', fontSize: 12, color: '#00ff88', textShadow: '0 0 8px #00ff88',
        whiteSpace: 'nowrap', userSelect: 'none'
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ 
            animation: `matrixFall ${15 + Math.random() * 25}s linear infinite`,
            animationDelay: `${-Math.random() * 25}s`,
            writingMode: 'vertical-rl',
            textAlign: 'center'
          }}>
            {Array.from({ length: 60 }).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes matrixFall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

type WFMRole = 'comercial' | 'preventa' | 'almacen' | 'aprovisionamiento' | 'pm';

const ROLE_DATA: Record<WFMRole, { label: string; icon: string; color: string }> = {
  comercial:        { label: 'Comercial',        icon: '🤝', color: '#00C896' },
  preventa:         { label: 'Preventa',         icon: '🔍', color: '#4FC3F7' },
  almacen:          { label: 'Almacén',          icon: '📦', color: '#FFB703' },
  aprovisionamiento: { label: 'Aprovisionamiento',icon: '⚙️', color: '#A855F7' },
  pm:               { label: 'PM / Operaciones', icon: '📋', color: '#FF4757' },
};

const STATE_LABEL: Record<WFMOrderState, string> = {
  SOLICITUD_PREVENTA:  'Solicitud Preventa',
  ANTEPROYECTO:        'Anteproyecto Listo',
  ORDEN_IMPLEMENTACION: 'Orden de Imp.',
  ALMACEN_VALIDACION:  'Validando Almacén',
  ESPERA_INVENTARIO:   'Espera Inventario',
  APROVISIONAMIENTO:   'En Aprovisionamiento',
  REVISION_PM:         'Revisión Final PM',
  LISTO_INSTALACION:   'Listo p/ Instalación',
  BACKLOG:             'Backlog / Incidencia',
};

// ── Components ───────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30`, textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

// ── Main Section ─────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig; activeThemeId?: string }

export default function WFMSection({ theme, activeThemeId }: Props) {
  const [role, setRole]           = useState<WFMRole>('comercial');
  const [orders, setOrders]       = useState<WFMOrder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelected] = useState<string | null>(null);

  // Forms
  const [newOrder, setNewOrder] = useState({ cliente: '', servicio: '' });

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wfm/ordenes`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Error fetching orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCreate = async () => {
    if (!newOrder.cliente || !newOrder.servicio) return;
    await fetch(`${API_BASE}/api/wfm/comercial/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newOrder, comercial: 'Usuario Demo' })
    });
    setNewOrder({ cliente: '', servicio: '' });
    fetchOrders();
  };

  const handleAudit = async (ok: boolean) => {
    if (!selectedId) return;
    await fetch(`${API_BASE}/api/wfm/pm/auditar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        order_id: selectedId, 
        ok, 
        motivo: ok ? 'Auditoría aprobada satisfactoriamente' : 'Documentación incompleta / Errores técnicos',
        usuario: 'Auditor PM'
      })
    });
    fetchOrders();
  };

  const handlePreventaUpdate = async () => {
    if (!selectedId) return;
    await fetch(`${API_BASE}/api/wfm/preventa/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        order_id: selectedId, 
        data: { factibilidad: 'OK', tecnologia: 'Fibra', analisis: 'Factible vía FO' },
        usuario: 'Ing. Preventa'
      })
    });
    fetchOrders();
  };

  const handleVentasContratar = async () => {
    if (!selectedId) return;
    await fetch(`${API_BASE}/api/wfm/ventas/contratar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: selectedId, usuario: 'Gerente Ventas' })
    });
    fetchOrders();
  };

  const handleAlmacenAsignar = async () => {
    if (!selectedId) return;
    await fetch(`${API_BASE}/api/wfm/almacen/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        order_id: selectedId, 
        equipos: [{ modelo: 'CCR2004', sn: 'SN-' + Math.random().toString(36).substring(7).toUpperCase() }],
        usuario: 'Jefe Almacén'
      })
    });
    fetchOrders();
  };

  const handleAprovisionar = async () => {
    if (!selectedId) return;
    await fetch(`${API_BASE}/api/wfm/aprovisionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        order_id: selectedId, 
        config: { vlan: 4000, bw: '1GB' },
        usuario: 'Ing. NOC'
      })
    });
    fetchOrders();
  };

  const selectedOrder = orders.find(o => o.id === selectedId);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 20, position: 'relative' }}>
      {activeThemeId === 'matrix' && <MatrixBackground />}
      
      {/* Sidebar de Roles */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>Vistas por Rol</h3>
        {(Object.keys(ROLE_DATA) as WFMRole[]).map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
              background: role === r ? `${ROLE_DATA[r].color}15` : 'transparent',
              border: `1px solid ${role === r ? ROLE_DATA[r].color : 'transparent'}`,
              color: role === r ? ROLE_DATA[r].color : theme.dim,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: 18 }}>{ROLE_DATA[r].icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{ROLE_DATA[r].label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Header Dinámico */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard de {ROLE_DATA[role].label}</h2>
            <p style={{ fontSize: 12, color: theme.dim }}>Gestión de órdenes de implementación y field services</p>
          </div>
          <button 
            onClick={fetchOrders}
            style={{ padding: '8px 16px', borderRadius: 8, background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer' }}
          >
            🔄 Sincronizar
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
          
          {/* Listado de Órdenes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingRight: 4 }}>
            {role === 'comercial' && (
              <div style={{ background: `${theme.accent}10`, border: `1px dashed ${theme.accent}40`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>+ Nueva Solicitud</div>
                <input 
                  placeholder="Cliente" 
                  value={newOrder.cliente}
                  onChange={e => setNewOrder({...newOrder, cliente: e.target.value})}
                  style={{ width: '100%', padding: 8, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, color: '#fff', marginBottom: 8 }}
                />
                <input 
                  placeholder="Servicio (ej. Fibra 100MB)" 
                  value={newOrder.servicio}
                  onChange={e => setNewOrder({...newOrder, servicio: e.target.value})}
                  style={{ width: '100%', padding: 8, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, color: '#fff', marginBottom: 10 }}
                />
                <button 
                  onClick={handleCreate}
                  style={{ width: '100%', padding: 8, background: theme.accent, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Crear Solicitud
                </button>
              </div>
            )}

            {orders.map(o => (
              <div 
                key={o.id}
                onClick={() => setSelected(o.id)}
                style={{
                  background: theme.card, border: `1px solid ${selectedId === o.id ? theme.accent : theme.border}`,
                  borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: theme.dim }}>{o.id}</span>
                    {o.id.startsWith('ODOO-') && <span style={{ fontSize: 9, color: '#00C896', background: '#00C89610', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>ODOO SYNC</span>}
                  </div>
                  <Badge label={STATE_LABEL[o.estado]} color={o.estado === 'BACKLOG' ? '#FF4757' : theme.accent} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{o.cliente}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{o.servicio}</div>
              </div>
            ))}
          </div>

          {/* Panel de Detalles y Acciones */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedOrder ? (
              <>
                <div style={{ padding: 20, borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedOrder.cliente}</div>
                  <div style={{ display: 'flex', gap: 15, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: theme.dim }}>📦 Servicio: <b>{selectedOrder.servicio}</b></span>
                    <span style={{ fontSize: 13, color: theme.dim }}>👤 Comercial: <b>{selectedOrder.comercial}</b></span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 15, textTransform: 'uppercase', color: ROLE_DATA[role].color }}>Acciones de {role.toUpperCase()}</h4>
                  
                  {/* Vista específica por ROL */}
                  {role === 'preventa' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Evaluación de Factibilidad</div>
                        <textarea placeholder="Detalle técnico de factibilidad..." style={{ width: '100%', height: 80, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, color: '#fff', padding: 10 }} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                          <button 
                            onClick={handlePreventaUpdate}
                            style={{ flex: 1, padding: 10, background: theme.accent, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Generar Anteproyecto (US-009)
                          </button>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Cierre de Venta (Oportunidad Ganada)</div>
                        <button 
                          onClick={handleVentasContratar}
                          style={{ width: '100%', padding: 10, background: '#00C896', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Marcar como Ganada y Emitir Token
                        </button>
                      </div>
                    </div>
                  )}

                  {role === 'almacen' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                       <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Gestión de Inventario (US-015)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ padding: 10, background: theme.bg, borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Router Mikrotik CCR-2004</span>
                            <span style={{ color: '#00C896' }}>S/N: 2026-X123</span>
                          </div>
                          <button 
                            onClick={handleAlmacenAsignar}
                            style={{ padding: 10, background: theme.accent, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Asignar y Enviar a Apro (US-018)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {role === 'aprovisionamiento' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                       <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Aprovisionamiento Lógico de Red</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div style={{ padding: 10, background: theme.bg, borderRadius: 6, border: `1px solid ${theme.border}` }}>
                            <div style={{ fontSize: 10, color: theme.dim }}>VLAN</div>
                            <div style={{ fontWeight: 700 }}>4022</div>
                          </div>
                          <div style={{ padding: 10, background: theme.bg, borderRadius: 6, border: `1px solid ${theme.border}` }}>
                            <div style={{ fontSize: 10, color: theme.dim }}>BW</div>
                            <div style={{ fontWeight: 700 }}>1024 Mbps</div>
                          </div>
                        </div>
                        <button 
                          onClick={handleAprovisionar}
                          style={{ width: '100%', padding: 10, background: theme.accent, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Ejecutar Aprovisionamiento (US-022)
                        </button>
                      </div>
                    </div>
                  )}

                  {role === 'pm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                       <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 10, border: `1px solid ${selectedOrder.pm.bloqueada ? '#FF4757' : 'transparent'}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Auditoría de Documento Único (US-025)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <button 
                            onClick={() => handleAudit(true)}
                            style={{ padding: 10, background: '#00C896', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Aprobar Instalación
                          </button>
                          <button 
                            onClick={() => handleAudit(false)}
                            style={{ padding: 10, background: '#FF4757', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Rechazar / Backlog
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 30 }}>
                    <h5 style={{ fontSize: 12, fontWeight: 700, color: theme.dim, marginBottom: 10 }}>Historial de la Orden</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedOrder.historial.map((h, i) => (
                        <div key={i} style={{ fontSize: 11, color: theme.dim, padding: '4px 0', borderBottom: `1px solid ${theme.border}` }}>
                          <b>{h.fecha.split('T')[1].substring(0,5)}</b> · {h.accion} (<i>{h.usuario}</i>)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: theme.dim }}>
                <span style={{ fontSize: 40, marginBottom: 20 }}>📁</span>
                <p>Selecciona una orden de implementación para ver detalles</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
