import { useState, useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import HexoField3D from '../../../components/HexoField3D';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChainEvent {
  type: 'token_created' | 'token_transition' | 'connected' | 'ping';
  token_id?: string;
  token_name?: string;
  domain?: string;
  entity?: string;
  state?: string;
  from_state?: string;
  to_state?: string;
  by?: string;
  event_hash?: string;
  prev_hash?: string;
  ts?: string;
  _received_at?: string;
}

interface ChainStatus {
  valid: boolean;
  total: number;
  broken_at: string | null;
}

// ─── Domain config ────────────────────────────────────────────────────────────

const D: Record<string, { icon: string; color: string; label: string }> = {
  inventory:     { icon: '🏷️', color: '#1976D2', label: 'Inventario' },
  rrhh:          { icon: '👤', color: '#2E7D32', label: 'RRHH' },
  finanzas:      { icon: '💰', color: '#7B1FA2', label: 'Finanzas' },
  noc:           { icon: '📡', color: '#E65100', label: 'NOC' },
  academia:      { icon: '🎓', color: '#00796B', label: 'Academia' },
  field_service: { icon: '🔧', color: '#455A64', label: 'Campo' },
};

function short(h?: string) { return h ? h.slice(0, 10) + '...' : '—'; }
function ts(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Block component ─────────────────────────────────────────────────────────

function Block({ event, index, theme, isNew }: {
  event: ChainEvent; index: number; theme: ThemeConfig; isNew: boolean;
}) {
  const d = D[event.domain || ''] || { icon: '🔖', color: '#64748b', label: event.domain };
  const isGenesis = !event.prev_hash || event.prev_hash === 'GENESIS';

  return (
    <div style={{
      display: 'flex', gap: 0, alignItems: 'stretch',
      animation: isNew ? 'slideIn 0.35s ease' : 'none',
    }}>
      {/* Chain connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
        {index > 0 && (
          <div style={{ width: 2, flex: '0 0 12px', background: `${d.color}60` }} />
        )}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: d.color, flexShrink: 0,
          boxShadow: isNew ? `0 0 10px ${d.color}` : 'none',
        }} />
        <div style={{ width: 2, flex: 1, background: `${d.color}30` }} />
      </div>

      {/* Block card */}
      <div style={{
        flex: 1, marginBottom: 4,
        background: theme.card,
        border: `1px solid ${isNew ? d.color : (theme.border || '#2a3f50')}`,
        borderLeft: `3px solid ${d.color}`,
        borderRadius: 6, padding: '8px 10px',
        transition: 'border-color 0.5s',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>{d.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: d.color }}>{d.label}</span>
            {event.entity && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                background: `${d.color}15`, color: d.color, fontWeight: 700,
                textTransform: 'uppercase' as const,
              }}>
                {event.entity}
              </span>
            )}
          </div>
          <span style={{ fontSize: 9, color: theme.dim, fontFamily: 'monospace' }}>
            {ts(event._received_at)}
          </span>
        </div>

        {/* Token name + transition */}
        <div style={{ fontSize: 11, color: theme.text, marginBottom: 4, fontWeight: 500 }}>
          {event.token_name}
          {event.type === 'token_transition' && event.from_state && (
            <span style={{ color: theme.dim, fontWeight: 400 }}>
              {' '}· {event.from_state} <span style={{ color: d.color }}>→ {event.to_state}</span>
            </span>
          )}
          {event.type === 'token_created' && (
            <span style={{ color: '#10B981', fontWeight: 400 }}> · creado</span>
          )}
        </div>

        {event.by && (
          <div style={{ fontSize: 9, color: theme.dim, marginBottom: 5 }}>por {event.by}</div>
        )}

        {/* Hashes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {event.prev_hash && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: theme.dim, width: 60 }}>prev</span>
              <span style={{
                fontSize: 8, fontFamily: 'monospace',
                color: isGenesis ? '#F59E0B' : theme.dim,
                background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 3,
              }}>
                {isGenesis ? 'GENESIS' : short(event.prev_hash)}
              </span>
            </div>
          )}
          {event.event_hash && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: theme.dim, width: 60 }}>hash</span>
              <span style={{
                fontSize: 8, fontFamily: 'monospace',
                color: '#10B981',
                background: 'rgba(16,185,129,0.08)', padding: '1px 5px', borderRadius: 3,
              }}>
                {short(event.event_hash)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MerkleFeedSection({ theme }: { theme: ThemeConfig }) {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [chainStatus, setChainStatus] = useState<ChainStatus | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const esRef = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Verificar integridad al cargar
  useEffect(() => {
    fetch(`${API_BASE}/api/xtokens/chain/verify`)
      .then(r => r.json())
      .then(setChainStatus)
      .catch(() => {});
  }, []);

  // SSE connection
  useEffect(() => {
    if (paused) {
      esRef.current?.close();
      setConnected(false);
      return;
    }

    const es = new EventSource(`${API_BASE}/api/xtokens/stream`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const data: ChainEvent = JSON.parse(e.data);
        if (data.type === 'ping' || data.type === 'connected') return;

        const enriched = { ...data, _received_at: new Date().toISOString() };
        setEvents(prev => [enriched, ...prev.slice(0, 199)]);

        const key = `${data.token_id}-${data.ts}`;
        setNewIds(prev => new Set([...prev, key]));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(key); return n; }), 2000);

        // Re-verificar cadena
        fetch(`${API_BASE}/api/xtokens/chain/verify`)
          .then(r => r.json()).then(setChainStatus).catch(() => {});
      } catch {}
    };

    return () => { es.close(); setConnected(false); };
  }, [paused]);

  const filtered = domainFilter === 'all'
    ? events
    : events.filter(e => e.domain === domainFilter);

  const accent = theme.accent || '#60a5fa';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

      {/* Fondo hexomórfico animado */}
      <HexoField3D
        mode="blockchain"
        interactive={false}
        opacity={0.18}
        style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}
      />

      {/* Contenido sobre el fondo — z-index 10 */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: theme.text }}>
            Merkle Chain — Feed en Vivo
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: theme.dim }}>
            Cada evento es un bloque encadenado criptográficamente · imposible de alterar sin detección
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Connection indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            color: connected ? '#10B981' : '#64748b' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#10B981' : '#64748b',
              boxShadow: connected ? '0 0 6px #10B981' : 'none',
              animation: connected ? 'pulse 2s infinite' : 'none',
            }} />
            {connected ? 'En vivo' : 'Desconectado'}
          </div>
          <button
            onClick={() => setPaused(p => !p)}
            style={{
              background: paused ? '#F59E0B' : 'transparent',
              border: `1px solid ${paused ? '#F59E0B' : (theme.border || '#2a3f50')}`,
              color: paused ? '#000' : theme.dim,
              borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {paused ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
        </div>
      </div>

      {/* Chain integrity status */}
      {chainStatus && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: chainStatus.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${chainStatus.valid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 8, padding: '10px 16px',
        }}>
          <span style={{ fontSize: 18 }}>{chainStatus.valid ? '🔒' : '⚠️'}</span>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: chainStatus.valid ? '#10B981' : '#EF4444',
            }}>
              {chainStatus.valid
                ? `Cadena íntegra — ${chainStatus.total} eventos verificados`
                : `⚠️ INTEGRIDAD COMPROMETIDA — manipulación detectada`}
            </div>
            {chainStatus.broken_at && (
              <div style={{ fontSize: 10, color: '#EF4444', fontFamily: 'monospace', marginTop: 2 }}>
                Roto en: {chainStatus.broken_at}
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: theme.dim }}>
            SHA-256 · Merkle chain
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total eventos', value: events.length, color: accent },
          ...Object.entries(D).map(([k, v]) => ({
            label: `${v.icon} ${v.label}`,
            value: events.filter(e => e.domain === k).length,
            color: v.color,
          })),
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 7, padding: '8px 12px', textAlign: 'center' as const, minWidth: 60,
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9, color: theme.dim, marginTop: 2, whiteSpace: 'nowrap' as const }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: theme.dim }}>Filtrar:</span>
        {['all', ...Object.keys(D)].map(k => {
          const cfg = D[k];
          const active = domainFilter === k;
          return (
            <button
              key={k}
              onClick={() => setDomainFilter(k)}
              style={{
                background: active ? (cfg?.color || accent) + '20' : 'transparent',
                border: `1px solid ${active ? (cfg?.color || accent) : (theme.border || '#2a3f50')}`,
                color: active ? (cfg?.color || accent) : theme.dim,
                borderRadius: 5, padding: '3px 10px', fontSize: 10,
                cursor: 'pointer', fontWeight: active ? 700 : 400,
              }}
            >
              {cfg ? `${cfg.icon} ${cfg.label}` : 'Todos'}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: theme.dim }}>
          {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed */}
      <div style={{
        maxHeight: 'calc(100vh - 380px)', overflowY: 'auto',
        paddingRight: 4,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            background: theme.card, border: `1px dashed ${theme.border}`,
            borderRadius: 10, padding: 60, textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⛓️</div>
            <div style={{ fontSize: 13, color: theme.dim, marginBottom: 8 }}>
              Esperando eventos...
            </div>
            <div style={{ fontSize: 11, color: theme.dim }}>
              Crea una transacción, token de inventario o ticket WFM para ver la cadena en vivo.
            </div>
          </div>
        ) : (
          <>
            {filtered.map((ev, i) => (
              <Block
                key={`${ev.token_id}-${ev.ts}-${i}`}
                event={ev} index={i} theme={theme}
                isNew={newIds.has(`${ev.token_id}-${ev.ts}`)}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
      </div>
    </div>
  );
}
