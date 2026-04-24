import { ThemeConfig, DEFAULT_THEME, PRESET_ACCENTS, PRESET_THEMES, PresetTheme } from './types';

interface Props {
  theme: ThemeConfig;
  activeThemeId: string;
  onChange: (patch: Partial<ThemeConfig>) => void;
  onApplyPreset: (preset: PresetTheme) => void;
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

function Slider({ value, min, max, step = 1, unit = '', accent, onChange }: {
  value: number; min: number; max: number; step?: number; unit?: string; accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 100, accentColor: accent, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#F0F0F0', minWidth: 36, textAlign: 'right' }}>
        {value}{unit}
      </span>
    </div>
  );
}

function Toggle({ value, accent, onChange }: { value: boolean; accent: string; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 20, border: 'none', cursor: 'pointer',
        background: value ? accent : '#333', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#808080', margin: '0 0 8px', ...style }}>
      {children}
    </p>
  );
}

// ── Theme Card ────────────────────────────────────────────────────────────────
function ThemeCard({ preset, isActive, onApply }: { preset: PresetTheme; isActive: boolean; onApply: () => void }) {
  const { preview } = preset;
  return (
    <button
      onClick={onApply}
      style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      {/* Mini preview */}
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        border: isActive ? `2px solid ${preview.accent}` : '2px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.2s, transform 0.15s',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isActive ? `0 0 16px ${preview.accent}40` : 'none',
      }}>
        {/* Simulated sidebar + content */}
        <div style={{ display: 'flex', height: 64, background: preview.bg }}>
          <div style={{ width: 28, background: preview.card, borderRight: `1px solid ${preview.accent}20`, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 5px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 4, borderRadius: 2, background: i === 1 ? preview.accent : `${preview.text}20` }} />
            ))}
          </div>
          <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[40, 30, 50, 35].map((w, i) => (
                <div key={i} style={{ height: 16, width: w, borderRadius: 3, background: preview.card, border: `1px solid ${preview.accent}20` }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[60, 45].map((w, i) => (
                <div key={i} style={{ height: 24, width: w, borderRadius: 3, background: preview.card }} />
              ))}
              <div style={{ height: 24, flex: 1, borderRadius: 3, background: `${preview.accent}18` }} />
            </div>
          </div>
        </div>
        {/* Color strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${preview.accent}, ${preview.bg})` }} />
      </div>

      {/* Label */}
      <div style={{ padding: '8px 2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? preview.accent : '#F0F0F0' }}>{preset.emoji} {preset.name}</span>
          {isActive && <span style={{ fontSize: 9, background: `${preview.accent}20`, color: preview.accent, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>ACTIVO</span>}
        </div>
        <p style={{ fontSize: 11, color: '#606060', margin: '2px 0 0', lineHeight: 1.4 }}>{preset.description}</p>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DevPanel({ theme, activeThemeId, onChange, onApplyPreset, onReset }: Props) {
  const BG_PRESETS = [
    { label: 'Negro',       value: '#0A0A0A' },
    { label: 'Gris oscuro', value: '#111111' },
    { label: 'Azul noche',  value: '#0B1826' },
    { label: 'Verde noche', value: '#071410' },
  ];

  const accent = theme.accent;

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: theme.text }}>Editor en vivo</h2>
          <button
            onClick={onReset}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, cursor: 'pointer' }}
          >
            Restaurar defaults
          </button>
        </div>
        <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Los cambios se aplican al instante en toda la página.</p>
      </div>

      {/* ── Preset themes ── */}
      <SectionLabel>Temas predefinidos</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {PRESET_THEMES.map(preset => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            isActive={activeThemeId === preset.id}
            onApply={() => onApplyPreset(preset)}
          />
        ))}
      </div>

      <div style={{ height: 1, background: theme.border, marginBottom: 24 }} />

      {/* ── Fine-tune colors ── */}
      <SectionLabel>Ajuste fino — Colores</SectionLabel>

      <Row label="Color acento">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {PRESET_ACCENTS.map(p => (
            <button key={p.value} title={p.label} onClick={() => onChange({ accent: p.value })}
              style={{ width: 22, height: 22, borderRadius: '50%', background: p.value, border: 'none', cursor: 'pointer', outline: theme.accent === p.value ? `2px solid ${p.value}` : 'none', outlineOffset: 2, transition: 'outline 0.15s' }}
            />
          ))}
          <input type="color" value={theme.accent} onChange={e => onChange({ accent: e.target.value })}
            title="Color personalizado"
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
          />
        </div>
      </Row>

      <Row label="Fondo">
        <div style={{ display: 'flex', gap: 6 }}>
          {BG_PRESETS.map(p => (
            <button key={p.value} title={p.label} onClick={() => onChange({ bg: p.value })}
              style={{ width: 22, height: 22, borderRadius: 4, background: p.value, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', outline: theme.bg === p.value ? '2px solid #fff' : 'none', outlineOffset: 1 }}
            />
          ))}
          <input type="color" value={theme.bg} onChange={e => onChange({ bg: e.target.value })}
            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer' }}
          />
        </div>
      </Row>

      {/* ── Layout ── */}
      <SectionLabel style={{ marginTop: 24 }}>Layout</SectionLabel>

      <Row label="Ancho sidebar">
        <Slider value={theme.sidebarWidth} min={200} max={320} unit="px" accent={accent} onChange={v => onChange({ sidebarWidth: v })} />
      </Row>

      <Row label="Border radius">
        <Slider value={theme.radius} min={0} max={24} unit="px" accent={accent} onChange={v => onChange({ radius: v })} />
      </Row>

      <Row label="Modo compacto">
        <Toggle value={theme.compact} accent={accent} onChange={v => onChange({ compact: v })} />
      </Row>

      {/* ── Typography ── */}
      <SectionLabel style={{ marginTop: 24 }}>Tipografía</SectionLabel>

      <Row label="Tamaño base">
        <Slider value={theme.baseFontSize} min={12} max={18} unit="px" accent={accent} onChange={v => onChange({ baseFontSize: v })} />
      </Row>

      {/* ── Animations ── */}
      <SectionLabel style={{ marginTop: 24 }}>Efectos</SectionLabel>

      <Row label="Animaciones">
        <Toggle value={theme.animations} accent={accent} onChange={v => onChange({ animations: v })} />
      </Row>

      {/* ── Export config ── */}
      <SectionLabel style={{ marginTop: 24 }}>Config actual</SectionLabel>
      <div style={{ background: '#111', borderRadius: 8, padding: 14, marginTop: 4 }}>
        <pre style={{ fontSize: 11, color: '#606060', margin: 0, fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto' }}>
          {JSON.stringify(theme, null, 2)}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(theme, null, 2))}
          style={{ marginTop: 10, fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, cursor: 'pointer' }}
        >
          Copiar JSON
        </button>
      </div>
    </div>
  );
}
