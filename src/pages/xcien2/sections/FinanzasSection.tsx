import { useState } from 'react';
import { ThemeConfig } from '../types';
import { ArrowLeftRight, Hash } from 'lucide-react';
import TransaccionesSection from './TransaccionesSection';
import TokensSection from './TokensSection';

type TabId = 'transacciones' | 'tokens';

interface Props {
  theme: ThemeConfig;
  activeThemeId?: string;
  initialTab?: TabId;
}

export default function FinanzasSection({ theme, activeThemeId, initialTab = 'transacciones' }: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);

  const accent = theme.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${theme.border}`,
        borderRadius: 12, padding: 4, alignSelf: 'flex-start',
      }}>
        {([
          ['transacciones', 'Transacciones Grupo', ArrowLeftRight],
          ['tokens',        'Registro de Tokens',  Hash],
        ] as [TabId, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: tab === id ? `${accent}22` : 'transparent',
            color: tab === id ? accent : theme.dim,
            fontSize: 12, fontWeight: tab === id ? 700 : 500,
            transition: 'all 0.15s',
            boxShadow: tab === id ? `0 0 0 1px ${accent}40` : 'none',
          }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'transacciones' && (
        <TransaccionesSection theme={theme} activeThemeId={activeThemeId} />
      )}
      {tab === 'tokens' && (
        <TokensSection theme={theme} activeThemeId={activeThemeId} />
      )}
    </div>
  );
}
