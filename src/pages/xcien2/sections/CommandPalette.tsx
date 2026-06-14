import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SectionId } from '../types';
import { API_BASE } from '../../../config';

// ─── Types ────────────────────────────────────────────────────────────────────

type CmdCategoria = 'seccion' | 'tecnico' | 'alerta' | 'ticket' | 'accion';

interface CmdItem {
  id: string;
  categoria: CmdCategoria;
  titulo: string;
  subtitulo?: string;
  icono: string;
  badge?: string;
  badgeColor?: string;
  onSelect: () => void;
  keywords?: string;   // extra texto para búsqueda
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: SectionId) => void;
  secciones: { id: SectionId; label: string; icon: string; group?: string }[];
}

const CAT_LABEL: Record<CmdCategoria, string> = {
  seccion:  'Secciones',
  tecnico:  'Técnicos',
  alerta:   'Alertas NOC',
  ticket:   'Tickets WFM',
  accion:   'Acciones rápidas',
};

const CAT_COLOR: Record<CmdCategoria, string> = {
  seccion:  '#4FC3F7',
  tecnico:  '#00C896',
  alerta:   '#FF4757',
  ticket:   '#FFB703',
  accion:   '#7c3aed',
};

// ─── Fuzzy match ──────────────────────────────────────────────────────────────

function fuzzy(haystack: string, needle: string): boolean {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let hi = 0;
  for (const ch of n) {
    const idx = h.indexOf(ch, hi);
    if (idx === -1) return false;
    hi = idx + 1;
  }
  return true;
}

