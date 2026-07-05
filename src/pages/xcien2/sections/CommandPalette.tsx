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
  keywords?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: SectionId) => void;
  secciones: { id: SectionId; label: string; icon: string; group?: string }[];
}

// ─── Design tokens (XCIEN palette) ───────────────────────────────────────────
const G       = '#00c46a';
const G_DIM   = 'rgba(0,196,106,0.12)';
const G_RING  = 'rgba(0,196,106,0.18)';
const BG      = '#0b1017';
const BG_ITEM = 'rgba(0,196,106,0.05)';
const BOR     = 'rgba(255,255,255,0.06)';
const TXT     = '#e2e8f0';
const DIM     = '#4a5568';
const DIM2    = '#64748b';

const CAT_META: Record<CmdCategoria, { label: string; color: string }> = {
  accion:  { label: 'Acciones rápidas', color: G       },
  seccion: { label: 'Secciones',        color: '#60a5fa' },
  tecnico: { label: 'Técnicos',         color: '#34d399' },
  alerta:  { label: 'Alertas NOC',      color: '#f87171' },
  ticket:  { label: 'Tickets WFM',      color: '#fbbf24' },
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

// ─── Search icon SVG ──────────────────────────────────────────────────────────
function SearchIcon({ size = 16, color = DIM2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"
      style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="5.5" stroke={color} strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommandPalette({ open, onClose, onNavigate, secciones }: Props) {
  const [query, setQuery]       = useState('');
  const [cursor, setCursor]     = useState(0);
  const [tecnicos, setTecnicos] = useState<{ name: string; avgPct: number; rank: number }[]>([]);
  const [alertas, setAlertas]   = useState<{ id: string; entity: string; severity: string; message: string }[]>([]);
  const [tickets, setTickets]   = useState<{ id: number; name: string; partner: string; priority: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

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
        setTecnicos(Object.entries(map)
          .map(([name, { sum, count }]) => ({ name, avgPct: Math.round(sum / count), rank: 0 }))
          .sort((a, b) => b.avgPct - a.avgPct)
          .map((t, i) => ({ ...t, rank: i + 1 }))
          .slice(0, 50));
      }).catch(() => {});

    fetch(`${API_BASE}/api/noc/alerts`)
      .then(r => r.ok ? r.json() : [])
      .then((data: { id?: string; entity_name?: string; alert_severity?: string; alert_message?: string }[]) => {
        setAlertas((Array.isArray(data) ? data : []).slice(0, 30).map(a => ({
          id:       String(a.id ?? ''),
          entity:   a.entity_name   ?? 'Dispositivo',
          severity: a.alert_severity ?? 'warning',
          message:  a.alert_message  ?? '',
        })));
      }).catch(() => {});

    fetch(`${API_BASE}/api/wfm/field-tickets?limit=30`)
      .then(r => r.ok ? r.json() : { tickets: [] })
      .then((data: { tickets?: { id: number; name: string; partner_name?: string; priority?: string }[] }) => {
        setTickets((data.tickets ?? []).slice(0, 30).map(t => ({
          id: t.id, name: t.name,
          partner: t.partner_name ?? '', priority: t.priority ?? '0',
        })));
      }).catch(() => {});
  }, [open]);

  const items = useMemo<CmdItem[]>(() => {
    const out: CmdItem[] = [];

    out.push(
      { id: 'act_kpi',       categoria: 'accion', icono: '🎯', titulo: 'KPI Dashboard',      subtitulo: 'Indicadores ejecutivos',      onSelect: () => onNavigate('reportes-kpi'), keywords: 'kpi ejecutivo métricas' },
      { id: 'act_academia',  categoria: 'accion', icono: '🎓', titulo: 'Academia',            subtitulo: 'Cursos y ranking Odoo',       onSelect: () => onNavigate('academia'),     keywords: 'cursos badges odoo elearning' },
      { id: 'act_noc',       categoria: 'accion', icono: '📡', titulo: 'NOC Virtual',         subtitulo: 'Alertas y estado de red',     onSelect: () => onNavigate('noc'),          keywords: 'alertas red observium noc' },
      { id: 'act_wfm',       categoria: 'accion', icono: '🔧', titulo: 'Control Operativo',   subtitulo: 'Tickets WFM · CAST',          onSelect: () => onNavigate('wfm'),          keywords: 'wfm cast campo tickets operativo' },
      { id: 'act_bidrillas', categoria: 'accion', icono: '🚛', titulo: 'Equipos de Campo',    subtitulo: 'Técnicos geolocalizados',     onSelect: () => onNavigate('bidrillas'),    keywords: 'campo técnicos mapa bidrillas' },
      { id: 'act_call',      categoria: 'accion', icono: '📞', titulo: 'Call Center',         subtitulo: 'Tickets Odoo · helpdesk',     onSelect: () => onNavigate('call'),         keywords: 'call helpdesk tickets soporte' },
    );

    for (const s of secciones) {
      out.push({
        id: `sec_${s.id}`, categoria: 'seccion',
        icono: s.icon, titulo: s.label, subtitulo: s.group,
        keywords: s.id, onSelect: () => onNavigate(s.id),
      });
    }

    for (const t of tecnicos) {
      const pct = t.avgPct;
      const color = pct >= 80 ? '#fbbf24' : pct >= 50 ? G : DIM2;
      out.push({
        id: `tec_${t.name}`, categoria: 'tecnico',
        icono: '👷', titulo: t.name, subtitulo: `#${t.rank} en ranking`,
        badge: `${pct}%`, badgeColor: color,
        keywords: 'técnico campo odoo', onSelect: () => onNavigate('academia'),
      });
    }

    for (const a of alertas) {
      const isCrit = a.severity === 'critical' || a.severity === 'high';
      out.push({
        id: `noc_${a.id}`, categoria: 'alerta',
        icono: isCrit ? '🔴' : '🟡', titulo: a.entity,
        subtitulo: a.message.slice(0, 70),
        badge: a.severity.toUpperCase(), badgeColor: isCrit ? '#f87171' : '#fbbf24',
        keywords: 'noc alerta red', onSelect: () => onNavigate('noc'),
      });
    }

    for (const t of tickets) {
      out.push({
        id: `tick_${t.id}`, categoria: 'ticket',
        icono: t.priority === '1' ? '🔥' : '📋',
        titulo: t.name.slice(0, 60), subtitulo: t.partner,
        badge: t.priority === '1' ? 'URGENTE' : undefined, badgeColor: '#fbbf24',
        keywords: 'wfm ticket campo', onSelect: () => onNavigate('wfm'),
      });
    }

    return out;
  }, [secciones, tecnicos, alertas, tickets, onNavigate]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.filter(i => i.categoria === 'accion' || i.categoria === 'seccion');
    return items
      .map(i => ({ item: i, s: score(i, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || a.item.titulo.localeCompare(b.item.titulo))
      .map(x => x.item)
      .slice(0, 30);
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<CmdCategoria, CmdItem[]>();
    for (const item of filtered) {
      if (!map.has(item.categoria)) map.set(item.categoria, []);
      map.get(item.categoria)!.push(item);
    }
    return map;
  }, [filtered]);

  useEffect(() => { setCursor(0); }, [query]);

  const selectItem = useCallback((item: CmdItem) => {
    item.onSelect();
    onClose();
  }, [onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter')     { e.preventDefault(); if (filtered[cursor]) selectItem(filtered[cursor]); }
    else if (e.key === 'Escape')    { onClose(); }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-cursor="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'cpFadeIn 0.12s ease',
      }} />

      {/* Shell */}
      <div style={{
        position: 'fixed',
        top: '13%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1101,
        width: 640,
        maxWidth: 'calc(100vw - 32px)',
        background: BG,
        border: `1px solid ${G_RING}`,
        borderRadius: 14,
        boxShadow: `0 0 0 1px rgba(0,196,106,0.06), 0 0 40px rgba(0,196,106,0.06), 0 40px 80px rgba(0,0,0,0.8)`,
        overflow: 'hidden',
        animation: 'cpSlideIn 0.2s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* ── Input ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px',
          borderBottom: `1px solid ${BOR}`,
        }}>
          <SearchIcon size={15} color={query ? G : DIM2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar sección, técnico, alerta, ticket…"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: TXT, fontFamily: 'inherit',
              caretColor: G,
            }}
          />
          {query ? (
            <button onClick={() => setQuery('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: DIM2, padding: '2px 6px', borderRadius: 4,
              fontSize: 12, lineHeight: 1,
              transition: 'color 0.1s',
            }}>✕</button>
          ) : (
            <kbd style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: DIM, fontFamily: 'monospace', letterSpacing: '0.02em',
            }}>ESC</kbd>
          )}
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <SearchIcon size={24} color={DIM} />
              <p style={{ margin: '12px 0 4px', fontSize: 13, color: DIM2 }}>
                Sin resultados para <strong style={{ color: TXT }}>"{query}"</strong>
              </p>
              <p style={{ margin: 0, fontSize: 11, color: DIM }}>Intenta con otro término</p>
            </div>
          ) : (
            Array.from(groups.entries()).map(([cat, catItems]) => {
              const { label, color } = CAT_META[cat];
              return (
                <div key={cat}>
                  {/* Category label */}
                  <div style={{
                    padding: '8px 16px 3px',
                    fontSize: 9.5, fontWeight: 700,
                    color, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: color }} />
                    {label}
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: DIM, fontWeight: 600 }}>
                      {catItems.length}
                    </span>
                  </div>

                  {/* Items */}
                  {catItems.map(item => {
                    const idx = flatIdx++;
                    const active = idx === cursor;
                    return (
                      <div
                        key={item.id}
                        data-cursor={active ? 'true' : undefined}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setCursor(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 11,
                          padding: '8px 16px',
                          background: active ? BG_ITEM : 'transparent',
                          borderLeft: `2px solid ${active ? G : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'background 0.08s, border-color 0.08s',
                        }}
                      >
                        {/* Icon */}
                        <span style={{
                          fontSize: 15, width: 24, textAlign: 'center', flexShrink: 0,
                          opacity: active ? 1 : 0.75,
                          filter: active ? 'none' : 'grayscale(20%)',
                          transition: 'opacity 0.1s',
                        }}>{item.icono}</span>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0, fontSize: 12.5, fontWeight: active ? 600 : 500,
                            color: active ? TXT : '#cbd5e1',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            transition: 'color 0.08s',
                          }}>
                            {item.titulo}
                          </p>
                          {item.subtitulo && (
                            <p style={{
                              margin: '1px 0 0', fontSize: 10.5, color: DIM,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.subtitulo}
                            </p>
                          )}
                        </div>

                        {/* Badge */}
                        {item.badge && (
                          <span style={{
                            flexShrink: 0, padding: '2px 7px', borderRadius: 20,
                            background: `${item.badgeColor ?? G}12`,
                            border: `1px solid ${item.badgeColor ?? G}25`,
                            color: item.badgeColor ?? G,
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
                          }}>
                            {item.badge}
                          </span>
                        )}

                        {/* Active arrow */}
                        {active && (
                          <span style={{ color: G, fontSize: 11, flexShrink: 0, opacity: 0.7 }}>→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '7px 16px',
          borderTop: `1px solid ${BOR}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {[['↑↓', 'navegar'], ['↵', 'seleccionar']].map(([key, lbl]) => (
            <span key={key} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <kbd style={{
                padding: '1px 6px', borderRadius: 4, fontSize: 9.5,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: DIM2, fontFamily: 'monospace',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: DIM }}>{lbl}</span>
            </span>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: DIM }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: DIM }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G, display: 'inline-block' }} />
            XCIEN 2.0
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes cpSlideIn {
          from { transform: translateX(-50%) translateY(-10px) scale(0.97); opacity: 0 }
          to   { transform: translateX(-50%) translateY(0)     scale(1);    opacity: 1 }
        }
        [data-theme="light"] .cmd-shell { background: #f8fafc; }
      `}</style>
    </>
  );
}
