import { useEffect } from 'react';
import CiudadOSSection from './xcien2/sections/CiudadOSSection';
import { PDN_CONFIG, MTY_CONFIG, SLT_CONFIG } from './xcien2/sections/ciudadConfigs';
import { DEFAULT_THEME } from './xcien2/types';
import type { PlazaConfig } from './xcien2/sections/CiudadOSSection';

const PLAZAS: Record<string, PlazaConfig> = {
  pdn: PDN_CONFIG,
  mty: MTY_CONFIG,
  slt: SLT_CONFIG,
};

export default function CiudadOSPage({ plaza }: { plaza: string }) {
  const config = PLAZAS[plaza];

  useEffect(() => {
    if (config) document.title = `${config.nombre} OS · XCIEN`;
  }, [config]);

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#060B14', color: '#6B7280', fontFamily: 'monospace', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 32 }}>404</div>
        <div>Plaza no encontrada: {plaza}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CiudadOSSection config={config} theme={DEFAULT_THEME} />
    </div>
  );
}
