import { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import { ThemeConfig, DEFAULT_THEME, SectionId, PresetTheme } from './types';
import DirectorChat    from './sections/DirectorChat';
import NocSection      from './sections/NocSection';
import AcademiaSection from './sections/AcademiaSection';
import WFMSection      from './sections/WFMSection';
import TokensSection        from './sections/TokensSection';
import TransaccionesSection from './sections/TransaccionesSection';
import EtiquetasSection     from './sections/EtiquetasSection';
import DevPanel        from './DevPanel';

// ── Theme reducer ─────────────────────────────────────────────────────────────
type ThemeAction = { type: 'patch'; payload: Partial<ThemeConfig> } | { type: 'reset' };

function themeReducer(state: ThemeConfig, action: ThemeAction): ThemeConfig {
  switch (action.type) {
    case 'patch': return { ...state, ...action.payload };
    case 'reset': return DEFAULT_THEME;
    default:      return state;
  }
}

// ── Navigation structure ──────────────────────────────────────────────────────
interface NavEntry { id: SectionId; label: string; icon: string; group?: string }

const NAV: NavEntry[] = [
  { id: 'inicio',   label: 'Inicio',               icon: '🏠' },
  { id: 'noc',      label: 'Red en Vivo',           icon: '📡' },
  { id: 'wfm',      label: 'Control Operativo',     icon: '⚙️', group: 'Operaciones' },
  { id: 'tokens',        label: 'Tokens & Certificados', icon: '🔖', group: 'Operaciones' },
  { id: 'transacciones', label: 'Transacciones Grupo',   icon: '🔄', group: 'Operaciones' },
  { id: 'etiquetas',     label: 'Etiquetas & Comprobantes', icon: '🏷️', group: 'Operaciones' },
  { id: 'academia', label: 'Dashboard',             icon: '🎓', group: 'Academia XCIEN' },
  { id: 'editor',   label: 'Editor en vivo',        icon: '🎨' },
];

const SECTION_TITLE: Record<SectionId, string> = {
  inicio:   'Director General',
  noc:      'Red en Vivo',
  wfm:      'Control Operativo — WFM',
  tokens:        'Tokens & Certificados',
  transacciones: 'Transacciones Intragrupo',
  etiquetas:     'Etiquetas & Comprobantes',
  academia: 'Academia XCIEN',
  editor:   'Editor en vivo',
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  theme: ThemeConfig;
}

function Sidebar({ active, onSelect, theme }: SidebarProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const grouped: { label: string | null; items: NavEntry[] }[] = [];
    let current: NavEntry[] = [];
    let currentLabel: string | null = null;

    for (const entry of NAV) {
      if (entry.group !== currentLabel) {
        if (current.length) grouped.push({ label: currentLabel, items: current });
        currentLabel = entry.group ?? null;
        current = [];
      }
      current.push(entry);
    }
    if (current.length) grouped.push({ label: currentLabel, items: current });
    return grouped;
  }, []);

  const accent = theme.accent;

  return (
    <div style={{
      width: theme.sidebarWidth, flexShrink: 0,
      background: theme.sidebar, borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s',
    }}>
      {/* Logo */}
      <div style={{ padding: 24, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/xcien.png" alt="XCIEN" style={{ height: 28, objectFit: 'contain' }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: -0.5, color: theme.text }}>XCIEN</span>
            <span style={{ color: accent, fontSize: '0.7rem', background: `${accent}20`, padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>2.0</span>
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: theme.dim, marginTop: 8 }}>
          {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
        {groups.map(({ label, items }, idx) => (
          <div key={label ?? `_top_${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {label && (
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#444', padding: '0 12px 8px', letterSpacing: 1 }}>
                {label.toUpperCase()}
              </div>
            )}
            {items.map(item => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: theme.compact ? '7px 12px' : '10px 12px',
                    background: isActive ? `${accent}20` : 'transparent',
                    border: isActive ? `1px solid ${accent}30` : '1px solid transparent',
                    color: isActive ? theme.text : theme.dim,
                    fontSize: theme.baseFontSize - 1,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', borderRadius: 8, textAlign: 'left', transition: 'all 0.15s', width: '100%',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1rem', filter: isActive ? 'none' : 'grayscale(1)' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'editor' && (
                    <span style={{ marginLeft: 'auto', fontSize: 9, background: '#FFB703', color: '#000', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>LIVE</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer user pill */}
      <div style={{ padding: 20, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: theme.card, padding: 10, borderRadius: theme.radius }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
            JM
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin XCIEN</div>
            <div style={{ fontSize: '0.7rem', color: theme.dim }}>Director General</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
interface ContentProps {
  section: SectionId;
  theme: ThemeConfig;
  activeThemeId: string;
  onThemeChange: (p: Partial<ThemeConfig>) => void;
  onThemeReset: () => void;
  onApplyPreset: (preset: PresetTheme) => void;
}

function Content({ section, theme, activeThemeId, onThemeChange, onThemeReset, onApplyPreset }: ContentProps) {
  const padding = theme.compact ? 20 : 32;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding, background: theme.bg, minWidth: 0 }}>
      {section === 'inicio'   && <DirectorChat    theme={theme} />}
      {section === 'noc'      && <NocSection      theme={theme} />}
      {section === 'academia' && <AcademiaSection theme={theme} />}
      {section === 'wfm'      && <WFMSection      theme={theme} />}
      {section === 'tokens'        && <TokensSection        theme={theme} />}
      {section === 'transacciones' && <TransaccionesSection  theme={theme} />}
      {section === 'etiquetas'     && <EtiquetasSection      theme={theme} />}
      {section === 'editor'   && (
        <DevPanel
          theme={theme}
          activeThemeId={activeThemeId}
          onChange={onThemeChange}
          onApplyPreset={onApplyPreset}
          onReset={onThemeReset}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Xcien2Page() {
  const [section, setSection]     = useState<SectionId>('inicio');
  const [theme, dispatch]         = useReducer(themeReducer, DEFAULT_THEME, (initial) => {
    try {
      const saved = localStorage.getItem('xcien2_theme');
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch { return initial; }
  });
  const [activeThemeId, setActiveThemeId] = useState('xcien');

  const patchTheme   = useCallback((patch: Partial<ThemeConfig>) => dispatch({ type: 'patch', payload: patch }), []);
  const resetTheme   = useCallback(() => { dispatch({ type: 'reset' }); setActiveThemeId('xcien'); }, []);
  const applyPreset  = useCallback((preset: PresetTheme) => {
    dispatch({ type: 'patch', payload: preset.config });
    setActiveThemeId(preset.id);
  }, []);

  // Apply CSS variables to :root for native elements
  const cssVars = useMemo(() => ({
    '--xcien-accent':  theme.accent,
    '--xcien-bg':      theme.bg,
    '--xcien-card':    theme.card,
    '--xcien-border':  theme.border,
    '--xcien-text':    theme.text,
    '--xcien-dim':     theme.dim,
    '--xcien-radius':  `${theme.radius}px`,
    '--xcien-font':    `${theme.baseFontSize}px`,
  } as React.CSSProperties), [theme]);

  return (
    <div
      style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        fontSize: theme.baseFontSize,
        color: theme.text,
        background: theme.bg,
        ...cssVars,
      }}
    >
      <Sidebar active={section} onSelect={setSection} theme={theme} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top header */}
        <header style={{
          height: 56, padding: '0 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${theme.bg}cc`, backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{SECTION_TITLE[section]}</h2>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, boxShadow: `0 0 8px ${theme.accent}`, animation: theme.animations ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${theme.accent}10`, border: `1px solid ${theme.accent}30`, borderRadius: 20, padding: '5px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: theme.accent, animation: theme.animations ? 'pulse-dot 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.accent }}>Sistema operacional</span>
          </div>
        </header>

        <Content
          section={section}
          theme={theme}
          activeThemeId={activeThemeId}
          onThemeChange={patchTheme}
          onThemeReset={resetTheme}
          onApplyPreset={applyPreset}
        />
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1) }
          50%      { opacity:.5; transform:scale(1.3) }
        }
        input[type=range] { height: 4px }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px }
        button:focus { outline:none }
      `}</style>
    </div>
  );
}
