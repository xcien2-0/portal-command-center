import { useState, useRef } from 'react';
import { ThemeConfig, DEFAULT_THEME, PRESET_ACCENTS, PRESET_THEMES, PresetTheme } from './types';

const LS_KEY   = 'xcien2_theme';
const LS_SAVED = 'xcien2_saved_themes';

interface Props {
  theme: ThemeConfig;
  activeThemeId: string;
  onChange: (patch: Partial<ThemeConfig>) => void;
  onApplyPreset: (preset: PresetTheme) => void;
  onReset: () => void;
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: '#808080', flexShrink: 0, minWidth: 120 }}>{label}</span>
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
        style={{ width: 110, accentColor: accent, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#F0F0F0', minWidth: 40, textAlign: 'right' }}>
        {value}{unit}
      </span>
    </div>
  );
}

function Toggle({ value, accent, onChange }: { value: boolean; accent: string; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 20, border: 'none', cursor: 'pointer',
      background: value ? accent : '#333', position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, marginTop: 24 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#606060', margin: 0 }}>
        {children}
      </p>
      {action}
    </div>
  );
}

function ColorSwatch({ value, onChange, accent, label }: { value: string; onChange: (v: string) => void; accent: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const isRgba = value.startsWith('rgba');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => !isRgba && ref.current?.click()}
        title={isRgba ? 'Valor RGBA — edita manualmente' : label}
        style={{
          width: 26, height: 26, borderRadius: 6, background: value,
          border: '1px solid rgba(255,255,255,0.15)', cursor: isRgba ? 'default' : 'pointer', flexShrink: 0,
          boxShadow: `0 0 0 2px ${accent}40`,
        }}
      />
      {isRgba ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ fontSize: 11, fontFamily: 'monospace', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#F0F0F0', padding: '3px 6px', width: 180 }}
        />
      ) : (
        <input
          ref={ref}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      )}
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#606060' }}>{isRgba ? '' : value}</span>
    </div>
  );
}