function score(item: CmdItem, q: string): number {
  const text = `${item.titulo} ${item.subtitulo ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  const ql = q.toLowerCase();
  if (text.startsWith(ql)) return 3;
  if (text.includes(ql))   return 2;
  if (fuzzy(text, ql))     return 1;
  return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommandPalette({ open, onClose, onNavigate, secciones }: Props) {
  const [query, setQuery]       = useState('');
  const [cursor, setCursor]     = useState(0);
  const [tecnicos, setTecnicos] = useState<{ name: string; avgPct: number; rank: number }[]>([]);
  const [alertas, setAlertas]   = useState<{ id: string; entity: string; severity: string; message: string }[]>([]);
  const [tickets, setTickets]   = useState<{ id: number; name: string; partner: string; priority: string }[]>([]);

  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Load dynamic data lazily once open
  useEffect(() => {
    if (!open) return;

    // Técnicos from Academia
    fetch(`${API_BASE}/api/academia/cursos`)
      .then(r => r.ok ? r.json() : [])
      .then((cursos: { members_list: { name: string; pct: number }[] }[]) => {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const c of cursos) {
          for (const m of c.members_list) {
            const name = (m.name ?? '').trim();
            if (!name || name === '—') continue;
            if (!map[name]) map[name] = { sum: 0, count: 0 };
            map[name].sum += m.pct ?? 0;
            map[name].count += 1;
          }
        }
        const list = Object.entries(map)
          .map(([name, { sum, count }]) => ({ name, avgPct: Math.round(sum / count), rank: 0 }))
          .sort((a, b) => b.avgPct - a.avgPct)
          .map((t, i) => ({ ...t, rank: i + 1 }))
          .slice(0, 50);
        setTecnicos(list);
      })
      .catch(() => {});

    // NOC Alerts
    fetch(`${API_BASE}/api/noc/alerts`)
      .then(r => r.ok ? r.json() : [])
      .then((data: { id?: string; entity_name?: string; alert_severity?: string; alert_message?: string }[]) => {
        const list = (Array.isArray(data) ? data : []).slice(0, 30).map(a => ({
          id:       String(a.id ?? ''),
          entity:   a.entity_name   ?? 'Dispositivo',
          severity: a.alert_severity ?? 'warning',
          message:  a.alert_message  ?? '',
        }));
        setAlertas(list);
      })
      .catch(() => {});

    // WFM Tickets urgentes
    fetch(`${API_BASE}/api/wfm/field-tickets?limit=30`)
      .then(r => r.ok ? r.json() : { tickets: [] })
      .then((data: { tickets?: { id: number; name: string; partner_name?: string; priority?: string }[] }) => {
        const list = (data.tickets ?? []).slice(0, 30).map(t => ({
          id:      t.id,
          name:    t.name,
          partner: t.partner_name ?? '',
          priority: t.priority ?? '0',
        }));
        setTickets(list);
      })
      .catch(() => {});
  }, [open]);

  // Build items
  const items = useMemo<CmdItem[]>(() => {
    const out: CmdItem[] = [];

    // Acciones rápidas (siempre visibles sin query)
    const acciones: CmdItem[] = [
      { id: 'act_warroom',  categoria: 'accion', icono: '⚔️', titulo: 'Abrir War Room',         subtitulo: 'Comando multi-agente IA',        onSelect: () => onNavigate('war-room'),     keywords: 'ia agente director' },
      { id: 'act_kpi',      categoria: 'accion', icono: '🎯', titulo: 'KPI Dashboard',           subtitulo: 'Indicadores clave ejecutivos',    onSelect: () => onNavigate('reportes-kpi'), keywords: 'kpi dashboard ejecutivo semáforo' },
      { id: 'act_academia', categoria: 'accion', icono: '🎓', titulo: 'Academia',                subtitulo: 'Cursos y leaderboard Odoo',      onSelect: () => onNavigate('academia'),     keywords: 'cursos badges odoo elearning' },
      { id: 'act_noc',      categoria: 'accion', icono: '📡', titulo: 'NOC Virtual',             subtitulo: 'Alertas y estado de red',        onSelect: () => onNavigate('noc'),          keywords: 'alertas red noc observium' },
      { id: 'act_bidrillas',categoria: 'accion', icono: '🚛', titulo: 'Equipos de Campo',        subtitulo: 'Técnicos geolocalizados',        onSelect: () => onNavigate('bidrillas'),    keywords: 'campo técnicos mapa bidrillas' },
      { id: 'act_adopcion', categoria: 'accion', icono: '👥', titulo: 'Gestión de Usuarios',    subtitulo: 'Crear y administrar cuentas',    onSelect: () => onNavigate('adopcion'),     keywords: 'usuarios roles cuentas registro' },
    ];
    out.push(...acciones);

    // Secciones
    for (const s of secciones) {
      out.push({
        id:       `sec_${s.id}`,
        categoria: 'seccion',
        icono:    s.icon,
        titulo:   s.label,
        subtitulo: s.group,
        keywords: s.id,
        onSelect: () => onNavigate(s.id),
      });
    }

    // Técnicos
    for (const t of tecnicos) {
      const pct = t.avgPct;
      const color = pct >= 80 ? '#FFB703' : pct >= 50 ? '#00C896' : '#6b7280';
      out.push({
        id:        `tec_${t.name}`,
        categoria: 'tecnico',
        icono:     '👷',
        titulo:    t.name,
        subtitulo: `#${t.rank} en ranking`,
        badge:     `${pct}%`,
        badgeColor: color,
        keywords:  'técnico campo odoo',
        onSelect:  () => onNavigate('academia'),
      });
    }

    // Alertas
    for (const a of alertas) {
      const isCrit = a.severity === 'critical' || a.severity === 'high';
      out.push({
        id:        `noc_${a.id}`,
        categoria: 'alerta',
        icono:     isCrit ? '🔴' : '🟡',
        titulo:    a.entity,
        subtitulo: a.message.slice(0, 70),
        badge:     a.severity.toUpperCase(),
        badgeColor: isCrit ? '#FF4757' : '#FFB703',
        keywords:  'noc alerta red',
        onSelect:  () => onNavigate('noc'),
      });
    }

    // Tickets
    for (const t of tickets) {
      out.push({
        id:        `tick_${t.id}`,
        categoria: 'ticket',
        icono:     t.priority === '1' ? '🔥' : '📋',
        titulo:    t.name.slice(0, 60),
        subtitulo: t.partner,
        badge:     t.priority === '1' ? 'URGENTE' : undefined,
        badgeColor: '#FFB703',
        keywords:  'wfm ticket campo orden',
        onSelect:  () => onNavigate('wfm'),
      });
    }

    return out;
  }, [secciones, tecnicos, alertas, tickets, onNavigate]);

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return items.filter(i => i.categoria === 'accion' || i.categoria === 'seccion');
    return items
      .map(i => ({ item: i, s: score(i, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || a.item.titulo.localeCompare(b.item.titulo))
      .map(x => x.item)
      .slice(0, 30);
  }, [items, query]);

  // Group filtered
  const groups = useMemo(() => {
    const map = new Map<CmdCategoria, CmdItem[]>();
    for (const item of filtered) {
      if (!map.has(item.categoria)) map.set(item.categoria, []);
      map.get(item.categoria)!.push(item);
    }
    return map;
  }, [filtered]);

  // Flat list for cursor navigation
  useEffect(() => { setCursor(0); }, [query]);

  const selectItem = useCallback((item: CmdItem) => {
    item.onSelect();
    onClose();
  }, [onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[cursor]) selectItem(filtered[cursor]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll cursor into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cursor="true"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.1s ease',
        }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed',
        top: '14%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1101,
        width: 620,
        maxWidth: 'calc(100vw - 32px)',
        background: '#0f1623',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden',
        animation: 'cmdAppear 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar sección, técnico, alerta, ticket…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: '#f9fafb', fontFamily: 'inherit',
              caretColor: '#00C896',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>
              ✕
            </button>
          )}
          <kbd style={{ padding: '3px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
              Sin resultados para <strong style={{ color: '#9ca3af' }}>"{query}"</strong>
            </div>
          ) : (
            Array.from(groups.entries()).map(([cat, catItems]) => {
              const color = CAT_COLOR[cat];
              return (
                <div key={cat}>
                  {/* Category header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px 4px',
                    fontSize: 10, fontWeight: 800,
                    color, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    <div style={{ width: 20, height: 1, background: `${color}40` }} />
                    {CAT_LABEL[cat]}
                    <div style={{ flex: 1, height: 1, background: `${color}20` }} />
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>{catItems.length}</span>
                  </div>

                  {/* Items */}
                  {catItems.map(item => {
                    const idx = flatIdx++;
                    const isActive = idx === cursor;
                    return (
                      <div
                        key={item.id}
                        data-cursor={isActive ? 'true' : undefined}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setCursor(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 18px',
                          background: isActive ? `${color}12` : 'transparent',
                          borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'all 0.08s',
                        }}
                      >
                        <span style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: 'center' }}>{item.icono}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? '#f9fafb' : '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.titulo}
                          </p>
                          {item.subtitulo && (
                            <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.subtitulo}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                            background: `${item.badgeColor ?? color}15`,
                            border: `1px solid ${item.badgeColor ?? color}30`,
                            color: item.badgeColor ?? color,
                            fontSize: 10, fontWeight: 800,
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', gap: 16, alignItems: 'center',
        }}>
          {[
            ['↑↓', 'navegar'],
            ['↵',  'seleccionar'],
            ['Esc','cerrar'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{key}</kbd>
              <span style={{ fontSize: 10, color: '#4b5563' }}>{label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: '#374151' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cmdAppear {
          from { transform: translateX(-50%) scale(0.96) translateY(-8px); opacity: 0 }
          to   { transform: translateX(-50%) scale(1)    translateY(0);    opacity: 1 }
        }
      `}</style>
    </>
  );
}
