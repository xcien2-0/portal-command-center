import { ThemeConfig, DEFAULT_THEME, PRESET_ACCENTS } from './types';

interface Props {
  theme: ThemeConfig;
  onChange: (patch: Partial<ThemeConfig>) => void;
  onReset: () => void;
}

// ── Primitive controls ────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: '#808080', flexShrink: 0, minWidth: 110 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  );
}

function Slider({ value, min, max, step = 1, unit = '', onChange }: {
  value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 100, accentColor: '#00A859', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#F0F0F0', minWidth: 36, textAlign: 'right' }}>
        {value}{unit}
      </span>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 20, border: 'none', cursor: 'pointer',
        background: value ? '#00A859' : '#333', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DevPanel({ theme, onChange, onReset }: Props) {
  const BG_PRESETS = [
    { label: 'Negro',      value: '#0A0A0A' },
    { label: 'Gris oscuro',value: '#111111' },
    { label: 'Azul noche', value: '#0B1826' },
    { label: 'Verde noche',value: '#071410' },
  ];

  return (
    <div style={{ maxWidth: 580 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Editor en vivo</h2>
          <button
            onClick={onReset}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#808080', cursor: 'pointer' }}
          >
            Restaurar defaults
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#808080', margin: 0 }}>Los cambios se aplican al instante en toda la página.</p>
      </div>

      {/* ── Colors ── */}
      <SectionLabel>Colores</SectionLabel>

      <Row label="Color acento">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {PRESET_ACCENTS.map(p => (
            <button
              key={p.value}
              title={p.label}
              onClick={() => onChange({ accent: p.value })}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: p.value, border: 'none',
                cursor: 'pointer', outline: theme.accent === p.value ? `2px solid ${p.value}` : 'none',
                outlineOffset: 2, transition: 'outline 0.15s',
              }}
            />
          ))}
          <input
            type="color"
            value={theme.accent}
            onChange={e => onChange({ accent: e.target.value })}
            title="Color personalizado"
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
          />
        </div>
      </Row>

      <Row label="Fondo">
        <div style={{ display: 'flex', gap: 6 }}>
          {BG_PRESETS.map(p => (
            <button
              key={p.value}
              title={p.label}
              onClick={() => onChange({ bg: p.value })}
              style={{
                width: 22, height: 22, borderRadius: 4, background: p.value, border: `1px solid rgba(255,255,255,0.15)`,
                cursor: 'pointer', outline: theme.bg === p.value ? '2px solid #fff' : 'none', outlineOffset: 1,
              }}
            />
          ))}
          <input
            type="color"
            value={theme.bg}
            onChange={e => onChange({ bg: e.target.value })}
            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer' }}
          />
        </div>
      </Row>

      {/* ── Layout ── */}
      <SectionLabel style={{ marginTop: 20 }}>Layout</SectionLabel>

      <Row label="Ancho sidebar">
        <Slider value={theme.sidebarWidth} min={200} max={320} unit="px" onChange={v => onChange({ sidebarWidth: v })} />
      </Row>

      <Row label="Border radius">
        <Slider value={theme.radius} min={0} max={24} unit="px" onChange={v => onChange({ radius: v })} />
      </Row>

      <Row label="Modo compacto">
        <Toggle value={theme.compact} onChange={v => onChange({ compact: v })} />
      </Row>

      {/* ── Typography ── */}
      <SectionLabel style={{ marginTop: 20 }}>Tipografía</SectionLabel>

      <Row label="Tamaño base">
        <Slider value={theme.baseFontSize} min={12} max={18} unit="px" onChange={v => onChange({ baseFontSize: v })} />
      </Row>

      {/* ── Animations ── */}
      <SectionLabel style={{ marginTop: 20 }}>Efectos</SectionLabel>

      <Row label="Animaciones">
        <Toggle value={theme.animations} onChange={v => onChange({ animations: v })} />
      </Row>

      {/* ── Current config ── */}
      <SectionLabel style={{ marginTop: 20 }}>Configuración actual</SectionLabel>
      <div style={{ background: '#111', borderRadius: 8, padding: 14, marginTop: 4 }}>
        <pre style={{ fontSize: 11, color: '#808080', margin: 0, fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto' }}>
          {JSON.stringify(theme, null, 2)}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(theme, null, 2))}
          style={{ marginTop: 10, fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#808080', cursor: 'pointer' }}
        >
          Copiar JSON
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808080', margin: '0 0 4px', ...style }}>
      {children}
    </p>
  );
}