// ── Preset Card ───────────────────────────────────────────────────────────────
function ThemeCard({ preset, isActive, onApply }: { preset: PresetTheme; isActive: boolean; onApply: () => void }) {
  const { preview } = preset;
  return (
    <button onClick={onApply} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        border: isActive ? `2px solid ${preview.accent}` : '2px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s',
        boxShadow: isActive ? `0 0 16px ${preview.accent}40` : 'none',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
      }}>
        <div style={{ display: 'flex', height: 64, background: preview.bg }}>
          <div style={{ width: 28, background: preview.card, borderRight: `1px solid ${preview.accent}20`, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 5px' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 4, borderRadius: 2, background: i === 1 ? preview.accent : `${preview.text}20` }} />)}
          </div>
          <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[40, 30, 50, 35].map((w, i) => <div key={i} style={{ height: 16, width: w, borderRadius: 3, background: preview.card, border: `1px solid ${preview.accent}20` }} />)}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ height: 24, width: 60, borderRadius: 3, background: preview.card }} />
              <div style={{ height: 24, flex: 1, borderRadius: 3, background: `${preview.accent}18` }} />
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${preview.accent}, ${preview.bg})` }} />
      </div>
      <div style={{ padding: '8px 2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? preview.accent : '#F0F0F0' }}>{preset.emoji} {preset.name}</span>
          {isActive && <span style={{ fontSize: 9, background: `${preview.accent}20`, color: preview.accent, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>ACTIVO</span>}
        </div>
        <p style={{ fontSize: 11, color: '#606060', margin: '2px 0 0' }}>{preset.description}</p>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DevPanel({ theme, activeThemeId, onChange, onApplyPreset, onReset }: Props) {
  const [saveMsg, setSaveMsg]       = useState('');
  const [importErr, setImportErr]   = useState('');
  const [savedThemes, setSaved]     = useState<{ name: string; config: ThemeConfig }[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SAVED) || '[]'); } catch { return []; }
  });
  const [saveName, setSaveName]     = useState('');
  const accent = theme.accent;

  // ── Persist on every change ──────────────────────────────────────────────────
  const patch = (p: Partial<ThemeConfig>) => {
    onChange(p);
    setTimeout(() => {
      const updated = { ...theme, ...p };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }, 0);
  };

  // ── Save custom preset ───────────────────────────────────────────────────────
  const handleSave = () => {
    if (!saveName.trim()) return;
    const next = [...savedThemes, { name: saveName.trim(), config: theme }];
    setSaved(next);
    localStorage.setItem(LS_SAVED, JSON.stringify(next));
    setSaveName('');
    setSaveMsg('Guardado ✓');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleDeleteSaved = (i: number) => {
    const next = savedThemes.filter((_, idx) => idx !== i);
    setSaved(next);
    localStorage.setItem(LS_SAVED, JSON.stringify(next));
  };

  // ── Import from clipboard ────────────────────────────────────────────────────
  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      const required: (keyof ThemeConfig)[] = ['accent', 'bg', 'card', 'sidebar', 'border', 'text', 'dim'];
      if (!required.every(k => k in parsed)) throw new Error('JSON incompleto');
      onChange(parsed);
      localStorage.setItem(LS_KEY, JSON.stringify(parsed));
      setImportErr('Importado ✓');
    } catch (e: any) {
      setImportErr('Error: ' + (e.message || 'JSON inválido'));
    }
    setTimeout(() => setImportErr(''), 3000);
  };

  const btnSm = (onClick: () => void, label: string, color = accent) => (
    <button onClick={onClick} style={{
      fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
      background: 'transparent', border: `1px solid ${color}40`, color,
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: theme.text }}>Editor en vivo</h2>
          <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Cambios instantáneos · auto-guardado en navegador</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {btnSm(handleImport, '⬇ Importar JSON', '#4FC3F7')}
          {btnSm(() => { onReset(); localStorage.removeItem(LS_KEY); }, 'Restaurar defaults', '#FF4757')}
        </div>
      </div>
      {importErr && <div style={{ fontSize: 11, color: importErr.startsWith('Error') ? '#FF4757' : '#00C896', marginBottom: 12 }}>{importErr}</div>}

      {/* ── Preset themes ── */}
      <SectionLabel>Temas predefinidos</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 8 }}>
        {PRESET_THEMES.map(p => (
          <ThemeCard key={p.id} preset={p} isActive={activeThemeId === p.id}
            onApply={() => { onApplyPreset(p); localStorage.setItem(LS_KEY, JSON.stringify(p.config)); }} />
        ))}
      </div>

      {/* ── Saved custom themes ── */}
      {savedThemes.length > 0 && (
        <>
          <SectionLabel>Mis temas guardados</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {savedThemes.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.config.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1, color: theme.text }}>{s.name}</span>
                <button onClick={() => { onChange(s.config); localStorage.setItem(LS_KEY, JSON.stringify(s.config)); }}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: `${accent}18`, border: `1px solid ${accent}30`, color: accent, cursor: 'pointer' }}>
                  Aplicar
                </button>
                <button onClick={() => handleDeleteSaved(i)}
                  style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 1, background: theme.border, margin: '20px 0' }} />

      {/* ── Colors ── */}
      <SectionLabel>Colores</SectionLabel>

      <Row label="Acento">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_ACCENTS.map(p => (
            <button key={p.value} title={p.label} onClick={() => patch({ accent: p.value })}
              style={{ width: 20, height: 20, borderRadius: '50%', background: p.value, border: 'none', cursor: 'pointer', outline: theme.accent === p.value ? `2px solid ${p.value}` : 'none', outlineOffset: 2 }}
            />
          ))}
          <input type="color" value={theme.accent} onChange={e => patch({ accent: e.target.value })}
            style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer' }}
          />
        </div>
      </Row>

      <Row label="Fondo"><ColorSwatch value={theme.bg}      onChange={v => patch({ bg: v })}      accent={accent} label="Fondo" /></Row>
      <Row label="Sidebar"><ColorSwatch value={theme.sidebar}  onChange={v => patch({ sidebar: v })}  accent={accent} label="Sidebar" /></Row>
      <Row label="Tarjetas"><ColorSwatch value={theme.card}    onChange={v => patch({ card: v })}    accent={accent} label="Tarjetas" /></Row>
      <Row label="Borde"><ColorSwatch value={theme.border}  onChange={v => patch({ border: v })}  accent={accent} label="Borde" /></Row>
      <Row label="Texto"><ColorSwatch value={theme.text}    onChange={v => patch({ text: v })}    accent={accent} label="Texto" /></Row>
      <Row label="Texto secundario"><ColorSwatch value={theme.dim} onChange={v => patch({ dim: v })} accent={accent} label="Dim" /></Row>

      {/* ── Layout ── */}
      <SectionLabel>Layout</SectionLabel>
      <Row label="Ancho sidebar"><Slider value={theme.sidebarWidth} min={200} max={320} unit="px" accent={accent} onChange={v => patch({ sidebarWidth: v })} /></Row>
      <Row label="Border radius"><Slider value={theme.radius} min={0} max={24} unit="px" accent={accent} onChange={v => patch({ radius: v })} /></Row>
      <Row label="Modo compacto"><Toggle value={theme.compact} accent={accent} onChange={v => patch({ compact: v })} /></Row>

      {/* ── Typography ── */}
      <SectionLabel>Tipografía</SectionLabel>
      <Row label="Tamaño base"><Slider value={theme.baseFontSize} min={12} max={18} unit="px" accent={accent} onChange={v => patch({ baseFontSize: v })} /></Row>

      {/* ── Animations ── */}
      <SectionLabel>Efectos</SectionLabel>
      <Row label="Animaciones"><Toggle value={theme.animations} accent={accent} onChange={v => patch({ animations: v })} /></Row>

      {/* ── Save custom ── */}
      <SectionLabel>Guardar tema actual</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Nombre del tema..."
          style={{ flex: 1, background: '#1a1a1a', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 12px', color: theme.text, fontSize: 13, outline: 'none' }}
        />
        <button onClick={handleSave} disabled={!saveName.trim()} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: saveName.trim() ? 'pointer' : 'not-allowed',
          background: saveName.trim() ? accent : '#333', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          Guardar
        </button>
        {saveMsg && <span style={{ fontSize: 12, color: '#00C896', alignSelf: 'center' }}>{saveMsg}</span>}
      </div>

      {/* ── Export ── */}
      <SectionLabel>Exportar configuración</SectionLabel>
      <div style={{ background: '#111', borderRadius: 8, padding: 14 }}>
        <pre style={{ fontSize: 11, color: '#505050', margin: 0, fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', maxHeight: 200 }}>
          {JSON.stringify(theme, null, 2)}
        </pre>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(theme, null, 2))}
          style={{ marginTop: 10, fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, cursor: 'pointer' }}>
          Copiar JSON
        </button>
      </div>

    </div>
  );
}
